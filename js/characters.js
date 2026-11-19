import * as THREE from '../vendor/three.module.js';

// 角色都用基础几何体拼，低面数、零外部加载。每个工厂返回一个 Group，
// 并在 userData.animate(t) 上挂待机动画，场景循环里按需调用。

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
}

function part(geometry, color, extra = {}) {
  const m = new THREE.Mesh(geometry, mat(color, extra));
  m.castShadow = true;
  return m;
}

// 小兔：白色身体 + 长耳朵 + 粉鼻子 + 小尾巴
export function makeRabbit() {
  const g = new THREE.Group();
  const WHITE = 0xf7f4ee;
  const PINK = 0xf4a9b8;

  // 后脚
  for (const sx of [-0.18, 0.18]) {
    const foot = part(new THREE.SphereGeometry(0.14, 14, 12), WHITE);
    foot.scale.set(1.2, 0.6, 1.5);
    foot.position.set(sx, 0.1, 0.08);
    g.add(foot);
  }

  // 身体
  const body = part(new THREE.SphereGeometry(0.4, 16, 14), WHITE);
  body.scale.set(0.95, 1.2, 0.9);
  body.position.y = 0.55;
  g.add(body);

  // 手臂
  for (const sx of [-0.34, 0.34]) {
    const arm = part(new THREE.SphereGeometry(0.12, 12, 10), WHITE);
    arm.scale.set(0.8, 1.3, 0.8);
    arm.position.set(sx, 0.6, 0.05);
    g.add(arm);
  }

  // 尾巴
  const tail = part(new THREE.SphereGeometry(0.15, 14, 12), WHITE);
  tail.position.set(0, 0.45, -0.36);
  g.add(tail);

  // 头
  const head = part(new THREE.SphereGeometry(0.32, 16, 14), WHITE);
  head.position.y = 1.18;
  g.add(head);

  // 眼睛
  for (const sx of [-0.12, 0.12]) {
    const eye = part(new THREE.SphereGeometry(0.045, 10, 8), 0x2a2622);
    eye.position.set(sx, 1.22, 0.27);
    g.add(eye);
  }

  // 鼻子
  const nose = part(new THREE.SphereGeometry(0.05, 10, 8), PINK);
  nose.position.set(0, 1.12, 0.3);
  g.add(nose);

  // 耳朵（成组，方便摆动）
  const ears = [];
  for (const sx of [-0.14, 0.14]) {
    const ear = new THREE.Group();
    const outer = part(new THREE.CapsuleGeometry(0.08, 0.32, 4, 12), WHITE);
    ear.add(outer);
    const inner = part(new THREE.CapsuleGeometry(0.045, 0.24, 4, 10), PINK, { roughness: 0.9 });
    inner.position.set(0, 0.02, 0.04);
    ear.add(inner);
    ear.position.set(sx, 1.5, 0);
    ear.rotation.z = sx < 0 ? 0.18 : -0.18;
    ear.userData.base = ear.rotation.z;
    g.add(ear);
    ears.push(ear);
  }

  let t0 = Math.random() * 6;
  g.userData.moving = false;
  g.userData.animate = (t) => {
    const tt = t + t0;
    if (g.userData.moving) {
      // 走路：兔子一蹦一蹦，蹦得高一点、节奏快一点，耳朵跟着抖
      const hop = Math.abs(Math.sin(tt * 7.5));
      g.position.y = hop * 0.17;
      ears.forEach((ear) => {
        ear.rotation.z = ear.userData.base + Math.sin(tt * 7.5) * 0.14;
      });
    } else {
      // 待机：轻轻呼吸浮动，耳朵慢慢摆
      g.position.y = Math.sin(tt * 2) * 0.035;
      ears.forEach((ear) => {
        ear.rotation.z = ear.userData.base + Math.sin(tt * 2.6) * 0.07;
      });
    }
  };
  return g;
}

// 河狸馆员：棕色身体 + 圆耳朵 + 大门牙 + 扁尾巴
export function makeBeaver() {
  const g = new THREE.Group();
  const BROWN = 0xa9743f;
  const DARK = 0x7a4f2c;

  // 脚
  for (const sx of [-0.18, 0.18]) {
    const foot = part(new THREE.SphereGeometry(0.14, 12, 10), DARK);
    foot.scale.set(1.2, 0.6, 1.4);
    foot.position.set(sx, 0.1, 0.08);
    g.add(foot);
  }

  // 身体
  const body = part(new THREE.SphereGeometry(0.4, 16, 14), BROWN);
  body.scale.set(0.95, 1.15, 0.9);
  body.position.y = 0.55;
  g.add(body);

  // 肚皮（浅一点）
  const belly = part(new THREE.SphereGeometry(0.28, 14, 12), 0xd8b48a);
  belly.scale.set(0.9, 1.1, 0.5);
  belly.position.set(0, 0.5, 0.32);
  g.add(belly);

  // 头
  const head = part(new THREE.SphereGeometry(0.33, 16, 14), BROWN);
  head.position.y = 1.16;
  g.add(head);

  // 耳朵
  for (const sx of [-0.2, 0.2]) {
    const ear = part(new THREE.SphereGeometry(0.1, 12, 10), DARK);
    ear.position.set(sx, 1.4, 0.02);
    g.add(ear);
  }

  // 眼睛
  for (const sx of [-0.12, 0.12]) {
    const eye = part(new THREE.SphereGeometry(0.045, 10, 8), 0x2a2018);
    eye.position.set(sx, 1.2, 0.28);
    g.add(eye);
  }

  // 鼻子
  const nose = part(new THREE.SphereGeometry(0.07, 10, 8), 0x3a2a1e);
  nose.scale.set(1.1, 0.8, 0.9);
  nose.position.set(0, 1.1, 0.32);
  g.add(nose);

  // 大门牙
  const tooth = part(new THREE.BoxGeometry(0.12, 0.16, 0.06), 0xf7f1e2, { roughness: 0.6 });
  tooth.position.set(0, 0.98, 0.3);
  g.add(tooth);

  // 扁尾巴（成组，可轻摆）
  const tailGroup = new THREE.Group();
  const tail = part(new THREE.SphereGeometry(0.34, 14, 12), DARK);
  tail.scale.set(0.7, 0.35, 1.5);
  tailGroup.add(tail);
  tailGroup.position.set(0, 0.35, -0.4);
  tailGroup.rotation.x = 0.25;
  g.add(tailGroup);

  let t0 = Math.random() * 6;
  g.userData.animate = (t) => {
    const tt = t + t0;
    g.position.y = Math.sin(tt * 1.8) * 0.03;
    tailGroup.rotation.y = Math.sin(tt * 1.6) * 0.12;
  };
  return g;
}
