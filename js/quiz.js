// 单选题闯关：读句子选答案，不依赖音频。5 关各 30 题，不限时。
// 一次选对记 first，错过再选对记 corrected；全程一次全对才触发完美庆祝。
import { playCorrect, playWrong, stopSfx } from './sfx.js?v=1';
import { showCelebration } from './celebrate.js?v=1';

const QUIZ_BEST_KEY = 'english-quiz-best';
const QUIZ_PROG_KEY = 'english-quiz-progress';
const QUIZ_LAST_KEY = 'english-quiz-last';
const KEYS = ['A','B','C'];

function qGet(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function qSet(k,v){ try { localStorage.setItem(k,JSON.stringify(v)); return true; } catch { return false; } }
function qRemove(k){ try { localStorage.removeItem(k); } catch {} }

function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

let quizRun = null;
let quizLast = null;
let viewEl = null;

export function setQuizView(el){ viewEl = el; }
export function getQuizBest(){ return qGet(QUIZ_BEST_KEY) || {}; }

function newState(){ return { status:null, wrongPicks:[], finalPick:null }; }

// 题干：不同题型不同展示
function stemHTML(q){
  if (q.type === 'dialog') {
    return `
      <div class="quiz-dialog">
        ${q.audio.map((line,i)=>`
          <div class="dl-line ${i%2?'alt':''}">
            <span class="dl-who">${i%2?'B':'A'}</span><span class="dl-text">${esc(line)}</span>
          </div>`).join('')}
      </div>
      <div class="quiz-ask">${esc(q.ask)}</div>`;
  }
  if (q.type === 'mono') {
    return `<div class="quiz-passage">${esc(q.audio)}</div><div class="quiz-ask">${esc(q.ask)}</div>`;
  }
  if (q.type === 'judge') {
    return `
      <div class="quiz-scene">👀 ${esc(q.screen.t)}</div>
      <div class="quiz-sentence">${esc(q.audio)}</div>
      <div class="quiz-ask">这句话和上面的场景对得上吗？</div>`;
  }
  return `<div class="quiz-sentence">${esc(q.audio)}</div>`;
}

export function beginQuiz(levels, i){
  if (i < 0) { location.hash = '#/home'; return; }
  const l = levels[i];
  const prog = qGet(QUIZ_PROG_KEY);
  const same = !!(prog && prog.levelId === l.id);
  let states, start;
  if (same) {
    states = prog.states.map(s => ({...s, wrongPicks:s.wrongPicks||[]}));
    start = Math.min(prog.index, l.data.questions.length - 1);
  } else {
    states = l.data.questions.map(()=>newState());
    start = 0;
  }
  quizRun = { level:l, qs:l.data.questions, states, index:start };
  document.documentElement.style.setProperty('--c', l.color);
  renderQuizQuestion();
}

function cur(){ return quizRun.qs[quizRun.index]; }
function cst(){ return quizRun.states[quizRun.index]; }

function persistQuiz(){
  qSet(QUIZ_PROG_KEY, { levelId:quizRun.level.id, index:quizRun.index, states:quizRun.states, updatedAt:Date.now() });
}

function renderQuizQuestion(){
  const q = cur(); const st = cst();
  const total = quizRun.qs.length;
  const pct = Math.round(quizRun.index / total * 100);
  viewEl.innerHTML = `
    <div class="play">
      <div class="play-top">
        <button class="btn-back" id="btn-back">‹</button>
        <div class="progress-wrap">
          <div class="progress-label">
            <span>单选闯关 · ${esc(quizRun.level.name)}</span>
            <span>第 ${quizRun.index+1} / ${total} 题</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>
      <div class="mode-row"><span class="mode-tag">📝 阅读单选 · 不限时</span></div>
      <div class="q-stage quiz-stage">
        ${stemHTML(q)}
      </div>
      <div class="options" id="options">
        ${q.options.map((o,k)=>`
          <button class="opt" data-k="${k}">
            <span class="key">${q.type==='judge'?esc(o.t):KEYS[k]}</span>
            <span>${q.type==='judge'?'':esc(o.t)}</span>
          </button>`).join('')}
      </div>
      <div class="feedback" id="feedback"></div>
      <div class="q-actions hidden" id="q-actions">
        <button class="btn-primary" id="next-btn">${quizRun.index===total-1?'查看结果 ›':'下一题 ›'}</button>
      </div>
    </div>`;
  document.getElementById('btn-back').addEventListener('click', ()=>{ persistQuiz(); location.hash='#/home'; });
  viewEl.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>chooseQuiz(+b.dataset.k)));
  document.getElementById('next-btn').addEventListener('click', goNextQuiz);
  if (st.status) restoreQuizAnswered();
}

function chooseQuiz(k){
  const st = cst();
  if (st.status) return;
  const q = cur();
  if (k === q.answer) {
    st.status = st.wrongPicks.length ? 'corrected' : 'first';
    st.finalPick = k;
    lockQuiz(k, q.answer);
    const fb = document.getElementById('feedback');
    fb.className = 'feedback ok';
    fb.textContent = st.status==='first' ? '一次就选对，真棒！' : '订正后答对了';
    playCorrect();
    persistQuiz();
    showQuizNext();
  } else {
    st.wrongPicks.push(k);
    const b = document.querySelectorAll('#options .opt')[k];
    if (b){ b.classList.add('wrong'); b.disabled = true; }
    const fb = document.getElementById('feedback');
    fb.className = 'feedback no';
    fb.textContent = '再读一遍，想想看';
    playWrong();
    persistQuiz();
  }
}

function lockQuiz(picked, answer){
  document.querySelectorAll('#options .opt').forEach((b,k)=>{
    b.disabled = true; b.classList.add('locked');
    if (k === answer) b.classList.add('correct');
    else if (k === picked) b.classList.add('wrong');
  });
}

function showQuizNext(){ document.getElementById('q-actions').classList.remove('hidden'); }

function restoreQuizAnswered(){
  const q = cur(); const st = cst();
  (st.wrongPicks||[]).forEach(k=>{
    const b = document.querySelectorAll('#options .opt')[k];
    if (b){ b.classList.add('wrong'); b.disabled = true; }
  });
  lockQuiz(st.finalPick!=null?st.finalPick:q.answer, q.answer);
  const fb = document.getElementById('feedback');
  fb.className = 'feedback ok';
  fb.textContent = st.status==='first' ? '一次就选对，真棒！' : '订正后答对了';
  showQuizNext();
}

function goNextQuiz(){
  persistQuiz();
  if (quizRun.index < quizRun.qs.length - 1) { quizRun.index++; renderQuizQuestion(); }
  else finishQuiz();
}

function finishQuiz(){
  const counts = { first:0, corrected:0 };
  quizRun.states.forEach(s=>{ if (s.status) counts[s.status]++; });
  const total = quizRun.qs.length;
  const summary = { id:quizRun.level.id, total, ...counts, right:counts.first+counts.corrected, updatedAt:Date.now() };
  quizLast = summary;
  qRemove(QUIZ_PROG_KEY);
  // 最佳成绩看一次答对的题数
  const best = qGet(QUIZ_BEST_KEY) || {};
  const prev = best[quizRun.level.id];
  if (!prev || counts.first > prev.first) best[quizRun.level.id] = { first:counts.first, total };
  qSet(QUIZ_BEST_KEY, best);
  const allLast = qGet(QUIZ_LAST_KEY) || {};
  allLast[quizRun.level.id] = summary;
  qSet(QUIZ_LAST_KEY, allLast);
  // 全程一次全对，才给完美庆祝
  if (counts.first === total) showCelebration();
  location.hash = '#/quiz-result/' + quizRun.level.id;
}

export function renderQuizResult(levels, i){
  if (i < 0) { location.hash = '#/home'; return; }
  const l = levels[i];
  const allLast = qGet(QUIZ_LAST_KEY) || {};
  const s = quizLast && quizLast.id === l.id ? quizLast : allLast[l.id];
  if (!s) { location.hash = '#/home'; return; }
  const perfect = s.first === s.total;
  const rate = Math.round(s.first / s.total * 100);
  const deg = rate * 3.6;
  viewEl.innerHTML = `
    <div class="result">
      <div class="result-card" style="--c:${l.color}">
        <div class="score-ring" style="--deg:${deg}deg">
          <div class="inner"><div><div class="num">${s.first}</div><div class="unit">/ ${s.total} 一次选对</div></div></div>
        </div>
        <h2>${perfect?'全部一次做对，太厉害了':'读完都能答对，继续加油'}</h2>
        <div class="breakdown">
          <div class="bd-row"><span class="dot first"></span>一次选对<b>${s.first}</b></div>
          <div class="bd-row"><span class="dot corrected"></span>订正后答对<b>${s.corrected}</b></div>
        </div>
      </div>
      <div class="result-actions">
        <button class="btn-primary" style="--c:${l.color}" id="retry">再闯一次</button>
        <button class="btn-ghost" id="home">返回首页</button>
      </div>
    </div>`;
  document.getElementById('retry').addEventListener('click',()=>location.hash='#/quiz/'+l.id);
  document.getElementById('home').addEventListener('click',()=>location.hash='#/home');
}

export function stopQuiz(){ stopSfx(); }
