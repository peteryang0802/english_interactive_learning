// 关卡配置中心：每关的名称、HUD 标题、技能标签、奖励道具（含中文名和内联 SVG）。
// 纯静态数据，不含步骤逻辑；步骤由 story.js 的 build 函数生成。

const BOOK_SVG = '<svg viewBox="0 0 40 32" aria-hidden="true"><rect x="4" y="3" width="32" height="26" rx="3" fill="#2f7d8c"/><rect x="7" y="6" width="26" height="20" rx="2" fill="#f7f1e2"/></svg>';
const ROLL_SVG = '<svg viewBox="0 0 44 36" aria-hidden="true"><ellipse cx="14" cy="20" rx="11" ry="12" fill="#e8b878"/><ellipse cx="30" cy="22" rx="10" ry="10" fill="#d99a5e"/><path d="M8 16 q3 -4 6 0 M25 18 q3 -4 6 0" stroke="#b07a45" fill="none" stroke-width="2"/></svg>';
const MAP_SVG = '<svg viewBox="0 0 44 40" aria-hidden="true"><path d="M6 8 L18 5 L26 9 L38 6 L38 32 L26 35 L18 31 L6 34 Z" fill="#f3e6c4" stroke="#9c7b46" stroke-width="2"/><path d="M18 5 L18 31 M26 9 L26 35" stroke="#9c7b46" stroke-width="1.5"/><circle cx="30" cy="16" r="3" fill="#d6503e"/></svg>';
const BALLOON_SVG = '<svg viewBox="0 0 40 44" aria-hidden="true"><path d="M20 26 L19 40" stroke="#888" stroke-width="1.5"/><ellipse cx="14" cy="14" rx="9" ry="11" fill="#ef6f5b"/><ellipse cx="27" cy="17" rx="8" ry="10" fill="#4f93d6"/><ellipse cx="20" cy="24" rx="7" ry="8" fill="#f2c14e"/></svg>';
const CAKE_SVG = '<svg viewBox="0 0 44 40" aria-hidden="true"><rect x="8" y="18" width="28" height="16" rx="2" fill="#f7e3c8"/><path d="M8 22 q4 4 8 0 t8 0 t8 0" stroke="#e88aa6" fill="none" stroke-width="2"/><rect x="21" y="8" width="2" height="8" fill="#8a5a30"/><circle cx="22" cy="7" r="2.5" fill="#f2c14e"/></svg>';
// 购物篮（超市采购奖励，里面是买到的东西，不再发气球）
const GROCERIES_SVG = '<svg viewBox="0 0 44 40" aria-hidden="true"><path d="M7 12 L37 12 L34 34 L10 34 Z" fill="#a9743f"/><ellipse cx="22" cy="12" rx="15" ry="3.6" fill="#8a5a30"/><circle cx="16" cy="22" r="4" fill="#d9483f"/><rect x="23" y="17" width="6" height="10" rx="1" fill="#f2f0e8"/></svg>';

export const LEVELS = [
  {
    id: 'library',
    name: '图书馆',
    hudTitle: '第一关：书在哪儿',
    skillLabel: '方位听辨',
    doneTitle: '书借到啦',
    reward: { id: 'party-book', name: '派对用书', svg: BOOK_SVG },
  },
  {
    id: 'bakery',
    name: '面包店',
    hudTitle: '第二关：面包店点单',
    skillLabel: '数量听辨',
    doneTitle: '面包装好啦',
    reward: { id: 'party-rolls', name: '派对面包', svg: ROLL_SVG },
  },
  {
    id: 'crossing',
    name: '小镇路口',
    hudTitle: '第三关：小镇问路',
    skillLabel: '方向听辨',
    doneTitle: '路问清楚啦',
    reward: { id: 'party-map', name: '派对地图', svg: MAP_SVG },
  },
  {
    id: 'market',
    name: '超市',
    hudTitle: '第四关：超市采购',
    skillLabel: '顺序听辨',
    doneTitle: '东西买齐啦',
    reward: { id: 'party-groceries', name: '派对采购', svg: GROCERIES_SVG },
  },
  {
    id: 'party',
    name: '派对场地',
    hudTitle: '第五关：生日派对',
    skillLabel: '综合听辨',
    doneTitle: '派对准备好啦',
    reward: { id: 'party-cake', name: '派对蛋糕', svg: CAKE_SVG },
  },
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || null;
}
