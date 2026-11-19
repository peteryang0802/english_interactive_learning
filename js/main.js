import * as THREE from '../vendor/three.module.js';
import { createTown } from './town.js';
import { createLibraryScene } from './library.js';
import { buildLibraryRun } from './story.js';
import { AUDIO, audioState, playAudio, playThen, stopAudio } from './audio.js';

const $ = (id) => document.getElementById(id);

// ===== 全局状态 =====
let unlocked = 1;          // 已解锁地点数（图书馆一开始可进）
let bagCount = 0;
let current = null;        // 当前 3D 场景句柄
let mode = 'town';

// 关卡内状态
let steps = [];
let stepIndex = 0;
let answered = false;
let locked = false;
const record = { firstCorrect: 0, quizTotal: 0, replays: 0, usedCaption: false, usedDemo: false };

// ===== DOM =====
const els = {
  start: $('start-card'), stage: $('stage'),
  hudTitle: $('hud-title'), back: $('back-btn'), bagCount: $('bag-count'),
  wrap: $('canvas-wrap'),
  progress: $('progress'), speaker: $('speaker-row'), control: $('control-bar'),
  speakerAvatar: $('speaker-avatar'), speakerName: $('speaker-name'),
  enLine: $('en-line'), zhLine: $('zh-line'),
  dialogueBar: $('dialogue-bar'), dialogueReplay: $('dialogue-replay'), dialogueNext: $('dialogue-next'),
  caption: $('caption-btn'), replay: $('replay-btn'),
  demoBtn: $('demo-btn'), tip: $('tip'),
  demoModal: $('demo-modal'), demoStage: $('demo-stage'), demoClose: $('demo-close'),
  speakModal: $('speak-modal'), speakListen: $('speak-listen'),
  speakDone: $('speak-done'), speakSkip: $('speak-skip'),
  doneModal: $('done-modal'), report: $('report'), doneContinue: $('done-continue'),
};

function showTip(text, kind) {
  els.tip.textContent = text;
  els.tip.className = 'tip' + (kind ? ' ' + kind : '');
}

function closeAllModals() {
  els.demoModal.hidden = true;
  els.speakModal.hidden = true;
  els.doneModal.hidden = true;
}

// ===== 小镇地图 =====
function startTown() {
  mode = 'town';
  els.hudTitle.textContent = '动物小镇';
  els.back.hidden = true;
  els.progress.hidden = true;
  els.speaker.hidden = true;
  els.control.hidden = true;
  els.dialogueBar.hidden = true;
  showTip('', '');

  current = createTown(els.wrap, {
    unlocked,
    onEnter: (id) => enterLevel(id),
    onLocked: (name) => showTip('「' + name + '」还没解锁，先通过图书馆这一关吧。', 'bad'),
  });
}

function disposeCurrent() {
  if (current) { current.dispose(); current = null; }
  stopAudio();
}

// ===== 进入关卡 =====
function enterLevel(id) {
  if (id !== 'library') { showTip('这一关还在建设中，先玩图书馆吧。', 'bad'); return; }
  disposeCurrent();
  mode = 'library';
  els.hudTitle.textContent = '第一关：书在哪儿';
  els.back.hidden = false;
  els.progress.hidden = false;
  els.speaker.hidden = false;
  els.control.hidden = false;

  steps = buildLibraryRun();
  stepIndex = 0;
  record.firstCorrect = 0;
  record.quizTotal = 0;
  record.replays = 0;
  record.usedCaption = false;
  record.usedDemo = false;

  current = createLibraryScene(els.wrap);
  current.onPick(handlePick);
  renderStep();
}

// ===== 进度条 =====
function renderProgress() {
  els.progress.innerHTML = '';
  steps.forEach((s, i) => {
    const dot = document.createElement('i');
    dot.className = i < stepIndex ? 'on' : i === stepIndex ? 'now' : '';
    els.progress.appendChild(dot);
  });
}

// ===== 渲染每一步 =====
function renderStep() {
  answered = false;
  locked = false;
  renderProgress();
  closeAllModals();
  const step = steps[stepIndex];
  els.enLine.hidden = true;
  els.caption.textContent = '看字幕';
  const isDialogue = step.type === 'dialogue';
  els.dialogueBar.hidden = !isDialogue;
  els.control.hidden = isDialogue;

  if (step.type === 'dialogue') renderDialogue(step);
  else if (step.type === 'check') renderCheck(step);
  else if (step.type === 'quiz') renderQuiz(step);
  else if (step.type === 'demo') openDemoStep();
  else if (step.type === 'speak') openSpeak();
  else if (step.type === 'done') openDone();
}

// ===== 剧情对话：逐句播放，孩子点“继续”往下走 =====
let currentLines = [];
let lineIndex = 0;
const SPEAKER_NAME = { beaver: '河狸馆员', rabbit: '小兔' };

function renderDialogue(step) {
  currentLines = step.lines;
  lineIndex = 0;
  els.control.hidden = true;       // 任务控制条先藏起来
  els.dialogueBar.hidden = false;
  showTip('', '');
  showDialogueLine();
}

function showDialogueLine() {
  const ln = currentLines[lineIndex];
  els.speaker.hidden = false;
  els.speakerAvatar.className = 'avatar avatar--' + ln.speaker;
  els.speakerName.textContent = SPEAKER_NAME[ln.speaker];
  els.enLine.textContent = ln.en;
  els.enLine.hidden = false;
  els.zhLine.textContent = ln.zh;
  els.zhLine.hidden = false;
  // 最后一句按钮写“开始/继续”，其余写“下一句”
  els.dialogueNext.textContent = lineIndex === currentLines.length - 1 ? '继续' : '下一句';
  playAudio(ln.audio).then(() => {
    if (!audioState.played) showTip('声音没出来，点「重听这句」试试。', 'bad');
  });
}

function advanceDialogue() {
  if (lineIndex < currentLines.length - 1) {
    lineIndex++;
    showDialogueLine();
  } else {
    els.dialogueBar.hidden = true;
    els.zhLine.hidden = true;
    goNext();
  }
}

function renderCheck(step) {
  current.showCheck(step.target);
  showTip('听完，点你听到的东西。', '');
  playAudio(step.audio).then(() => {
    if (!audioState.played) showTip('声音没出来，点「再听一次」试试。', 'bad');
  });
}

function quizAudio(step) {
  return 'tap-' + step.relation + '-' + step.holder;
}

function captionText(step) {
  return step.relation === 'on'
    ? 'Tap the book on the ' + step.holder + '.'
    : 'Tap the book next to the ' + step.holder + '.';
}

function renderQuiz(step) {
  // 关系在渲染时随机定，避免提前写死
  step.relation = Math.random() < 0.5 ? 'on' : 'next';
  const side = Math.random() < 0.5 ? 'left' : 'right';
  current.showQuiz(step.holder, side);
  record.quizTotal++;
  showTip('听完，点对的那本书。', '');
  playAudio(quizAudio(step)).then(() => {
    if (!audioState.played) showTip('声音没出来，点「再听一次」试试。', 'bad');
  });
}

// ===== 点击判定 =====
function handlePick(pos) {
  const step = steps[stepIndex];

  if (step.type === 'check') {
    if (!audioState.played) { showTip('先听，点「再听一次」。', 'bad'); return; }
    if (pos === step.target) {
      if (locked) return;
      locked = true;
      current.mark(pos, 'correct');
      showTip('对啦！', 'good');
      setTimeout(goNext, 750);
    } else {
      showTip('再听听看。', 'bad');
      playAudio(step.audio);
    }
    return;
  }

  if (step.type === 'quiz') {
    if (!audioState.played) { showTip('先听，点「再听一次」。', 'bad'); return; }
    if (pos === step.relation) {
      if (locked) return;
      locked = true;
      if (!answered) record.firstCorrect++;
      current.mark(pos, 'correct');
      showTip('找到书啦！', 'good');
      setTimeout(goNext, 850);
    } else {
      answered = true;
      current.mark(pos, 'wrong');
      showTip('这本不对，再听一次，注意 on 还是 next to。', 'bad');
      playAudio(quizAudio(step));
    }
  }
}

function goNext() {
  closeAllModals();
  const next = stepIndex + 1;
  if (next >= steps.length) {
    stepIndex = steps.length - 1;
    return;
  }
  stepIndex = next;
  renderStep();
}

// ===== 示范 =====
function openDemoStep() {
  // 流程里的示范步骤：直接打开示范弹层
  openDemo();
}

function openDemo() {
  record.usedDemo = true;
  els.demoStage.innerHTML =
    '<span class="demo-word on">on：书在推车上面</span>' +
    '<span class="demo-word next">next to：书在推车旁边</span>';
  els.demoModal.hidden = false;
  playThen('on-cart', () => playThen('next-cart', null));
}

// ===== 开口 =====
function openSpeak() {
  els.speakModal.hidden = false;
  showTip('对馆员说一句，也可以直接借书。', '');
}

// ===== 完成 =====
function openDone() {
  els.report.innerHTML =
    '<p>听辨题一共 ' + record.quizTotal + ' 道，第一次就点对 ' + record.firstCorrect + ' 道</p>' +
    '<p>点了「再听一次」 ' + record.replays + ' 次</p>' +
    '<p>求助：字幕 ' + (record.usedCaption ? '用了' : '没用') +
    '，示范 ' + (record.usedDemo ? '用了' : '没用') + '</p>';
  els.doneModal.hidden = false;
}

// 完成关卡：解锁下一关、背包加道具
function finishLevel() {
  closeAllModals();
  bagCount += 1;
  els.bagCount.textContent = bagCount;
  unlocked = Math.max(unlocked, 2);
  disposeCurrent();
  startTown();
}

// ===== 事件绑定 =====
els.dialogueNext.addEventListener('click', () => {
  stopAudio();
  advanceDialogue();
});
els.dialogueReplay.addEventListener('click', () => {
  playAudio(currentLines[lineIndex].audio);
});

$('start-btn').addEventListener('click', () => {
  els.start.hidden = true;
  els.stage.hidden = false;
  startTown();
});

els.back.addEventListener('click', () => {
  disposeCurrent();
  startTown();
});

els.replay.addEventListener('click', () => {
  record.replays++;
  const step = steps[stepIndex];
  if (step.type === 'quiz') playAudio(quizAudio(step));
  else if (step.type === 'check') playAudio(step.audio);
});

els.caption.addEventListener('click', () => {
  const step = steps[stepIndex];
  if (step.type !== 'quiz') return;
  if (!els.enLine.hidden) {
    els.enLine.hidden = true;
    els.caption.textContent = '看字幕';
    return;
  }
  record.usedCaption = true;
  els.enLine.textContent = captionText(step);
  els.enLine.hidden = false;
  els.caption.textContent = '藏字幕';
});

els.demoBtn.addEventListener('click', openDemo);

els.demoClose.addEventListener('click', () => {
  stopAudio();
  const step = steps[stepIndex];
  if (step && step.type === 'demo') goNext();
  else els.demoModal.hidden = true;
});

els.speakListen.addEventListener('click', () => playAudio('ask-checkout'));
els.speakDone.addEventListener('click', () => {
  els.speakModal.hidden = true;
  let moved = false;
  const move = () => { if (!moved) { moved = true; goNext(); } };
  playThen('beaver-done', move);
  setTimeout(move, 4000); // 兜底：音频没成功也能往下走
});
els.speakSkip.addEventListener('click', () => {
  els.speakModal.hidden = true;
  goNext();
});

els.doneContinue.addEventListener('click', finishLevel);

// 窗口尺寸变化
window.addEventListener('resize', () => {
  if (current && current.resize) current.resize();
});
