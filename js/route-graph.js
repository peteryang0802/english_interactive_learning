// 路口路线的纯逻辑：节点图、方向、邻居。不依赖 Three.js，引擎和 3D 视图共用。
// 所有决策路口小兔都面朝北(-z)，所以方向在世界坐标里是固定的：
// left 西、right 东、straight 北。

export const STEP = 4;
export const DIRS = ['left', 'right', 'straight'];
export const DIR_VEC = {
  left: [-1, 0],
  right: [1, 0],
  straight: [0, -1],
};

export function nodeKey(x, z) { return x + ',' + z; }
export function parseNode(id) {
  const [x, z] = id.split(',').map(Number);
  return [x, z];
}

export const NODES = {
  '0,0': { kind: 'junction', stage: 'first' },
  '-4,0': { kind: 'junction', stage: 'second' },
  '0,-4': { kind: 'junction', stage: 'second' },
  '4,0': { kind: 'junction', stage: 'second' },
  '-8,0': { kind: 'terminal' },
  '-4,-4': { kind: 'terminal' },
  '0,-8': { kind: 'terminal' },
  '4,-4': { kind: 'terminal' },
  '8,0': { kind: 'terminal' },
};

// 中心路口
export const FIRST_NODE = '0,0';

export function neighbor(nodeId, dir) {
  const [x, z] = parseNode(nodeId);
  const [dx, dz] = DIR_VEC[dir];
  const nk = nodeKey(x + dx * STEP, z + dz * STEP);
  return NODES[nk] ? nk : null;
}

// 移动方向对应的小兔朝向（小兔正面默认朝 +z）
export function dirRotation(dir) {
  if (dir === 'straight') return Math.PI;
  if (dir === 'left') return Math.PI / 2;
  return -Math.PI / 2;
}

// 第二路口回中心的方向（指向 0,0），没有则 null
export function backDir(nodeId) {
  for (const d of DIRS) {
    if (neighbor(nodeId, d) === FIRST_NODE) return d;
  }
  return null;
}

// 第二路口的合法第二段方向：走到终点、且不是回中心的路
export function secondChoices(nodeId) {
  return DIRS.filter((d) => {
    const nb = neighbor(nodeId, d);
    return nb && nb !== FIRST_NODE && NODES[nb].kind === 'terminal';
  });
}
