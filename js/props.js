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

// ===== 面包店物件 =====

// 面包卷：椭圆小球，暖黄色
export function makeRoll() {
  const g = new THREE.Group();
  const roll = part(new THREE.SphereGeometry(0.32, 16, 12), 0xe8b878, { roughness: 0.9 });
  roll.scale.set(1.15, 0.85, 1);
  roll.castShadow = true;
  g.add(roll);
  // 两道浅纹
  for (const sx of [-0.1, 0.1]) {
    const stripe = part(new THREE.BoxGeometry(0.05, 0.02, 0.3), 0xc9915a);
    stripe.position.set(sx, 0.22, 0);
    g.add(stripe);
  }
  g.userData.isRoll = true;
  return g;
}

// 面包：长椭球，浅棕色
export function makeBread() {
  const g = new THREE.Group();
  const loaf = part(new THREE.SphereGeometry(0.35, 16, 12), 0xd99a5e, { roughness: 0.9 });
  loaf.scale.set(1.6, 0.8, 1);
  g.add(loaf);
  const slash = part(new THREE.BoxGeometry(0.3, 0.03, 0.08), 0xb07a45);
  slash.position.y = 0.26;
  g.add(slash);
  return g;
}

// 纸袋：方盒，上口略收
export function makeBag() {
  const g = new THREE.Group();
  const body = part(new THREE.BoxGeometry(0.6, 0.8, 0.5), 0xc9a877, { roughness: 1 });
  body.position.y = 0.4;
  g.add(body);
  const rim = part(new THREE.BoxGeometry(0.62, 0.08, 0.52), 0xb08c5e);
  rim.position.y = 0.82;
  g.add(rim);
  return g;
}

// 篮子：宽口圆柱，简化编织
export function makeBasket() {
  const g = new THREE.Group();
  const basket = part(new THREE.CylinderGeometry(0.45, 0.35, 0.55, 16, 1, true), 0xa9743f, { roughness: 1 });
  basket.position.y = 0.3;
  g.add(basket);
  const bottom = part(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16), 0x8a5a30);
  bottom.position.y = 0.05;
  g.add(bottom);
  const rim = part(new THREE.TorusGeometry(0.45, 0.05, 8, 18), 0x8a5a30);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.58;
  g.add(rim);
  return g;
}

// 面包店柜台：木质高柜 + 玻璃面
export function makeCounter() {
  const g = new THREE.Group();
  const base = part(new THREE.BoxGeometry(3.2, 1.0, 1.0), 0x9c6b3f);
  base.position.y = 0.5;
  g.add(base);
  const top = part(new THREE.BoxGeometry(3.3, 0.1, 1.1), 0xbfe0e6, { roughness: 0.2, metalness: 0.3 });
  top.position.y = 1.05;
  g.add(top);
  return g;
}

// 烤箱：方盒 + 深色玻璃门
export function makeOven() {
  const g = new THREE.Group();
  const body = part(new THREE.BoxGeometry(1.6, 1.6, 1.2), 0x8f9aa2, { roughness: 0.6, metalness: 0.3 });
  body.position.y = 0.8;
  g.add(body);
  const door = part(new THREE.BoxGeometry(1.2, 1.0, 0.08), 0x2a3540, { roughness: 0.2, metalness: 0.5 });
  door.position.set(0, 0.8, 0.62);
  g.add(door);
  return g;
}

// ===== 路口物件 =====

// 十字交叉道路：南北一条 + 东西一条，深灰扁平
export function makeRoad() {
  const g = new THREE.Group();
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 1 });
  const ns = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 16), roadMat);
  ns.position.y = 0.02;
  ns.receiveShadow = true;
  const ew = new THREE.Mesh(new THREE.BoxGeometry(16, 0.06, 2.4), roadMat);
  ew.position.y = 0.025;
  ew.receiveShadow = true;
  // 中线虚线（米白）
  for (let i = -3; i <= 3; i++) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.07, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf2e6c4 })
    );
    dash.position.set(0, 0.05, i * 2);
    g.add(dash);
  }
  g.add(ns, ew);
  return g;
}

// 简单卡通房子：方墙 + 坡屋顶 + 门
export function makeBuilding(color = 0xe88a6b) {
  const g = new THREE.Group();
  const body = part(new THREE.BoxGeometry(2.2, 1.8, 2.0), color);
  body.position.y = 0.9;
  g.add(body);
  const roof = part(new THREE.ConeGeometry(1.8, 1.0, 4), 0x8a4a3a);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.3;
  g.add(roof);
  const door = part(new THREE.BoxGeometry(0.6, 0.9, 0.1), 0x6e4525);
  door.position.set(0, 0.45, 1.02);
  g.add(door);
  return g;
}

// 路标：杆子 + 空白牌
export function makeSign() {
  const g = new THREE.Group();
  const pole = part(new THREE.CylinderGeometry(0.06, 0.07, 1.8, 10), 0x444c55);
  pole.position.y = 0.9;
  g.add(pole);
  const board = part(new THREE.BoxGeometry(1.0, 0.6, 0.08), 0xf2e6c4);
  board.position.y = 1.7;
  g.add(board);
  return g;
}

// 方向小旗：中性热点，杆子 + 三角旗，不写方向文字
export function makeFlag(color = 0x4f93d6) {
  const g = new THREE.Group();
  const pole = part(new THREE.CylinderGeometry(0.05, 0.06, 1.2, 8), 0x555c66);
  pole.position.y = 0.6;
  g.add(pole);
  const flag = part(new THREE.ConeGeometry(0.35, 0.6, 3), color);
  flag.rotation.z = Math.PI / 2;
  flag.position.set(0.28, 1.1, 0);
  g.add(flag);
  // 热点指向三角旗（杆子太细，不好点）
  g.userData.localHotspot = new THREE.Vector3(0.28, 1.1, 0);
  return g;
}

// ===== 超市物件 =====

// 苹果：红小球 + 小叶子
export function makeApple() {
  const g = new THREE.Group();
  const apple = part(new THREE.SphereGeometry(0.28, 16, 14), 0xd9483f);
  apple.position.y = 0.28;
  g.add(apple);
  const leaf = part(new THREE.SphereGeometry(0.08, 8, 8), 0x5aa86b);
  leaf.scale.set(1.4, 0.6, 1);
  leaf.position.set(0.1, 0.52, 0);
  g.add(leaf);
  const stem = part(new THREE.CylinderGeometry(0.03, 0.03, 0.12), 0x6e4525);
  stem.position.y = 0.5;
  g.add(stem);
  return g;
}

// 牛奶盒：高方盒，白身蓝字
export function makeMilk() {
  const g = new THREE.Group();
  const carton = part(new THREE.BoxGeometry(0.5, 0.9, 0.5), 0xf2f0e8);
  carton.position.y = 0.45;
  g.add(carton);
  const label = part(new THREE.BoxGeometry(0.52, 0.3, 0.52), 0x4f93d6);
  label.position.y = 0.4;
  g.add(label);
  const top = part(new THREE.BoxGeometry(0.4, 0.12, 0.4), 0x3a7bb0);
  top.position.y = 0.95;
  g.add(top);
  return g;
}

// 奶酪：黄色三角块
export function makeCheese() {
  const g = new THREE.Group();
  const wedge = part(new THREE.ConeGeometry(0.4, 0.35, 3), 0xf2c14e);
  wedge.rotation.y = Math.PI / 6;
  wedge.position.y = 0.18;
  g.add(wedge);
  return g;
}

// 鸡蛋：白色椭圆
export function makeEgg() {
  const g = new THREE.Group();
  const egg = part(new THREE.SphereGeometry(0.25, 16, 14), 0xf7f4ee);
  egg.scale.set(0.9, 1.2, 0.9);
  egg.position.y = 0.3;
  g.add(egg);
  return g;
}

// 超市货架：金属架 + 两层隔板
export function makeShelf() {
  const g = new THREE.Group();
  const METAL = 0x6b7a86;
  for (const yy of [0.5, 1.4, 2.2]) {
    const board = part(new THREE.BoxGeometry(2.6, 0.08, 1.0), METAL, { metalness: 0.3 });
    board.position.y = yy;
    g.add(board);
  }
  for (const sx of [-1.2, 1.2]) {
    for (const sz of [-0.4, 0.4]) {
      const leg = part(new THREE.CylinderGeometry(0.05, 0.05, 2.2), 0x444c55);
      leg.position.set(sx, 1.1, sz);
      g.add(leg);
    }
  }
  return g;
}

// 冷柜：玻璃门高柜
export function makeFreezer() {
  const g = new THREE.Group();
  const body = part(new THREE.BoxGeometry(1.8, 2.2, 1.0), 0xbfe0e6, { roughness: 0.2, metalness: 0.2 });
  body.position.y = 1.1;
  g.add(body);
  const door = part(new THREE.BoxGeometry(1.6, 2.0, 0.08), 0xd8f0f5, {
    roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.7,
  });
  door.position.set(0, 1.1, 0.52);
  g.add(door);
  return g;
}

// ===== 派对物件 =====

// 生日蛋糕：两层奶油 + 蜡烛 + 小火苗
export function makeCake() {
  const g = new THREE.Group();
  const base = part(new THREE.CylinderGeometry(0.7, 0.78, 0.5, 20), 0xf7e3c8);
  base.position.y = 0.25;
  g.add(base);
  const top = part(new THREE.CylinderGeometry(0.42, 0.5, 0.32, 20), 0xfff4e6);
  top.position.y = 0.66;
  g.add(top);
  // 彩色糖珠
  const beadColors = [0xd9534f, 0x4f93d6, 0xf2c14e, 0x5aa86b, 0x9b6bb0];
  beadColors.forEach((c, i) => {
    const bead = part(new THREE.SphereGeometry(0.06, 8, 8), c);
    const ang = (i / beadColors.length) * Math.PI * 2;
    bead.position.set(Math.cos(ang) * 0.5, 0.52, Math.sin(ang) * 0.5);
    g.add(bead);
  });
  // 蜡烛
  const candle = part(new THREE.CylinderGeometry(0.04, 0.04, 0.28), 0xffffff);
  candle.position.y = 0.96;
  g.add(candle);
  const flame = part(new THREE.ConeGeometry(0.07, 0.16, 10), 0xf2a13c, {
    emissive: 0xd96f1e, emissiveIntensity: 0.6, roughness: 0.4,
  });
  flame.position.y = 1.18;
  flame.visible = false;
  g.add(flame);
  g.userData.flame = flame;
  return g;
}

// 气球：椭球 + 细绳，带轻微上下飘动
export function makeBalloon(color = 0xef6f5b) {
  const g = new THREE.Group();
  const body = part(new THREE.SphereGeometry(0.3, 16, 14), color, { roughness: 0.5 });
  body.scale.y = 1.2;
  body.position.y = 0.4;
  g.add(body);
  const knot = part(new THREE.ConeGeometry(0.06, 0.1, 8), color);
  knot.rotation.x = Math.PI;
  knot.position.y = 0.08;
  g.add(knot);
  const string = part(new THREE.CylinderGeometry(0.012, 0.012, 0.7), 0x888888);
  string.position.y = -0.3;
  g.add(string);
  const baseY = g.position.y;
  g.userData.animate = (t) => {
    g.position.y = baseY + Math.sin(t * 1.6 + color) * 0.06;
  };
  return g;
}

// 礼物盒：方盒 + 十字丝带
export function makeGift(color = 0x4f93d6) {
  const g = new THREE.Group();
  const box = part(new THREE.BoxGeometry(0.6, 0.6, 0.6), color);
  box.position.y = 0.3;
  g.add(box);
  const ribbonMat = 0xf2c14e;
  const rib1 = part(new THREE.BoxGeometry(0.64, 0.62, 0.1), ribbonMat);
  rib1.position.y = 0.3;
  g.add(rib1);
  const rib2 = part(new THREE.BoxGeometry(0.1, 0.62, 0.64), ribbonMat);
  rib2.position.y = 0.3;
  g.add(rib2);
  const bow = part(new THREE.SphereGeometry(0.1, 10, 8), ribbonMat);
  bow.position.y = 0.66;
  g.add(bow);
  return g;
}

// 折叠地图：米黄图板 + 折痕 + 红色定位点
export function makeMap() {
  const g = new THREE.Group();
  const board = part(new THREE.BoxGeometry(0.72, 0.04, 0.56), 0xf3e6c4, { roughness: 0.9 });
  board.position.y = 0.02;
  g.add(board);
  // 折痕：一条纵向、一条横向
  const fold1 = part(new THREE.BoxGeometry(0.02, 0.045, 0.56), 0x9c7b46);
  fold1.position.y = 0.045;
  const fold2 = part(new THREE.BoxGeometry(0.72, 0.045, 0.02), 0x9c7b46);
  fold2.position.y = 0.045;
  g.add(fold1, fold2);
  // 红色定位点
  const pin = part(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12), 0xd6503e);
  pin.position.set(0.18, 0.07, -0.1);
  g.add(pin);
  return g;
}

// 平放的书：封皮 + 书页，和派对答题候选的书保持同一观感
export function makeBook() {
  const g = new THREE.Group();
  const cover = part(new THREE.BoxGeometry(0.5, 0.12, 0.36), 0x2f7d8c);
  cover.position.y = 0.06;
  g.add(cover);
  const pages = part(new THREE.BoxGeometry(0.42, 0.06, 0.3), 0xf7f1e2);
  pages.position.y = 0.13;
  g.add(pages);
  return g;
}

// 派对横幅：一根绳 + 一串三角旗
export function makeBanner() {
  const g = new THREE.Group();
  const rope = part(new THREE.CylinderGeometry(0.02, 0.02, 6), 0x777777);
  rope.rotation.z = Math.PI / 2;
  g.add(rope);
  const flagColors = [0xef6f5b, 0xf2c14e, 0x5aa86b, 0x4f93d6, 0x9b6bb0];
  flagColors.forEach((c, i) => {
    const flag = part(new THREE.ConeGeometry(0.18, 0.4, 3), c);
    flag.rotation.x = Math.PI;
    flag.position.set(-2.4 + i * 1.2, -0.25, 0);
    g.add(flag);
  });
  return g;
}

