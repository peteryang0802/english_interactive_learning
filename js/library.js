// 通用室内 3D 视图：负责渲染和拾取，判定与音频由引擎负责。
// 按 levelId 切换房间主题、静态家具和角色；按 step.scene 渲染不同的候选场景。
// 实现统一视图接口：showCheck / showQuiz / mark / prepareDemo / demoStep / onAction / resetCamera / dispose。

import * as THREE from '../vendor/three.module.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { makeBeaver } from './characters.js';
import {
  makeBookshelf, makeTable, makeChair, makeLamp, makeRug,
  makeWindow, makeClock, makePlant, makeDesk,
  makeRoll, makeBread, makeBag, makeBasket, makeCounter, makeOven,
  makeApple, makeMilk, makeCheese, makeEgg, makeShelf, makeFreezer,
} from './props.js';

const DEFAULT_ORBIT = { theta: 0.4, phi: 1.05, radius: 8 };

// 各关房间主题：背景、地板、墙
const ROOM_THEME = {
  library: { bg: 0xf3ead8, floor: 0xd9b98c, wall: 0xe9dcc3 },
  bakery: { bg: 0xf7e9d3, floor: 0xe2bf95, wall: 0xf1d9b6 },
  market: { bg: 0xeef3f0, floor: 0xcfd8c4, wall: 0xe2eae4 },
};

function disposeObject(obj) {
  obj.traverse((m) => {
    if (m.isMesh) {
      m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => mat.dispose());
    }
  });
}

export function createLibraryScene(container, levelId = 'library') {
  const width = container.clientWidth;
  const height = container.clientHeight;
  const theme = ROOM_THEME[levelId] || ROOM_THEME.library;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.bg);

  // 环境反射：让 PBR 材质有高光和层次，金属、玻璃能出质感
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environment = envMap;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  const orbit = { ...DEFAULT_ORBIT };
  function updateCamera() {
    const fit = THREE.MathUtils.clamp(1 / camera.aspect, 1, 1.7);
    const r = orbit.radius * fit;
    camera.position.set(
      r * Math.sin(orbit.phi) * Math.sin(orbit.theta),
      r * Math.cos(orbit.phi),
      r * Math.sin(orbit.phi) * Math.cos(orbit.theta)
    );
    camera.lookAt(0, 0.8, 0);
    camera.updateMatrixWorld();
  }
  updateCamera();

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a6a45, 0.5));
  const sun = new THREE.DirectionalLight(0xfff0d6, 1.5);
  sun.position.set(5, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  scene.add(sun);

  // 房间
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ color: theme.floor, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 7),
    new THREE.MeshStandardMaterial({ color: theme.wall, roughness: 1 })
  );
  wall.position.set(0, 3.5, -5);
  scene.add(wall);

  // 静态布置
  const animators = [];
  function addStatic(obj, x, y, z, rotY = 0) {
    obj.position.set(x, y, z);
    obj.rotation.y = rotY;
    scene.add(obj);
    if (obj.userData.animate) animators.push(obj.userData.animate);
    return obj;
  }

  function buildStaticLibrary() {
    addStatic(makeBookshelf(), -3.4, 0, -4.7);
    addStatic(makeBookshelf(), 3.4, 0, -4.7);
    addStatic(makeWindow(), 0, 2.0, -4.95);
    addStatic(makeClock(), 0, 4.3, -4.9);
    addStatic(makePlant(), -5.6, 0, -4.5);
    addStatic(makePlant(), 5.6, 0, -4.5);
    addStatic(makeTable(true), -4.4, 0, -1.2);
    addStatic(makeChair(), -4.4, 0, 0.1, Math.PI);
    addStatic(makeChair(), -5.6, 0, -1.2, Math.PI / 2);
    addStatic(makeLamp(), -4.0, 0.95, -1.2);
    addStatic(makeDesk(), 4.3, 0, -1.4);
    // 河狸站在借书台左侧端旁边当接待员，完全脱离桌子，正面朝相机，门牙清楚
    const beaver = addStatic(makeBeaver(), 2.4, 0, -1.3);
    beaver.rotation.y = 0.05;
    beaver.scale.setScalar(1.05);
    addStatic(makeRug(), 0, 0, 0.6);
  }

  function buildStaticBakery() {
    addStatic(makeOven(), -4.2, 0, -4.4);
    addStatic(makeOven(), -2.4, 0, -4.5);
    addStatic(makeWindow(), 0, 2.0, -4.95);
    addStatic(makePlant(), 5.6, 0, -4.5);
    addStatic(makeCounter(), 0, 0, -1.6);
    addStatic(makeTable(), -4.6, 0, -0.6);
    addStatic(makeChair(), -4.6, 0, 0.7, Math.PI);
    // 面包师站在柜台左侧端旁边，全身和门牙露出来，不被柜台挡
    const baker = addStatic(makeBeaver(), -2.4, 0, -1.5);
    baker.rotation.y = 0.05;
    addStatic(makeRug(), 0, 0, 1.2);
  }

  function buildStaticMarket() {
    addStatic(makeShelf(), -3.6, 0, -3.6);
    addStatic(makeShelf(), 3.6, 0, -3.6);
    addStatic(makeFreezer(), 0, 0, -4.6);
    addStatic(makeWindow(), -5.6, 2.0, -4.9);
    addStatic(makeWindow(), 5.6, 2.0, -4.9);
    addStatic(makePlant(), -5.8, 0, -1.8);
    addStatic(makePlant(), 5.8, 0, -1.8);
    addStatic(makeCounter(), 0, 0, -1.8);
    // 店员站在柜台左侧端旁边，全身和门牙露出来，不被柜台挡
    const clerk = addStatic(makeBeaver(), -2.4, 0, -1.6);
    clerk.rotation.y = 0.05;
    addStatic(makeRug(), 0, 0, 1.4);
  }

  if (levelId === 'bakery') buildStaticBakery();
  else if (levelId === 'market') buildStaticMarket();
  else buildStaticLibrary();

  // 动态物体挂载点
  const dyn = new THREE.Group();
  scene.add(dyn);

  // ===== 图书馆动态物件 =====
  // 竖立的书：书脊朝相机，米白书页从顶和两侧露出，一眼是书，底部在 y=0
  function makeBook(pos, color = 0x2f7d8c) {
    const g = new THREE.Group();
    const PAGES = 0xf7f1e2;
    const w = 0.62, h = 0.82, t = 0.2;
    const std = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...extra });

    // 书页（米白，略小，四周露出白边）
    const pages = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, h - 0.08, t - 0.04), std(PAGES, { roughness: 1 }));
    pages.position.set(0, h / 2, 0);
    pages.castShadow = true;
    pages.receiveShadow = true;
    g.add(pages);

    // 书脊（正面朝相机）
    const spine = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), std(color));
    spine.position.set(0, h / 2, t / 2 - 0.01);
    spine.castShadow = true;
    g.add(spine);

    // 封底
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), std(color));
    back.position.set(0, h / 2, -t / 2 + 0.01);
    back.castShadow = true;
    g.add(back);

    // 书脊上两条烫金装饰（像书名区）
    const gold = std(0xf2e0b0, { roughness: 0.5, metalness: 0.2 });
    const d1 = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, 0.05, 0.02), gold);
    d1.position.set(0, h * 0.68, t / 2 + 0.02);
    g.add(d1);
    const d2 = new THREE.Mesh(new THREE.BoxGeometry(w - 0.22, 0.04, 0.02), gold);
    d2.position.set(0, h * 0.55, t / 2 + 0.02);
    g.add(d2);

    g.userData.pick = pos;
    return g;
  }

  function makeHolder(kind) {
    const g = new THREE.Group();
    if (kind === 'cart') {
      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.18, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x6b7a86, roughness: 0.7, metalness: 0.2 })
      );
      bed.position.y = 0.9;
      bed.castShadow = true;
      g.add(bed);
      for (const sx of [-0.9, 0.9]) {
        for (const sz of [-0.5, 0.5]) {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.9),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
          );
          leg.position.set(sx, 0.45, sz);
          g.add(leg);
          const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
          );
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(sx, 0.12, sz);
          g.add(wheel);
        }
      }
      g.userData.topY = 0.99;
    } else {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 1.0, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xb07a45, roughness: 0.9 })
      );
      box.position.y = 0.5;
      box.castShadow = true;
      g.add(box);
      g.userData.topY = 1.0;
    }
    g.userData.pick = kind;
    return g;
  }

  // ===== 面包店动态物件 =====
  // 一个盘子（候选数量组的底座）
  function makePlate() {
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.8, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0xf2f0e8, roughness: 0.4 })
    );
    plate.position.y = 0.06;
    plate.receiveShadow = true;
    return plate;
  }

  // 数量候选：一个盘子上放 1 个或 2 个面包卷
  function makeCountGroup(pick) {
    const g = new THREE.Group();
    g.add(makePlate());
    if (pick === 'one') {
      const r = makeRoll();
      r.position.set(0, 0.32, 0);
      g.add(r);
    } else {
      const r1 = makeRoll();
      r1.position.set(-0.3, 0.32, 0);
      const r2 = makeRoll();
      r2.position.set(0.3, 0.32, 0);
      g.add(r1, r2);
    }
    g.userData.pick = pick;
    return g;
  }

  // 面包店袋子候选：on 在篮子上、next 在篮子旁
  function makeBagGroup(pick) {
    const g = new THREE.Group();
    const basket = makeBasket();
    g.add(basket);
    const bag = makeBag();
    if (pick === 'on') {
      bag.position.set(0, 0.62, 0);
    } else {
      bag.position.set(1.1, 0, 0);
    }
    g.add(bag);
    g.userData.pick = pick;
    g.userData.localHotspot = bag.position.clone();
    return g;
  }

  let currentPickables = [];
  let pickCb = null;
  let demoGroup = null;
  let demoTarget = null;
  let demoTopY = 1.0;
  let demoMovable = false;

  function clear() {
    while (dyn.children.length) {
      const c = dyn.children.pop();
      disposeObject(c);
    }
    currentPickables = [];
    demoGroup = null;
    demoTarget = null;
    demoMovable = false;
  }

  function addPickable(obj, x, z) {
    obj.position.set(x, obj.position.y, z);
    dyn.add(obj);
    obj.updateMatrixWorld(true);
    if (obj.userData.localHotspot) {
      obj.userData.hotspot = obj.localToWorld(obj.userData.localHotspot.clone());
    }
    currentPickables.push(obj);
  }

  // ===== 词义确认 =====
  function showCheck(step) {
    clear();
    if (levelId === 'bakery') {
      if (step.options.includes('roll')) {
        const r = makeRoll();
        r.userData.pick = 'roll';
        addPickable(r, -1.8, 0);
      }
      if (step.options.includes('bread')) {
        const b = makeBread();
        b.userData.pick = 'bread';
        addPickable(b, 1.8, 0);
      }
      return;
    }
    if (levelId === 'market') {
      // 超市词义题：按 options 摆对应商品
      step.options.forEach((o, i) => {
        const factory = MARKET_FACTORY[o];
        const obj = factory ? factory() : makeApple();
        obj.userData.pick = o;
        addPickable(obj, (i - (step.options.length - 1) / 2) * 2.0, 0);
      });
      return;
    }
    if (step.options.includes('book')) {
      const b = makeBook('book');
      addPickable(b, -1.6, 0);
    }
    if (step.options.includes('cart')) {
      const c = makeHolder('cart');
      addPickable(c, 1.6, 0);
    }
  }

  // ===== 听辨题：按 scene 渲染候选 =====
  function showQuiz(step) {
    clear();
    if (step.scene === 'bakery-count') {
      addPickable(makeCountGroup('one'), -2.0, 0);
      addPickable(makeCountGroup('two'), 2.0, 0);
    } else if (step.scene === 'bakery-bag') {
      addPickable(makeBagGroup('on'), -1.4, 0);
      addPickable(makeBagGroup('next'), 1.6, 0);
    } else if (step.scene === 'market-shelf') {
      // 货架 + 两个苹果：一个在货架上（on），一个在旁边（next）
      const shelf = makeShelf();
      dyn.add(shelf);
      const onApple = makeApple();
      onApple.userData.pick = 'on';
      addPickable(onApple, -0.5, 0);
      onApple.position.y = 1.44;   // 苹果球底正好贴中间板顶面
      onApple.updateMatrixWorld(true);
      const nextApple = makeApple();
      nextApple.userData.pick = 'next';
      addPickable(nextApple, 2.3, 0);
    } else {
      // 图书馆 on/next
      const h = makeHolder(step.holder);
      dyn.add(h);
      const topY = h.userData.topY;
      const onBook = makeBook('on');
      onBook.position.set(0, topY, 0);
      dyn.add(onBook);
      const nextBook = makeBook('next');
      nextBook.position.set(step.side === 'left' ? -2.0 : 2.0, 0, 0);
      dyn.add(nextBook);
      currentPickables.push(onBook, nextBook);
    }
  }

  // 超市商品工厂表
  const MARKET_FACTORY = {
    apple: makeApple,
    milk: makeMilk,
    cheese: makeCheese,
    egg: makeEgg,
  };

  // ===== 连续两步题：商品摆一排，按 first、then 顺序点 =====
  function showSequence(step) {
    clear();
    const picks = step.picks || ['apple', 'milk', 'cheese', 'egg'];
    const n = picks.length;
    picks.forEach((id, i) => {
      const factory = MARKET_FACTORY[id];
      const obj = factory ? factory() : makeApple();
      obj.userData.pick = id;
      // 均匀分布在 x 轴
      const x = (i - (n - 1) / 2) * 2.0;
      addPickable(obj, x, 0.4);
    });
  }

  // ===== 示范 =====
  function prepareDemo(holder) {
    if (demoGroup) return;
    if (levelId === 'bakery') {
      // 数量示范：一个盘子，书（面包卷）在 1 个和 2 个之间靠 demoStep 切换
      const g = new THREE.Group();
      g.add(makePlate());
      g.position.set(0, 0, 0);
      dyn.add(g);
      demoGroup = g;
      demoTarget = new THREE.Vector3();
      return;
    }
    const h = makeHolder(holder);
    dyn.add(h);
    const demoBook = makeBook('demo');
    demoBook.position.set(-2.4, 0, 0);
    dyn.add(demoBook);
    demoGroup = demoBook;
    demoTarget = new THREE.Vector3();
    demoTopY = h.userData.topY;
    demoMovable = true;
  }

  function demoStep(where) {
    if (!demoGroup) return;
    if (levelId === 'bakery') {
      // 重建盘子上的面包卷数量：先清掉旧 roll，再按 where 放
      const old = demoGroup.children.filter((c) => c.userData && c.userData.pick === undefined && c.geometry && c.geometry.type === 'SphereGeometry');
      // 简化：用可见 roll 数量控制
      demoGroup.userData.show = where;
      renderDemoCount(where);
      return;
    }
    if (where === 'on') demoTarget.set(0, demoTopY, 0);
    else demoTarget.set(2.0, 0, 0);
  }

  // 数量示范：清掉盘子上的 roll，重新放 1 个或 2 个
  function renderDemoCount(where) {
    const rolls = demoGroup.children.filter((c) => c.userData && c.userData.isRoll);
    rolls.forEach((r) => { disposeObject(r); demoGroup.remove(r); });
    if (where === 'one') {
      const r = makeRoll();
      r.position.set(0, 0.32, 0);
      demoGroup.add(r);
    } else {
      const r1 = makeRoll();
      r1.position.set(-0.3, 0.32, 0);
      const r2 = makeRoll();
      r2.position.set(0.3, 0.32, 0);
      demoGroup.add(r1, r2);
    }
  }

  function mark(pos, kind) {
    const b = currentPickables.find((p) => p.userData.pick === pos);
    if (!b) return;
    const color = kind === 'correct' ? 0x2e7d4f : kind === 'done' ? 0x2f7d9e : 0xb03a2e;
    b.traverse((m) => {
      if (m.isMesh && m.material) {
        m.material = m.material.clone();
        m.material.emissive = new THREE.Color(color);
        m.material.emissiveIntensity = 0.5;
      }
    });
  }

  function onAction(cb) { pickCb = cb; }

  function debugRaycast(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(currentPickables, true);
    return hits.slice(0, 4).map((h) => {
      let o = h.object;
      while (o && o.userData.pick === undefined) o = o.parent;
      return { pick: o ? o.userData.pick : null, dist: Math.round(h.distance * 100) / 100 };
    });
  }

  function debugPicks() {
    const rect = renderer.domElement.getBoundingClientRect();
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    const out = {};
    for (const p of currentPickables) {
      if (p.userData.hotspot) {
        v.copy(p.userData.hotspot);
      } else {
        box.setFromObject(p);
        box.getCenter(v);
      }
      v.project(camera);
      const px = rect.left + (v.x * 0.5 + 0.5) * rect.width;
      const py = rect.top + (-v.y * 0.5 + 0.5) * rect.height;
      out[p.userData.pick] = {
        x: Math.round((px / window.innerWidth) * 1000),
        y: Math.round((py / window.innerHeight) * 1000),
      };
    }
    return out;
  }

  // 拾取
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragging = false, moved = 0, lastX = 0, lastY = 0;

  function setPointer(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
  function down(e) { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; }
  function move(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX; lastY = e.clientY;
    orbit.theta -= dx * 0.006;
    orbit.phi = THREE.MathUtils.clamp(orbit.phi - dy * 0.005, 0.5, 1.35);
    updateCamera();
  }
  // 热点兜底：真实 mesh 没点中时，按热点世界坐标到射线的距离判定（细杆小旗更好点）
  const hotWorld = new THREE.Vector3();
  function hotspotPick() {
    let best = null;
    for (const p of currentPickables) {
      if (!p.userData.hotspot) continue;
      hotWorld.copy(p.userData.hotspot);
      p.localToWorld(hotWorld);
      const d = raycaster.ray.distanceToPoint(hotWorld);
      if (d < 0.8 && (!best || d < best.d)) best = { pick: p.userData.pick, d };
    }
    return best;
  }

  function up(e) {
    if (!dragging) return;
    dragging = false;
    if (moved > 8) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    let chosen = null;
    const hits = raycaster.intersectObjects(currentPickables, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && obj.userData.pick === undefined) obj = obj.parent;
      if (obj) chosen = obj.userData.pick;
    }
    if (!chosen) {
      const hp = hotspotPick();
      if (hp) chosen = hp.pick;
    }
    if (chosen && pickCb) pickCb(chosen);
  }
  function wheel(e) {
    e.preventDefault();
    orbit.radius = THREE.MathUtils.clamp(orbit.radius + e.deltaY * 0.008, 5, 13);
    updateCamera();
  }

  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', down);
  dom.addEventListener('pointermove', move);
  dom.addEventListener('pointerup', up);
  dom.addEventListener('wheel', wheel, { passive: false });

  let raf = 0;
  let usingTimer = false;
  const clock = new THREE.Clock();
  function schedule() {
    if (document.hidden) {
      usingTimer = true;
      raf = setTimeout(loop, 200);
    } else {
      usingTimer = false;
      raf = requestAnimationFrame(loop);
    }
  }
  function loop() {
    const t = clock.getElapsedTime();
    for (const a of animators) a(t);
    if (demoMovable && demoGroup && demoTarget) {
      demoGroup.position.lerp(demoTarget, 0.09);
      if (demoGroup.position.distanceTo(demoTarget) < 0.02) demoGroup.position.copy(demoTarget);
    }
    renderer.render(scene, camera);
    schedule();
  }
  schedule();

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateCamera();
  }

  function resetCamera() {
    Object.assign(orbit, DEFAULT_ORBIT);
    updateCamera();
  }

  return {
    showCheck,
    showQuiz,
    showSequence,
    prepareDemo,
    demoStep,
    mark,
    onAction,
    debugPicks,
    debugRaycast,
    resetCamera,
    resize,
    dispose() {
      if (usingTimer) clearTimeout(raf); else cancelAnimationFrame(raf);
      dom.removeEventListener('pointerdown', down);
      dom.removeEventListener('pointermove', move);
      dom.removeEventListener('pointerup', up);
      dom.removeEventListener('wheel', wheel);
      clear();
      scene.traverse((m) => {
        if (m.isMesh) {
          m.geometry.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => mat.dispose());
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}
