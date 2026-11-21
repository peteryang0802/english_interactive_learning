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
const AUDIO_VERSION=5;
const withVer=f=>f+(f.includes('?')?'&':'?')+'v='+AUDIO_VERSION;
const keyOf = q => Array.isArray(q.audio) ? q.audio.join('\u0001') : q.audio;
const view = document.getElementById('view');
const player = new Audio();
player.preload = 'auto';
document.body.appendChild(player);
let run = null;
let lastSummary = null;

// ============ 存储（带可用性检测，失败降级内存） ============
const BEST_KEY='english-listening-best';
const PROG_KEY='english-listening-progress';
const LAST_KEY='english-listening-last';
const PIN_KEY='english-listening-pin';
const DEFAULT_PIN='8888';
// 密码家长可自己改，没设置过就用默认 8888
function loadPin(){ const v=lsGet(PIN_KEY); return (typeof v==='string'&&v)?v:DEFAULT_PIN; }
let storageOK=true;
function storageAvailable(){
  try{ const k='__t'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; }
  catch{ return false; }
}
function lsGet(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch{ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch{ storageOK=false; return false; } }
function lsRemove(k){ try{ localStorage.removeItem(k); }catch{} }
function loadBest(){ return lsGet(BEST_KEY)||{}; }
function loadProgress(){ return lsGet(PROG_KEY); }
function loadLast(){ return lsGet(LAST_KEY)||{}; }
// 一次性迁移：旧版最佳成绩按“答对题数”记录（含看原文、猜中的高估分），
// 新口径只认“首听独立”。旧结构没有 first 字段，直接废弃，让孩子按新口径重新积累。
function migrateStorage(){
  const best=loadBest();
  let changed=false;
  Object.keys(best).forEach(k=>{
    const b=best[k];
    if(!b || typeof b.first!=='number'){ delete best[k]; changed=true; }
  });
  if(changed) lsSet(BEST_KEY,best);
}

// ============ 统一定时器管理（退出时全部取消，杜绝退出后翻题） ============
const timerIds=new Set();
function later(fn,ms){ const id=setTimeout(()=>{ timerIds.delete(id); fn(); },ms); timerIds.add(id); return id; }
function every(fn,ms){ const id=setInterval(fn,ms); timerIds.add(id); return id; }
function cancelTimer(id){ clearTimeout(id); clearInterval(id); timerIds.delete(id); }
function clearAllTimers(){ timerIds.forEach(id=>{ clearTimeout(id); clearInterval(id); }); timerIds.clear(); }

function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ============ 可靠播放封装 ============
function mkErr(kind,msg){ const e=new Error(msg||kind); e.kind=kind; return e; }
function playSrc(src){
  return new Promise((resolve,reject)=>{
    let settled=false;
    const failTimer=later(()=>{ cleanup(); reject(mkErr('timeout')); },12000);
    function onErr(){ if(settled)return; settled=true; cleanup(); reject(mkErr('load')); }
    function cleanup(){ cancelTimer(failTimer); player.removeEventListener('error',onErr); }
    player.addEventListener('error',onErr);
    player.src=src;
    // 立即在当前调用栈（用户手势）里请求播放，不等 canplay，避免手势激活过期
    player.play().then(()=>{ if(settled)return; settled=true; cleanup(); resolve(); })
      .catch(pe=>{ if(settled)return; settled=true; cleanup();
        reject(mkErr(pe.name==='NotAllowedError'?'autoplay':'load',pe.message)); });
  });
}

// ============ 路由 ============
function router(){
  cleanupRun();
  const hash=location.hash||'#/home';
  const parts=hash.split('/');
  if(parts[1]!=='parent'){ resetParentConfirm(); parentToast=''; }
  if(parts[1]==='parent') renderParent();
  else if(parts[1]==='intro') renderIntro(LEVELS.findIndex(l=>l.id===parts[2]),parts[3]==='challenge'?'challenge':'learn');
  else if(parts[1]==='play') beginRun(LEVELS.findIndex(l=>l.id===parts[2]),parts[3]==='challenge'?'challenge':'learn');
  else if(parts[1]==='weak') beginWeak(LEVELS.findIndex(l=>l.id===parts[2]));
  else if(parts[1]==='result') renderResult(LEVELS.findIndex(l=>l.id===parts[2]));
  else renderHome();
}
window.addEventListener('hashchange',router);
function cleanupRun(){
  clearAllTimers();
  player.pause();
}

// 占位：家长状态（后面定义，函数声明提升）
let parentConfirm=null, parentConfirmTimer=null, parentToast='';
function resetParentConfirm(){ parentConfirm=null; if(parentConfirmTimer){ clearTimeout(parentConfirmTimer); parentConfirmTimer=null; } }

// ============ 首页 ============
function renderHome(){
  storageOK=storageAvailable();
  const best=loadBest(); const prog=loadProgress();
  view.innerHTML=`
    <div class="home-head">
      <h1>英语听力闯关</h1>
      <p>北师大版七年级上册 · 5 关 150 题 · 先听懂再作答</p>
    </div>
    <div class="quick-actions">
      <button class="btn-primary" id="quick-start">▶ 先听 3 题试试</button>
      ${prog?`<button class="btn-continue" id="continue">继续上次：${LEVELS.find(l=>l.id===prog.levelId).name} 第 ${prog.index+1} 题</button>`:''}
    </div>
    <div class="home-section-label">选择关卡（成绩按“首听独立答对”记录）</div>
    <div class="level-grid">
      ${LEVELS.map((l,i)=>{
        const b=best[l.id];
        return `
        <button class="level-card" style="--c:${l.color}" data-i="${i}">
          <span class="level-badge">${l.emoji}</span>
          <span class="level-meta">
            <span class="name">${esc(l.name)}</span>
            <span class="desc">${esc(l.desc)} · 30 题</span>
            ${b?`<span class="best">首听独立：${b.first}/30 题</span>`:'<span class="desc">暂无记录</span>'}
          </span>
          <span class="level-arrow">›</span>
        </button>`;
      }).join('')}
    </div>
    <div class="home-foot"><button class="parent-link" id="parent-link">家长管理</button></div>
    ${storageOK?'':'<p class="storage-warn">当前浏览器无法保存记录，本次练习结果可能不会保留</p>'}`;
  document.getElementById('quick-start').addEventListener('click',()=>{
    location.hash='#/play/'+LEVELS[0].id+'/learn';
  });
  if(prog) document.getElementById('continue').addEventListener('click',()=>{
    location.hash='#/play/'+prog.levelId+'/'+(prog.mode||'learn');
  });
  view.querySelectorAll('.level-card').forEach(b=>
    b.addEventListener('click',()=>location.hash='#/intro/'+LEVELS[b.dataset.i].id+'/learn'));
  document.getElementById('parent-link').addEventListener('click',()=>location.hash='#/parent');
}

// ============ 模式选择过渡 ============
function renderIntro(i,mode){
  if(i<0){ location.hash='#/home'; return; }
  const l=LEVELS[i];
  view.innerHTML=`
    <div class="intro">
      <div class="intro-card" style="--c:${l.color}">
        <div class="big-badge">${l.emoji}</div>
        <h2>${esc(l.name)}</h2>
        <p class="sub">${esc(l.desc)} · 共 30 题</p>
        <ul class="rule-list">
          <li>📘 <span><b>学习模式（默认）</b>不限时，可反复听，答错给线索订正</span></li>
          <li>🏆 <span><b>挑战模式</b>播放不计时，听完再给作答窗口，可重听 1 次</span></li>
          <li>🎯 <span>只有<b>首听独立答对</b>计入最佳成绩</span></li>
        </ul>
      </div>
      <button class="btn-primary" style="--c:${l.color}" id="start-learn">学习模式开始</button>
      <button class="btn-challenge" id="start-challenge">🏆 挑战模式</button>
      <button class="btn-ghost" id="back-home">返回首页</button>
    </div>`;
  document.getElementById('start-learn').addEventListener('click',()=>location.hash='#/play/'+l.id+'/learn');
  document.getElementById('start-challenge').addEventListener('click',()=>location.hash='#/play/'+l.id+'/challenge');
  document.getElementById('back-home').addEventListener('click',()=>location.hash='#/home');
}

// ============ 答题运行 ============
function newQState(){ return { status:null, usedReplay:false, usedScript:false, wrongPicks:[] }; }

function beginRun(i,mode){
  if(i<0){ location.hash='#/home'; return; }
  const l=LEVELS[i];
  const prog=loadProgress();
  const sameRun=!!(prog && prog.levelId===l.id && prog.mode===mode);
  let qs;
  if(sameRun){ qs=prog.qs.map(s=>({...s,wrongPicks:s.wrongPicks||[]})); }
  else qs=l.data.questions.map(()=>newQState());
  const startIndex=sameRun?Math.min(prog.index,l.data.questions.length-1):0;
  const order=l.data.questions.map((_,i)=>i);
  run={ level:l, qs:l.data.questions, states:qs, index:startIndex, mode, order, weak:false,
        startTime:Date.now(), timerId:null, answerTimerId:null, timeLeft:0,
        phase:'listen', replaysLeft:mode==='challenge'?1:99, audioState:'idle' };
  document.documentElement.style.setProperty('--c', l.color);
  renderQuestion();
}
// order 是当前练习包含的原题索引：正常模式是全部 0..29，错题练习只放卡住的题
function cur(){ return run.qs[run.order[run.index]]; }
function cst(){ return run.states[run.index]; }
function runTotal(){ return run.order.length; }
function beginWeak(i){
  if(i<0){ location.hash='#/home'; return; }
  const l=LEVELS[i];
  // 优先用内存里最新的结算，刷新后从持久化的整关 summary 取错题索引
  const src=(lastSummary&&lastSummary.id===l.id)?lastSummary:loadLast()[l.id];
  const order=src&&Array.isArray(src.weakIdx)?src.weakIdx.slice():[];
  if(!order.length){ location.hash='#/home'; return; }
  const states=order.map(()=>newQState());
  run={ level:l, qs:l.data.questions, states, index:0, mode:'learn', order, weak:true,
        startTime:Date.now(), timerId:null, answerTimerId:null, timeLeft:0,
        phase:'listen', replaysLeft:99, audioState:'idle' };
  document.documentElement.style.setProperty('--c', l.color);
  renderQuestion();
}

function persist(){
  // 错题练习不写正常进度，避免和整关的"继续上次"互相打架
  if(run.weak) return;
  lsSet(PROG_KEY,{ levelId:run.level.id, mode:run.mode, index:run.index, qs:run.states, updatedAt:Date.now() });
}

function renderQuestion(){
  const q=cur(); const st=cst();
  run.phase='listen'; run.replaysLeft=run.mode==='challenge'?1:99;
  const pct=Math.round(run.index/runTotal()*100);
  let head='';
  if(q.type==='dialog'||q.type==='mono') head=esc(q.ask);
  else if(q.type==='judge') head=`<span class="screen-hint"><span class="pic">👀</span>${esc(q.screen.t)}</span>`;
  else head=`<span class="screen-hint">听音频，选出正确答案</span>`;

  view.innerHTML=`
    <div class="play">
      <div class="play-top">
        <button class="btn-back" id="btn-back">‹</button>
        <div class="progress-wrap">
          <div class="progress-label"><span>${run.weak?'错题练习 · ':''}${esc(run.level.name)}</span><span>第 ${run.index+1} / ${runTotal()} 题</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>
      <div class="mode-row"><span class="mode-tag">${run.weak?'🎯 错题精准练习':(run.mode==='challenge'?'🏆 挑战模式':'📘 学习模式')}</span><span class="answer-window" id="answer-window"></span></div>

      <div class="q-stage">
        <button class="audio-btn" id="audio-btn">▶</button>
        <div class="stage-msg" id="stage-msg">点击播放，加载和播放都不计时</div>
        <div class="listen-controls">
          <button class="replay-btn" id="replay-btn">↻ 再听一次</button>
          ${run.mode==='challenge'?'<button class="ready-answer hidden" id="ready-answer">我听完了，开始答题</button>':''}
        </div>
        <div class="ask">${head}</div>
        <button class="script-toggle" id="script-toggle">显示原文（会标记）</button>
        <div class="script-box hidden" id="script-box"></div>
      </div>

      <div class="options ${run.mode==='challenge'?'options-locked':''}" id="options">
        ${q.options.map((o,k)=>`
          <button class="opt" data-k="${k}" ${run.mode==='challenge'?'disabled':''}>
            <span class="key">${q.type==='judge'?esc(o.t):KEYS[k]}</span>
            <span>${q.type==='judge'?'':esc(o.t)}</span>
          </button>`).join('')}
      </div>
      <div class="feedback" id="feedback"></div>
      <div class="q-actions hidden" id="q-actions"><button class="btn-primary" id="next-btn">下一题 ›</button></div>
    </div>`;

  document.getElementById('btn-back').addEventListener('click',()=>{ persist(); location.hash='#/home'; });
  document.getElementById('audio-btn').addEventListener('click',onAudioBtn);
  document.getElementById('replay-btn').addEventListener('click',doReplay);
  const readyBtn=document.getElementById('ready-answer');
  if(readyBtn)readyBtn.addEventListener('click',startAnswerPhase);
  document.getElementById('script-toggle').addEventListener('click',toggleScript);
  view.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.k)));
  document.getElementById('next-btn').addEventListener('click',goNext);
  if(st.usedScript) showScriptBox();
  prepareStage();
  restoreAnswered();
}

// 进入题目不自动播放，等孩子点播放（主动听，也避免浏览器自动播放限制）
function prepareStage(){
  player.pause();
  player.removeAttribute('src'); player.load(); // 清空上一题，等孩子主动播放当前题
  run.audioState='idle';
  const btn=document.getElementById('audio-btn');
  const msg=document.getElementById('stage-msg');
  if(btn)btn.textContent='▶';
  if(msg){ msg.className='stage-msg'; msg.textContent='点下面的播放按钮开始听，加载和播放都不计时'; }
}
// 完整播放（首次或重新加载）
async function startPlay(){
  run.audioState='loading';
  const src=withVer(audioMap[keyOf(cur())]);
  const msg=document.getElementById('stage-msg');
  if(msg){ msg.className='stage-msg'; msg.textContent='正在加载音频…'; }
  try{
    await playSrc(src);
    run.audioState='playing';
    if(msg){ msg.className='stage-msg'; msg.textContent='播放中，可随时暂停或再听'; }
  }catch(e){ run.audioState='idle'; showReload(e,src); }
}
// 暂停后继续
function resumePlay(){
  run.audioState='playing';
  player.play().then(markPlaying).catch(()=>startPlay());
}
function showReload(e,src){
  const msg=document.getElementById('stage-msg');
  const btn=document.getElementById('audio-btn');
  if(btn)btn.textContent='↻';
  if(msg){ msg.className='stage-msg err';
    msg.innerHTML='音频没加载出来 <button class="retry-link" id="retry-audio">重新加载音频</button>';
    document.getElementById('retry-audio').addEventListener('click',()=>startPlay()); }
}
function markPlaying(){ const b=document.getElementById('audio-btn'); if(b)b.textContent='⏸'; }
function onAudioBtn(){
  const btn=document.getElementById('audio-btn');
  if(run.audioState==='playing'){ player.pause(); run.audioState='paused'; btn.textContent='▶'; }
  else if(run.audioState==='paused'){ resumePlay(); }
  else { startPlay(); } // idle 或加载失败后
}
player.addEventListener('playing',markPlaying);
player.addEventListener('ended',()=>{
  run.audioState='idle';
  const b=document.getElementById('audio-btn'); if(b)b.textContent='▶';
  const m=document.getElementById('stage-msg');
  if(run.mode==='challenge'){
    const r=document.getElementById('ready-answer'); if(r)r.classList.remove('hidden');
    if(m){ m.className='stage-msg'; m.textContent='听完了，点下面按钮开始答题'; }
  }else if(m){ m.className='stage-msg'; m.textContent='听完了，选答案吧；没听清可以再听'; }
});
player.addEventListener('pause',()=>{ const b=document.getElementById('audio-btn'); if(b&&!player.ended)b.textContent='▶'; });

// 重听：只有成功播放才消耗次数，失败不耗
async function doReplay(){
  if(run.replaysLeft<=0) return;
  const src=withVer(audioMap[keyOf(cur())]);
  try{ await playSrc(src); run.replaysLeft--; cst().usedReplay=true; updateReplayBtn(); markPlaying(); persist(); }
  catch(e){ showReload(e,src); }
}
function updateReplayBtn(){
  const rb=document.getElementById('replay-btn');
  if(!rb)return;
  if(run.mode==='challenge'){
    if(run.replaysLeft<=0) rb.disabled=true, rb.textContent='重听已用完';
  }
}

// 挑战模式：作答阶段才计时
function startAnswerPhase(){
  run.phase='answer';
  // 进入作答窗口，启用选项，隐藏开始按钮
  view.querySelectorAll('.opt').forEach(b=>b.disabled=false);
  document.getElementById('options').classList.remove('options-locked');
  const readyBtn=document.getElementById('ready-answer'); if(readyBtn)readyBtn.classList.add('hidden');
  const q=cur();
  const windowS=(q.type==='dialog'||q.type==='mono')?20:15;
  run.timeLeft=windowS;
  const w=document.getElementById('answer-window');
  if(w){ w.className='answer-window active'; w.textContent=`作答 ${windowS}s`; }
  run.answerTimerId=every(()=>{
    run.timeLeft--;
    const w2=document.getElementById('answer-window');
    if(w2){ w2.textContent=`作答 ${run.timeLeft}s`; w2.classList.toggle('urgent',run.timeLeft<=5); }
    if(run.timeLeft<=0){ cancelTimer(run.answerTimerId); timeOut(); }
  },1000);
}

function toggleScript(){
  const st=cst(); if(st.usedScript)return;
  st.usedScript=true; showScriptBox(); persist();
}
function showScriptBox(){
  const q=cur();
  const lines=Array.isArray(q.audio)?q.audio:[q.audio];
  const box=document.getElementById('script-box');
  const tg=document.getElementById('script-toggle');
  if(box){ box.classList.remove('hidden'); box.innerHTML=`<span class="tag">已看原文 · 本题不计首听独立</span>${lines.map(esc).join('<br>')}`; }
  if(tg)tg.classList.add('hidden');
}

// ============ 选择与判分 ============
function choose(k){
  const st=cst();
  if(st.status) return; // 已定论
  // 挑战模式只有进入作答窗口后选项才会启用，这里能触发说明已在作答阶段
  const q=cur(); const right=k===q.answer;
  if(right){
    // 先看原文 → script；先答错再改对 → corrected；没答错但重听过 → replay；首听直接对 → first
    st.status = st.usedScript ? 'script'
      : (st.wrongPicks.length ? 'corrected'
        : (st.usedReplay ? 'replay' : 'first'));
    st.finalPick=k;
    lockFinal(k,q.answer);
    feedbackOk(st.status);
    persist(); showNext();
  }else{
    st.wrongPicks.push(k);
    // 答错进入订正：标记错项，给线索，不直接给答案
    markWrongOption(k);
    const fb=document.getElementById('feedback');
    fb.className='feedback no';
    fb.innerHTML=`再听听看 · 线索：${esc(q.point)}`;
    persist();
    // 挑战模式若在作答窗口内答错，允许在剩余时间改；学习模式不限时
  }
}

function timeOut(){
  const st=cst();
  if(st.status)return;
  st.status='wrong';
  lockFinal(-1,cur().answer);
  const fb=document.getElementById('feedback');
  fb.className='feedback no'; fb.textContent='时间到！正确答案已标出';
  persist(); showNext();
}

function markWrongOption(k){
  const b=view.querySelectorAll('.opt')[k];
  if(b){ b.classList.add('wrong'); b.disabled=true; }
}
function lockFinal(picked,answer){
  view.querySelectorAll('.opt').forEach((b,k)=>{
    b.disabled=true; b.classList.add('locked');
    if(k===answer)b.classList.add('correct');
    else if(k===picked)b.classList.add('wrong');
  });
}
function feedbackOk(status){
  const fb=document.getElementById('feedback');
  const map={first:'首听就答对，真棒！',replay:'重听后答对了',script:'看原文后答对了',corrected:'订正后答对了'};
  fb.className='feedback ok'; fb.textContent=map[status]||'答对了';
}
function showNext(){
  const a=document.getElementById('q-actions'); if(a)a.classList.remove('hidden');
}
// 刷新/续学后，把已定论的题恢复成答完的样子（锁定、反馈、下一题）
function restoreAnswered(){
  const q=cur(); const st=cst();
  if(!st.status) return;
  (st.wrongPicks||[]).forEach(k=>markWrongOption(k));
  const fb=document.getElementById('feedback');
  if(st.status==='wrong'){
    lockFinal(-1,q.answer);
    fb.className='feedback no'; fb.textContent='时间到！正确答案已标出';
  }else{
    lockFinal(st.finalPick!=null?st.finalPick:q.answer,q.answer);
    feedbackOk(st.status);
  }
  showNext();
}

function goNext(){
  player.pause();
  const st=cst();
  if(!st.status){ st.status=st.wrongPicks.length?'wrong':null; }
  persist();
  if(run.index<runTotal()-1){ run.index++; renderQuestion(); }
  else finishRun();
}

// ============ 结算 ============
function isWeakStatus(s){ return s.status==='wrong'||s.status==='corrected'||s.status==='script'; }
function finishRun(){
  if(run.answerTimerId)cancelTimer(run.answerTimerId);
  const counts={first:0,replay:0,script:0,corrected:0,wrong:0};
  run.states.forEach(s=>{ if(s.status)counts[s.status]++; });
  const total=runTotal();
  // 记录本次卡住的原题索引，结算页和刷新后都能精准拉出来再练
  const weakIdx=run.states.map((s,k)=>isWeakStatus(s)?run.order[k]:-1).filter(x=>x>=0);
  const summary={ id:run.level.id, mode:run.mode, total, weak:run.weak, weakIdx, ...counts,
                  independent:counts.first, updatedAt:Date.now() };
  lastSummary=summary;
  lsRemove(PROG_KEY);
  // 错题练习不写最佳成绩，也不覆盖整关 summary，只在内存里给结算页看
  if(run.weak){ location.hash='#/result/'+run.level.id; return; }
  // 最佳成绩只认首听独立
  const best=loadBest(); const prev=best[run.level.id];
  if(!prev||counts.first>prev.first) best[run.level.id]={first:counts.first,total};
  lsSet(BEST_KEY,best);
  const allLast=loadLast(); allLast[run.level.id]=summary; lsSet(LAST_KEY,allLast);
  location.hash='#/result/'+run.level.id;
}

function renderResult(i){
  if(i<0){ location.hash='#/home'; return; }
  const l=LEVELS[i];
  const allLast=loadLast();
  let s=lastSummary && lastSummary.id===l.id?lastSummary:allLast[l.id];
  if(!s){ location.hash='#/home'; return; }
  const indRate=Math.round(s.independent/s.total*100);
  const deg=indRate*3.6;
  let title;
  if(s.weak) title=s.independent===s.total?'这些题这次都听对了':'还有没听对的，再练一轮';
  else title=indRate>=90?'首听基本全懂':indRate>=60?'大部分能听懂':'还需要多听';
  const hasWeak=(s.weakIdx&&s.weakIdx.length>0);
  view.innerHTML=`
    <div class="result">
      <div class="result-card" style="--c:${l.color}">
        <div class="score-ring" style="--deg:${deg}deg">
          <div class="inner"><div><div class="num">${s.independent}</div><div class="unit">/ ${s.total} 首听独立答对</div></div></div>
        </div>
        <h2>${title}</h2>
        <div class="breakdown">
          <div class="bd-row"><span class="dot first"></span>首听独立答对<b>${s.first}</b></div>
          <div class="bd-row"><span class="dot replay"></span>重听后答对<b>${s.replay}</b></div>
          <div class="bd-row"><span class="dot script"></span>看原文后答对<b>${s.script}</b></div>
          <div class="bd-row"><span class="dot corrected"></span>订正后答对<b>${s.corrected}</b></div>
          <div class="bd-row"><span class="dot wrong"></span>仍需再练<b>${s.wrong}</b></div>
        </div>
      </div>
      <div class="result-actions">
        ${s.weak
          ? `<button class="btn-primary" style="--c:${l.color}" id="practice-weak" ${hasWeak?'':'disabled'}>再练还错的题（${hasWeak?s.weakIdx.length:0}）</button>
             <button class="btn-ghost" id="home">返回首页</button>`
          : `<button class="btn-primary" style="--c:${l.color}" id="practice-weak" ${hasWeak?'':'disabled'}>练刚才卡住的题${hasWeak?'（'+s.weakIdx.length+'）':''}</button>
             <button class="btn-ghost" id="retry">整关重来</button>
             <button class="btn-ghost" id="home">返回首页</button>`}
      </div>
    </div>`;
  const pw=document.getElementById('practice-weak');
  if(pw) pw.addEventListener('click',()=>{ location.hash='#/weak/'+l.id; });
  const rt=document.getElementById('retry');
  if(rt) rt.addEventListener('click',()=>location.hash='#/intro/'+l.id);
  document.getElementById('home').addEventListener('click',()=>location.hash='#/home');
}

// ============ 家长管理（密码 + 完整清除） ============
function renderParent(){
  if(!parentUnlocked){ return renderParentGate(); }
  const best=loadBest(); const prog=loadProgress(); const allLast=loadLast();
  view.innerHTML=`
    <div class="parent">
      <div class="parent-head">
        <h2>家长管理</h2>
        <p>清除会同时处理该关的最佳成绩、进行中进度和本次结算，清除后无法恢复。</p>
      </div>
      ${parentToast?`<div class="parent-toast">${esc(parentToast)}</div>`:''}
      <div class="parent-card">
        ${LEVELS.map(l=>{
          const b=best[l.id]; const doing=prog&&prog.levelId===l.id;
          return `
          <div class="rec-row">
            <span class="rec-dot" style="background:${l.color}">${l.emoji}</span>
            <span class="rec-meta">
              <span class="rec-name">${esc(l.name)}</span>
              <span class="rec-val">${b?`首听独立 ${b.first}/30`:'暂无最佳'}${doing?' · 有进行中':''}</span>
            </span>
            <button class="rec-clear ${parentConfirm===l.id?'armed':''}" data-id="${l.id}">
              ${parentConfirm===l.id?'确认清除':'清除'}
            </button>
          </div>`;
        }).join('')}
      </div>
      <button class="btn-danger ${parentConfirm==='all'?'armed':''}" id="clear-all">
        ${parentConfirm==='all'?'再次点击，确认全部清除':'一键清除全部记录'}
      </button>
      <div class="parent-card pin-change">
        <span class="rec-name">修改家长密码</span>
        <div class="pin-change-row">
          <input type="password" inputmode="numeric" id="new-pin" class="pin-input" placeholder="4 位新密码" maxlength="6" />
          <button class="btn-primary" id="save-pin">保存密码</button>
        </div>
        <div class="pin-err hidden" id="pin-msg"></div>
      </div>
      <button class="btn-ghost" id="parent-back">返回首页</button>
    </div>`;
  view.querySelectorAll('.rec-clear').forEach(b=>b.addEventListener('click',()=>onParentClear(b.dataset.id)));
  document.getElementById('clear-all').addEventListener('click',()=>onParentClear('all'));
  document.getElementById('save-pin').addEventListener('click',savePin);
  document.getElementById('parent-back').addEventListener('click',()=>location.hash='#/home');
}
function savePin(){
  const v=document.getElementById('new-pin').value.trim();
  const msg=document.getElementById('pin-msg');
  if(!/^\d{4,6}$/.test(v)){ msg.textContent='请输入 4 到 6 位数字'; msg.classList.remove('hidden'); return; }
  lsSet(PIN_KEY,v);
  msg.className='pin-err ok'; msg.textContent='密码已保存'; msg.classList.remove('hidden');
  document.getElementById('new-pin').value='';
}
let parentUnlocked=false;
function renderParentGate(){
  view.innerHTML=`
    <div class="parent gate">
      <div class="parent-card gate-card">
        <h2>家长验证</h2>
        <p>请输入家长密码（默认 8888，可在面板内修改）</p>
        <input type="password" inputmode="numeric" id="pin" class="pin-input" placeholder="4 位数字" />
        <button class="btn-primary" id="pin-ok">进入</button>
        <div class="pin-err hidden" id="pin-err">密码不对</div>
        <button class="btn-ghost" id="gate-back">返回首页</button>
      </div>
    </div>`;
  document.getElementById('pin-ok').addEventListener('click',checkPin);
  document.getElementById('pin').addEventListener('keydown',e=>{ if(e.key==='Enter')checkPin(); });
  document.getElementById('gate-back').addEventListener('click',()=>location.hash='#/home');
}
function checkPin(){
  const v=document.getElementById('pin').value;
  if(v===loadPin()){ parentUnlocked=true; renderParent(); }
  else document.getElementById('pin-err').classList.remove('hidden');
}
function onParentClear(id){
  if(parentConfirm===id){
    resetParentConfirm();
    const best=loadBest(); const allLast=loadLast(); const prog=loadProgress();
    const targets=id==='all'?LEVELS.map(l=>l.id):[id];
    targets.forEach(t=>{ delete best[t]; delete allLast[t];
      if(prog&&prog.levelId===t)lsRemove(PROG_KEY); });
    lsSet(BEST_KEY,best); lsSet(LAST_KEY,allLast);
    parentToast=id==='all'?'已清除全部记录':`已清除「${LEVELS.find(l=>l.id===id).name}」的全部记录`;
    renderParent();
  }else{
    resetParentConfirm(); parentConfirm=id;
    parentConfirmTimer=setTimeout(()=>{ parentConfirm=null; parentConfirmTimer=null; renderParent(); },3000);
    renderParent();
  }
}

// 启动
storageOK=storageAvailable();
migrateStorage();
location.hash=location.hash||'#/home';
router();
