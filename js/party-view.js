// 派对 3D 视图（户外花园）：生日派对综合关，渲染四个语言点的候选。
// 判定与音频由引擎负责；接口与室内、路口视图一致：
// showCheck / showQuiz / showSequence / mark / prepareDemo / demoStep / onAction / resetCamera / resize / dispose。

import * as THREE from '../vendor/three.module.js';
import { makeRabbit, makeBeaver } from './characters.js';
import {
  makeTable, makeChair, makeTree, makeBush, makeFlower, makeFlag,
  makeCake, makeBalloon, makeGift, makeBanner,
} from './props.js';

const DEFAULT_ORBIT = { theta: 0.3, phi: 1.02, radius: 9 };

// 方向小旗坐标（复用路口的三方向）
const DIR_POS = {
  left: new THREE.Vector3(-3.6, 0, 0),
  right: new THREE.Vector3(3.6, 0, 0),
  straight: new THREE.Vector3(0, 0, -3.6),
};
const FLAG_COLOR = { left: 0x4f93d6, right: 0xef6f5b, straight: 0xf2c14e };

function disposeObject(obj) {
  obj.traverse((m) => {
    if (m.isMesh) {
      m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => mat.dispose());
    }
  });
}

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
}
function part(geometry, color, extra = {}) {
  const m = new THREE.Mesh(geometry, mat(color, extra));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createPartyScene(container) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6d9d2); // 傍晚暖粉天空

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

  scene.add(new THREE.HemisphereLight(0xfff2e8, 0x8fae7a, 0.95));
  const sun = new THREE.DirectionalLight(0xfff0da, 1.05);
  sun.position.set(6, 10, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -9;
  scene.add(sun);

  // 草地
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x86b56f, roughness: 1 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  // 静态装饰
  const animators = [];
  function addStatic(obj, x, z, rotY = 0) {
    obj.position.set(x, 0, z);
    obj.rotation.y = rotY;
    scene.add(obj);
    if (obj.userData.animate) animators.push(obj.userData.animate);
    return obj;
  }

  // 横幅挂在前方高处
  const banner = makeBanner();
  banner.position.set(0, 4.2, -4.6);
  scene.add(banner);

  // 长桌（放蛋糕）在中间偏后
  addStatic(makeTable(true), 0, -2.2);
  const cake = makeCake();
  cake.position.set(0, 1.02, -2.2);
  scene.add(cake);

  // 气球点缀
  addStatic(makeBalloon(0xef6f5b), -4.2, -2.8);
  addStatic(makeBalloon(0x4f93d6), 4.2, -2.8);
  addStatic(makeBalloon(0xf2c14e), -4.6, 1.2);

  // 礼物、椅子、树、灌木、花
  addStatic(makeGift(0x9b6bb0), 3.4, -0.6);
  addStatic(makeChair(), -2.6, -1.0, 0.8);
  addStatic(makeChair(), 2.6, -1.0, -0.8);
  addStatic(makeTree('broad'), -7.0, -3.2);
  addStatic(makeTree('pine'), 7.0, -3.4);
  addStatic(makeTree('broad'), -6.4, 3.6);
  addStatic(makeBush(), 5.8, 2.8);
  addStatic(makeFlower(0xef6f9b), -1.2, 3.0);
  addStatic(makeFlower(0xf2c14e), 1.4, 3.2);

  // 主人（河狸）和小兔
  const host = addStatic(makeBeaver(), -1.0, -0.8);
  host.rotation.y = 0.3;
  const rabbit = addStatic(makeRabbit(), 0, 3.0);
  rabbit.rotation.y = Math.PI;

  // 动态挂载点
  const dyn = new THREE.Group();
  scene.add(dyn);

  let currentPickables = [];
  let pickCb = null;
  let demoGroup = null;
  let demoTarget = null;

  function clear() {
    while (dyn.children.length) {
      const c = dyn.children.pop();
      disposeObject(c);
    }
    currentPickables = [];
    demoGroup = null;
    demoTarget = null;
  }

  // 简单书候选
  function makeBookPick(pos) {
    const g = new THREE.Group();
    const body = part(new THREE.BoxGeometry(0.5, 0.14, 0.38), 0x2f7d8c);
    g.add(body);
    const page = part(new THREE.BoxGeometry(0.42, 0.08, 0.32), 0xf7f1e2);
    g.add(page);
    g.userData.pick = pos;
    g.userData.localHotspot = new THREE.Vector3(0, 0.1, 0);
    return g;
  }

  // 独立蜡烛候选（圆柱 + 火苗）
  function makeCandlePick(pos) {
    const g = new THREE.Group();
    const stick = part(new THREE.CylinderGeometry(0.05, 0.05, 0.5), 0xffffff);
    stick.position.y = 0.25;
    g.add(stick);
    const flame = part(new THREE.ConeGeometry(0.09, 0.2, 10), 0xf2a13c, {
      emissive: 0xd96f1e, emissiveIntensity: 0.6, roughness: 0.4,
    });
    flame.position.y = 0.6;
    g.add(flame);
    g.userData.pick = pos;
    g.userData.localHotspot = new THREE.Vector3(0, 0.55, 0);
    return g;
  }

  // 气球组：one 一个，two 两个
  function makeBalloonGroup(kind) {
    const g = new THREE.Group();
    const colors = kind === 'one' ? [0xef6f5b] : [0xef6f5b, 0x4f93d6];
    colors.forEach((c, i) => {
      const b = makeBalloon(c);
      b.position.x = (i - (colors.length - 1) / 2) * 0.5;
      g.add(b);
    });
    g.userData.pick = kind;
    // 热点指向第一个气球的球体中心（球体中心在局部 y=0.4），避免落在气球顶端空隙
    g.userData.localHotspot = new THREE.Vector3(kind === 'one' ? 0 : -0.25, 0.4, 0);
    return g;
  }

  function showCheck() {
    clear();
  }

  function showQuiz(step) {
    clear();
    if (step.scene === 'party-book') {
      // 桌子 + on（桌面上）/ next（旁边地上）
      const table = makeTable();
      table.position.set(0, 0, 0.4);
      dyn.add(table);
      const onBook = makeBookPick('on');
      onBook.position.set(0, 1.02, 0.4);
      const nextBook = makeBookPick('next');
      nextBook.position.set(2.2, 0.05, 0.4);
      dyn.add(onBook, nextBook);
      onBook.updateMatrixWorld(true);
      nextBook.updateMatrixWorld(true);
      onBook.userData.hotspot = onBook.localToWorld(onBook.userData.localHotspot.clone());
      nextBook.userData.hotspot = nextBook.localToWorld(nextBook.userData.localHotspot.clone());
      currentPickables.push(onBook, nextBook);
    } else if (step.scene === 'party-balloons') {
      // 数量：一组 1 个、一组 2 个
      const one = makeBalloonGroup('one');
      one.position.set(-2.0, 0, 0.2);
      const two = makeBalloonGroup('two');
      two.position.set(2.0, 0, 0.2);
      dyn.add(one, two);
      one.updateMatrixWorld(true);
      two.updateMatrixWorld(true);
      one.userData.hotspot = one.localToWorld(one.userData.localHotspot.clone());
      two.userData.hotspot = two.localToWorld(two.userData.localHotspot.clone());
      currentPickables.push(one, two);
    } else if (step.scene === 'party-direction') {
      // 方向：三个小旗
      ['left', 'right', 'straight'].forEach((dir) => {
        const f = makeFlag(FLAG_COLOR[dir]);
        f.userData.pick = dir;
        f.position.copy(DIR_POS[dir]);
        dyn.add(f);
        f.updateMatrixWorld(true);
        if (f.userData.localHotspot) {
          f.userData.hotspot = f.localToWorld(f.userData.localHotspot.clone());
        }
        currentPickables.push(f);
      });
    }
  }

  // 顺序题：礼物 + 蜡烛两个候选
  function showSequence(step) {
    clear();
    const gift = makeGift(0x4f93d6);
    gift.userData.pick = 'gift';
    gift.userData.localHotspot = new THREE.Vector3(0, 0.6, 0);
    gift.position.set(-1.4, 0, 0.4);
    const candle = makeCandlePick('candle');
    candle.position.set(1.4, 0, 0.4);
    dyn.add(gift, candle);
    gift.updateMatrixWorld(true);
    candle.updateMatrixWorld(true);
    gift.userData.hotspot = gift.localToWorld(gift.userData.localHotspot.clone());
    candle.userData.hotspot = candle.localToWorld(candle.userData.localHotspot.clone());
    currentPickables.push(gift, candle);
  }

  function mark(pos, kind) {
    const target = currentPickables.find((p) => p.userData.pick === pos);
    if (!target) return;
    const color = kind === 'correct' ? 0x2e7d4f : kind === 'done' ? 0x2f7d9e : 0xb03a2e;
    target.traverse((m) => {
      if (m.isMesh && m.material) {
        m.material = m.material.clone();
        m.material.emissive = new THREE.Color(color);
        m.material.emissiveIntensity = 0.5;
      }
    });
  }

  // 示范：保留统一接口，发光球移动
  function prepareDemo() {
    if (demoGroup) return;
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 14),
      new THREE.MeshStandardMaterial({
        color: 0xffd24e, emissive: 0xf2a93b, emissiveIntensity: 0.7, roughness: 0.4,
      })
    );
    marker.position.set(0, 0.5, 0);
    marker.castShadow = true;
    dyn.add(marker);
    demoGroup = marker;
    demoTarget = new THREE.Vector3(0, 0.5, 0);
  }

  function demoStep(where) {
    if (!demoGroup || !DIR_POS[where]) return;
    const p = DIR_POS[where];
    demoTarget.set(p.x, 0.5, p.z);
  }

  function onAction(cb) { pickCb = cb; }

  function debugPicks() {
    const rect = renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector3();
    const out = {};
    for (const p of currentPickables) {
      if (p.userData.hotspot) v.copy(p.userData.hotspot);
      else {
        const box = new THREE.Box3().setFromObject(p);
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

  function debugRaycast(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(v, camera);
    return raycaster.intersectObjects(currentPickables, true).slice(0, 5).map((h) => {
      let o = h.object;
      while (o && o.userData.pick === undefined) o = o.parent;
      return { pick: o ? o.userData.pick : null, dist: Math.round(h.distance * 100) / 100 };
    });
  }

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
  function up(e) {
    if (!dragging) return;
    dragging = false;
    if (moved > 8) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(currentPickables, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && obj.userData.pick === undefined) obj = obj.parent;
      if (obj && pickCb) pickCb(obj.userData.pick);
    }
  }
  function wheel(e) {
    e.preventDefault();
    orbit.radius = THREE.MathUtils.clamp(orbit.radius + e.deltaY * 0.008, 6, 14);
    updateCamera();
  }

  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', down);
  dom.addEventListener('pointermove', move);
  dom.addEventListener('pointerup', up);
  dom.addEventListener('wheel', wheel, { passive: false });

  let raf = 0, usingTimer = false;
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
    if (demoGroup && demoTarget) demoGroup.position.lerp(demoTarget, 0.08);
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
