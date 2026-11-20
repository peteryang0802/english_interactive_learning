// 路口 3D 视图（户外）：渲染十字道路和方向热点，判定与音频由引擎负责。
// 接口与室内视图一致：showCheck / showQuiz / mark / prepareDemo / demoStep / onAction / resetCamera / resize / dispose。

import * as THREE from '../vendor/three.module.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { makeRabbit, makeBeaver } from './characters.js';
import {
  makeRoad, makeBuilding, makeSign, makeFlag,
  makeTree, makeStreetLamp, makeBench, makeBush,
} from './props.js';

const DEFAULT_ORBIT = { theta: 0.35, phi: 1.02, radius: 9 };

// 三个方向热点的世界坐标（相对路口中心）
const DIR_POS = {
  left: new THREE.Vector3(-3.6, 0, 0),
  right: new THREE.Vector3(3.6, 0, 0),
  straight: new THREE.Vector3(0, 0, -3.6),
};
// 三面旗统一中性色，只靠位置（left/right/straight）区分，不让颜色变成答题线索
const FLAG_COLOR = { left: 0xe07a3f, right: 0xe07a3f, straight: 0xe07a3f };

function disposeObject(obj) {
  obj.traverse((m) => {
    if (m.isMesh) {
      m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => mat.dispose());
    }
  });
}

export function createCrossingScene(container) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe0f0);

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

  scene.add(new THREE.HemisphereLight(0xf2f8ff, 0x6a8a55, 0.55));
  const sun = new THREE.DirectionalLight(0xfff6e0, 1.5);
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
    new THREE.MeshStandardMaterial({ color: 0x7fae6b, roughness: 1 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  // 道路
  scene.add(makeRoad());

  // 静态装饰
  const animators = [];
  function addStatic(obj, x, z, rotY = 0) {
    obj.position.set(x, 0, z);
    obj.rotation.y = rotY;
    scene.add(obj);
    if (obj.userData.animate) animators.push(obj.userData.animate);
    return obj;
  }

  addStatic(makeBuilding(0xe88a6b), -6.2, -6.2, 0.6);
  addStatic(makeBuilding(0x6ba8c9), 6.2, -6.0, -0.6);
  addStatic(makeBuilding(0xe8c46b), -6.0, 5.8, 1.0);
  addStatic(makeTree('pine'), -7.2, -1.8);
  addStatic(makeTree('broad'), 7.0, -2.6);
  addStatic(makeTree('pine'), -1.8, -7.2);
  addStatic(makeBush(), 2.6, 5.6);
  addStatic(makeStreetLamp(), -2.6, 2.4);
  addStatic(makeStreetLamp(), 2.6, -2.4);
  addStatic(makeBench(), 5.4, 3.2, -0.6);
  addStatic(makeSign(), -2.4, -2.6, 0.4);

  // 指路人（河狸）站在路口偏北，面向小兔
  const guide = addStatic(makeBeaver(), -0.9, -1.6);
  guide.rotation.y = 0.3;

  // 小兔站在南侧，面向北（正面默认朝 +z，转 180 度朝 -z）
  const rabbit = addStatic(makeRabbit(), 0, 3.2);
  rabbit.rotation.y = Math.PI;

  // 动态挂载点
  const dyn = new THREE.Group();
  scene.add(dyn);

  let currentPickables = [];
  let pickCb = null;
  let demoGroup = null;
  let demoTarget = null;
  let lockOrbit = false;

  function clear() {
    while (dyn.children.length) {
      const c = dyn.children.pop();
      disposeObject(c);
    }
    currentPickables = [];
    demoGroup = null;
    demoTarget = null;
    lockOrbit = false;
  }

  // 三个方向小旗
  function makeDirFlag(dir) {
    const g = makeFlag(FLAG_COLOR[dir]);
    g.userData.pick = dir;
    const p = DIR_POS[dir];
    g.position.set(p.x, 0, p.z);
    return g;
  }

  // 第三关以 quiz 为主，showCheck 保留接口（不单独使用）
  function showCheck() {
    clear();
  }

  // 地图候选（扁平小盒），用于长椅 on/next 题
  function makeMapPick(pos) {
    const g = new THREE.Group();
    const map = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.06, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xe8d9a8, roughness: 0.9 })
    );
    map.castShadow = true;
    const fold = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.07, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xb08c5e })
    );
    fold.position.x = 0.1;
    g.add(map, fold);
    g.userData.pick = pos;
    return g;
  }

  function showQuiz(step) {
    clear();
    if (step.scene === 'crossing-bench') {
      // 长椅 + on（座面上）/ next（旁边地上）两个地图
      const bench = makeBench();
      bench.position.set(1.6, 0, 1.2);
      bench.rotation.y = -0.5;
      dyn.add(bench);
      const onMap = makeMapPick('on');
      onMap.position.set(1.6, 0.62, 1.2);
      const nextMap = makeMapPick('next');
      nextMap.position.set(2.9, 0.06, 1.6);
      dyn.add(onMap, nextMap);
      currentPickables.push(onMap, nextMap);
      return;
    }
    const dirs = step.picks || ['left', 'right', 'straight'];
    dirs.forEach((dir) => {
      const f = makeDirFlag(dir);
      dyn.add(f);
      f.updateMatrixWorld(true);
      if (f.userData.localHotspot) {
        f.userData.hotspot = f.localToWorld(f.userData.localHotspot.clone());
      }
      currentPickables.push(f);
    });
    // 方向题固定视角：自动回正，答题期间不允许自由旋转（left/right 以小兔朝向为准）
    lockOrbit = true;
    resetCamera();
  }

  function mark(pos, kind) {
    const f = currentPickables.find((p) => p.userData.pick === pos);
    if (!f) return;
    f.traverse((m) => {
      if (m.isMesh && m.material) {
        m.material = m.material.clone();
        m.material.emissive = new THREE.Color(kind === 'correct' ? 0x2e7d4f : 0xb03a2e);
        m.material.emissiveIntensity = 0.5;
      }
    });
  }

  // ===== 示范：一个发光标记依次走到三个方向 =====
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
    if (lockOrbit) return;
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
    if (demoGroup && demoTarget) {
      demoGroup.position.lerp(demoTarget, 0.08);
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
