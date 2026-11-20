// 任务引擎：纯逻辑，不依赖 Three.js。3D 和 HTML 图卡视图都由它驱动。
// 负责世代令牌、定时器生命周期、逐题学习记录、对话自动推进、开口与结算。
// 通用化：每个步骤自带音频键、字幕、答案和演示序列，引擎不写死任何关卡内容。

import * as audio from './audio-manager.js';

const SPEAKER_NAME = { beaver: '河狸馆员', rabbit: '小兔', baker: '面包师', guide: '河狸路人' };

export function createEngine({ els, view, onPersist, onFinish, config = {} }) {
  let steps = [];
  let stepIndex = 0;
  let stepToken = 0;
  let disposed = false;
  let inputLocked = false;

  let currentLines = [];
  let lineIndex = 0;
  let dialogueCaptionOn = false;
  let currentSpeak = null;
  let seqStage = 'first';   // sequence 题当前进行到 first 还是 then
  let seqDoneFirst = false; // sequence 题第一步是否已完成

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

  // 步骤要播的音频键，统一从 step.audio 取
  function stepAudio(step) {
    return step ? step.audio : null;
  }
  function captionText(step) {
    return step ? step.caption : '';
  }

  // ===== 音频状态订阅：按钮三态 + 自动推进 + 出错兜底 =====
  const unsub = audio.subscribe((st) => {
    if (disposed) return;
    syncAudioButton(st);
    if (st.status === 'ended') handleAudioEnded();
    if (st.status === 'error') {
      setTip('声音没出来，可点「重试」，或点「看字幕」继续。', 'bad');
    }
  });

  function syncAudioButton(st) {
    const map = { loading: '加载中…', playing: '播放中', ended: '再听一次', error: '重试' };
    if (!els.replayBtn.hidden && map[st.status]) els.replayBtn.textContent = map[st.status];
  }

  function handleAudioEnded() {
    const step = steps[stepIndex];
    if (step && step.type === 'dialogue') later(advanceDialogue, 350);
  }

  // ===== 启动关卡 =====
  function start(runSteps) {
    steps = runSteps;
    stepIndex = 0;
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
    clearTimers();
    closeModals();
    renderProgress();
    seqStage = 'first';
    seqDoneFirst = false;

    const step = steps[stepIndex];
    dialogueCaptionOn = false;
    els.enLine.hidden = true;
    els.captionBtn.textContent = '看字幕';

    const isDialogue = step.type === 'dialogue';
    els.dialogueBar.hidden = !isDialogue;
    els.controlBar.hidden = isDialogue;
    els.dialogueCaption.textContent = '看字幕';

    if (step.type === 'dialogue') renderDialogue(step);
    else if (step.type === 'check') renderCheck(step);
    else if (step.type === 'quiz') renderQuiz(step);
    else if (step.type === 'sequence') renderSequence(step);
    else if (step.type === 'demo') runSequence(step.holder, step.sequence, false);
    else if (step.type === 'speak') openSpeak(step);
    else if (step.type === 'done') openDone(step);
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
    els.enLine.hidden = true;
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

  // ===== 词义确认 / 听辨题 / 连续两步题 =====
  function beginQuestion(step) {
    cur = {
      type: step.type,
      target: step.target,
      answer: step.answer,
      first: step.first,
      then: step.then,
      firstTryCorrect: null,
      replays: 0,
      usedCaption: false,
      usedDemo: false,
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

  function classify(r) {
    if (r.usedCaption || r.usedDemo) return 'with-hint';
    if (r.replays > 0 || r.firstTryCorrect === false) return 'after-replay';
    return 'independent';
  }

  // ===== 视图上报的点击动作 =====
  function handleAction(pos) {
    const step = steps[stepIndex];
    if (!step || inputLocked) return;
    if (step.type !== 'check' && step.type !== 'quiz' && step.type !== 'sequence') return;
    const hasHint = cur.usedCaption || cur.usedDemo;
    // 没听到声音时，先要求听或看提示；一旦看了字幕/示范，就允许作答继续
    if (!audio.audioState.played && audio.audioState.status !== 'ended' && !hasHint) {
      setTip('先听，点「再听一次」，或点「看字幕」。', 'bad');
      return;
    }

    // ===== 连续两步题：按 first、then 顺序点 =====
    if (step.type === 'sequence') {
      if (seqStage === 'first') {
        if (pos === step.first) {
          if (cur.firstTryCorrect === null) cur.firstTryCorrect = true;
          seqStage = 'then';
          seqDoneFirst = true;
          view.mark(pos, 'done');
          setTip(step.thenPrompt || '第一个对啦，再点第二个。', 'good');
        } else {
          cur.firstTryCorrect = false;
          view.mark(pos, 'wrong');
          setTip(step.badTip || '这个不对，再听一次。', 'bad');
          audio.play(step.audio);
        }
      } else {
        if (pos === step.first) {
          setTip('这个已经拿过啦，点第二个。', 'bad');
          return;
        }
        if (pos === step.then) {
          inputLocked = true;
          cur.completion = classify(cur);
          view.mark(pos, 'correct');
          setTip(step.goodTip || '两步都对啦！', 'good');
          later(advance, 900);
        } else {
          cur.firstTryCorrect = false;
          view.mark(pos, 'wrong');
          setTip(step.badTip || '第二个不对，再听一次。', 'bad');
          audio.play(step.audio);
        }
      }
      return;
    }

    // ===== check / quiz 单点判定 =====
    const correct = step.type === 'check' ? pos === step.target : pos === step.answer;
    if (correct) {
      if (cur.firstTryCorrect === null) cur.firstTryCorrect = true;
      inputLocked = true;
      cur.completion = classify(cur);
      view.mark(pos, 'correct');
      setTip(step.goodTip || '对啦！', 'good');
      later(advance, step.type === 'quiz' ? 850 : 700);
    } else {
      if (cur.firstTryCorrect === null) cur.firstTryCorrect = false;
      view.mark(pos, 'wrong');
      setTip(step.badTip || '这个不对，再听一次，注意听清楚。', 'bad');
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
        if (st.status === 'ended' || st.status === 'error') { off(); resolve(st.status === 'ended'); }
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
        const ok = await waitForEnded();
        if (token !== stepToken) return;
        // ok=false 表示音频出错，容错继续，不卡住整个示范
      }
    }
    if (!isHelp) later(advance, 400);
  }

  // ===== 开口环节 =====
  function openSpeak(step) {
    currentSpeak = step;
    els.speakEn.textContent = step.sentence;
    els.speakModal.hidden = false;
    setTip(step.prompt || '对馆员说一句，也可以直接完成。', '');
  }

  // ===== 结算：家长报告 =====
  function buildSummary() {
    // quiz 和 sequence 都算听辨大题
    const qs = questionRecords.filter((r) => r.type === 'quiz' || r.type === 'sequence');
    const checks = questionRecords.filter((r) => r.type === 'check');
    const n = (comp) => qs.filter((r) => r.completion === comp).length;
    return {
      quizTotal: qs.length,
      independent: n('independent'),
      afterReplay: n('after-replay'),
      withHint: n('with-hint'),
      replays: qs.reduce((s, r) => s + r.replays, 0),
      checkTotal: checks.length,
      checkIndependent: checks.filter((r) => r.completion === 'independent').length,
    };
  }

  function openDone(step) {
    const s = buildSummary();
    // 结果页显示之前，先一次性把完成状态、道具、解锁写入存档
    if (typeof onPersist === 'function') {
      try { onPersist(s); } catch (e) { /* 存储内部已降级，不阻断结算 */ }
    }
    const skill = step.skillLabel || config.skillLabel || '听辨';
    if (els.doneTitle) els.doneTitle.textContent = step.doneTitle || config.doneTitle || '完成啦';
    els.report.innerHTML =
      '<p>' + skill + '共 ' + s.quizTotal + ' 道：</p>' +
      '<p>独立第一次选对 ' + s.independent + ' 道</p>' +
      '<p>重听后选对 ' + s.afterReplay + ' 道</p>' +
      '<p>看字幕或求助完成 ' + s.withHint + ' 道</p>' +
      '<p>中途重听 ' + s.replays + ' 次；词义确认 ' + s.checkIndependent + '/' + s.checkTotal + ' 独立完成</p>';
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
      const key = stepAudio(step);
      // 出错状态下先重新预加载（可能是网络抖动），再播放；正常状态直接重放
      if (key && audio.audioState.status === 'error') {
        await audio.retry(key);
      } else {
        audio.play(key);
      }
    },
    toggleCaption() {
      const step = steps[stepIndex];
      if (step.type !== 'quiz' && step.type !== 'check' && step.type !== 'sequence') return;
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
      if (currentSpeak) audio.play(currentSpeak.listenKey);
    },
    speakDone() {
      els.speakModal.hidden = true;
      let moved = false;
      const move = () => { if (!moved) { moved = true; advance(); } };
      const doneKey = currentSpeak ? currentSpeak.doneKey : null;
      if (doneKey) {
        audio.play(doneKey);
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
        type: step && step.type, target: step && step.target,
        answer: step && step.answer,
        first: step && step.first, then: step && step.then,
        seqStage, seqDoneFirst,
        records: questionRecords.map((r) => ({
          type: r.type, target: r.target, answer: r.answer,
          firstTry: r.firstTryCorrect, replays: r.replays,
          usedCaption: r.usedCaption, usedDemo: r.usedDemo, completion: r.completion,
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
