'use strict';

const $ = id => document.getElementById(id);
const voice = $('voice');

const AUDIO = {
  'tap-book': 'audio/tap-book.m4a',
  'tap-cart': 'audio/tap-cart.m4a',
  'on-cart': 'audio/on-cart.m4a',
  'next-cart': 'audio/next-cart.m4a',
  'tap-on-cart': 'audio/tap-on-cart.m4a',
  'tap-next-cart': 'audio/tap-next-cart.m4a',
  'tap-on-box': 'audio/tap-on-box.m4a',
  'tap-next-box': 'audio/tap-next-box.m4a',
  'ask-checkout': 'audio/ask-checkout.m4a',
  'beaver-done': 'audio/beaver-done.m4a',
};

// 一次完整闯关的记录
const record = {
  firstCorrect: 0,
  quizTotal: 0,
  replays: 0,
  usedCaption: false,
  usedDemo: false,
};

let steps = [];
let stepIndex = 0;
let audioPlayed = false;   // 当前题音频是否真正成功播放
let answered = false;     // 当前题是否已首次作答
let locked = false;       // 答对后锁定，防止连点重复推进

function playAudio(key) {
  audioPlayed = false;
  voice.src = AUDIO[key];
  return voice.play().then(() => {
    audioPlayed = true;
  }).catch(() => {
    audioPlayed = false;
    showTip('声音没出来，点「再听一次」试试。', 'bad');
  });
}

function showTip(text, kind) {
  const tip = $('tip');
  tip.textContent = text;
  tip.className = 'tip' + (kind ? ' ' + kind : '');
}

function buildRun() {
  const list = [];
  list.push({type: 'check', target: 'book', audio: 'tap-book'});
  list.push({type: 'check', target: 'cart', audio: 'tap-cart'});
  list.push({type: 'demo'});
  // 核心听辨：cart 四题，关系随机
  for (let i = 0; i < 4; i++) list.push({type: 'quiz', holder: 'cart', relation: Math.random() < 0.5 ? 'on' : 'next'});
  // 迁移：box 两题
  for (let i = 0; i < 2; i++) list.push({type: 'quiz', holder: 'box', relation: Math.random() < 0.5 ? 'on' : 'next'});
  list.push({type: 'speak'});
  list.push({type: 'done'});
  return list;
}

function renderProgress() {
  const bar = $('progress');
  bar.innerHTML = '';
  const total = steps.length;
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('i');
    if (i < stepIndex) dot.className = 'on';
    else if (i === stepIndex) dot.className = 'now';
    bar.appendChild(dot);
  }
}

function holderHTML(kind) {
  if (kind === 'box') {
    return '<div class="holder"><div class="box-body"></div></div>';
  }
  return '<div class="holder"><div class="cart-body"></div></div>';
}

function quizAudio(step) {
  return 'tap-' + step.relation + '-' + step.holder;
}

function renderQuiz(step) {
  answered = false;
  locked = false;
  $('en-line').textContent = '';
  $('en-line').hidden = true;
  $('caption-btn').textContent = '看字幕';
  // 先修正缺失音频导致的关系变化，再创建判定逻辑，保证听到的和判定的一致
  const audio = quizAudio(step);
  $('surface').innerHTML = holderHTML(step.holder);
  const surface = $('surface');
  const side = Math.random() < 0.5 ? 'left' : 'right';

  // 两本书：一本在容器上(on)，一本在容器旁(next)，外观一致
  const onBook = makeBook('on', step.relation);
  const nextBook = makeBook('next', step.relation);
  onBook.style.cssText = 'position:absolute;bottom:42px;left:50%;transform:translateX(-50%);';
  nextBook.style.cssText = 'position:absolute;bottom:6px;' + side + ':6px;';
  surface.appendChild(onBook);
  surface.appendChild(nextBook);

  record.quizTotal++;
  playAudio(audio);
  showTip('听完，点对的那本书。', '');
}

function makeBook(pos, relation) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'book ' + pos;
  b.dataset.pos = pos;
  b.setAttribute('aria-label', '一本书');
  b.addEventListener('click', () => {
    if (!audioPlayed) {
      showTip('先听馆员说，点「再听一次」。', 'bad');
      return;
    }
    judge(b, pos, relation);
  });
  return b;
}

function judge(book, pos, relation) {
  if (pos === relation) {
    if (locked) return;
    locked = true;
    if (!answered) record.firstCorrect++;
    book.classList.add('correct');
    showTip('找到书啦！', 'good');
    setTimeout(goNext, 850);
  } else {
    if (!answered) answered = true;
    book.classList.add('wrong');
    showTip('这本不对，再听一次，注意 on 还是 next to。', 'bad');
    const step = steps[stepIndex];
    playAudio(quizAudio(step));
    setTimeout(() => book.classList.remove('wrong'), 700);
  }
}

// 基础确认：书和推车两个可点物
function renderCheck(step) {
  answered = false;
  locked = false;
  $('en-line').hidden = true;
  const surface = $('surface');
  surface.innerHTML = '';
  surface.style.justifyContent = 'space-around';
  surface.style.alignItems = 'flex-end';

  const book = document.createElement('button');
  book.type = 'button';
  book.className = 'book';
  book.textContent = 'book';
  const cart = document.createElement('button');
  cart.type = 'button';
  cart.className = 'book';
  cart.style.background = 'linear-gradient(120deg,#4f8a78,#356b5c)';
  cart.textContent = 'cart';

  const pick = (el, name) => {
    el.addEventListener('click', () => {
      if (!audioPlayed) { showTip('先听，点「再听一次」。', 'bad'); return; }
      if (name === step.target) {
        if (locked) return;
        locked = true;
        el.classList.add('correct');
        showTip('对啦！', 'good');
        setTimeout(goNext, 750);
      } else {
        el.classList.add('wrong');
        showTip('再听听看。', 'bad');
        playAudio(step.audio);
        setTimeout(() => el.classList.remove('wrong'), 700);
      }
    });
  };
  pick(book, 'book');
  pick(cart, 'cart');
  surface.appendChild(book);
  surface.appendChild(cart);
  playAudio(step.audio);
  showTip('点你听到的东西。', '');
}

function renderDemoStep() {
  openDemo();
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

function renderStep() {
  const step = steps[stepIndex];
  renderProgress();
  if (step.type === 'check') renderCheck(step);
  else if (step.type === 'quiz') renderQuiz(step);
  else if (step.type === 'demo') renderDemoStep();
  else if (step.type === 'speak') openSpeak();
  else if (step.type === 'done') openDone();
}

function closeAllModals() {
  ['demo-modal', 'speak-modal', 'done-modal'].forEach(id => { $(id).hidden = true; });
}

function openDemo() {
  const m = $('demo-modal');
  m.hidden = false;
  const stage = $('demo-stage');
  stage.innerHTML = '<div class="demo-book d-on">on</div><div class="demo-book d-next">next to</div>';
  // 依次播两句示范
  playAudio('on-cart');
  voice.onended = () => {
    if (!$('demo-modal').hidden) setTimeout(() => playAudio('next-cart'), 400);
  };
}

function openSpeak() {
  $('speak-modal').hidden = false;
}

function openDone() {
  const r = $('report');
  r.innerHTML =
    '<p>听辨题一共 <b>' + record.quizTotal + '</b> 道，第一次就点对 <b>' + record.firstCorrect + '</b> 道</p>' +
    '<p>点了「再听一次」 <b>' + record.replays + '</b> 次</p>' +
    '<p>求助：字幕 ' + (record.usedCaption ? '用了' : '没用') + '，示范 ' + (record.usedDemo ? '用了' : '没用') + '</p>';
  $('done-modal').hidden = false;
}

// 事件
$('start-btn').addEventListener('click', () => {
  steps = buildRun();
  stepIndex = 0;
  record.firstCorrect = 0;
  record.quizTotal = 0;
  record.replays = 0;
  record.usedCaption = false;
  record.usedDemo = false;
  $('start-card').hidden = true;
  $('stage-card').hidden = false;
  renderStep();
});

$('replay-btn').addEventListener('click', () => {
  record.replays++;
  const step = steps[stepIndex];
  if (step.type === 'quiz') playAudio(quizAudio(step));
  else if (step.type === 'check') playAudio(step.audio);
});

$('caption-btn').addEventListener('click', () => {
  const line = $('en-line');
  const step = steps[stepIndex];
  if (!line.hidden) { line.hidden = true; $('caption-btn').textContent = '看字幕'; return; }
  record.usedCaption = true;
  if (step.type === 'quiz') {
    line.textContent = step.relation === 'on'
      ? 'Tap the book on the ' + step.holder + '.'
      : 'Tap the book next to the ' + step.holder + '.';
  }
  line.hidden = false;
  $('caption-btn').textContent = '藏字幕';
});

$('demo-btn').addEventListener('click', () => {
  record.usedDemo = true;
  openDemo();
});

$('demo-close').addEventListener('click', () => {
  voice.onended = null;
  // 看完示范：若是流程里的示范步骤就进下一题；若是中途求助则只关闭
  const step = steps[stepIndex];
  if (step && step.type === 'demo') goNext();
  else $('demo-modal').hidden = true;
});

$('speak-listen').addEventListener('click', () => playAudio('ask-checkout'));
$('speak-done').addEventListener('click', () => {
  $('speak-modal').hidden = true;
  playAudio('beaver-done');
  setTimeout(openDone, 900);
});
$('speak-skip').addEventListener('click', () => {
  $('speak-modal').hidden = true;
  openDone();
});

$('again-btn').addEventListener('click', () => {
  closeAllModals();
  $('stage-card').hidden = true;
  $('start-card').hidden = false;
});
