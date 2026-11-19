// 音频管理：统一播放、记录是否真正出声
const voice = document.getElementById('voice');

export const AUDIO = {
  'tap-book': 'audio/tap-book.m4a',
  'tap-cart': 'audio/tap-cart.m4a',
  'on-cart': 'audio/on-cart.m4a',
  'next-cart': 'audio/next-cart.m4a',
  'tap-on-cart': 'audio/tap-on-cart.m4a',
  'tap-next-cart': 'audio/tap-next-cart.m4a',
  'tap-on-box': 'audio/tap-on-box.m4a',
  'tap-next-box': 'audio/tap-next-box.m4a',
  'ask-checkout': 'audio/ask-checkout.m4a',
  'beaver-done': 'audio/beaver-done.m4a',
};

// 当前题音频是否真正成功播放
export const audioState = { played: false };

export function stopAudio() {
  voice.onended = null;
  voice.pause();
  voice.removeAttribute('src');
  voice.load();
}

export function playAudio(key) {
  audioState.played = false;
  voice.onended = null;
  voice.src = AUDIO[key] || key;
  return voice.play().then(() => {
    audioState.played = true;
  }).catch(() => {
    audioState.played = false;
  });
}

// 播放后，结束时执行回调
export function playThen(key, onEnded) {
  return playAudio(key).then(() => {
    if (audioState.played && onEnded) voice.onended = onEnded;
  });
}
