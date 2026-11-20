import { starter } from './data/starter.js';
import { unit1 } from './data/unit1.js';
import { unit2 } from './data/unit2.js';
import { unit3 } from './data/unit3.js';
import { unit4 } from './data/unit4.js';
import { audioMap } from './audio-map.js';

const LEVELS = [
  { id:'starter', data:starter, color:'#3b82f6', emoji:'S', name:'Starter 入门', desc:'入门词汇与日常表达' },
  { id:'unit1', data:unit1, color:'#f97316', emoji:'1', name:'Unit 1 家庭', desc:'家庭成员与生活' },
  { id:'unit2', data:unit2, color:'#22c55e', emoji:'2', name:'Unit 2 学校生活', desc:'科目、课表与作业' },
  { id:'unit3', data:unit3, color:'#8b5cf6', emoji:'3', name:'Unit 3 家与地点', desc:'房间、场所与方位' },
  { id:'unit4', data:unit4, color:'#ec4899', emoji:'4', name:'Unit 4 兴趣能力', desc:'爱好、能力与才艺' },
];
const KEYS=['A','B','C'];
const keyOf = q => Array.isArray(q.audio) ? q.audio.join('\u0001') : q.audio;
const view = document.getElementById('view');
const player = new Audio();
player.preload = 'auto';
document.body.appendChild(player); // 挂到 DOM 便于统一管理（无 controls，页面不显示控件）
let run = null;

const BEST_KEY='english-listening-best';
function loadBest(){ try{ return JSON.parse(localStorage.getItem(BEST_KEY))||{}; }catch{ return {}; } }
function saveBest(o){ try{ localStorage.setItem(BEST_KEY,JSON.stringify(o)); }catch{} }

function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ============ 路由 ============
function router(){
  cleanupRun();
  const hash=location.hash||'#/home';
  const parts=hash.split('/');
  if(parts[1]==='intro') renderIntro(LEVELS.findIndex(l=>l.id===parts[2]));
  else if(parts[1]==='play') beginRun(LEVELS.findIndex(l=>l.id===parts[2]));
  else if(parts[1]==='result') renderResult(LEVELS.findIndex(l=>l.id===parts[2]));
  else renderHome();
}
window.addEventListener('hashchange',router);

function cleanupRun(){
  if(run && run.timerId) clearInterval(run.timerId);
  player.pause();
}

// ============ 首页 ============
function renderHome(){
  const best=loadBest();
  view.innerHTML=`
    <div class="home-head">
      <h1>英语听力闯关</h1>
      <p>北师大版七年级上册 · 共 5 关 150 题 · 限时作答</p>
    </div>
    <div class="level-grid">
      ${LEVELS.map((l,i)=>{
        const b=best[l.id];
        return `
        <button class="level-card" style="--c:${l.color}" data-i="${i}">
          <span class="level-badge">${l.emoji}</span>
          <span class="level-meta">
            <span class="name">${esc(l.name)}</span>
            <span class="desc">${esc(l.desc)} · 30 题</span>
            ${b?`<span class="best">最佳：${b.correct}/30 题</span>`:''}
          </span>
          <span class="level-arrow">›</span>
        </button>`;
      }).join('')}
    </div>`;
  view.querySelectorAll('.level-card').forEach(b=>
    b.addEventListener('click',()=>location.hash='#/intro/'+LEVELS[b.dataset.i].id));
}

// ============ 开始过渡 ============
function renderIntro(i){
  if(i<0){ location.hash='#/home'; return; }
  const l=LEVELS[i];
  view.innerHTML=`
    <div class="intro">
      <div class="intro-card" style="--c:${l.color}">
        <div class="big-badge">${l.emoji}</div>
        <h2>${esc(l.name)}</h2>
        <p class="sub">${esc(l.desc)} · 共 30 题</p>
        <ul class="rule-list">
          <li>⏱ <span>每题限时：<b>单句 20 秒、对话/独白 30 秒</b>，超时算错</span></li>
          <li>🔁 <span>每题可<b>再听 1 次</b>，重听不增加时间</span></li>
          <li>📄 <span>实在听不懂可点<b>显示原文</b>，会记为“借助提示”</span></li>
        </ul>
      </div>
      <button class="btn-primary" style="--c:${l.color}" id="start-btn">开始本关</button>
      <button class="btn-ghost" id="back-home">返回首页</button>
    </div>`;
  document.getElementById('start-btn').addEventListener('click',()=>location.hash='#/play/'+l.id);
  document.getElementById('back-home').addEventListener('click',()=>location.hash='#/home');
}

// ============ 答题 ============
function beginRun(i){
  if(i<0){ location.hash='#/home'; return; }
  const l=LEVELS[i];
  run={ level:l, qs:l.data.questions, index:0, correct:0, hintCount:0,
        startTime:Date.now(), timerId:null, timeLeft:0, answered:false, replaysLeft:1, scriptShown:false };
  document.documentElement.style.setProperty('--c', l.color);
  renderQuestion();
}

function cur(){ return run.qs[run.index]; }

function renderQuestion(){
  const q=cur();
  run.answered=false; run.scriptShown=false; run.replaysLeft=1;
  const pct=Math.round(run.index/run.qs.length*100);
  let head='';
  if(q.type==='dialog'||q.type==='mono') head=esc(q.ask);
  else if(q.type==='judge') head=`<span class="screen-hint"><span class="pic">👀</span>${esc(q.screen.t)}</span>`;
  else head=`<span class="screen-hint">听音频，选出正确答案</span>`;

  view.innerHTML=`
    <div class="play">
      <div class="play-top">
        <button class="btn-back" id="btn-back">‹</button>
        <div class="progress-wrap">
          <div class="progress-label"><span>${esc(run.level.name)}</span><span>第 ${run.index+1} / ${run.qs.length} 题</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>
      <div class="timer-row"><span class="timer-dot" id="timer-dot">${q.limit}s</span></div>

      <div class="q-stage">
        <button class="audio-btn" id="audio-btn">▶</button>
        <div><button class="replay-btn" id="replay-btn">🔁 再听一次（剩 1 次）</button></div>
        <div class="ask">${head}</div>
        <button class="script-toggle" id="script-toggle">📄 显示原文</button>
        <div class="script-box hidden" id="script-box"></div>
      </div>

      <div class="options" id="options">
        ${q.options.map((o,k)=>`
          <button class="opt" data-k="${k}">
            <span class="key">${q.type==='judge'?esc(o.t):KEYS[k]}</span>
            <span>${q.type==='judge'?'':esc(o.t)}</span>
          </button>`).join('')}
      </div>
      <div class="feedback" id="feedback"></div>
    </div>`;

  document.getElementById('btn-back').addEventListener('click',()=>location.hash='#/home');
  document.getElementById('audio-btn').addEventListener('click',onAudioBtn);
  document.getElementById('replay-btn').addEventListener('click',doReplay);
  document.getElementById('script-toggle').addEventListener('click',toggleScript);
  view.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.k)));

  // 计时
  run.timeLeft=q.limit;
  run.timerId=setInterval(tick,1000);
  // 自动播放
  loadAndPlay();
}

function tick(){
  run.timeLeft--;
  const dot=document.getElementById('timer-dot');
  if(dot){ dot.textContent=run.timeLeft+'s'; dot.classList.toggle('urgent',run.timeLeft<=5); }
  if(run.timeLeft<=0){ clearInterval(run.timerId); timeOut(); }
}

function loadAndPlay(){
  const file=audioMap[keyOf(cur())];
  player.src=file; player.currentTime=0;
  player.play().catch(()=>{});
}
function onAudioBtn(){
  const btn=document.getElementById('audio-btn');
  if(player.ended){ doReplay(); return; }
  if(player.paused){ player.play(); btn.textContent='⏸'; }
  else { player.pause(); btn.textContent='▶'; }
}
player.addEventListener('playing',()=>{ const b=document.getElementById('audio-btn'); if(b)b.textContent='⏸'; });
player.addEventListener('ended',()=>{ const b=document.getElementById('audio-btn'); if(b)b.textContent='▶'; });
player.addEventListener('pause',()=>{ const b=document.getElementById('audio-btn'); if(b&&!player.ended)b.textContent='▶'; });

function doReplay(){
  if(run.answered||run.replaysLeft<=0) return;
  run.replaysLeft--;
  const rb=document.getElementById('replay-btn');
  if(rb) rb.disabled=true, rb.textContent='🔁 已用完';
  player.currentTime=0; player.play().catch(()=>{});
}

function toggleScript(){
  if(run.scriptShown) return;
  run.scriptShown=true; run.hintCount++;
  const q=cur();
  const lines=Array.isArray(q.audio)?q.audio:[q.audio];
  const box=document.getElementById('script-box');
  box.classList.remove('hidden');
  box.innerHTML=`<span class="tag">借助提示 · 已记录</span>${lines.map(esc).join('<br>')}`;
  document.getElementById('script-toggle').classList.add('hidden');
}

function choose(k){
  if(run.answered) return;
  run.answered=true; clearInterval(run.timerId);
  const q=cur(); const right=k===q.answer;
  if(right) run.correct++;
  lockOptions(k,q.answer);
  const fb=document.getElementById('feedback');
  fb.className='feedback '+(right?'ok':'no');
  fb.textContent=right?'答对了！':`正确答案是 ${KEYS[q.answer]}`;
  setTimeout(goNext,950);
}

function timeOut(){
  if(run.answered) return;
  run.answered=true;
  const q=cur();
  lockOptions(-1,q.answer);
  const fb=document.getElementById('feedback');
  fb.className='feedback no'; fb.textContent='时间到！';
  setTimeout(goNext,1000);
}

function lockOptions(picked,answer){
  view.querySelectorAll('.opt').forEach((b,k)=>{
    b.classList.add('locked'); b.disabled=true;
    if(k===answer) b.classList.add('correct');
    else if(k===picked) b.classList.add('wrong');
  });
}

function goNext(){
  player.pause();
  if(run.index<run.qs.length-1){ run.index++; renderQuestion(); }
  else finishRun();
}

// ============ 结算 ============
function finishRun(){
  if(run.timerId) clearInterval(run.timerId);
  const elapsed=Math.round((Date.now()-run.startTime)/1000);
  const best=loadBest();
  const prev=best[run.level.id];
  if(!prev||run.correct>prev.correct)
    best[run.level.id]={correct:run.correct,total:run.qs.length,elapsed};
  saveBest(best);
  sessionStorage.setItem('last-result',JSON.stringify({
    id:run.level.id,correct:run.correct,total:run.qs.length,hint:run.hintCount,elapsed}));
  location.hash='#/result/'+run.level.id;
}

function renderResult(i){
  if(i<0){ location.hash='#/home'; return; }
  const l=LEVELS[i];
  let r; try{ r=JSON.parse(sessionStorage.getItem('last-result')); }catch{}
  if(!r||r.id!==l.id){ location.hash='#/home'; return; }
  const rate=Math.round(r.correct/r.total*100);
  const deg=rate*3.6;
  const mm=String(Math.floor(r.elapsed/60)).padStart(2,'0');
  const ss=String(r.elapsed%60).padStart(2,'0');
  const title=rate>=90?'太棒了！':rate>=60?'继续加油！':'再练一练吧';
  view.innerHTML=`
    <div class="result">
      <div class="result-card" style="--c:${l.color}">
        <div class="score-ring" style="--deg:${deg}deg">
          <div class="inner"><div><div class="num">${r.correct}</div><div class="unit">/ ${r.total} 题</div></div></div>
        </div>
        <h2>${title}</h2>
        <div class="stat-grid">
          <div class="stat"><div class="v">${rate}%</div><div class="l">正确率</div></div>
          <div class="stat"><div class="v">${r.hint}</div><div class="l">借助提示</div></div>
          <div class="stat"><div class="v">${mm}:${ss}</div><div class="l">用时</div></div>
        </div>
      </div>
      <div class="result-actions">
        <button class="btn-primary" style="--c:${l.color}" id="retry">再来一次</button>
        <button class="btn-ghost" id="home">返回首页</button>
      </div>
    </div>`;
  document.getElementById('retry').addEventListener('click',()=>location.hash='#/intro/'+l.id);
  document.getElementById('home').addEventListener('click',()=>location.hash='#/home');
}

// 启动
location.hash=location.hash||'#/home';
router();
