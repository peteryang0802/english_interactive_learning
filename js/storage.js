// 本地存档：只存学习进度和道具，不存任何个人身份信息。
// 所有读写都包 try/catch，隐私模式或写满时降级为内存态，不挡住学习。
// v2：支持每关完成状态和结果，自动迁移旧版存档。

const KEY = 'animal-town-save-v1';

export const LEVEL_IDS = ['library', 'bakery', 'crossing', 'market', 'party'];

const DEFAULT_SAVE = {
  version: 2,
  unlocked: 1,        // 已解锁地点数（图书馆一开始可进）
  items: [],          // 已获得道具，按唯一 ID 去重
  lastResult: null,   // 最近一次学习结果（家长报告用）
  levels: {},         // levelId -> { done:boolean, result:summary }
  progress: {},       // levelId -> 未完成时停在的题号（stepIndex）
};

let memoryFallback = { ...DEFAULT_SAVE, levels: {} };

// 旧存档（无 levels）迁移：按 unlocked 反推已完成的关卡
function migrate(raw) {
  const base = { ...DEFAULT_SAVE, ...raw };
  base.levels = raw.levels || {};
  base.progress = raw.progress || {};
  if (!raw.levels) {
    for (let i = 0; i < base.unlocked - 1 && i < LEVEL_IDS.length; i++) {
      const id = LEVEL_IDS[i];
      base.levels[id] = { done: true, result: id === 'library' ? base.lastResult : null };
    }
  }
  return base;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE, levels: {} };
    return migrate(JSON.parse(raw));
  } catch {
    return { ...memoryFallback, levels: { ...memoryFallback.levels } };
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    memoryFallback = data;
    return true;
  } catch {
    memoryFallback = data;
    return false;
  }
}

export function addItem(data, itemId) {
  if (!data.items.includes(itemId)) data.items.push(itemId);
  writeSave(data);
  return data;
}

// 标记某关完成：存结果、推进解锁数；重复通关不重复解锁
export function markLevelDone(data, levelId, result) {
  const idx = LEVEL_IDS.indexOf(levelId);
  if (!data.levels) data.levels = {};
  if (!data.progress) data.progress = {};
  data.levels[levelId] = { done: true, result: result || null };
  delete data.progress[levelId];   // 完成了，不再保留中途题号
  data.lastResult = result || data.lastResult;
  if (idx >= 0) data.unlocked = Math.max(data.unlocked, Math.min(idx + 2, LEVEL_IDS.length));
  writeSave(data);
  return data;
}

// 保存某关中途停在的题号（刷新、退出后能从这道题继续）
export function saveProgress(data, levelId, stepIndex) {
  if (!data.progress) data.progress = {};
  data.progress[levelId] = stepIndex;
  writeSave(data);
  return data;
}

export function getProgress(data, levelId) {
  if (!data.progress || data.progress[levelId] == null) return 0;
  return data.progress[levelId];
}

export function isLevelDone(data, levelId) {
  return !!(data.levels && data.levels[levelId] && data.levels[levelId].done);
}

export function getLevelResult(data, levelId) {
  return data.levels && data.levels[levelId] ? data.levels[levelId].result : null;
}

export function resetSave() {
  const fresh = { ...DEFAULT_SAVE, levels: {} };
  writeSave(fresh);
  return fresh;
}
