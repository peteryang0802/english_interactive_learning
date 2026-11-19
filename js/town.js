import * as THREE from '../vendor/three.module.js';
import { makeRabbit } from './characters.js';
import {
  makeTree, makeStreetLamp, makeBench, makeBush, makeFlower, makeFountain,
} from './props.js';

// 五个地点：id、中文名、颜色、在小镇里的位置
const SPOTS = [
  { id: 'library', name: '图书馆', color: 0x1f8a8a, angle: 0 },
  { id: 'bakery', name: '面包店', color: 0xf2a93b, angle: Math.PI * 0.4 },
  { id: 'crossing', name: '小镇路口', color: 0x4f93d6, angle: Math.PI * 0.8 },
  { id: 'market', name: '超市', color: 0x5aa86b, angle: Math.PI * 1.2 },
  { id: 'party', name: '派对场地', color: 0xef6f5b, angle: Math.PI * 1.6 },
];
const RADIUS = 9;

function addDecoration(g, id) {
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
  if (id === 'library') {
    // 门前两根柱子 + 屋顶一本小书
    for (const sx of [-1, 1]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.6), mat(0xf2ead8));
      col.position.set(sx * 1.05, 0.8, 1.25);
      col.castShadow = true;
      g.add(col);
    }
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.5), mat(0x2f7d8c));
    book.position.set(0, 3.75, 0);
    g.add(book);
  } else if (id === 'bakery') {
    // 烟囱 + 门口小圆面包招牌
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), mat(0x9c5a44));
    chimney.position.set(0.8, 3.3, -0.4);
    g.add(chimney);
    const loaf = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), mat(0xe8b878));
    loaf.position.set(0, 1.7, 1.25);
    g.add(loaf);
  } else if (id === 'crossing') {
    // 路边指示牌
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2), mat(0x555));
    pole.position.set(1.5, 1.1, 0.6);
    g.add(pole);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.1), mat(0xf2c14e));
    sign.position.set(1.5, 2.1, 0.6);
    g.add(sign);
  } else if (id === 'market') {
    // 红白条纹遮阳棚
    for (let i = 0; i < 4; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.08, 1.0),
        mat(i % 2 ? 0xffffff : 0xd9534f)
      );
      stripe.position.set(-0.51 + i * 0.34, 1.5, 1.25);
      g.add(stripe);
    }
  } else if (id === 'party') {
    // 三个彩色气球
    const colors = [0xef6f5b, 0xf2c14e, 0x4f93d6];
    colors.forEach((c, i) => {
      const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), mat(c));
      balloon.position.set(-0.5 + i * 0.5, 3.3 + (i % 2) * 0.25, 0.8);
      g.add(balloon);
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6), mat(0x888));
      string.position.set(-0.5 + i * 0.5, 2.85, 0.8);
      g.add(string);
    });
  }
}

export function createTown(container, { unlocked, onEnter, onLocked }) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe3f0);
  scene.fog = new THREE.Fog(0xbfe3f0, 22, 40);

  const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
  // 相机轨道参数（球坐标）
  const orbit = { theta: 0.35, phi: 1.15, radius: 22 };
  function updateCamera() {
    // 竖屏水平视野窄，按比例拉远，保证整个小镇进得来
    const fit = THREE.MathUtils.clamp(1 / camera.aspect, 1, 1.9);
    const r = orbit.radius * fit;
    const x = r * Math.sin(orbit.phi) * Math.sin(orbit.theta);
    const y = r * Math.cos(orbit.phi);
    const z = r * Math.sin(orbit.phi) * Math.cos(orbit.theta);
    camera.position.set(x, y, z);
    camera.lookAt(0, 1, 0);
    camera.updateMatrixWorld();
  }
  updateCamera();

  // 灯光
  const hemi = new THREE.HemisphereLight(0xffffff, 0x88a07a, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.1);
  sun.position.set(8, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  scene.add(sun);

  // 地面
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 13, 0.5, 48),
    new THREE.MeshStandardMaterial({ color: 0x7fbf72, roughness: 1 })
  );
  ground.position.y = -0.25;
  ground.receiveShadow = true;
  scene.add(ground);

  // 中心广场
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 0.12, 40),
    new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 1 })
  );
  plaza.position.y = 0.02;
  scene.add(plaza);

  // ===== 环境与角色：喷泉、小兔、树木、路灯、长椅、花草 =====
  const animators = [];
  function polar(r, ang) { return { x: Math.sin(ang) * r, z: Math.cos(ang) * r }; }
  function place(obj, r, ang, y = 0, rotY = 0) {
    const p = polar(r, ang);
    obj.position.set(p.x, y, p.z);
    obj.rotation.y = rotY;
    scene.add(obj);
    if (obj.userData.animate) animators.push(obj.userData.animate);
    return obj;
  }

  // 中心喷泉
  scene.add(makeFountain());

  // 小兔站在广场边，靠近图书馆一侧（angle 0 是图书馆）
  const rabbit = place(makeRabbit(), 3.1, -0.55);
  rabbit.rotation.y = -0.4;

  // 五条小路的间隙方向（两条小路中间）
  const gaps = [0.2 * Math.PI, 0.6 * Math.PI, Math.PI, 1.4 * Math.PI, 1.8 * Math.PI];
  gaps.forEach((g, i) => {
    place(makeTree(i % 2 ? 'leaf' : 'pine'), 11.6, g);
    place(makeBush(), 10.2, g + 0.12);
    // 路灯贴着小路一侧
    place(makeStreetLamp(), 5.6, SPOTS[i].angle + 0.14);
  });

  // 长椅放在两栋建筑附近
  place(makeBench(), 8.2, gaps[0], 0, gaps[0]);
  place(makeBench(), 8.2, gaps[3], 0, gaps[3]);

  // 花点缀在广场外圈
  const flowerColors = [0xef6f9b, 0xf2c14e, 0x9b6bb0, 0xe88a3c, 0x4f93d6];
  for (let i = 0; i < 10; i++) {
    place(makeFlower(flowerColors[i % flowerColors.length]), 3.6 + (i % 3) * 0.5, i * 0.63);
  }

  // 小路 + 建筑
  const groups = [];
  SPOTS.forEach((spot, idx) => {
    const a = spot.angle;
    const x = Math.sin(a) * RADIUS;
    const z = Math.cos(a) * RADIUS;

    // 小路
    const pathLen = RADIUS - 2.2;
    const path = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.08, pathLen),
      new THREE.MeshStandardMaterial({ color: 0xd8c79a, roughness: 1 })
    );
    path.position.set(x / 2, 0.03, z / 2);
    // 盒子长边默认沿 z 轴，绕 y 旋转指向建筑即可，保持平铺
    path.rotation.y = Math.atan2(x, z);
    scene.add(path);

    // 建筑组
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.userData.spot = spot;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.2, 2.4),
      new THREE.MeshStandardMaterial({ color: spot.color, roughness: 0.8 })
    );
    body.position.y = 1.1;
    body.castShadow = true;
    g.add(body);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.9, 1.4, 4),
      new THREE.MeshStandardMaterial({ color: 0x8a3b2e, roughness: 0.8 })
    );
    roof.position.y = 2.9;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);

    // 门
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x4a2c1c })
    );
    door.position.set(0, 0.6, 1.21);
    g.add(door);

    // 各建筑的标志性装饰，方便一眼区分
    addDecoration(g, spot.id);

    g.userData.index = idx;
    scene.add(g);
    groups.push(g);
  });

  // 云朵
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.9 })
    );
    c.position.set(-12 + i * 6, 9 + (i % 2), -6 + i * 3);
    c.scale.set(1.6, 0.8, 1);
    scene.add(c);
    clouds.push(c);
  }

  // 应用解锁状态
  function applyUnlocked(n) {
    groups.forEach((g, i) => {
      const isOpen = i < n;
      g.traverse((m) => {
        if (m.isMesh && m.material) {
          m.material = m.material.clone();
          // 锁定建筑保持原色、不发灰，只略微压暗一点表示暂不可进
          m.material.transparent = false;
          m.material.opacity = 1;
          if (!isOpen) m.material.emissive = new THREE.Color(0x1a1a1a);
        }
      });
      g.userData.open = isOpen;
      const lab = labelEls[i];
      if (lab) {
        lab.textContent = g.userData.spot.name + (isOpen ? '' : '（未解锁）');
        lab.className = 'spot-label' + (isOpen ? ' open' : ' locked');
      }
    });
  }

  // 建筑名称标签：HTML 元素，每帧投影到建筑上方
  const labelEls = groups.map((g) => {
    const d = document.createElement('div');
    d.className = 'spot-label';
    container.appendChild(d);
    return d;
  });
  const labelPos = new THREE.Vector3();
  function updateLabels() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    groups.forEach((g, i) => {
      const el = labelEls[i];
      labelPos.set(g.position.x, 3.9, g.position.z);
      labelPos.project(camera);
      if (labelPos.z > 1) { el.style.display = 'none'; return; }
      el.style.display = '';
      let x = (labelPos.x * 0.5 + 0.5) * w;
      let y = (-labelPos.y * 0.5 + 0.5) * h;
      // 夹在视口安全区内，保证标签不跑出屏幕
      x = THREE.MathUtils.clamp(x, 70, w - 70);
      y = THREE.MathUtils.clamp(y, 24, h - 12);
      el.style.transform = 'translate(-50%,-100%) translate(' + x + 'px,' + y + 'px)';
    });
  }

  applyUnlocked(unlocked);

  // ===== 简易轨道控制 + 点击拾取 =====
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragging = false;
  let moved = 0;
  let lastX = 0, lastY = 0;

  function setPointer(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onDown(e) {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
  }
  function onMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX;
    lastY = e.clientY;
    orbit.theta -= dx * 0.006;
    orbit.phi = THREE.MathUtils.clamp(orbit.phi - dy * 0.005, 0.35, 1.35);
    updateCamera();
  }
  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    if (moved > 8) return; // 是拖拽，不是点击
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(groups, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && !obj.userData.spot) obj = obj.parent;
      if (obj && obj.userData.spot) {
        const spot = obj.userData.spot;
        if (obj.userData.open) onEnter(spot.id);
        else onLocked(spot.name);
      }
    }
  }
  function onWheel(e) {
    e.preventDefault();
    orbit.radius = THREE.MathUtils.clamp(orbit.radius + e.deltaY * 0.01, 10, 26);
    updateCamera();
  }

  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', onDown);
  dom.addEventListener('pointermove', onMove);
  dom.addEventListener('pointerup', onUp);
  dom.addEventListener('wheel', onWheel, { passive: false });

  // 动画循环
  let raf = 0;
  let usingTimer = false;
  const clock = new THREE.Clock();
  function schedule() {
    if (document.hidden) {
      usingTimer = true;
      raf = setTimeout(loop, 33);
    } else {
      usingTimer = false;
      raf = requestAnimationFrame(loop);
    }
  }
  function loop() {
    const t = clock.getElapsedTime();
    for (const a of animators) a(t);
    clouds.forEach((c) => {
      c.position.x += 0.008;
      if (c.position.x > 14) c.position.x = -14;
    });
    updateLabels();
    renderer.render(scene, camera);
    schedule();
  }
  loop();

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateCamera();
  }

  return {
    resize,
    setUnlocked: applyUnlocked,
    dispose() {
      if (usingTimer) clearTimeout(raf); else cancelAnimationFrame(raf);
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
      labelEls.forEach((el) => { if (el.parentNode) el.parentNode.removeChild(el); });
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}
