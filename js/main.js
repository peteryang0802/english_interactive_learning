import { createEngine } from './engine.js';
import {
  buildLibraryRun, LIBRARY_AUDIO_KEYS,
  buildBakeryRun, BAKERY_AUDIO_KEYS,
  buildCrossingRun, CROSSING_AUDIO_KEYS,
  buildMarketRun, MARKET_AUDIO_KEYS,
  buildPartyRun, PARTY_AUDIO_KEYS,
} from './story.js';
import { LEVELS, getLevel } from './levels.js';
import * as audio from './audio-manager.js';
import { loadSave, writeSave, addItem, markLevelDone } from './storage.js';
import { createLevelView, createTownView, disable3D } from './view-loader.js';

window.__audio = audio;

const $ = (id) => document.getElementById(id);

// 关卡 id -> 步骤构建函数和音频清单；扩建一关注册一关
const RUN_BUILDERS = {
  library: { build: buildLibraryRun, audioKeys: LIBRARY_AUDIO_KEYS },
  bakery: { build: buildBakeryRun, audioKeys: BAKERY_AUDIO_KEYS },
  crossing: { build: buildCrossingRun, audioKeys: CROSSING_AUDIO_KEYS },
  market: { build: buildMarketRun, audioKeys: MARKET_AUDIO_KEYS },
  party: { build: buildPartyRun, audioKeys: PARTY_AUDIO_KEYS },
};

const els = {
  start: $('start-card'), stage: $('stage'),
  hudTitle: $('hud-title'), back: $('back-btn'),
  wrap: $('canvas-wrap'), loading: $('loading'), townMenu: $('town-menu'),
  progress: $('progress'),
  speaker: $('speaker-row'), speakerAvatar: $('speaker-avatar'), speakerName: $('speaker-name'),
  enLine: $('en-line'),
  dialogueBar: $('dialogue-bar'), dialogueCaption: $('dialogue-caption'), dialogueNext: $('dialogue-next'),
  controlBar: $('control-bar'), replayBtn: $('replay-btn'), captionBtn: $('caption-btn'),
  tip: $('tip'),
  speakModal: $('speak-modal'), speakEn: $('speak-en'), doneModal: $('done-modal'), doneTitle: $('done-title'), report: $('report'),
  bagModal: $('bag-modal'), bagContent: $('bag-content'), bagCount: $('bag-count'),
};

let save = loadSave();
writeSave(save);  // 立即持久化，顺带把旧存档迁移成新结构
let use3D = webglAvailable();
let current = null;     // 3D 地图句柄
let activeView = null;  // 当前关卡视图（3D 或 2D）
let engine = null;
let currentLevelId = null;

function setTip(text, kind) {
  els.tip.textContent = text;
  els.tip.className = 'tip' + (kind ? ' ' + kind : '');
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

// ===== HTML 地图入口：键盘可达，3D 时浮动，2D 时为主菜单 =====
function renderTownMenu(kind) {
  els.townMenu.hidden = false;
  els.townMenu.innerHTML = '';
  els.townMenu.className = 'town-menu town-menu--' + kind;

  LEVELS.forEach((level, i) => {
    const open = i < save.unlocked;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'town-menu-btn';
    btn.textContent = level.name + (open ? '' : '（建设中）');
    if (!open) btn.disabled = true;
    else btn.addEventListener('click', () => enterLevel(level.id));
    els.townMenu.appendChild(btn);
  });
}

// ===== 小镇地图 =====
async function startTown() {
  currentLevelId = null;
  els.hudTitle.textContent = '动物小镇';
  els.back.hidden = true;
  els.progress.hidden = true;
  els.speaker.hidden = true;
  els.controlBar.hidden = true;
  els.dialogueBar.hidden = true;
  els.speakModal.hidden = true;
  els.doneModal.hidden = true;
  setTip('', '');

  const { view, is3D } = await createTownView(els.wrap, {
    unlocked: save.unlocked,
    onEnter: enterLevel,
    onLocked: (name) => setTip('「' + name + '」还没解锁，先通过前面的关卡吧。', 'bad'),
  }, use3D);

  if (is3D && view) {
    current = view;
    renderTownMenu('3d');
  } else {
    use3D = false;
    current = null;
    renderTownMenu('2d');
  }
}

function teardownTown() {
  if (current) { current.dispose(); current = null; }
  els.townMenu.hidden = true;
  els.townMenu.innerHTML = '';
}

function teardownLevel() {
  if (engine) { engine.dispose(); engine = null; }
  if (activeView) { activeView.dispose(); activeView = null; }
  window.__activeView = null;
  window.__engine = null;
}

// ===== 进入关卡：按 id 取配置，数据驱动 =====
async function enterLevel(id) {
  const builder = RUN_BUILDERS[id];
  const level = getLevel(id);
  if (!builder || !level) { setTip('这一关还在建设中，先玩已解锁的关卡吧。', 'bad'); return; }

  currentLevelId = id;
  teardownTown();

  els.hudTitle.textContent = level.hudTitle;
  els.back.hidden = false;
  els.progress.hidden = false;
  els.speaker.hidden = false;

  els.loading.hidden = false;
  // 音频后台并发预加载，不阻塞进关卡；播放时若还没好，就走即时拉取（有 loading 提示）
  audio.preload(builder.audioKeys);
  const { view, is3D } = await createLevelView(els.wrap, id, use3D);
  activeView = view;
  if (!is3D) use3D = false;

  els.loading.hidden = true;

  engine = createEngine({
    els, view: activeView,
    onPersist: persistLevel,
    onFinish: returnToTown,
    config: { skillLabel: level.skillLabel, levelId: id, doneTitle: level.doneTitle },
  });
  window.__engine = engine;
  window.__activeView = activeView;
  engine.start(builder.build());
}

// ===== 结算前保存：发奖励、标记完成、解锁，一次性写入（在结果页显示之前）=====
function persistLevel(summary) {
  const level = getLevel(currentLevelId);
  if (level) addItem(save, level.reward.id);
  markLevelDone(save, currentLevelId, summary);
  els.bagCount.textContent = save.items.length;
}

// ===== 返回小镇：只做清理和导航，不再负责保存 =====
function returnToTown() {
  teardownLevel();
  startTown();
}

// ===== 背包：把已获得的道具都列出来 =====
function openBag() {
  if (save.items.length) {
    els.bagContent.innerHTML = save.items.map((itemId) => {
      const level = LEVELS.find((l) => l.reward.id === itemId);
      if (!level) return '';
      return '<div class="bag-item"><span class="bag-item-icon" aria-hidden="true">' +
        level.reward.svg + '</span><span class="bag-item-name">' + level.reward.name + '</span></div>';
    }).join('');
  } else {
    els.bagContent.innerHTML = '<p class="empty-note">背包还空着，去闯关收集道具吧。</p>';
  }
  els.bagModal.hidden = false;
}

// ===== 初始化音频（元素），播放都在用户点击后 =====
audio.initAudio($('voice'));
els.bagCount.textContent = save.items.length;

// ===== 事件绑定 =====
$('start-btn').addEventListener('click', () => {
  els.start.hidden = true;
  els.stage.hidden = false;
  startTown();
});

els.back.addEventListener('click', () => {
  teardownLevel();
  startTown();
});

$('bag-btn').addEventListener('click', openBag);
$('bag-close').addEventListener('click', () => { els.bagModal.hidden = true; });

els.dialogueNext.addEventListener('click', () => engine && engine.nextLine());
els.dialogueCaption.addEventListener('click', () => engine && engine.toggleDialogueCaption());
$('dialogue-replay').addEventListener('click', () => engine && engine.replayLine());

els.replayBtn.addEventListener('click', () => engine && engine.replay());
els.captionBtn.addEventListener('click', () => engine && engine.toggleCaption());
$('demo-btn').addEventListener('click', () => engine && engine.helpDemo());
$('camera-btn').addEventListener('click', () => engine && engine.resetCamera());

$('speak-listen').addEventListener('click', () => engine && engine.speakListen());
$('speak-done').addEventListener('click', () => engine && engine.speakDone());
$('speak-skip').addEventListener('click', () => engine && engine.speakSkip());

$('done-continue').addEventListener('click', () => engine && engine.doneContinue());

window.addEventListener('resize', () => {
  if (current && current.resize) current.resize();
  if (activeView && activeView.resize) activeView.resize();
});
