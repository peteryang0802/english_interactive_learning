import * as THREE from '../vendor/three.module.js';
import { makeBeaver } from './characters.js';
import {
  makeBookshelf, makeTable, makeChair, makeLamp, makeRug,
  makeWindow, makeClock, makePlant, makeDesk,
} from './props.js';

// 3D 图书馆：只负责渲染 3D 物体和点击拾取，判定与音频由 main.js 负责
export function createLibraryScene(container) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3ead8);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  const orbit = { theta: 0.4, phi: 1.05, radius: 8 };
  function updateCamera() {
    // 竖屏水平视野窄，按比例拉远，保证容器和两本书都进得来
    const fit = THREE.MathUtils.clamp(1 / camera.aspect, 1, 1.7);
    const r = orbit.radius * fit;
    const x = r * Math.sin(orbit.phi) * Math.sin(orbit.theta);
    const y = r * Math.cos(orbit.phi);
    const z = r * Math.sin(orbit.phi) * Math.cos(orbit.theta);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0.8, 0);
    camera.updateMatrixWorld();
  }
  updateCamera();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b48f, 0.9));
  const lamp = new THREE.DirectionalLight(0xfff0d6, 1.0);
  lamp.position.set(5, 9, 4);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.camera.left = -8;
  lamp.shadow.camera.right = 8;
  lamp.shadow.camera.top = 8;
  lamp.shadow.camera.bottom = -8;
  scene.add(lamp);

  // 房间：地板、后墙、两侧书架
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ color: 0xd9b98c, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 7),
    new THREE.MeshStandardMaterial({ color: 0xe9dcc3, roughness: 1 })
  );
  wall.position.set(0, 3.5, -5);
  scene.add(wall);

  // ===== 房间布置：书架、家具、馆员 =====
  const animators = [];
  function addStatic(obj, x, y, z, rotY = 0) {
    obj.position.set(x, y, z);
    obj.rotation.y = rotY;
    scene.add(obj);
    if (obj.userData.animate) animators.push(obj.userData.animate);
    return obj;
  }

  // 后墙：两侧书架、中央窗户
  addStatic(makeBookshelf(), -3.4, 0, -4.7);
  addStatic(makeBookshelf(), 3.4, 0, -4.7);
  addStatic(makeWindow(), 0, 2.0, -4.95);
  addStatic(makeClock(), 0, 4.3, -4.9);

  // 角落盆栽
  addStatic(makePlant(), -5.6, 0, -4.5);
  addStatic(makePlant(), 5.6, 0, -4.5);

  // 左侧阅读区：圆桌 + 两把椅子 + 台灯
  addStatic(makeTable(true), -4.4, 0, -1.2);
  addStatic(makeChair(), -4.4, 0, 0.1, Math.PI);
  addStatic(makeChair(), -5.6, 0, -1.2, Math.PI / 2);
  addStatic(makeLamp(), -4.0, 0.95, -1.2);

  // 右侧借书台 + 河狸馆员（站在台侧，面向孩子，全身可见）
  addStatic(makeDesk(), 4.3, 0, -1.4);
  const beaver = addStatic(makeBeaver(), 5.5, 0, -1.4);
  beaver.rotation.y = -0.5;
  beaver.scale.setScalar(1.05);

  // 中心地毯（任务区下方，不挡拾取）
  addStatic(makeRug(), 0, 0, 0.6);

  // 动态物体挂载点
  const dyn = new THREE.Group();
  scene.add(dyn);

  // 做一本 3D 书（两本外观完全一致）
  function makeBook(pos) {
    const g = new THREE.Group();
    const cover = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.18, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x2f7d8c, roughness: 0.7 })
    );
    cover.castShadow = true;
    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.12, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xf7f1e2, roughness: 1 })
    );
    pages.position.y = -0.02;
    g.add(cover, pages);
    g.userData.pick = pos;
    g.userData.book = true;
    return g;
  }

  // 做容器（推车或盒子）
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
      // 四条腿 + 轮子
      for (const sx of [-0.9, 0.9]) {
        for (const sz of [-0.5, 0.5]) {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.9),
            new THREE.MeshStandardMaterial({ color: 0x444 })
          );
          leg.position.set(sx, 0.45, sz);
          g.add(leg);
          const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16),
            new THREE.MeshStandardMaterial({ color: 0x222 })
          );
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(sx, 0.12, sz);
          g.add(wheel);
        }
      }
      g.userData.topY = 1.08;
    } else {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 1.0, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xb07a45, roughness: 0.9 })
      );
      box.position.y = 0.5;
      box.castShadow = true;
      g.add(box);
      g.userData.topY = 1.08;
    }
    g.userData.holder = kind;
    g.userData.pick = kind;
    return g;
  }

  let currentPickables = [];
  let pickCb = null;

  function clear() {
    while (dyn.children.length) {
      const c = dyn.children.pop();
      c.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); } });
    }
    currentPickables = [];
  }

  // 基础确认：显示一个可点的书或推车
  function showCheck(target) {
    clear();
    if (target === 'book') {
      const b = makeBook('book');
      b.position.set(0, 0.5, 0);
      dyn.add(b);
      currentPickables.push(b);
    } else {
      const c = makeHolder('cart');
      dyn.add(c);
      currentPickables.push(c);
    }
  }

  // 听辨题：容器 + 两本书，on 在上、next 在旁
  function showQuiz(holder, side) {
    clear();
    const h = makeHolder(holder);
    dyn.add(h);
    const topY = h.userData.topY;

    const onBook = makeBook('on');
    onBook.position.set(0, topY + 0.1, 0);
    dyn.add(onBook);

    const nextBook = makeBook('next');
    const x = side === 'left' ? -2.0 : 2.0;
    nextBook.position.set(x, 0.12, 0);
    dyn.add(nextBook);

    currentPickables.push(onBook, nextBook);
  }

  function onPick(cb) { pickCb = cb; }

  function mark(pos, kind) {
    const b = currentPickables.find((p) => p.userData.pick === pos);
    if (!b) return;
    b.traverse((m) => {
      if (m.isMesh && m.material) {
        m.material = m.material.clone();
        m.material.emissive = new THREE.Color(kind === 'correct' ? 0x2e7d4f : 0xb03a2e);
        m.material.emissiveIntensity = 0.5;
      }
    });
  }

  // 点击拾取
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
  function schedule() {
    if (document.hidden) {
      usingTimer = true;
      raf = setTimeout(loop, 33);
    } else {
      usingTimer = false;
      raf = requestAnimationFrame(loop);
    }
  }
  const clock = new THREE.Clock();
  function loop() {
    const t = clock.getElapsedTime();
    for (const a of animators) a(t);
    renderer.render(scene, camera);
    schedule();
  }
  loop();

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateCamera();
  }

  return {
    showCheck,
    showQuiz,
    onPick,
    mark,
    resize,
    dispose() {
      if (usingTimer) clearTimeout(raf); else cancelAnimationFrame(raf);
      dom.removeEventListener('pointerdown', down);
      dom.removeEventListener('pointermove', move);
      dom.removeEventListener('pointerup', up);
      dom.removeEventListener('wheel', wheel);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}
