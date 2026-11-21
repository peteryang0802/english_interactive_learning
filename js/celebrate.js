// 全对庆祝：全屏遮罩 + 花朵绽放 + 花瓣彩带飘落，配庆祝人声。
// 点击任意处或 6 秒后自动收起。
import { playCelebrate, stopSfx } from './sfx.js?v=1';

const FLOWER_EMOJI = ['🌸','🌼','🌺','💐','⭐'];
const PAPER = ['#f43f5e','#f59e0b','#22c55e','#3b82f6','#a855f7','#ec4899'];
let overlay = null;
let autoTimer = null;

export function showCelebration(){
  // 先把可能存在的旧庆祝收掉，再播新的，避免 stopSfx 把刚起的人声掐断
  closeCelebration();
  playCelebrate();

  overlay = document.createElement('div');
  overlay.className = 'celebrate-overlay';

  // 中央六瓣花
  const petals = Array.from({length:6}, (_,k)=>
    `<span class="cel-petal" style="--r:${k*60}deg"></span>`).join('');

  // 飘落元素：emoji + 彩色纸片混着来
  let pieces = '';
  for (let i = 0; i < 40; i++) {
    const left = Math.random() * 100;
    const delay = (Math.random() * 1.6).toFixed(2);
    const dur = (2.6 + Math.random() * 2.4).toFixed(2);
    const size = (16 + Math.random() * 18).toFixed(0);
    if (Math.random() < 0.5) {
      const e = FLOWER_EMOJI[Math.floor(Math.random()*FLOWER_EMOJI.length)];
      pieces += `<span class="cel-piece" style="left:${left}%;--d:${delay}s;--du:${dur}s;font-size:${size}px">${e}</span>`;
    } else {
      const c = PAPER[Math.floor(Math.random()*PAPER.length)];
      pieces += `<span class="cel-piece paper" style="left:${left}%;--d:${delay}s;--du:${dur}s;background:${c};width:${size}px;height:${(size*0.6).toFixed(0)}px"></span>`;
    }
  }

  overlay.innerHTML = `
    <div class="cel-pieces">${pieces}</div>
    <div class="cel-center">
      <div class="cel-flower">${petals}<span class="cel-core"></span></div>
      <div class="cel-title">你是最棒的！</div>
      <div class="cel-sub">送你一朵花 🌸</div>
    </div>
    <div class="cel-hint">点一下任意处继续</div>`;

  overlay.addEventListener('click', closeCelebration);
  document.body.appendChild(overlay);
  autoTimer = setTimeout(closeCelebration, 6000);
}

export function closeCelebration(){
  if (autoTimer){ clearTimeout(autoTimer); autoTimer = null; }
  stopSfx();
  if (overlay){
    overlay.classList.add('cel-leave');
    const node = overlay;
    overlay = null;
    setTimeout(()=>{ if (node.parentNode) node.parentNode.removeChild(node); }, 350);
  }
}
