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

// 河狸：深棕敦实身子 + 小耳朵 + 钝吻 + 两颗突出大门牙 + 宽扁船桨尾巴
export function makeBeaver() {
  const g = new THREE.Group();
  const BROWN = 0x8f5f35;
  const DARK = 0x5f3c22;
  const TOOTH = 0xf5ead4;   // 奶白大门牙，和棕脸对比强，一眼能看见

  // 脚
  for (const sx of [-0.18, 0.18]) {
    const foot = part(new THREE.SphereGeometry(0.14, 12, 10), DARK);
    foot.scale.set(1.2, 0.6, 1.4);
    foot.position.set(sx, 0.1, 0.08);
    g.add(foot);
  }

  // 身体：敦实
  const body = part(new THREE.SphereGeometry(0.42, 16, 14), BROWN);
  body.scale.set(1.0, 1.1, 0.95);
  body.position.y = 0.55;
  g.add(body);

  // 肚皮（浅一点）
  const belly = part(new THREE.SphereGeometry(0.28, 14, 12), 0xd4b085);
  belly.scale.set(0.9, 1.05, 0.5);
  belly.position.set(0, 0.5, 0.33);
  g.add(belly);

  // 头（略扁）
  const head = part(new THREE.SphereGeometry(0.34, 16, 14), BROWN);
  head.scale.set(1, 0.95, 1);
  head.position.y = 1.18;
  g.add(head);

  // 钝吻部（往前突出）
  const muzzle = part(new THREE.SphereGeometry(0.2, 14, 12), BROWN);
  muzzle.scale.set(0.9, 0.8, 1.1);
  muzzle.position.set(0, 1.05, 0.32);
  g.add(muzzle);

  // 小耳朵（缩小、贴头，不再像熊耳朵）
  for (const sx of [-0.17, 0.17]) {
    const ear = part(new THREE.SphereGeometry(0.075, 12, 10), DARK);
    ear.scale.set(1, 0.85, 0.9);
    ear.position.set(sx, 1.42, -0.02);
    g.add(ear);
  }

  // 眼睛
  for (const sx of [-0.12, 0.12]) {
    const eye = part(new THREE.SphereGeometry(0.045, 10, 8), 0x241c16);
    eye.position.set(sx, 1.22, 0.3);
    g.add(eye);
  }

  // 鼻子（小、深色，在吻尖）
  const nose = part(new THREE.SphereGeometry(0.06, 10, 8), 0x33231a);
  nose.scale.set(1, 0.85, 0.9);
  nose.position.set(0, 1.08, 0.47);
  g.add(nose);

  // 两颗大门牙（并排、加大、往前突出嘴外，正面一眼能看见）
  for (const sx of [-0.07, 0.07]) {
    const tooth = part(new THREE.BoxGeometry(0.08, 0.23, 0.08), TOOTH, { roughness: 0.5 });
    tooth.position.set(sx, 0.92, 0.47);
    g.add(tooth);
  }

  // 宽扁大尾巴（船桨形，比身体还宽，侧面转过去很明显）
  const tailGroup = new THREE.Group();
  const tail = part(new THREE.SphereGeometry(0.4, 16, 14), DARK);
  tail.scale.set(1.0, 0.18, 1.35);
  tailGroup.add(tail);
  tailGroup.position.set(0, 0.32, -0.52);
  tailGroup.rotation.x = 0.12;
  g.add(tailGroup);

  let t0 = Math.random() * 6;
  g.userData.animate = (t) => {
    const tt = t + t0;
    g.position.y = Math.sin(tt * 1.8) * 0.03;
    tailGroup.rotation.y = Math.sin(tt * 1.6) * 0.1;
  };
  return g;
}
