// 教学脚本：每个关卡一个 build 函数，返回步骤数组。
// 步骤自带音频键、字幕、答案和演示序列，引擎和视图按字段驱动，不写死关卡内容。
// speaker：beaver 河狸馆员、rabbit 小兔。

export function line(speaker, en, audio) {
  return { speaker, en, audio };
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 生成平衡的关系序列：先各放一个 on、next，再随机补齐，整体打乱，
// 保证不会出现一整轮只练到一个关系，顺序又不会被背下来。
export function balancedRelations(n) {
  const arr = ['on', 'next'];
  for (let i = 2; i < n; i++) arr.push(Math.random() < 0.5 ? 'on' : 'next');
  return shuffle(arr);
}

// on / next to 的标准演示序列：书移动的同时，馆员说完整句子，不把 next to 拆成单词
const CART_DEMO = [
  { step: 'on', audio: 'demo-on-cart' },
  { step: 'next', audio: 'demo-next-cart' },
];

function bookQuiz(holder, relation) {
  const side = Math.random() < 0.5 ? 'left' : 'right';
  return {
    type: 'quiz',
    skill: 'place',
    holder,
    answer: relation,
    side,
    audio: 'tap-' + relation + '-' + holder,
    caption: relation === 'on'
      ? 'Tap the book on the ' + holder + '.'
      : 'Tap the book next to the ' + holder + '.',
    goodTip: '找到书啦！',
    badTip: '这本不对，再听一次，注意听清楚。',
    help: CART_DEMO,
  };
}

// ===== 第一关：图书馆，听辨 on / next to =====
export function buildLibraryRun() {
  const steps = [];

  // 开场只留两句，打完招呼马上进入任务
  steps.push({
    type: 'dialogue',
    lines: [
      line('rabbit', 'Hi, Beaver!', 'd-r-hi'),
      line('beaver', 'Hello, little rabbit! What can I do for you?', 'd-b-hello'),
    ],
  });

  // 词义确认：书和推车同时出现，凭听到的词选一个
  steps.push({
    type: 'check', skill: 'word', target: 'book', options: ['book', 'cart'],
    audio: 'tap-book', caption: 'book',
  });
  steps.push({
    type: 'check', skill: 'word', target: 'cart', options: ['book', 'cart'],
    audio: 'tap-cart', caption: 'cart',
  });

  // 交代来意
  steps.push({
    type: 'dialogue',
    lines: [line('rabbit', 'I want to have a party. I need some books.', 'd-r-party')],
  });

  // 讲解 on / next to
  steps.push({
    type: 'dialogue',
    lines: [
      line('beaver', 'Look. A book can be on the cart.', 'd-b-on'),
      line('beaver', 'Or it can be next to the cart.', 'd-b-next'),
    ],
  });

  // 动作示范（馆员把书放车上、再放车旁）
  steps.push({ type: 'demo', holder: 'cart', sequence: CART_DEMO });
  steps.push({
    type: 'dialogue',
    lines: [line('beaver', 'Now you try. Listen for on or next to.', 'd-b-try')],
  });

  // 推车听辨：4 道，关系平衡
  balancedRelations(4).forEach((relation) => steps.push(bookQuiz('cart', relation)));

  steps.push({
    type: 'dialogue',
    lines: [line('beaver', 'You are doing great!', 'd-b-great')],
  });

  // 换盒子新任务：2 道，换物件和布局，验证迁移
  steps.push({
    type: 'dialogue',
    lines: [
      line('beaver', 'Nice listening! Now let us use the box.', 'd-b-nice'),
      line('beaver', 'The words are the same: on, next to.', 'd-b-same'),
    ],
  });
  balancedRelations(2).forEach((relation) => steps.push(bookQuiz('box', relation)));

  // 开口借书
  steps.push({
    type: 'dialogue',
    lines: [line('beaver', 'Time to ask for the book. Say it with me.', 'd-b-ask')],
  });
  steps.push({
    type: 'speak',
    speakTitle: '对河狸馆员说',
    sentence: 'Can I check this out, please?',
    listenKey: 'ask-checkout',
    doneKey: 'beaver-done',
  });

  // 结尾告别：河狸把书递过来，交代还书日子，完成交接
  steps.push({
    type: 'dialogue',
    lines: [
      line('beaver', "Here you go. It's due on Friday.", 'd-b-didit'),
      line('rabbit', 'Thank you, Beaver! See you at the party!', 'd-r-thanks'),
      line('beaver', 'Have a great party!', 'd-b-bye'),
    ],
  });

  steps.push({ type: 'done', skillLabel: '方位听辨' });
  return steps;
}

// 本关需要预加载的全部音频 key
export const LIBRARY_AUDIO_KEYS = [
  'd-r-hi', 'd-b-hello', 'd-r-party',
  'd-b-on', 'd-b-next', 'd-b-try',
  'd-b-great', 'd-b-nice', 'd-b-same',
  'd-b-ask', 'd-b-didit', 'd-r-thanks', 'd-b-bye',
  'tap-book', 'tap-cart',
  'demo-on-cart', 'demo-next-cart',
  'tap-on-cart', 'tap-on-box', 'tap-next-cart', 'tap-next-box',
  'ask-checkout', 'beaver-done',
];

// ===== 第二关：面包店，听辨数量 one / two，复用 next to =====
function countQuiz(answer) {
  return {
    type: 'quiz',
    scene: 'bakery-count',
    answer,
    picks: ['one', 'two'],
    audio: answer === 'one' ? 'one-roll' : 'two-roll',
    caption: answer === 'one' ? 'One roll.' : 'Two rolls.',
    goodTip: '选对啦！',
    badTip: '数量不对，再听一次，注意听数字。',
    help: [
      { step: 'one', audio: 'one-roll' },
      { step: 'two', audio: 'two-roll' },
    ],
  };
}

export function buildBakeryRun() {
  const steps = [];

  // 到店打招呼
  steps.push({
    type: 'dialogue',
    lines: [
      line('rabbit', 'Hello! I need some food for the party.', 'd-r-food'),
      line('baker', 'Hi, little rabbit! What would you like?', 'd-bak-hi'),
    ],
  });

  // 词义确认：用完整词组，分清一个面包卷和一条面包
  steps.push({
    type: 'check', target: 'roll', options: ['roll', 'bread'],
    audio: 'tap-bread-roll', caption: 'a bread roll', skill: 'word',
  });
  steps.push({
    type: 'check', target: 'bread', options: ['roll', 'bread'],
    audio: 'tap-loaf-bread', caption: 'a loaf of bread', skill: 'word',
  });

  // 小兔说明要买面包卷，面包师问买一个还是两个
  steps.push({
    type: 'dialogue',
    lines: [
      line('rabbit', 'I would like a bread roll for the party.', 'd-r-wantrolls'),
      line('baker', 'One or two? Listen for the number.', 'd-bak-howmany'),
    ],
  });

  // 数量示范
  steps.push({
    type: 'demo', holder: 'roll',
    sequence: [
      { step: 'one', audio: 'one-roll' },
      { step: 'two', audio: 'two-roll' },
    ],
  });
  steps.push({
    type: 'dialogue',
    lines: [line('baker', 'Now you try. Listen for the number.', 'd-bak-try')],
  });

  // 数量听辨：one 和 two 各一道，顺序随机，答对就真把对应数量装进袋子
  shuffle(['one', 'two']).forEach((c) => steps.push(countQuiz(c)));

  // 旧知识 next to：拿放在篮子旁的纸袋
  steps.push({
    type: 'dialogue',
    lines: [line('baker', 'Now take the paper bag. It is next to the basket.', 'd-bak-bag')],
  });
  steps.push({
    type: 'quiz', scene: 'bakery-bag',
    holder: 'basket', answer: 'next', picks: ['on', 'next'],
    audio: 'bag-next-basket',
    caption: 'Tap the bag next to the basket.',
    goodTip: '拿到袋子啦！',
    badTip: '再听一次，注意 next to。',
    help: [{ step: 'next', audio: 'bag-next-basket' }],
  });

  // 开口点单
  steps.push({
    type: 'dialogue',
    lines: [line('baker', 'Now order with me.', 'd-bak-say')],
  });
  steps.push({
    type: 'speak',
    sentence: 'Two rolls, please.',
    listenKey: 'say-two-rolls',
    doneKey: 'bak-done',
  });

  // 结尾
  steps.push({
    type: 'dialogue',
    lines: [
      line('baker', 'Here you are. Two rolls!', 'd-bak-here'),
      line('rabbit', 'Thank you! See you at the party!', 'd-r-thanks2'),
      line('baker', 'Bye! Have fun.', 'd-bak-bye'),
    ],
  });

  steps.push({ type: 'done', skillLabel: '数量听辨' });
  return steps;
}

export const BAKERY_AUDIO_KEYS = [
  'd-r-food', 'd-bak-hi', 'd-r-wantrolls', 'd-bak-howmany',
  'd-bak-try', 'd-bak-bag', 'd-bak-say', 'd-bak-here', 'd-r-thanks2', 'd-bak-bye',
  'tap-bread-roll', 'tap-loaf-bread', 'one-roll', 'two-roll', 'bag-next-basket',
  'say-two-rolls', 'bak-done',
];

// ===== 第三关：小镇路口，两个真实路口连起来，听方向走过去 =====
export function buildCrossingRun() {
  const steps = [];

  // 到路口问路
  steps.push({
    type: 'dialogue',
    lines: [
      line('rabbit', 'Excuse me. How do I get to the party?', 'd-r-excuse'),
      line('guide', 'Hello! I can help you. At the crossing, you can turn left, turn right, or go straight.', 'd-g-hi'),
    ],
  });

  // 先认识三个方向词
  steps.push({
    type: 'dialogue',
    lines: [
      line('guide', 'Turn left.', 'd-g-left'),
      line('guide', 'Turn right.', 'd-g-right'),
      line('guide', 'Go straight.', 'd-g-straight'),
    ],
  });

  // 出发前先拿地图：长椅上的 on / next to 复习，关系随机
  steps.push({
    type: 'dialogue',
    lines: [line('guide', 'You need a map first. Listen where it is.', 'd-g-bench')],
  });
  const benchRel = Math.random() < 0.5 ? 'on' : 'next';
  steps.push({
    type: 'quiz',
    scene: 'crossing-bench',
    answer: benchRel,
    picks: ['on', 'next'],
    audio: benchRel === 'on' ? 'map-on-bench' : 'map-next-bench',
    caption: benchRel === 'on'
      ? 'Tap the map on the bench.'
      : 'Tap the map next to the bench.',
    goodTip: '拿到地图啦！',
    badTip: '再听一次，注意听 on 还是 next to。',
    help: [
      { step: 'on', audio: 'map-on-bench' },
      { step: 'next', audio: 'map-next-bench' },
    ],
  });

  // 第一段路线：在中心路口听一个方向，走对就到第二个路口
  steps.push({
    type: 'dialogue',
    lines: [line('guide', 'Now follow the map. At the first crossing, listen carefully.', 'd-g-try')],
  });
  steps.push({
    type: 'route',
    stage: 'first',
    skill: 'direction',
    wrongAudio: 'dir-wrong-way',
    goodTip: '对啦，走这条路！',
    badTip: '不是这条路，回来再听一次。',
  });

  // 第二段路线：在第二个路口再听一个方向，走对就到终点、点亮派对
  steps.push({
    type: 'route',
    stage: 'second',
    skill: 'direction',
    wrongAudio: 'dir-wrong-way',
    goodTip: '到啦，前面就是派对！',
    badTip: '不是这条路，回来再听一次。',
  });

  // 自愿跟读：对向导说一句方向
  steps.push({
    type: 'dialogue',
    lines: [line('guide', 'Now say it with me.', 'd-g-say')],
  });
  steps.push({
    type: 'speak',
    speakTitle: '对河狸向导说',
    sentence: 'Go straight, please.',
    listenKey: 'say-go-straight',
    doneKey: 'cross-done',
  });

  // 结尾：向导确认目的地
  steps.push({
    type: 'dialogue',
    lines: [
      line('guide', 'You made it! There is the party.', 'd-g-here'),
      line('rabbit', 'Thank you! See you at the party!', 'd-r-thanks3'),
      line('guide', 'Bye! See you there.', 'd-g-bye'),
    ],
  });

  steps.push({ type: 'done', skillLabel: '方向听辨' });
  return steps;
}

export const CROSSING_AUDIO_KEYS = [
  'd-r-excuse', 'd-g-hi', 'd-g-left', 'd-g-right', 'd-g-straight',
  'd-g-bench', 'd-g-try', 'd-g-say', 'd-g-here', 'd-r-thanks3', 'd-g-bye',
  'dir-left', 'dir-right', 'dir-straight',
  'map-on-bench', 'map-next-bench', 'dir-wrong-way',
  'say-go-straight', 'cross-done',
];

// ===== 第四关：超市采购，按派对清单做两步，东西真放进篮子 =====
// 预设的购物清单：每次随机选一个，孩子靠背没用
const MARKET_LISTS = [
  { first: 'apple', then: 'milk' },
  { first: 'milk', then: 'cheese' },
  { first: 'egg', then: 'apple' },
  { first: 'cheese', then: 'milk' },
];
const MARKET_ITEMS = ['apple', 'milk', 'cheese', 'egg'];

export function buildMarketRun() {
  const steps = [];

  // 开场
  steps.push({
    type: 'dialogue',
    lines: [
      line('rabbit', 'Hello!', 'd-r-hi2'),
      line('clerk', 'Hi there! Welcome to the market.', 'd-c-hi'),
      line('clerk', 'Here is your party list. We take two things in order.', 'd-c-order'),
    ],
  });

  // 词义确认：从 4 样里随机挑 2 样先认识
  shuffle(MARKET_ITEMS.slice()).slice(0, 2).forEach((it) => {
    steps.push({
      type: 'check',
      target: it,
      options: MARKET_ITEMS,
      audio: 'tap-' + it,
      caption: it,
      skill: 'word',
    });
  });

  // 这次的清单和引导
  const shop = MARKET_LISTS[Math.floor(Math.random() * MARKET_LISTS.length)];
  steps.push({
    type: 'dialogue',
    lines: [
      line('clerk', "Listen for first and then, and put them in the basket.", 'd-c-try'),
    ],
  });

  // 两步采购：4 样都在台面上，位置随机打乱，选对一样就真放进篮子
  steps.push({
    type: 'sequence',
    scene: 'market-shop',
    first: shop.first,
    then: shop.then,
    picks: shuffle(MARKET_ITEMS.slice()),
    audio: 'seq-' + shop.first + '-' + shop.then,
    caption: 'First, take the ' + shop.first + '. Then, take the ' + shop.then + '.',
    firstPrompt: '先听，点清单上的第一个。',
    thenPrompt: '第一个进篮子啦，再点第二个。',
    goodTip: '两样都进篮子啦！',
    badTip: '这个不对，再听一次。',
  });

  // 旧知识复现：方位 on / next，商品在货架上
  steps.push({
    type: 'quiz',
    scene: 'market-shelf',
    holder: 'shelf',
    answer: 'on',
    picks: ['on', 'next'],
    audio: 'shelf-on-quiz',
    caption: 'The apples are on the shelf.',
    goodTip: '对，在货架上！',
    badTip: '再听一次，注意 on。',
    help: [{ step: 'on', audio: 'shelf-on-quiz' }],
  });

  // 开口
  steps.push({
    type: 'dialogue',
    lines: [
      line('clerk', 'Now say it with me.', 'd-c-say'),
    ],
  });
  steps.push({
    type: 'speak',
    speakTitle: '对河狸店员说',
    sentence: 'First, take the apples, please.',
    listenKey: 'say-first-then',
    doneKey: 'market-done',
  });

  // 结尾：店员确认篮子里的东西
  steps.push({
    type: 'dialogue',
    lines: [
      line('clerk', 'Here are your things. Great job!', 'd-c-here'),
      line('rabbit', 'Thank you! See you at the party!', 'd-r-thanks4'),
      line('clerk', 'Bye! See you there.', 'd-c-bye'),
    ],
  });

  steps.push({ type: 'done', skillLabel: '顺序听辨' });
  return steps;
}

export const MARKET_AUDIO_KEYS = [
  'd-r-hi2', 'd-c-hi', 'd-c-order', 'd-c-try', 'd-c-say', 'd-c-here',
  'd-r-thanks4', 'd-c-bye',
  'tap-apple', 'tap-milk', 'tap-cheese', 'tap-egg',
  'seq-apple-milk', 'seq-milk-cheese', 'seq-egg-apple', 'seq-cheese-milk',
  'shelf-on-quiz', 'say-first-then', 'market-done',
];

// ===== 第五关：生日派对（河狸过生日，把前面的话用出来） =====
export function buildPartyRun() {
  const steps = [];

  // 开场：先交代今天是河狸的生日
  steps.push({
    type: 'dialogue',
    lines: [
      line('rabbit', 'Hello! Happy birthday, Beaver!', 'd-r-hi3'),
      line('host', 'Welcome! Today is my birthday. Thank you for coming.', 'd-h-hi'),
      line('host', 'A few little jobs first. Listen carefully.', 'd-h-tasks'),
    ],
  });

  // 1. 方位：把书放在桌上（on / next）
  steps.push({
    type: 'quiz',
    scene: 'party-book',
    holder: 'table',
    answer: 'on',
    picks: ['on', 'next'],
    audio: 'p-book-on',
    caption: 'Put the book on the table.',
    goodTip: '书放好啦！',
    badTip: '再听一次，注意 on。',
    help: [{ step: 'on', audio: 'p-book-on' }],
  });

  // 2. 数量：拿两个气球（one / two）
  steps.push({
    type: 'quiz',
    scene: 'party-balloons',
    answer: 'two',
    picks: ['one', 'two'],
    audio: 'p-balloons-two',
    caption: 'Take two balloons.',
    goodTip: '两个气球！',
    badTip: '再听一次，注意 two。',
    help: [{ step: 'two', audio: 'p-balloons-two' }],
  });

  // 3. 方向：走向蛋糕（left / right / straight）
  steps.push({
    type: 'quiz',
    scene: 'party-direction',
    answer: 'straight',
    picks: ['left', 'right', 'straight'],
    audio: 'p-go-cake',
    caption: 'Go straight to the cake.',
    goodTip: '走到蛋糕啦！',
    badTip: '再听一次，注意 straight。',
    help: [{ step: 'straight', audio: 'p-go-cake' }],
  });

  // 4. 顺序：先把礼物放到蛋糕旁，再点蜡烛；礼物会真移过去
  steps.push({
    type: 'sequence',
    scene: 'party-candle',
    first: 'gift',
    then: 'candle',
    picks: ['gift', 'candle'],
    audio: 'p-gift-candle',
    caption: 'First, put the present next to the cake. Then, light the candle.',
    firstPrompt: '先听，点礼物，把它放到蛋糕旁。',
    thenPrompt: '礼物放好啦，再点蜡烛。',
    goodTip: '礼物和蜡烛都好啦！',
    badTip: '这个不对，再听一次。',
  });

  // 开口：对河狸说生日祝福
  steps.push({
    type: 'dialogue',
    lines: [
      line('host', 'Now let us sing together.', 'd-h-sing'),
    ],
  });
  steps.push({
    type: 'speak',
    speakTitle: '对河狸寿星说',
    sentence: 'Happy birthday, Beaver!',
    listenKey: 'say-happy-birthday',
    doneKey: 'party-done',
  });

  // 结尾：祝河狸生日快乐
  steps.push({
    type: 'dialogue',
    lines: [
      line('host', 'What a great birthday! Thank you.', 'd-h-here'),
      line('rabbit', 'Happy birthday, Beaver! See you soon!', 'd-r-thanks5'),
      line('host', 'Bye bye!', 'd-h-bye'),
    ],
  });

  steps.push({ type: 'done', skillLabel: '综合听辨' });
  return steps;
}

export const PARTY_AUDIO_KEYS = [
  'd-r-hi3', 'd-h-hi', 'd-h-tasks', 'd-h-sing', 'd-h-here',
  'd-r-thanks5', 'd-h-bye', 'p-book-on', 'p-balloons-two', 'p-go-cake',
  'p-gift-candle', 'say-happy-birthday', 'party-done',
];
