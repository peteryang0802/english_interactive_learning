// 通用 2D 图卡视图：不依赖 WebGL，用 HTML 按钮 + 内联 SVG 表达候选。
// 按 levelId 选图标和场景；接口与 3D 视图一致，由同一个引擎驱动，作为无障碍和弱设备回退。

const BOOK_SVG = '<svg viewBox="0 0 40 32" aria-hidden="true"><rect x="4" y="3" width="32" height="26" rx="3" fill="#2f7d8c"/><rect x="7" y="6" width="26" height="20" rx="2" fill="#f7f1e2"/></svg>';
const CART_SVG = '<svg viewBox="0 0 48 40" aria-hidden="true"><rect x="6" y="10" width="36" height="8" rx="2" fill="#6b7a86"/><rect x="9" y="18" width="3" height="12" fill="#444"/><rect x="36" y="18" width="3" height="12" fill="#444"/><circle cx="12" cy="33" r="5" fill="#222"/><circle cx="36" cy="33" r="5" fill="#222"/></svg>';
const BOX_SVG = '<svg viewBox="0 0 44 40" aria-hidden="true"><rect x="6" y="8" width="32" height="28" rx="2" fill="#b07a45"/><path d="M6 8 L22 20 L38 8" stroke="#8a5a30" fill="none" stroke-width="2"/></svg>';

const ROLL_SVG = '<svg viewBox="0 0 40 34" aria-hidden="true"><ellipse cx="20" cy="18" rx="15" ry="13" fill="#e8b878"/><path d="M11 14 q3 -4 6 0 M23 14 q3 -4 6 0" stroke="#c9915a" fill="none" stroke-width="2"/></svg>';
const BREAD_SVG = '<svg viewBox="0 0 48 34" aria-hidden="true"><ellipse cx="24" cy="19" rx="20" ry="12" fill="#d99a5e"/><path d="M18 12 q4 5 8 0" stroke="#b07a45" fill="none" stroke-width="2"/></svg>';
const BAG_SVG = '<svg viewBox="0 0 36 40" aria-hidden="true"><rect x="6" y="8" width="24" height="28" rx="2" fill="#c9a877"/><rect x="6" y="6" width="24" height="5" rx="2" fill="#b08c5e"/></svg>';
const BASKET_SVG = '<svg viewBox="0 0 40 36" aria-hidden="true"><path d="M6 10 L34 10 L31 32 L9 32 Z" fill="#a9743f"/><ellipse cx="20" cy="10" rx="14" ry="3.5" fill="#8a5a30"/></svg>';

// 盘子（数量候选底座）
const PLATE_SVG = '<svg viewBox="0 0 80 20" aria-hidden="true"><ellipse cx="40" cy="12" rx="36" ry="7" fill="#f2f0e8" stroke="#d8d4c8" stroke-width="1.5"/></svg>';

// 超市商品
const APPLE_SVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="24" r="12" fill="#d9483f"/><path d="M20 12 q4 -4 7 -2" stroke="#5aa86b" fill="none" stroke-width="2"/></svg>';
const MILK_SVG = '<svg viewBox="0 0 36 44" aria-hidden="true"><rect x="8" y="10" width="20" height="30" fill="#f2f0e8"/><rect x="8" y="18" width="20" height="10" fill="#4f93d6"/></svg>';
const CHEESE_SVG = '<svg viewBox="0 0 40 36" aria-hidden="true"><path d="M8 28 L20 10 L32 28 Z" fill="#f2c14e"/></svg>';
const EGG_SVG = '<svg viewBox="0 0 36 40" aria-hidden="true"><ellipse cx="18" cy="22" rx="11" ry="15" fill="#f7f4ee"/></svg>';

// 派对：礼物、蜡烛
const GIFT_SVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="8" y="14" width="24" height="22" fill="#4f93d6"/><rect x="8" y="14" width="5" height="22" fill="#f2c14e"/><rect x="18" y="14" width="5" height="22" fill="#f2c14e"/></svg>';
const CANDLE_SVG = '<svg viewBox="0 0 36 44" aria-hidden="true"><rect x="15" y="14" width="6" height="26" fill="#ffffff"/><path d="M18 4 L22 12 L14 12 Z" fill="#f2a13c"/></svg>';

// 桌子（方桌，桌面 + 四条腿）
const TABLE_SVG = '<svg viewBox="0 0 56 48" aria-hidden="true"><rect x="6" y="14" width="44" height="7" rx="2" fill="#9c6b3f"/><rect x="10" y="21" width="4" height="20" fill="#6e4525"/><rect x="42" y="21" width="4" height="20" fill="#6e4525"/><rect x="18" y="21" width="4" height="16" fill="#7a5030"/><rect x="34" y="21" width="4" height="16" fill="#7a5030"/></svg>';
// 长椅（座面 + 靠背）
const BENCH_SVG = '<svg viewBox="0 0 56 44" aria-hidden="true"><rect x="8" y="18" width="40" height="7" rx="2" fill="#8a5a34"/><rect x="10" y="25" width="4" height="16" fill="#444"/><rect x="42" y="25" width="4" height="16" fill="#444"/><rect x="10" y="8" width="40" height="6" rx="2" fill="#8a5a34"/><rect x="12" y="14" width="3" height="8" fill="#7a482c"/><rect x="41" y="14" width="3" height="8" fill="#7a482c"/></svg>';
// 小地图（折叠地图，长椅 on/next 题用）
const MAPM_SVG = '<svg viewBox="0 0 40 32" aria-hidden="true"><path d="M6 6 L16 4 L24 7 L34 4 L34 26 L24 28 L16 25 L6 27 Z" fill="#e8d9a8" stroke="#9c7b46" stroke-width="1.5"/><path d="M16 4 L16 25 M24 7 L24 28" stroke="#9c7b46" stroke-width="1.2"/></svg>';
// 货架（三层金属架，超市方位题用）
const SHELF_SVG = '<svg viewBox="0 0 56 48" aria-hidden="true"><rect x="8" y="10" width="40" height="5" rx="1" fill="#6b7a86"/><rect x="8" y="22" width="40" height="5" rx="1" fill="#6b7a86"/><rect x="8" y="34" width="40" height="5" rx="1" fill="#6b7a86"/><rect x="10" y="10" width="3" height="29" fill="#555c66"/><rect x="43" y="10" width="3" height="29" fill="#555c66"/></svg>';

// 单个小气球（数量卡片用）
function balloonSvg(color) {
  return '<svg viewBox="0 0 20 36" aria-hidden="true"><ellipse cx="10" cy="12" rx="7" ry="9" fill="' + color + '"/><path d="M10 21 L10 33" stroke="#888" stroke-width="1.5" fill="none"/></svg>';
}
// 方向箭头（左蓝、右红、直行黄，和路口小旗配色一致）
const ARROW_LEFT = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M16 8 L6 20 L16 32 M6 20 H34" stroke="#4f93d6" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_RIGHT = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M24 8 L34 20 L24 32 M34 20 H6" stroke="#ef6f5b" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_STRAIGHT = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 34 V8 M10 16 L20 6 L30 16" stroke="#e0a92e" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function iconFor(pos) {
  if (pos === 'book' || pos === 'on' || pos === 'next' || pos === 'demo') return BOOK_SVG;
  if (pos === 'cart') return CART_SVG;
  if (pos === 'box') return BOX_SVG;
  if (pos === 'roll') return ROLL_SVG;
  if (pos === 'bread') return BREAD_SVG;
  if (pos === 'bag') return BAG_SVG;
  if (pos === 'basket') return BASKET_SVG;
  if (pos === 'apple') return APPLE_SVG;
  if (pos === 'milk') return MILK_SVG;
  if (pos === 'cheese') return CHEESE_SVG;
  if (pos === 'egg') return EGG_SVG;
  if (pos === 'gift') return GIFT_SVG;
  if (pos === 'candle') return CANDLE_SVG;
  if (pos === 'table') return TABLE_SVG;
  if (pos === 'bench') return BENCH_SVG;
  if (pos === 'map') return MAPM_SVG;
  if (pos === 'shelf') return SHELF_SVG;
  return '';
}

export function createLibrary2D(container, levelId = 'library') {
  const root = document.createElement('div');
  root.className = 'view2d';
  container.appendChild(root);

  let pickCb = null;
  let cards = [];
  let demoEl = null;

  function clear() {
    root.innerHTML = '';
    root.className = 'view2d';
    cards = [];
    demoEl = null;
  }

  function makeCard(pos, cls, inner) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'v2-card ' + cls;
    btn.dataset.pos = pos;
    btn.innerHTML = inner || iconFor(pos);
    btn.addEventListener('click', () => { if (pickCb) pickCb(pos); });
    root.appendChild(btn);
    cards.push(btn);
    return btn;
  }

  // 数量候选卡片：盘子 + 1 个或 2 个面包卷
  function countCard(pick) {
    const rolls = pick === 'one'
      ? '<span class="mini-roll">' + ROLL_SVG + '</span>'
      : '<span class="mini-roll">' + ROLL_SVG + '</span><span class="mini-roll">' + ROLL_SVG + '</span>';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'v2-card v2-count-card';
    btn.dataset.pos = pick;
    btn.innerHTML = PLATE_SVG + '<span class="roll-row">' + rolls + '</span>';
    btn.addEventListener('click', () => { if (pickCb) pickCb(pick); });
    root.appendChild(btn);
    cards.push(btn);
    return btn;
  }

  // 袋子候选卡片：篮子 + on/next 袋子
  function bagCard(pick) {
    const bag = pick === 'on'
      ? '<span class="mini-bag bag-on">' + BAG_SVG + '</span>'
      : '<span class="mini-bag bag-next">' + BAG_SVG + '</span>';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'v2-card v2-bag-card';
    btn.dataset.pos = pick;
    btn.innerHTML = '<span class="mini-basket">' + BASKET_SVG + '</span>' + bag;
    btn.addEventListener('click', () => { if (pickCb) pickCb(pick); });
    root.appendChild(btn);
    cards.push(btn);
    return btn;
  }

  // 派对气球数量卡片：one 一个气球，two 两个气球
  function partyBalloonCard(pick) {
    const balloons = pick === 'one'
      ? '<span class="mini-balloon">' + balloonSvg('#ef6f5b') + '</span>'
      : '<span class="mini-balloon">' + balloonSvg('#ef6f5b') + '</span><span class="mini-balloon">' + balloonSvg('#4f93d6') + '</span>';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'v2-card v2-count-card';
    btn.dataset.pos = pick;
    btn.innerHTML = '<span class="balloon-row">' + balloons + '</span>';
    btn.addEventListener('click', () => { if (pickCb) pickCb(pick); });
    root.appendChild(btn);
    cards.push(btn);
    return btn;
  }

  // 通用 on/next 关系场景：holder 居中，on 候选在它上面，next 在旁边地上。
  // 候选统一用 candidateSvg，保证和 3D 里是同一种物体（书/地图/苹果）。
  function holderScene(holder, candidateSvg, side, labels) {
    root.classList.remove('v2-check');
    const scene = document.createElement('div');
    scene.className = 'v2-scene ' + (side === 'left' ? 'next-left' : 'next-right');

    const holderEl = document.createElement('div');
    holderEl.className = 'v2-holder';
    holderEl.innerHTML = iconFor(holder);

    const onBtn = document.createElement('button');
    onBtn.type = 'button';
    onBtn.className = 'v2-card v2-on';
    onBtn.dataset.pos = 'on';
    onBtn.setAttribute('aria-label', labels.on);
    onBtn.innerHTML = candidateSvg;
    onBtn.addEventListener('click', () => { if (pickCb) pickCb('on'); });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'v2-card v2-next';
    nextBtn.dataset.pos = 'next';
    nextBtn.setAttribute('aria-label', labels.next);
    nextBtn.innerHTML = candidateSvg;
    nextBtn.addEventListener('click', () => { if (pickCb) pickCb('next'); });

    scene.appendChild(holderEl);
    scene.appendChild(onBtn);
    scene.appendChild(nextBtn);
    root.appendChild(scene);
    cards.push(onBtn, nextBtn);
  }

  // ===== 词义确认 =====
  function showCheck(step) {
    clear();
    root.classList.add('v2-check');
    step.options.forEach((o) => makeCard(o, 'v2-' + o));
  }

  // ===== 听辨题 =====
  function showQuiz(step) {
    clear();
    root.classList.add('v2-check');
    if (step.scene === 'bakery-count') {
      countCard('one');
      countCard('two');
    } else if (step.scene === 'bakery-bag') {
      bagCard('on');
      bagCard('next');
    } else if (step.scene === 'party-balloons') {
      partyBalloonCard('one');
      partyBalloonCard('two');
    } else if (step.scene === 'party-direction' || step.scene === 'crossing-dir') {
      // 路口 / 派对方向题：三个方向箭头
      makeCard('left', 'v2-left', ARROW_LEFT);
      makeCard('right', 'v2-right', ARROW_RIGHT);
      makeCard('straight', 'v2-straight', ARROW_STRAIGHT);
    } else if (step.scene === 'party-book') {
      // 桌子 + on（桌上）/ next（旁边）两本书
      holderScene('table', BOOK_SVG, step.side || 'right',
        { on: 'book on the table', next: 'book next to the table' });
    } else if (step.scene === 'crossing-bench') {
      // 长椅 + on（椅面上）/ next（旁边）两张地图
      holderScene('bench', MAPM_SVG, step.side || 'right',
        { on: 'map on the bench', next: 'map next to the bench' });
    } else if (step.scene === 'market-shelf') {
      // 货架 + on（架上）/ next（旁边）两个苹果
      holderScene('shelf', APPLE_SVG, step.side || 'right',
        { on: 'apple on the shelf', next: 'apple next to the shelf' });
    } else {
      // 图书馆 on/next：cart 或 box 作 holder，候选是书
      holderScene(step.holder, BOOK_SVG, step.side,
        { on: 'book on the ' + step.holder, next: 'book next to the ' + step.holder });
    }
  }

  // ===== 连续两步题：商品卡片，按 first、then 顺序点 =====
  function showSequence(step) {
    clear();
    root.classList.add('v2-check');
    const picks = step.picks || ['apple', 'milk', 'cheese', 'egg'];
    picks.forEach((id) => makeCard(id, 'v2-seq-card'));
  }

  function mark(pos, kind) {
    const btn = cards.find((b) => b.dataset.pos === pos);
    if (btn) btn.classList.add('mark-' + kind);
  }

  // ===== 示范 =====
  function prepareDemo(holder) {
    if (demoEl) return;
    if (levelId === 'bakery') {
      demoEl = document.createElement('div');
      demoEl.className = 'v2-demo-count';
      demoEl.innerHTML = PLATE_SVG + '<span class="roll-row demo-rolls"></span>';
      root.appendChild(demoEl);
      return;
    }
    if (levelId === 'crossing') {
      // 路口示范：三个方向箭头，依次高亮
      const wrap = document.createElement('div');
      wrap.className = 'v2-demo-dir';
      const arrows = {};
      [['left', ARROW_LEFT], ['right', ARROW_RIGHT], ['straight', ARROW_STRAIGHT]].forEach(([d, svg]) => {
        const b = document.createElement('div');
        b.className = 'v2-demo-arrow';
        b.innerHTML = svg;
        wrap.appendChild(b);
        arrows[d] = b;
      });
      root.appendChild(wrap);
      demoEl = { arrows };
      return;
    }
    root.classList.add('v2-quiz');
    const scene = document.createElement('div');
    scene.className = 'v2-scene';
    const holderEl = document.createElement('div');
    holderEl.className = 'v2-holder';
    holderEl.innerHTML = iconFor(holder);
    const demoBook = document.createElement('button');
    demoBook.type = 'button';
    demoBook.className = 'v2-card v2-demo-book';
    demoBook.innerHTML = BOOK_SVG;
    scene.appendChild(holderEl);
    scene.appendChild(demoBook);
    root.appendChild(scene);
    demoEl = demoBook;
  }

  function demoStep(where) {
    if (!demoEl) return;
    if (levelId === 'bakery') {
      const target = demoEl.querySelector('.demo-rolls');
      target.innerHTML = where === 'one'
        ? '<span class="mini-roll">' + ROLL_SVG + '</span>'
        : '<span class="mini-roll">' + ROLL_SVG + '</span><span class="mini-roll">' + ROLL_SVG + '</span>';
      return;
    }
    if (levelId === 'crossing') {
      Object.entries(demoEl.arrows).forEach(([d, b]) =>
        b.classList.toggle('demo-arrow-on', d === where));
      return;
    }
    demoEl.classList.toggle('demo-on', where === 'on');
    demoEl.classList.toggle('demo-next', where === 'next');
  }

  function onAction(cb) { pickCb = cb; }
  function resetCamera() {}
  function resize() {}

  function dispose() {
    pickCb = null;
    if (root.parentNode) root.parentNode.removeChild(root);
  }

  return {
    showCheck,
    showQuiz,
    showSequence,
    prepareDemo,
    mark,
    demoStep,
    onAction,
    resetCamera,
    resize,
    dispose,
  };
}
