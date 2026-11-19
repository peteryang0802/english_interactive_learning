import * as THREE from '../vendor/three.module.js';

// 家具和环境小道具，都用基础几何体拼，低面数、卡通风格。
// 室内、户外通用，library.js 和 town.js 按需引入。

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
}
function part(geometry, color, extra = {}) {
  const m = new THREE.Mesh(geometry, mat(color, extra));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
const BOOK_COLORS = [0xd9534f, 0x4f93d6, 0xf2c14e, 0x5aa86b, 0x9b6bb0, 0xe88a3c, 0x2f7d8c];

// ===== 室内 =====

// 书架：木框 + 隔板 + 彩色小书
export function makeBookshelf() {
  const g = new THREE.Group();
  const WOOD = 0x7a4a2e;
  const w = 1.7, h = 3.2, d = 0.55;

  // 背板、侧板、顶板、底板
  const back = part(new THREE.BoxGeometry(w, h, 0.06), WOOD);
  back.position.set(0, h / 2, -d / 2);
  g.add(back);
  for (const sx of [-1, 1]) {
    const side = part(new THREE.BoxGeometry(0.08, h, d), WOOD);
    side.position.set(sx * w / 2, h / 2, 0);
    g.add(side);
  }
  for (const yy of [0, h]) {
    const board = part(new THREE.BoxGeometry(w, 0.08, d), WOOD);
    board.position.set(0, yy, 0);
    g.add(board);
  }
  // 三层隔板
  const rows = [0.8, 1.6, 2.4];
  rows.forEach((yy) => {
    const shelf = part(new THREE.BoxGeometry(w - 0.08, 0.07, d), WOOD);
    shelf.position.set(0, yy, 0);
    g.add(shelf);
  });
  // 每格摆书
  rows.concat([0]).forEach((baseY, ri) => {
    let x = -w / 2 + 0.16;
    let n = 0;
    while (x < w / 2 - 0.2 && n < 7) {
      const bw = 0.1 + Math.random() * 0.06;
      const bh = 0.45 + Math.random() * 0.2;
      const book = part(
        new THREE.BoxGeometry(bw, bh, 0.32),
        BOOK_COLORS[(ri * 3 + n) % BOOK_COLORS.length],
        { roughness: 0.7 }
      );
      book.position.set(x, baseY + bh / 2 + 0.05, 0.05);
      g.add(book);
      x += bw + 0.03;
      n++;
    }
  });
  return g;
}

// 桌子：桌面 + 四条腿
export function makeTable(round = false) {
  const g = new THREE.Group();
  const WOOD = 0x9c6b3f;
  const top = part(
    round ? new THREE.CylinderGeometry(0.9, 0.9, 0.12, 24) : new THREE.BoxGeometry(1.8, 0.12, 1.2),
    WOOD
  );
  top.position.y = 0.95;
  g.add(top);
  for (const sx of [-0.7, 0.7]) {
    for (const sz of [-0.45, 0.45]) {
      const leg = part(new THREE.CylinderGeometry(0.06, 0.07, 0.9), 0x6e4525);
      leg.position.set(sx, 0.45, sz);
      g.add(leg);
    }
  }
  return g;
}

// 椅子
export function makeChair() {
  const g = new THREE.Group();
  const WOOD = 0x9c6b3f;
  const seat = part(new THREE.BoxGeometry(0.6, 0.1, 0.6), WOOD);
  seat.position.y = 0.55;
  g.add(seat);
  const back = part(new THREE.BoxGeometry(0.6, 0.8, 0.08), WOOD);
  back.position.set(0, 0.95, -0.26);
  g.add(back);
  for (const sx of [-0.24, 0.24]) {
    for (const sz of [-0.24, 0.24]) {
      const leg = part(new THREE.CylinderGeometry(0.04, 0.05, 0.55), 0x6e4525);
      leg.position.set(sx, 0.27, sz);
      g.add(leg);
    }
  }
  return g;
}

// 台灯：底座 + 灯杆 + 灯罩
export function makeLamp() {
  const g = new THREE.Group();
  const base = part(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 16), 0x555c66);
  base.position.y = 0.03;
  g.add(base);
  const pole = part(new THREE.CylinderGeometry(0.03, 0.03, 0.7), 0x555c66);
  pole.position.y = 0.4;
  g.add(pole);
  const shade = part(new THREE.ConeGeometry(0.22, 0.28, 18, 1, true), 0xf2c14e, { side: THREE.DoubleSide });
  shade.position.y = 0.78;
  g.add(shade);
  return g;
}

// 地毯（圆形）
export function makeRug() {
  const g = new THREE.Group();
  const rug = part(new THREE.CylinderGeometry(1.5, 1.5, 0.04, 32), 0xc96a5a, { roughness: 1 });
  rug.position.y = 0.02;
  g.add(rug);
  const inner = part(new THREE.CylinderGeometry(1.05, 1.05, 0.05, 32), 0xe8c9a0, { roughness: 1 });
  inner.position.y = 0.025;
  g.add(inner);
  return g;
}

// 窗户：窗框 + 窗格 + 玻璃（浅蓝）
export function makeWindow() {
  const g = new THREE.Group();
  const glass = part(new THREE.PlaneGeometry(1.4, 1.4), 0xaedcf0, { roughness: 0.3, metalness: 0.1 });
  g.add(glass);
  const FRAME = 0xf2ead8;
  for (const yy of [-0.7, 0.7]) {
    const f = part(new THREE.BoxGeometry(1.5, 0.1, 0.08), FRAME);
    f.position.set(0, yy, 0.02);
    g.add(f);
  }
  for (const xx of [-0.7, 0.7]) {
    const f = part(new THREE.BoxGeometry(0.1, 1.5, 0.08), FRAME);
    f.position.set(xx, 0, 0.02);
    g.add(f);
  }
  const crossV = part(new THREE.BoxGeometry(0.06, 1.4, 0.06), FRAME);
  crossV.position.set(0, 0, 0.03);
  g.add(crossV);
  const crossH = part(new THREE.BoxGeometry(1.4, 0.06, 0.06), FRAME);
  crossH.position.set(0, 0, 0.03);
  g.add(crossH);
  return g;
}

// 挂钟
export function makeClock() {
  const g = new THREE.Group();
  const face = part(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24), 0xf7f1e2);
  face.rotation.x = Math.PI / 2;
  g.add(face);
  const hand = part(new THREE.BoxGeometry(0.04, 0.22, 0.03), 0x333);
  hand.position.set(0, 0.1, 0.06);
  g.add(hand);
  const hand2 = part(new THREE.BoxGeometry(0.18, 0.04, 0.03), 0x333);
  hand2.position.set(0.08, 0, 0.06);
  g.add(hand2);
  return g;
}

// 盆栽：花盆 + 绿植
export function makePlant() {
  const g = new THREE.Group();
  const pot = part(new THREE.CylinderGeometry(0.22, 0.16, 0.35, 14), 0xc06a4a);
  pot.position.y = 0.18;
  g.add(pot);
  for (let i = 0; i < 3; i++) {
    const leaf = part(new THREE.SphereGeometry(0.22, 12, 10), 0x5aa86b);
    leaf.scale.set(1, 1.2, 1);
    leaf.position.set((i - 1) * 0.14, 0.45 + (i % 2) * 0.12, (i % 2) * 0.1 - 0.05);
    g.add(leaf);
  }
  return g;
}

// 借书台/前台
export function makeDesk() {
  const g = new THREE.Group();
  const top = part(new THREE.BoxGeometry(2.4, 0.14, 0.8), 0x8a5a34);
  top.position.y = 1.05;
  g.add(top);
  const front = part(new THREE.BoxGeometry(2.4, 0.9, 0.1), 0x9c6b3f);
  front.position.set(0, 0.55, 0.36);
  g.add(front);
  for (const sx of [-1.05, 1.05]) {
    for (const sz of [-0.3, 0.3]) {
      const leg = part(new THREE.BoxGeometry(0.1, 1.0, 0.1), 0x6e4525);
      leg.position.set(sx, 0.5, sz);
      g.add(leg);
    }
  }
  return g;
}

// ===== 户外 =====

// 树：针叶（圆锥）或阔叶（球）
export function makeTree(kind = 'pine') {
  const g = new THREE.Group();
  const trunk = part(new THREE.CylinderGeometry(0.14, 0.18, 0.9, 10), 0x7a4a2e);
  trunk.position.y = 0.45;
  g.add(trunk);
  if (kind === 'pine') {
    for (let i = 0; i < 3; i++) {
      const cone = part(new THREE.ConeGeometry(0.9 - i * 0.18, 1.1, 12), 0x4a7c4f);
      cone.position.y = 1.1 + i * 0.65;
      g.add(cone);
    }
  } else {
    const crown = part(new THREE.SphereGeometry(0.85, 14, 12), 0x5aa86b);
    crown.position.y = 1.5;
    g.add(crown);
    const crown2 = part(new THREE.SphereGeometry(0.6, 12, 10), 0x6ab87b);
    crown2.position.set(0.4, 1.3, 0.2);
    g.add(crown2);
  }
  return g;
}

// 路灯
export function makeStreetLamp() {
  const g = new THREE.Group();
  const pole = part(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 10), 0x444c55);
  pole.position.y = 1.2;
  g.add(pole);
  const bulb = part(new THREE.SphereGeometry(0.18, 14, 12), 0xffe9a8, { emissive: 0xf2c14e, emissiveIntensity: 0.5 });
  bulb.position.y = 2.45;
  g.add(bulb);
  return g;
}

// 长椅
export function makeBench() {
  const g = new THREE.Group();
  const seat = part(new THREE.BoxGeometry(1.6, 0.1, 0.5), 0x8a5a34);
  seat.position.y = 0.5;
  g.add(seat);
  const back = part(new THREE.BoxGeometry(1.6, 0.5, 0.08), 0x8a5a34);
  back.position.set(0, 0.78, -0.22);
  g.add(back);
  for (const sx of [-0.65, 0.65]) {
    const leg = part(new THREE.BoxGeometry(0.08, 0.5, 0.4), 0x444);
    leg.position.set(sx, 0.25, 0);
    g.add(leg);
  }
  return g;
}

// 灌木
export function makeBush() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const b = part(new THREE.SphereGeometry(0.32, 12, 10), 0x5aa86b);
    b.position.set((i - 1) * 0.28, 0.28 + (i % 2) * 0.08, (i % 2) * 0.14);
    g.add(b);
  }
  return g;
}

// 花
export function makeFlower(color = 0xef6f9b) {
  const g = new THREE.Group();
  const stem = part(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), 0x4a7c4f);
  stem.position.y = 0.15;
  g.add(stem);
  const bloom = part(new THREE.SphereGeometry(0.1, 10, 8), color);
  bloom.position.y = 0.33;
  g.add(bloom);
  return g;
}

// 喷泉：水池 + 中心水柱
export function makeFountain() {
  const g = new THREE.Group();
  const basin = part(new THREE.CylinderGeometry(1.4, 1.2, 0.5, 28), 0xc9c4b8);
  basin.position.y = 0.25;
  g.add(basin);
  const water = part(new THREE.CylinderGeometry(1.25, 1.25, 0.12, 28), 0x6fb6d9, { roughness: 0.2, metalness: 0.2 });
  water.position.y = 0.5;
  g.add(water);
  const pillar = part(new THREE.CylinderGeometry(0.2, 0.28, 0.7, 16), 0xb8b3a8);
  pillar.position.y = 0.75;
  g.add(pillar);
  const top = part(new THREE.CylinderGeometry(0.5, 0.35, 0.2, 16), 0xc9c4b8);
  top.position.y = 1.15;
  g.add(top);
  const jet = part(new THREE.CylinderGeometry(0.05, 0.08, 0.5, 10), 0x9fd4ea, { transparent: true, opacity: 0.8 });
  jet.position.y = 1.45;
  g.add(jet);
  return g;
}
