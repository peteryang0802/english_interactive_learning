// 音频管理器：预加载为 blob、请求令牌、状态绑定具体音频、失败可重试。
// 同一时刻只播一条，配合 UI 显示 加载中 / 播放中 / 再听一次 / 出错重试。
// 首播跟踪：firstPlayEnded 表示当前这条音频是否自然完整播完一次，
// 引擎据此判断能不能把作答记成“完整首播后答对”。

import { AUDIO } from './audio.js';

const blobUrls = new Map();   // key -> objectURL；null 表示预加载失败
let el = null;
let reqToken = 0;
let currentKey = null;

// status: idle | loading | playing | ended | error
export const audioState = {
  key: null,
  status: 'idle',
  played: false,          // 已经真正开始播放（play promise resolve）
  firstPlayEnded: false,  // 当前 key 自然播完过一次（ended 事件）
};
const listeners = new Set();

function emit() { listeners.forEach((fn) => fn(audioState)); }
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initAudio(audioEl) {
  el = audioEl;
  el.addEventListener('ended', () => {
    // 短音频可能在状态切到 playing 前就播完，这里只认 token 和 key，不卡 status
    if (reqToken && audioState.key === currentKey) {
      audioState.played = true;
      audioState.firstPlayEnded = true;
      audioState.status = 'ended';
      emit();
    }
  });
}

export function getState() { return audioState; }

// 预加载：有限并发 fetch，单个失败不中断，标记 null 以便重试
export async function preload(keys, onProgress, concurrency = 5) {
  const todo = keys.filter((k) => !blobUrls.has(k));
  let idx = 0, done = 0;
  async function worker() {
    while (idx < todo.length) {
      const key = todo[idx++];
      try {
        const res = await fetch(AUDIO[key] || key);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        blobUrls.set(key, URL.createObjectURL(blob));
      } catch {
        blobUrls.set(key, null);
      }
      done++;
      if (onProgress) onProgress(done, todo.length, key);
    }
  }
  const n = Math.max(1, Math.min(concurrency, todo.length));
  await Promise.all(Array.from({ length: n }, worker));
}

// 只预加载指定的少量 key（用于进关卡前先保证首音），并发
export function preloadBackground(keys) {
  return preload(keys);
}

export function isReady(key) { return !!blobUrls.get(key); }

function setStatus(status) {
  audioState.status = status;
  emit();
}

// 播放：返回请求 token；token 过期的回调一律忽略，避免旧音频污染新题
export function play(key) {
  const token = ++reqToken;
  currentKey = key;
  audioState.key = key;
  audioState.played = false;
  audioState.firstPlayEnded = false;
  el.onended = null;

  el.src = blobUrls.get(key) || AUDIO[key] || key;
  setStatus('loading');

  el.play().then(() => {
    if (token !== reqToken) return;
    audioState.played = true;
    // 双保险：promise resolve 时音频可能已经播完、ended 事件已错过
    if (el.ended) {
      audioState.firstPlayEnded = true;
      audioState.status = 'ended';
      emit();
    } else {
      setStatus('playing');
    }
  }).catch((err) => {
    if (token !== reqToken) return;
    if (err && err.name === 'AbortError') return; // 主动停止，不算故障
    setStatus('error');
  });
  return token;
}

export function stop() {
  reqToken++;
  if (el) {
    el.onended = null;
    el.pause();
    el.removeAttribute('src');
    el.load();   // 强制中止还在进行的下载，避免离开后旧音频接着响
  }
  currentKey = null;
  audioState.played = false;
  audioState.firstPlayEnded = false;
  audioState.status = 'idle';
  emit();
}

// 重试：清掉失败标记，重新拉取后再播
export function retry(key) {
  const k = key || currentKey;
  if (blobUrls.get(k) === null) blobUrls.delete(k);
  return preload([k]).then(() => play(k));
}
