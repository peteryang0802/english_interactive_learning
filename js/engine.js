// 任务引擎：纯逻辑，不依赖 Three.js。3D 和 HTML 图卡视图都由它驱动。
// 负责世代令牌、定时器生命周期、逐题学习记录、对话自动推进、开口与结算。
// 计分规矩：首播完整播完才确认；听的过程中可以预选，不计分。
// 结果分四类：independent 完整首播后首对 / after-replay 重听或答错后 /
// with-hint 看字幕或示范后 / after-error 音频故障后。

import * as audio from './audio-manager.js';
import { DIRS, FIRST_NODE, neighbor, secondChoices } from './route-graph.js';

const SPEAKER_NAME = {
  beaver: '河狸馆员', rabbit: '小兔',
  baker: '面包师', guide: '河狸向导', clerk: '河狸店员', host: '河狸主人',
};

const SKILL_LABELS = {
  word: '词义', place: '方位', count: '数量',
  direction: '方向', order: '顺序', other: '其他',
};

// 步骤没显式标 skill 时，按类型和场景推断它考的能力
function inferSkill(step) {
  if (step.skill) return step.skill;
  if (step.type === 'check') return 'word';
  if (step.type === 'route') return 'direction';
  if (step.type === 'sequence') return 'order';
  if (step.type === 'quiz') {
    const s = step.scene || '';
    if (s.includes('count') || s.includes('balloons')) return 'count';
    if (s.includes('dir')) return 'direction';
    return 'place';
  }
  return 'other';
}

export function createEngine({ els, view, onPersist, onFinish, onStep, config = {} }) {
  let steps = [];
  let stepIndex = 0;
  let stepToken = 0;
  let disposed = false;
  let inputLocked = false;

  let currentLines = [];
  let lineIndex = 0;
  let dialogueCaptionOn = false;
  let dialoguePaused = false;
  let currentSpeak = null;
  let seqStage = 'first';   // sequence 题当前进行到 first 还是 then
  let seqDoneFirst = false; // sequence 题第一步是否已完成

  // route 两段路线状态
  let routeNode = FIRST_NODE;  // 当前决策节点
  let routeStage = 'first';    // first / second
  let routeAnswer = null;      // 本段正确方向
  let routeBusy = false;       // 移动/折返中，锁住输入

  const timers = new Set();
  const questionRecords = [];
  let cur = null;

  // ===== 定时器：全部登记，离开 / 切题即清 =====
  function later(fn, ms) {
    const t = setTimeout(() => { timers.delete(t); if (!disposed) fn(); }, ms);
    timers.add(t);
    return t;
  }
  function clearTimers() {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
  }

  function setTip(text, kind) {
    els.tip.textContent = text;
    els.tip.className = 'tip' + (kind ? ' ' + kind : '');
  }

  function closeModals() {
    els.speakModal.hidden = true;
    els.doneModal.hidden = true;
  }

  function captionText(step) {
    return step ? step.caption : '';
  }

  // ===== 音频状态订阅：按钮三态 + 首播结束处理 + 出错兜底 =====
  const unsub = audio.subscribe((st) => {
    if (disposed) return;
    syncAudioButton(st);
    if (st.status === 'ended') handleAudioEnded();
    if (st.status === 'error') {
      if (cur) cur.hadError = true;
      setTip('声音没出来，可点「重试」，或点「看字幕」继续。', 'bad');
    }
  });

  function syncAudioButton(st) {
    const map = { loading: '加载中…', playing: '播放中', ended: '再听一次', error: '重试' };
    if (!els.replayBtn.hidden && map[st.status]) els.replayBtn.textContent = map[st.status];
  }

  // 首播自然结束：对话自动接下一句；答题则确认预选或提示作答
  function handleAudioEnded() {
    const step = steps[stepIndex];
    if (!step) return;
    if (step.type === 'dialogue') {
      if (!dialoguePaused) later(advanceDialogue, 350);
      return;
    }
    if (cur && cur.confirmed) return;
    if (cur && cur.preselect != null) {
      later(() => { if (!cur.confirmed) confirmAnswer(cur.preselect); }, 250);
    } else if (cur) {
      setTip('听完啦，现在点你听到的。', '');
    }
  }

  // ===== 启动关卡；startIndex 用于从存档题号继续 =====
  function start(runSteps, startIndex = 0) {
    steps = runSteps;
    stepIndex = Math.max(0, Math.min(startIndex, runSteps.length - 1));
    view.onAction(handleAction);
    renderStep();
  }

  // ===== 进度文本 =====
  function renderProgress() {
    els.progress.textContent = '第 ' + (stepIndex + 1) + ' / ' + steps.length + ' 步';
  }

  // ===== 步骤分发 =====
  function renderStep() {
    stepToken++;
    inputLocked = false;
    routeBusy = false;
    clearTimers();
    closeModals();
    renderProgress();
    seqStage = 'first';
    seqDoneFirst = false;

    const step = steps[stepIndex];

    // 只有这道题真有示范序列才显示「看示范」，没有就藏起来，不摆无效按钮
    if (els.demoBtn) {
      const hasHelp = Array.isArray(step.help) && step.help.length > 0;
      els.demoBtn.hidden = !hasHelp;
    }

    dialogueCaptionOn = false;
    dialoguePaused = false;
    els.enLine.hidden = true;
    els.captionBtn.textContent = '看字幕';

    const isDialogue = step.type === 'dialogue';
    els.dialogueBar.hidden = !isDialogue;
    els.controlBar.hidden = isDialogue;
    els.dialogueCaption.textContent = '看字幕';

    if (step.type === 'dialogue') renderDialogue(step);
    else if (step.type === 'check') renderCheck(step);
    else if (step.type === 'quiz') renderQuiz(step);
    else if (step.type === 'route') renderRoute(step);
    else if (step.type === 'sequence') renderSequence(step);
    else if (step.type === 'demo') runSequence(step.holder, step.sequence, false);
    else if (step.type === 'speak') openSpeak(step);
    else if (step.type === 'done') openDone(step);

    // 把当前题号回传给外层存档，刷新或退出后能从这道题继续
    // done 步骤已在 openDone 里清掉中途题号，这里不能再写回
    if (step.type !== 'done' && typeof onStep === 'function') onStep(stepIndex);
  }

  // ===== 剧情对话：默认只听，播完自动接下一句 =====
  function renderDialogue(step) {
    currentLines = step.lines;
    lineIndex = 0;
    els.controlBar.hidden = true;
    els.dialogueBar.hidden = false;
    setTip('', '');
    showDialogueLine();
  }

  function showDialogueLine() {
    const ln = currentLines[lineIndex];
    els.speaker.hidden = false;
    els.speakerAvatar.className = 'avatar avatar--' + ln.speaker;
    els.speakerName.textContent = SPEAKER_NAME[ln.speaker] || ln.speaker;
    dialogueCaptionOn = false;
    els.dialogueCaption.textContent = '看字幕';
    els.dialogueNext.textContent = lineIndex === currentLines.length - 1 ? '继续' : '跳过';
    audio.play(ln.audio);
  }

  function advanceDialogue() {
    if (lineIndex < currentLines.length - 1) {
      lineIndex++;
      showDialogueLine();
    } else {
      els.dialogueBar.hidden = true;
      advance();
    }
  }

  // ===== 每道题的记录 =====
  function beginQuestion(step) {
    cur = {
      type: step.type,
      skill: inferSkill(step),
      target: step.target,
      answer: step.answer,
      first: step.first,
      then: step.then,
      firstTryCorrect: null,
      replays: 0,          // 主动重听次数
      wrongAttempts: 0,    // 答错次数（含自动重播）
      usedCaption: false,
      usedDemo: false,
      hadError: false,
      preselect: null,     // 首播中的预选
      confirmed: false,
      // 顺序题错误细分
      firstStepWrong: false,
      secondStepWrong: false,
      orderReversed: false,
      completion: null,
    };
    questionRecords.push(cur);
  }

  function renderCheck(step) {
    beginQuestion(step);
    view.showCheck(step);
    setTip(step.prompt || '听完，点你听到的东西。', '');
    audio.play(step.audio);
  }

  function renderQuiz(step) {
    beginQuestion(step);
    view.showQuiz(step);
    setTip(step.prompt || '听完，点对的那个。', '');
    audio.play(step.audio);
  }

  // 连续两步题：先 first 再 then，视图展示多个候选
  function renderSequence(step) {
    beginQuestion(step);
    view.showSequence(step);
    setTip(step.firstPrompt || '先听，按顺序点第一个。', '');
    audio.play(step.audio);
  }

  // 路线方向题：在当前决策路口随机定一个正确方向，视图放三方向旗
  function renderRoute(step) {
    beginQuestion(step);
    routeStage = step.stage || 'first';
    if (routeStage === 'first') {
      routeNode = FIRST_NODE;
      routeAnswer = DIRS[Math.floor(Math.random() * DIRS.length)];
    } else {
      const choices = secondChoices(routeNode);
      routeAnswer = choices[Math.floor(Math.random() * choices.length)];
    }
    if (view.routeSetNode) view.routeSetNode(routeNode);
    view.showRoute(step);
    setTip(step.prompt || '听完，点那面旗。', '');
    // 正确方向运行时才定，音频按方向播 dir-left/right/straight
    audio.play('dir-' + routeAnswer);
  }

  // 只有满足：首播完整结束、或看了提示、或重听过、或错过、或故障，才允许确认
  function canConfirmNow() {
    const hasHint = cur.usedCaption || cur.usedDemo;
    return audio.audioState.firstPlayEnded || hasHint ||
      cur.replays > 0 || cur.wrongAttempts > 0 || cur.hadError;
  }

  function classify(r) {
    if (r.hadError) return 'after-error';
    if (r.usedCaption || r.usedDemo) return 'with-hint';
    if (r.replays > 0 || r.wrongAttempts > 0) return 'after-replay';
    return 'independent';
  }

  // ===== 视图上报的点击：首播中只预选，之后才确认 =====
  function handleAction(pos) {
    const step = steps[stepIndex];
    if (!step || inputLocked || routeBusy) return;
    if (step.type !== 'check' && step.type !== 'quiz' &&
      step.type !== 'sequence' && step.type !== 'route') return;
    const hasHint = cur.usedCaption || cur.usedDemo;
    // 声音完全没开始，先要求听或看提示
    if (!audio.audioState.played && audio.audioState.status !== 'ended' && !hasHint) {
      setTip('先听，点「再听一次」，或点「看字幕」。', 'bad');
      return;
    }
    if (!canConfirmNow()) {
      // 首播还在进行：只记预选，轻量高亮，不判对错、不推进
      cur.preselect = pos;
      if (view.clearMarks) view.clearMarks('preselect');
      if (view.mark) view.mark(pos, 'preselect');
      setTip('先记住，听完再确认。', '');
      return;
    }
    confirmAnswer(pos);
  }

  // 正式判定入口：清掉旧红底，再按题型判
  function confirmAnswer(pos) {
    if (view.clearMarks) view.clearMarks('wrong');
    if (cur.type === 'route') confirmRoute(pos);
    else if (cur.type === 'sequence') confirmSequence(pos);
    else confirmSingle(pos);
  }

  // check / quiz 单点判定
  function confirmSingle(pos) {
    const step = steps[stepIndex];
    const correct = step.type === 'check' ? pos === step.target : pos === step.answer;
    if (correct) {
      cur.confirmed = true;
      if (cur.firstTryCorrect === null) cur.firstTryCorrect = true;
      inputLocked = true;
      cur.completion = classify(cur);
      view.mark(pos, 'correct');
      // 面包店数量题：听对数字，真把对应个数的面包卷装进袋子
      if (step.scene === 'bakery-count' && view.packRoll) {
        view.packRoll(step.answer === 'one' ? 1 : 2);
      }
      setTip(step.goodTip || '对啦！', 'good');
      later(advance, step.type === 'quiz' ? 850 : 700);
    } else {
      if (cur.firstTryCorrect === null) cur.firstTryCorrect = false;
      cur.wrongAttempts++;
      view.mark(pos, 'wrong');
      setTip(step.badTip || '这个不对，再听一次，注意听清楚。', 'bad');
      audio.play(step.audio);
    }
  }

  // route 方向判定：选对真走到下一路口/终点，走错走到错处再折返回当前路口重听
  function confirmRoute(pos) {
    const step = steps[stepIndex];
    if (pos === routeAnswer) {
      cur.confirmed = true;
      if (cur.firstTryCorrect === null) cur.firstTryCorrect = true;
      routeBusy = true;
      inputLocked = true;
      cur.completion = classify(cur);
      view.mark(pos, 'correct');
      const target = view.routeWalk(pos);
      setTip(step.goodTip || '对啦，走这条路！', 'good');
      if (routeStage === 'first') {
        // 走到第二路口，接着进第二段
        later(() => { routeNode = target; advance(); }, 1000);
      } else {
        // 走到终点，点亮派对，再往下走
        later(() => {
          view.routeParty(target);
          later(advance, 1500);
        }, 1000);
      }
      return;
    }
    // 走错：先走到错处，播提示，再折返回当前路口重听
    if (cur.firstTryCorrect === null) cur.firstTryCorrect = false;
    cur.wrongAttempts++;
    routeBusy = true;
    inputLocked = true;
    view.mark(pos, 'wrong');
    setTip(step.badTip || '不是这条路，回来再听一次。', 'bad');
    view.routeWalk(pos);
    if (step.wrongAudio) audio.play(step.wrongAudio);
    later(() => {
      view.routeReturn(routeNode);
      later(() => {
        routeBusy = false;
        inputLocked = false;
        audio.play('dir-' + routeAnswer);
      }, 1000);
    }, 1100);
  }

  // sequence 两阶段判定
  function confirmSequence(pos) {
    const step = steps[stepIndex];
    if (seqStage === 'first') {
      if (pos === step.first) {
        if (cur.firstTryCorrect === null) cur.firstTryCorrect = true;
        seqStage = 'then';
        seqDoneFirst = true;
        cur.preselect = null;
        if (view.clearMarks) view.clearMarks('preselect');
        view.mark(pos, 'done');
        // 超市采购：选对第一样，真放进购物篮
        if (step.scene === 'market-shop' && view.basketAdd) view.basketAdd(step.first);
        // 派对：选对礼物，真移到蛋糕旁
        if (step.scene === 'party-candle' && view.moveGiftToCake) view.moveGiftToCake();
        setTip(step.thenPrompt || '第一个对啦，再点第二个。', 'good');
      } else {
        cur.firstTryCorrect = false;
        cur.wrongAttempts++;
        cur.firstStepWrong = true;
        if (pos === step.then) cur.orderReversed = true;
        view.mark(pos, 'wrong');
        setTip(step.badTip || '这个不对，再听一次。', 'bad');
        audio.play(step.audio);
      }
      return;
    }
    // 第二步
    if (pos === step.first) {
      setTip('这个已经拿过啦，点第二个。', 'bad');
      return;
    }
    if (pos === step.then) {
      cur.confirmed = true;
      inputLocked = true;
      cur.completion = classify(cur);
      view.mark(pos, 'correct');
      // 超市采购：第二样也进篮子
      if (step.scene === 'market-shop' && view.basketAdd) view.basketAdd(step.then);
      setTip(step.goodTip || '两步都对啦！', 'good');
      later(advance, 900);
    } else {
      cur.wrongAttempts++;
      cur.secondStepWrong = true;
      view.mark(pos, 'wrong');
      setTip(step.badTip || '第二个不对，再听一次。', 'bad');
      audio.play(step.audio);
    }
  }

  function advance() {
    const next = stepIndex + 1;
    if (next >= steps.length) { stepIndex = steps.length - 1; return; }
    stepIndex = next;
    renderStep();
  }

  // ===== 动作示范：通用动作序列，音画对齐 =====
  function waitForEnded() {
    const token = stepToken;
    return new Promise((resolve) => {
      const off = audio.subscribe((st) => {
        if (token !== stepToken) { off(); resolve(false); return; }
        if (st.status === 'ended' || st.status === 'error') {
          off(); resolve(st.status === 'ended');
        }
      });
    });
  }

  async function runSequence(holder, sequence, isHelp) {
    const token = stepToken;
    if (isHelp && cur) cur.usedDemo = true;
    if (view.prepareDemo && holder) view.prepareDemo(holder);
    if (view.demoStep) {
      for (const item of sequence) {
        view.demoStep(item.step);
        audio.play(item.audio);
        await waitForEnded();
        if (token !== stepToken) return;
        // 音频出错也容错继续，不卡住整个示范
      }
    }
    if (!isHelp) later(advance, 400);
  }

  // ===== 开口（自愿跟读）=====
  function openSpeak(step) {
    currentSpeak = step;
    els.speakEn.textContent = step.sentence;
    if (els.speakTitle) {
      els.speakTitle.textContent = step.speakTitle || config.speakTitle || '跟读练习';
    }
    if (els.speakDone) els.speakDone.textContent = '我练过了';
    els.speakModal.hidden = false;
    setTip(step.prompt || '自愿跟读，练完点「我练过了」就行。', '');
    // 焦点移入弹窗，配合 main 的 Tab 陷阱，不让焦点走到背后
    later(() => {
      if (els.speakModal && els.speakModal.querySelector) {
        const btn = els.speakModal.querySelector('#speak-done');
        if (btn) btn.focus();
      }
    }, 0);
  }

  // ===== 结算：按能力分组的家长报告 =====
  function emptyBucket() {
    return { total: 0, independent: 0, afterReplay: 0, withHint: 0, afterError: 0 };
  }

  function buildSummary() {
    const bySkill = {};
    let replays = 0, wrongAttempts = 0;
    const orderDetail = { firstStepWrong: 0, secondStepWrong: 0, orderReversed: 0 };

    questionRecords.forEach((r) => {
      const key = r.skill || 'other';
      if (!bySkill[key]) bySkill[key] = emptyBucket();
      const b = bySkill[key];
      b.total++;
      if (r.completion === 'independent') b.independent++;
      else if (r.completion === 'after-replay') b.afterReplay++;
      else if (r.completion === 'with-hint') b.withHint++;
      else if (r.completion === 'after-error') b.afterError++;
      replays += r.replays;
      wrongAttempts += r.wrongAttempts;
      if (r.firstStepWrong) orderDetail.firstStepWrong++;
      if (r.secondStepWrong) orderDetail.secondStepWrong++;
      if (r.orderReversed) orderDetail.orderReversed++;
    });

    return {
      total: questionRecords.length,
      bySkill,
      replays,
      wrongAttempts,
      orderDetail,
    };
  }

  function openDone(step) {
    const s = buildSummary();
    // 结果页显示之前，先一次性把完成状态、道具、解锁写入存档
    if (typeof onPersist === 'function') {
      try { onPersist(s); } catch (e) { /* 存储内部已降级，不阻断结算 */ }
    }
    if (els.doneTitle) els.doneTitle.textContent = step.doneTitle || config.doneTitle || '完成啦';

    let html = '';
    Object.keys(s.bySkill).forEach((key) => {
      const b = s.bySkill[key];
      html += '<p class="report-skill">' + (SKILL_LABELS[key] || key) + '共 ' + b.total + ' 道：</p>' +
        '<p>完整首播后首次答对 ' + b.independent + ' 道</p>' +
        '<p>重听或答错后答对 ' + b.afterReplay + ' 道</p>' +
        '<p>看字幕或示范后做对 ' + b.withHint + ' 道</p>' +
        '<p>音频故障后完成 ' + b.afterError + ' 道</p>';
    });
    // 顺序题错误细分（有数据才显示）
    const od = s.orderDetail;
    if (od.firstStepWrong || od.secondStepWrong || od.orderReversed) {
      html += '<p class="report-skill">顺序题问题：第一步错 ' + od.firstStepWrong +
        ' 次、第二步错 ' + od.secondStepWrong + ' 次、两步顺序弄反 ' + od.orderReversed + ' 次</p>';
    }
    html += '<p class="report-extra">主动重听 ' + s.replays + ' 次，答错 ' + s.wrongAttempts + ' 次</p>';
    els.report.innerHTML = html;

    // 结算时收起答题控制条、对话条和说话人，停掉还在响的音频
    if (els.controlBar) els.controlBar.hidden = true;
    if (els.dialogueBar) els.dialogueBar.hidden = true;
    if (els.speaker) els.speaker.hidden = true;
    audio.stop();
    els.doneModal.hidden = false;
  }

  // ===== 供 UI 按钮调用的方法 =====
  const api = {
    start,
    async replay() {
      const step = steps[stepIndex];
      if (step && cur) cur.replays++;
      const key = step.audio;
      if (key && audio.audioState.status === 'error') {
        await audio.retry(key);
      } else {
        audio.play(key);
      }
    },
    toggleCaption() {
      const step = steps[stepIndex];
      if (step.type !== 'quiz' && step.type !== 'check' &&
        step.type !== 'sequence' && step.type !== 'route') return;
      if (!els.enLine.hidden) {
        els.enLine.hidden = true;
        els.captionBtn.textContent = '看字幕';
        return;
      }
      if (cur) cur.usedCaption = true;
      els.enLine.textContent = captionText(step);
      els.enLine.hidden = false;
      els.captionBtn.textContent = '藏字幕';
    },
    helpDemo() {
      const step = steps[stepIndex];
      if (cur && step && step.help) runSequence(step.holder, step.help, true);
    },
    nextLine() {
      audio.stop();
      advanceDialogue();
    },
    prevLine() {
      // 回听上一句对话
      if (lineIndex > 0) {
        lineIndex--;
        showDialogueLine();
      } else {
        audio.stop();
        audio.play(currentLines[0].audio);
      }
    },
    togglePause() {
      dialoguePaused = !dialoguePaused;
      return dialoguePaused;
    },
    replayLine() {
      audio.play(currentLines[lineIndex].audio);
    },
    toggleDialogueCaption() {
      const ln = currentLines[lineIndex];
      dialogueCaptionOn = !dialogueCaptionOn;
      if (dialogueCaptionOn) {
        els.enLine.textContent = ln.en;
        els.enLine.hidden = false;
        els.dialogueCaption.textContent = '藏字幕';
      } else {
        els.enLine.hidden = true;
        els.dialogueCaption.textContent = '看字幕';
      }
    },
    speakListen() {
      // 再听一遍跟读示范句
      if (currentSpeak && currentSpeak.listenKey) audio.play(currentSpeak.listenKey);
    },
    speakDone() {
      // 自愿跟读：练完点「我练过了」，角色给一句贴合场景的回应再往下走
      els.speakModal.hidden = true;
      let moved = false;
      const move = () => { if (!moved) { moved = true; advance(); } };
      if (currentSpeak && currentSpeak.doneKey) {
        audio.play(currentSpeak.doneKey);
        const off = audio.subscribe((st) => {
          if (st.status === 'ended' || st.status === 'error') { off(); later(move, 200); }
        });
        later(move, 4000);
      } else {
        later(move, 300);
      }
    },
    speakSkip() {
      els.speakModal.hidden = true;
      advance();
    },
    // 中途换视图（3D↔平面）：替换视图引用，重画当前题候选，不丢记录、不重播
    setView(newView) {
      view = newView;
      view.onAction(handleAction);
      const step = steps[stepIndex];
      if (!step) return;
      if (step.type === 'check') view.showCheck(step);
      else if (step.type === 'quiz') view.showQuiz(step);
      else if (step.type === 'route') {
        if (view.routeSetNode) view.routeSetNode(routeNode);
        view.showRoute(step);
      }
      else if (step.type === 'sequence') view.showSequence(step);
      // 顺序题第一步已完成，给新视图补上完成标记
      if (step.type === 'sequence' && seqDoneFirst && view.mark) view.mark(step.first, 'done');
    },
    doneContinue() {
      onFinish(buildSummary());
    },
    resetCamera() {
      if (view.resetCamera) view.resetCamera();
    },
    __debug() {
      const step = steps[stepIndex];
      return {
        stepIndex, total: steps.length,
        type: step && step.type, skill: step && inferSkill(step),
        target: step && step.target, answer: step && step.answer,
        first: step && step.first, then: step && step.then,
        seqStage, seqDoneFirst,
        routeStage, routeNode, routeAnswer, routeBusy,
        preselect: cur && cur.preselect,
        firstPlayEnded: audio.audioState.firstPlayEnded,
        records: questionRecords.map((r) => ({
          type: r.type, skill: r.skill,
          target: r.target, answer: r.answer,
          firstTry: r.firstTryCorrect, replays: r.replays,
          wrongAttempts: r.wrongAttempts,
          usedCaption: r.usedCaption, usedDemo: r.usedDemo,
          hadError: r.hadError, completion: r.completion,
          firstStepWrong: r.firstStepWrong, secondStepWrong: r.secondStepWrong,
          orderReversed: r.orderReversed,
        })),
      };
    },
    resize() { if (view.resize) view.resize(); },
    dispose() {
      disposed = true;
      clearTimers();
      unsub();
      audio.stop();
    },
  };

  return api;
}
