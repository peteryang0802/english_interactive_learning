'use strict';

const byId = id => document.getElementById(id);
const library = byId('library');
const plan = byId('plan');
const model = byId('three');
const dimension = byId('dimension');
const viewpoint = byId('viewpoint');
const modelMessage = byId('model-message');
const roomStatus = byId('room-status');
const audio = byId('voice');
const listen = byId('listen');
const listenLabel = byId('listen-label');
const mediaMessage = byId('media-message');
const feedback = byId('feedback');
const choices = byId('route-choices');
const advance = byId('advance');
const practice = byId('practice-line');
const steps = [...document.querySelectorAll('[data-track]')];

const lines = {
  'rabbit-welcome': ['小兔', 'rabbit', "I found a copy, but I can't take it home."],
  'beaver-welcome': ['河狸馆员', 'beaver', 'Hi! What are you looking for?'],
  'beaver-window': ['河狸馆员', 'beaver', 'Yes. The copy you can check out is upstairs, on the cart by the big window.'],
  'beaver-shelf': ['河狸馆员', 'beaver', 'Yes. The copy you can check out is upstairs, on the cart next to the tall bookshelf.'],
  'rabbit-found': ['小兔', 'rabbit', "I found it! Let's take it to the front desk."],
  'rabbit-wait': ['小兔', 'rabbit', 'Which cart do you mean?'],
  'beaver-done': ['河狸馆员', 'beaver', 'Of course! Enjoy the book!'],
  'wrong-cart': ['小兔', 'rabbit', "The book isn't on this cart. Let's listen to the librarian again."],
  'desk-first': ['小兔', 'rabbit', 'We need to find the book before we can check it out.'],
  'bookshelf-first': ['小兔', 'rabbit', "That's the bookshelf. We need the return cart."],
  'ask-copy': ['松鼠示范', 'squirrel', 'Is there another copy I can check out?'],
  'guide-window': ['松鼠示范', 'squirrel', 'Go upstairs and turn right. Look for the cart by the window.'],
  'guide-shelf': ['松鼠示范', 'squirrel', 'Go upstairs and turn left. Look for the cart next to the tall bookshelf.'],
  'ask-checkout': ['松鼠示范', 'squirrel', 'Can I check this out, please?'],
};

const variations = ['window', 'shelf'];
const stageInfo = [
  {title: '小兔找到了一本书', room: '小兔在一楼借阅台', cue: 'rabbit-welcome', practice: 'ask-copy', action: '问问馆员', track: 0},
  {title: '馆员给了线索', room: '点两辆还书车中的一辆', track: 1},
  {title: '找到了能借走的那一本', room: '小兔到了二楼还书车', cue: 'rabbit-found', practice: 'ask-checkout', action: '到借阅台借书', track: 1},
  {title: '借到书了', room: '小兔带着书回到借阅台', cue: 'beaver-done', practice: 'ask-checkout', action: '换个位置再试', track: 2},
];

let stage = 0;
let variant = 0;
let displayLine = 'rabbit-welcome';
let currentAudio = 'rabbit-welcome';
let attempt = 0;
let threeScene;
let loadingScene = false;
let threeActive = false;
let view = 'overview';
const loadedScripts = new Set();
const destination = () => variations[variant];
const cue = () => stage === 1 ? 'beaver-' + destination() : stageInfo[stage].cue;
const practiceCue = () => stage === 1 ? 'guide-' + destination() : stageInfo[stage].practice;

function caption(key) {
  const [speaker, animal, text] = lines[key];
  byId('speaker').textContent = speaker;
  byId('speaker-art').className = 'animal animal--' + animal;
  byId('speaker-line').textContent = text;
  displayLine = key;
  reflectAudio();
}

function reflectAudio() {
  const playing = !audio.paused && !audio.ended;
  listen.dataset.playing = String(playing);
  const label = playing ? '暂停' : displayLine !== cue() && stage === 1 ? '重听馆员线索' : '播放美式英语';
  listenLabel.textContent = label;
}

function playLine(key) {
  const id = ++attempt;
  mediaMessage.textContent = '';
  audio.pause();
  if (currentAudio !== key) {
    audio.src = 'audio/' + key + '.m4a?v=3';
    currentAudio = key;
  } else if (audio.readyState > 0) {
    audio.currentTime = 0;
  } else if (audio.error) {
    audio.load();
  }
  caption(key);
  audio.play().catch(error => {
    if (id !== attempt || error.name === 'AbortError') return;
    mediaMessage.textContent = '这句没播出来。再点一次播放。';
    reflectAudio();
  });
  reflectAudio();
}

function showFeedback(message, positive = false) {
  feedback.textContent = message;
  feedback.dataset.positive = String(positive);
  feedback.hidden = !message;
}

function renderStage() {
  const info = stageInfo[stage];
  library.dataset.stage = String(stage);
  library.dataset.variant = destination();
  byId('step-title').textContent = info.title;
  roomStatus.textContent = info.room;
  for (const item of steps) {
    if (Number(item.dataset.track) === info.track) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  }
  choices.hidden = stage !== 1;
  advance.hidden = stage === 1;
  advance.textContent = info.action || '';
  practice.textContent = lines[practiceCue()][2];
  threeScene?.setStage(stage, variant);
  caption(cue());
}

function moveTo(next, origin) {
  stage = next;
  showFeedback('');
  renderStage();
  playLine(cue());
  if (origin?.closest?.('#dialogue') && (origin.hidden || origin.closest('[hidden]'))) {
    listen.focus({preventScroll: true});
  }
}

function pickPlace(place, origin) {
  if (place === 'empty') {
    const instructions = ['先问馆员，听听她给的线索。', '试试点两辆还书车中的一辆。', '找到书了，下一步去一楼借阅台。', '可以点「换个位置再试」，再帮小兔找一次。'];
    showFeedback(instructions[stage]);
    if (stage === 1) playLine('rabbit-wait');
    return;
  }
  if (place === 'desk') {
    if (stage === 2) {
      moveTo(3, origin);
      showFeedback('书借到了。你听懂了馆员说的位置。', true);
    } else if (stage === 3) {
      showFeedback('这本书已经借到了。', true);
      playLine('beaver-done');
    } else {
      showFeedback('这里是借阅台。找到能借走的书再回来。');
      playLine('desk-first');
    }
    return;
  }
  if (stage === 0) {
    showFeedback('先问柜台的河狸馆员，听听她说哪一本能借。');
    playLine('beaver-welcome');
    return;
  }
  if (stage !== 1) {
    showFeedback(stage === 2 ? '书已经找到了。现在去一楼借阅台。' : '这一轮已经借到了。可以换个位置再试。', true);
    playLine(cue());
    return;
  }
  if (place === 'books') {
    showFeedback('你点的是书架。馆员说的是还书车，再听听是哪辆。');
    playLine('bookshelf-first');
  } else if (place === destination()) {
    moveTo(2, origin);
    showFeedback(place === 'window' ? '找对了。你听到了 by the big window。' : '找对了。你听到了 next to the tall bookshelf。', true);
  } else {
    showFeedback('这辆车上没有能借的那一本。重听馆员，再选一辆。');
    playLine('wrong-cart');
  }
}

function loadScript(url) {
  if (loadedScripts.has(url)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => finish(new Error('3D download timed out')), 6500);
    function finish(error) {
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else {
        loadedScripts.add(url);
        resolve();
      }
    }
    script.src = url;
    script.onload = () => finish();
    script.onerror = () => finish(new Error('3D script unavailable'));
    document.head.append(script);
  });
}

function modelLabel(message = '') {
  modelMessage.textContent = message;
  modelMessage.hidden = !message;
}

async function toggleView() {
  if (loadingScene) return;
  if (threeActive) {
    threeActive = false;
    threeScene?.dispose();
    threeScene = undefined;
    model.hidden = true;
    plan.hidden = false;
    viewpoint.hidden = true;
    dimension.textContent = '打开 3D';
    dimension.setAttribute('aria-expanded', 'false');
    return;
  }
  loadingScene = true;
  dimension.setAttribute('aria-busy', 'true');
  dimension.textContent = '准备 3D…';
  modelLabel('');
  try {
    await loadScript('src/three.min.js');
    await loadScript('src/scene.js');
    model.hidden = false;
    threeScene = window.MoonMapScene.mount(model, pickPlace);
    view = 'overview';
    threeScene.setStage(stage, variant);
    threeActive = true;
    plan.hidden = true;
    viewpoint.hidden = false;
    viewpoint.textContent = '看小兔视角';
    dimension.textContent = '切回平面';
    dimension.setAttribute('aria-expanded', 'true');
  } catch {
    threeScene?.dispose();
    threeScene = undefined;
    model.hidden = true;
    plan.hidden = false;
    modelLabel('3D 暂时没打开。平面图和语音可以继续用。');
    dimension.textContent = '重试 3D';
  } finally {
    loadingScene = false;
    dimension.removeAttribute('aria-busy');
  }
}

for (const event of ['playing', 'pause', 'ended', 'emptied']) audio.addEventListener(event, reflectAudio);
listen.addEventListener('click', () => {
  if (!audio.paused && !audio.ended) {
    ++attempt;
    audio.pause();
    reflectAudio();
    return;
  }
  playLine(stage === 1 && displayLine !== cue() ? cue() : displayLine);
});
byId('practice-play').addEventListener('click', () => playLine(practiceCue()));
advance.addEventListener('click', () => {
  if (stage === 0) moveTo(1, advance);
  else if (stage === 2) pickPlace('desk', advance);
  else if (stage === 3) {
    variant = (variant + 1) % variations.length;
    moveTo(0, advance);
  }
});
for (const button of choices.querySelectorAll('[data-cart]')) {
  button.addEventListener('click', () => pickPlace(button.dataset.cart, button));
}
plan.addEventListener('click', event => {
  const button = event.target.closest('[data-map-place]');
  pickPlace(button?.dataset.mapPlace || 'empty', button);
});
dimension.addEventListener('click', toggleView);
viewpoint.addEventListener('click', () => {
  if (!threeScene) return;
  view = view === 'overview' ? 'rabbit' : 'overview';
  threeScene.setView(view);
  viewpoint.textContent = view === 'rabbit' ? '看全馆' : '看小兔视角';
});
renderStage();
