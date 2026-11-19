// 第一关剧情与任务流：教学目标仍是 on / next to，
// 用对话把任务串起来，让孩子有代入感，也多听英语。
// speaker：beaver 河狸馆员、rabbit 小兔。

// 一句对话：说话人、英文（配音）、中文意思（字幕辅助，不配音）
function line(speaker, en, zh, audio) {
  return { speaker, en, zh, audio };
}

// 生成第一关的完整步骤
export function buildLibraryRun() {
  const steps = [];

  // 开场：小兔来借书，河狸欢迎
  steps.push({
    type: 'dialogue',
    lines: [
      line('rabbit', 'Hi, Beaver!', '嗨，河狸！', 'd-r-hi'),
      line('beaver', 'Hello, little rabbit! What can I do for you?', '你好小兔！我能帮你什么？', 'd-b-hello'),
      line('rabbit', 'I want to have a party. I need some books.', '我想办个派对，需要一些书。', 'd-r-party'),
      line('beaver', 'Wonderful! Let us find the books together.', '太好了！我们一起找书吧。', 'd-b-find'),
      line('beaver', 'First, listen carefully.', '先仔细听哦。', 'd-b-first'),
    ],
  });

  // 基础确认：book
  steps.push({ type: 'check', target: 'book', audio: 'tap-book' });
  steps.push({
    type: 'dialogue',
    lines: [line('beaver', 'Great! That is a book.', '棒！那是一本书。', 'd-b-book')],
  });

  // 基础确认：cart
  steps.push({ type: 'check', target: 'cart', audio: 'tap-cart' });
  steps.push({
    type: 'dialogue',
    lines: [line('beaver', 'Well done! That is the cart.', '做得好！那是推车。', 'd-b-cart')],
  });

  // 讲解 on / next to
  steps.push({
    type: 'dialogue',
    lines: [
      line('beaver', 'Look. A book can be on the cart.', '看，书可以在推车上面。', 'd-b-on'),
      line('beaver', 'Or it can be next to the cart.', '或者在推车旁边。', 'd-b-next'),
    ],
  });

  // 示范
  steps.push({ type: 'demo' });
  steps.push({
    type: 'dialogue',
    lines: [line('beaver', 'Now you try. Listen for on or next to.', '你来试试，注意听 on 还是 next to。', 'd-b-try')],
  });

  // 推车听辨：前三道
  for (let i = 0; i < 3; i++) steps.push({ type: 'quiz', holder: 'cart' });
  steps.push({
    type: 'dialogue',
    lines: [line('beaver', 'You are doing great!', '你做得真棒！', 'd-b-great')],
  });
  // 推车听辨：再两道
  for (let i = 0; i < 2; i++) steps.push({ type: 'quiz', holder: 'cart' });

  // 迁移到盒子
  steps.push({
    type: 'dialogue',
    lines: [
      line('beaver', 'Nice listening! Now let us use the box.', '听得真仔细！现在换成盒子。', 'd-b-nice'),
      line('beaver', 'The words are the same: on, next to.', '词还是一样的：on、next to。', 'd-b-same'),
    ],
  });
  for (let i = 0; i < 3; i++) steps.push({ type: 'quiz', holder: 'box' });

  // 开口借书
  steps.push({
    type: 'dialogue',
    lines: [line('beaver', 'Time to ask for the book. Say it with me.', '该借书了，跟我一起说。', 'd-b-ask')],
  });
  steps.push({ type: 'speak' });

  // 结尾：庆祝、告别
  steps.push({
    type: 'dialogue',
    lines: [
      line('beaver', 'You did it! The book is yours.', '你做到了！书归你了。', 'd-b-didit'),
      line('rabbit', 'Thank you, Beaver! See you at the party!', '谢谢河狸，派对见！', 'd-r-thanks'),
      line('beaver', 'Have a great party!', '祝派对开心！', 'd-b-bye'),
    ],
  });

  steps.push({ type: 'done' });
  return steps;
}

// 本轮新增的对话音频 key（文件路径在 audio.js 统一登记）
export const DIALOGUE_KEYS = [
  'd-r-hi', 'd-b-hello', 'd-r-party', 'd-b-find', 'd-b-first',
  'd-b-book', 'd-b-cart',
  'd-b-on', 'd-b-next', 'd-b-try',
  'd-b-great', 'd-b-nice', 'd-b-same',
  'd-b-ask', 'd-b-didit', 'd-r-thanks', 'd-b-bye',
];
