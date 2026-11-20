// 视图加载器：3D 模块（依赖 Three.js）一律动态 import，核心流程不静态依赖 three。
// 这样拦截 three 模块、禁用 WebGL 或 3D 运行出错时，HTML 菜单、2D 视图和引擎仍能独立运行。
import { createLibrary2D } from './view-2d.js';

let mod3D = null;
let loadFailed = false;

// 按需加载全部 3D 模块，只加载一次；失败后记录，不重复踩坑
async function load3DModules() {
  if (mod3D) return mod3D;
  if (loadFailed) throw new Error('3d modules unavailable');
  const [town, library, crossing, party] = await Promise.all([
    import('./town.js'),
    import('./library.js'),
    import('./crossing-view.js'),
    import('./party-view.js'),
  ]);
  mod3D = {
    createTown: town.createTown,
    createLibraryScene: library.createLibraryScene,
    createCrossingScene: crossing.createCrossingScene,
    createPartyScene: party.createPartyScene,
  };
  return mod3D;
}

// 主动标记 3D 不可用（运行中上下文丢失等），后续直接走 2D
export function disable3D() {
  loadFailed = true;
  mod3D = null;
}

// 创建 3D 关卡视图；任何失败都回退到 2D，并通过返回值告诉调用方实际用了哪种
export async function createLevelView(container, id, prefer3D) {
  if (prefer3D) {
    try {
      const m = await load3DModules();
      let view;
      if (id === 'crossing') view = m.createCrossingScene(container);
      else if (id === 'party') view = m.createPartyScene(container);
      else view = m.createLibraryScene(container, id);
      return { view, is3D: true };
    } catch (err) {
      disable3D();
    }
  }
  // 防御：清掉可能残留的旧平面视图，避免多个 root 叠加把卡片挤出视口
  container.querySelectorAll('.view2d').forEach((el) => el.remove());
  return { view: createLibrary2D(container, id), is3D: false };
}

// 创建 3D 小镇地图；失败返回 null，由调用方渲染 HTML 菜单
export async function createTownView(container, opts, prefer3D) {
  if (!prefer3D) return { view: null, is3D: false };
  try {
    const m = await load3DModules();
    return { view: m.createTown(container, opts), is3D: true };
  } catch (err) {
    disable3D();
    return { view: null, is3D: false };
  }
}
