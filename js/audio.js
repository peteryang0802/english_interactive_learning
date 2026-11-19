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
  // 剧情对话（本轮新增）
  'd-r-hi': 'audio/d-r-hi.m4a',
  'd-b-hello': 'audio/d-b-hello.m4a',
  'd-r-party': 'audio/d-r-party.m4a',
  'd-b-find': 'audio/d-b-find.m4a',
  'd-b-first': 'audio/d-b-first.m4a',
  'd-b-book': 'audio/d-b-book.m4a',
  'd-b-cart': 'audio/d-b-cart.m4a',
  'd-b-on': 'audio/d-b-on.m4a',
  'd-b-next': 'audio/d-b-next.m4a',
  'd-b-try': 'audio/d-b-try.m4a',
  'd-b-great': 'audio/d-b-great.m4a',
  'd-b-nice': 'audio/d-b-nice.m4a',
  'd-b-same': 'audio/d-b-same.m4a',
  'd-b-ask': 'audio/d-b-ask.m4a',
  'd-b-didit': 'audio/d-b-didit.m4a',
  'd-r-thanks': 'audio/d-r-thanks.m4a',
  'd-b-bye': 'audio/d-b-bye.m4a',
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
