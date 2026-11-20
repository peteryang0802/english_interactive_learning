// 路口 3D 视图（户外）：两个真实路口连起来的小镇街区。
// 小兔在路口听方向，选对就沿那条路真走到下一个路口，走错会走到另一处再回来重听。
// 判定与音频由引擎负责，这里只管场景、移动、相机和标记。
// 接口：showRoute / showQuiz / showCheck / mark / prepareDemo / demoStep /
// onAction / routeSetNode / routeWalk / routeReturn / routeParty /
// debugPicks / debugRaycast / resetCamera / resize / dispose。

import * as THREE from '../vendor/three.module.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { makeRabbit, makeBeaver } from './characters.js';
import {
  makeBuilding, makeSign, makeFlag,
  makeTree, makeStreetLamp, makeBench, makeBush,
  makeBalloon, makeGift, makeBanner, makeFountain,
} from './props.js';
import {
  NODES, DIRS, DIR_VEC, STEP,
  parseNode, neighbor, dirRotation,
} from './route-graph.js';

const DEFAULT_ORBIT = { theta: 0.35, phi: 1.02, radius: 9 };
// 三面旗统一中性色，只靠位置区分，不让颜色变成答题线索
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
  const camTarget = new THREE.Vector3(0, 0.8, 0);
  function updateCamera() {
    const fit = THREE.MathUtils.clamp(1 / camera.aspect, 1, 1.7);
    const r = orbit.radius * fit;
    camera.position.set(
      camTarget.x + r * Math.sin(orbit.phi) * Math.sin(orbit.theta),
      camTarget.y + r * Math.cos(orbit.phi),
      camTarget.z + r * Math.sin(orbit.phi) * Math.cos(orbit.theta)
    );
    camera.lookAt(camTarget);
    camera.updateMatrixWorld();
  }
  updateCamera();

  scene.add(new THREE.HemisphereLight(0xf2f8ff, 0x6a8a55, 0.55));
  const sun = new THREE.DirectionalLight(0xfff6e0, 1.5);
  sun.position.set(6, 10, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -12;
  scene.add(sun);

  // 草地
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 26),
    new THREE.MeshStandardMaterial({ color: 0x7fae6b, roughness: 1 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, 0, -3);
  grass.receiveShadow = true;
  scene.add(grass);

  // ===== 道路：遍历节点图的边自动生成，去重 =====
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 1 });
  const edges = new Set();
  Object.keys(NODES).filter((id) => NODES[id].kind === 'junction').forEach((id) => {
    ['left', 'right', 'straight'].forEach((d) => {
      const nb = neighbor(id, d);
      if (!nb) return;
      const ek = [id, nb].sort().join('|');
      if (edges.has(ek)) return;
      edges.add(ek);
      const [x1, z1] = parseNode(id);
      const [x2, z2] = parseNode(nb);
      const horizontal = z1 === z2;
      const road = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? STEP : 2.4, 0.06, horizontal ? 2.4 : STEP),
        roadMat
      );
      road.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
      road.receiveShadow = true;
      scene.add(road);
    });
  });

  // ===== 终点建筑：5 栋，门朝来车方向 =====
  const BUILDINGS = [
    { id: '-8,0', color: 0xe88a6b, rotY: -Math.PI / 2 },
    { id: '-4,-4', color: 0x9b6bb0, rotY: 0 },
    { id: '0,-8', color: 0xe8c46b, rotY: 0 },
    { id: '4,-4', color: 0x6ba8c9, rotY: 0 },
    { id: '8,0', color: 0x5aa86b, rotY: Math.PI / 2 },
  ];
  BUILDINGS.forEach((b) => {
    const [x, z] = parseNode(b.id);
    const g = makeBuilding(b.color);
    g.position.set(x, 0, z);
    g.rotation.y = b.rotY;
    scene.add(g);
  });

  // ===== 静态装饰：两处地标 + 街区点缀，都放在道路围合的格子里，不挡路 =====
  const animators = [];
  function addStatic(obj, x, z, rotY = 0) {
    obj.position.set(x, 0, z);
    obj.rotation.y = rotY;
    scene.add(obj);
    if (obj.userData.animate) animators.push(obj.userData.animate);
    return obj;
  }

  // 第一处地标：喷泉（东南象限）
  addStatic(makeFountain(), 2, -2);
  // 第二处地标：路标（西南象限）
  addStatic(makeSign(), -2, -2);
  // 西北、东北象限再放树和灌木，让街区不空
  addStatic(makeTree('pine'), -2, -6);
  addStatic(makeBush(), 2, -6);
  // 路灯
  addStatic(makeStreetLamp(), -1.6, 1.6);
  addStatic(makeStreetLamp(), 1.6, -1.6);
  // 长椅（拿地图用，中心路口东南侧）
  addStatic(makeBench(), 2.2, 1.6, -0.5);
  // 远处再补两棵树
  addStatic(makeTree('broad'), -6.6, -2.2);
  addStatic(makeTree('broad'), 6.6, -2.2);

  // 指路人（河狸向导）站在中心路口北侧，面向小兔
  const guide = addStatic(makeBeaver(), -0.9, -1.6);
  guide.rotation.y = 0.3;

  // 小兔站在中心路口，面朝北
  const rabbit = addStatic(makeRabbit(), 0, 0);
  rabbit.rotation.y = Math.PI;

  // 动态挂载点：只放当题热点和派对装饰，静态街区始终保留
  const dyn = new THREE.Group();
  scene.add(dyn);

  let currentNode = '0,0';
  let currentPickables = [];
  let pickCb = null;
  let demoGroup = null;
  let demoTarget = null;
  let lockOrbit = false;
  let walk = null;
  let partyLayer = null;

  function clearDyn() {
    while (dyn.children.length) {
      const c = dyn.children.pop();
      if (c === partyLayer) { dyn.push(c); break; }
      disposeObject(c);
    }
    currentPickables = [];
    demoGroup = null;
    demoTarget = null;
    lockOrbit = false;
  }

  // 方向小旗：放在当前路口沿方向的路中间
  function makeDirFlag(dir) {
    const g = makeFlag(FLAG_COLOR[dir]);
    g.userData.pick = dir;
    const [nx, nz] = parseNode(currentNode);
    const [dx, dz] = DIR_VEC[dir];
    g.position.set(nx + dx * 0.62, 0, nz + dz * 0.62);
    return g;
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

  function showCheck() { clearDyn(); }

  // 路线决策：当前路口三个方向各放一面旗
  function showRoute() {
    clearDyn();
    ['left', 'right', 'straight'].forEach((d) => {
      const f = makeDirFlag(d);
      dyn.add(f);
      f.updateMatrixWorld(true);
      if (f.userData.localHotspot) {
        f.userData.hotspot = f.localToWorld(f.userData.localHotspot.clone());
      }
      currentPickables.push(f);
    });
    lockOrbit = true;
    resetCamera();
  }

  function showQuiz(step) {
    clearDyn();
    if (step.scene === 'crossing-bench') {
      const bench = makeBench();
      bench.position.set(2.0, 0, 1.4);
      bench.rotation.y = -0.5;
      dyn.add(bench);
      const onMap = makeMapPick('on');
      onMap.position.set(2.0, 0.62, 1.4);
      const nextMap = makeMapPick('next');
      nextMap.position.set(3.3, 0.06, 1.8);
      dyn.add(onMap, nextMap);
      currentPickables.push(onMap, nextMap);
    }
  }

  // ===== 标记：黑底 + 强发光，四色清晰 =====
  function markColor(kind) {
    if (kind === 'correct') return 0x27ae60;
    if (kind === 'done') return 0x3498db;
    if (kind === 'preselect') return 0xe0a92e;
    return 0xe8453a;
  }
  function forEachMesh(obj, fn) {
    obj.traverse((m) => { if (m.isMesh && m.material) fn(m); });
  }
  function eachMat(m, fn) {
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach(fn);
  }
  function rememberBase(mat) {
    if (mat.userData.__baseEmissive === undefined) {
      mat.userData.__baseColor = mat.color ? mat.color.getHex() : 0xffffff;
      mat.userData.__baseEmissive = mat.emissive ? mat.emissive.getHex() : 0x000000;
      mat.userData.__baseIntensity = mat.emissiveIntensity || 0;
    }
  }
  function restoreMat(mat) {
    if (mat.userData.__baseEmissive !== undefined) {
      if (mat.color) mat.color = new THREE.Color(mat.userData.__baseColor);
      mat.emissive = new THREE.Color(mat.userData.__baseEmissive);
      mat.emissiveIntensity = mat.userData.__baseIntensity;
    }
  }

  function mark(pos, kind) {
    const f = currentPickables.find((p) => p.userData.pick === pos);
    if (!f) return;
    const hex = markColor(kind);
    forEachMesh(f, (m) => eachMat(m, (mat) => {
      rememberBase(mat);
      if (mat.emissive) {
        if (mat.color) mat.color.setHex(0x000000);
        mat.emissive.setHex(hex);
        mat.emissiveIntensity = kind === 'preselect' ? 0.75 : 1;
      } else if (mat.color) {
        mat.color.setHex(hex);
      }
    }));
  }

  function unmark(pos) {
    const f = currentPickables.find((p) => p.userData.pick === pos);
    if (!f) return;
    forEachMesh(f, (m) => eachMat(m, restoreMat));
  }

  function clearMarks() {
    currentPickables.forEach((p) => forEachMesh(p, (m) => eachMat(m, restoreMat)));
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
    const [nx, nz] = parseNode(currentNode);
    marker.position.set(nx, 0.5, nz);
    marker.castShadow = true;
    dyn.add(marker);
    demoGroup = marker;
    demoTarget = new THREE.Vector3(nx, 0.5, nz);
  }

  function demoStep(where) {
    if (!demoGroup || !DIR_VEC[where]) return;
    const [nx, nz] = parseNode(currentNode);
    const [dx, dz] = DIR_VEC[where];
    demoTarget.set(nx + dx * 0.62, 0.5, nz + dz * 0.62);
  }

  // ===== 小兔移动：转身、hop 走到目标节点，只插值 x/z，y 交给动画 =====
  function easeInOut(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  function startWalk(toId) {
    const [tx, tz] = parseNode(toId);
    rabbit.userData.moving = true;
    walk = {
      fx: rabbit.position.x, fz: rabbit.position.z,
      tx, tz, t: 0, dur: 0.85, toId,
    };
  }

  // 引擎驱动：设置当前决策节点
  function routeSetNode(nodeId) { currentNode = nodeId; }
  function getRouteNode() { return currentNode; }

  // 沿方向走，返回目标节点 id（移动动画异步，引擎按固定时长等待）
  function routeWalk(dir) {
    const nb = neighbor(currentNode, dir);
    if (!nb) return null;
    rabbit.rotation.y = dirRotation(dir);
    startWalk(nb);
    return nb;
  }

  // 从错误节点回到指定决策节点（转身朝南走回去，到达后面朝北）
  function routeReturn(nodeId) {
    currentNode = nodeId;
    rabbit.rotation.y = 0;   // 朝 +z 往回走
    startWalk(nodeId);
    return nodeId;
  }

  // ===== 派对装饰：到达终点时移过去点亮 =====
  function ensureParty() {
    if (partyLayer) return partyLayer;
    const g = new THREE.Group();
    const b1 = makeBalloon(0xef6f5b);
    const b2 = makeBalloon(0x4f93d6);
    const b3 = makeBalloon(0xf2c14e);
    b1.position.set(-0.9, 0, 0);
    b2.position.set(0.9, 0, 0);
    b3.position.set(0, 0, -0.7);
    if (b1.userData.animate) animators.push(b1.userData.animate);
    if (b2.userData.animate) animators.push(b2.userData.animate);
    if (b3.userData.animate) animators.push(b3.userData.animate);
    const gift = makeGift(0x9b6bb0);
    gift.position.set(0, 0, 0.9);
    const banner = makeBanner();
    banner.position.set(0, 2.6, 0);
    g.add(b1, b2, b3, gift, banner);
    g.visible = false;
    scene.add(g);
    partyLayer = g;
    return g;
  }

  function routeParty(nodeId) {
    const g = ensureParty();
    const [x, z] = parseNode(nodeId);
    g.position.set(x, 0, z + 1.4);
    g.visible = true;
  }

  function clearParty() {
    if (partyLayer) partyLayer.visible = false;
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
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    for (const a of animators) a(t);

    if (walk) {
      walk.t += dt;
      const k = easeInOut(Math.min(walk.t / walk.dur, 1));
      rabbit.position.x = walk.fx + (walk.tx - walk.fx) * k;
      rabbit.position.z = walk.fz + (walk.tz - walk.fz) * k;
      if (k >= 1) {
        rabbit.position.x = walk.tx;
        rabbit.position.z = walk.tz;
        rabbit.userData.moving = false;
        const arrived = walk.toId;
        walk = null;
        // 到达决策路口，转回面朝北
        if (NODES[arrived] && NODES[arrived].kind === 'junction') {
          rabbit.rotation.y = Math.PI;
        }
      }
    }

    // 相机目标平滑跟随小兔
    camTarget.x += (rabbit.position.x - camTarget.x) * 0.08;
    camTarget.z += (rabbit.position.z - camTarget.z) * 0.08;

    if (demoGroup && demoTarget) demoGroup.position.lerp(demoTarget, 0.1);
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
    const [nx, nz] = parseNode(currentNode);
    camTarget.set(nx, 0.8, nz);
    updateCamera();
  }

  return {
    showCheck,
    showRoute,
    showQuiz,
    prepareDemo,
    demoStep,
    mark,
    unmark,
    clearMarks,
    onAction,
    routeSetNode,
    routeWalk,
    routeReturn,
    routeParty,
    clearParty,
    getRouteNode,
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
