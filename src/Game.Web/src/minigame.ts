import {assetUrl} from './content';
import {miniGameInput} from './bridge';
import type {MiniGameConfig, MiniGameFrame} from './bridge';
import './minigame.css';

const e = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function miniGameView(config: MiniGameConfig) {
  const lightness = config.id === 'qinggong';
  const touch = config.id === 'touch';
  return `<div class="training-scrim"><section class="training-window paper" role="dialog" aria-modal="true" aria-label="${e(config.title)}"><header><div><div class="eyebrow">${touch?'江湖救急 · 点穴':'同福客栈 · 实战修炼'}</div><h2>${e(config.title)}</h2></div><strong id="training-score" aria-live="off">准备就绪</strong></header><p class="training-hint">${touch?'等外圈收拢至穴位时点击。五轮，每轮八个穴位；精准 +3、良好 +1，累计至少 100 分成功。圈未靠近时点击无效。':lightness ? '拖动、点击场地或按方向键移动头像，躲开四方来客；坚持越久，修炼收获越多。' : '30 秒内点击出现的头像：东 −2、西 +4、南 +2、北 +3；点击物品可以收进背包。'}<span>离开页面时自动暂停。</span></p><div id="training-area" class="training-area ${touch?'touch-area':''}" tabindex="0" aria-label="${touch?'点穴场地，等待圈靠拢时点击穴位':lightness?'轻功场地，使用方向键或拖动头像':'点穴场地，点击出现的目标'}">${touch&&config.background?`<img class="touch-backdrop" src="${e(assetUrl(config.background))}" alt="">`:lightness?`<img class="training-hero" src="${e(assetUrl(config.heroPortrait))}" alt="你的头像">`:''}<div class="training-targets"></div><div class="training-status"></div></div><footer><button class="button primary" data-mini-action="start">${touch?'开始点穴':'开始修炼'}</button><button class="button outline" data-mini-action="pause" disabled>暂停</button><button class="button outline" data-mini-action="quit">${touch?'放弃此次救治':'结束此次修炼'}</button></footer><p class="panel-notice">${touch?'完成五轮后按实际成绩继续剧情；放弃将按救治失败继续。':'按原版规则结算实际成绩、奖励与修炼进度。提前结束也会消耗此次修炼机会。'}</p></section></div>`;
}

export class MiniGameController {
  private destroyed = false;
  private completing = false;
  private animation = 0;
  private frame?: MiniGameFrame;
  private area: HTMLElement;
  private targets = new Map<string, HTMLButtonElement>();
  private visibility = () => {if (document.hidden) this.pause();};

  constructor(private root: HTMLElement, private config: MiniGameConfig,
    private complete: () => Promise<unknown>, private fail: (error: unknown) => void) {
    this.area = root.querySelector('#training-area')!;
    for (const url of Object.values(config.itemIcons)) if (url) {const image = new Image(); image.src = assetUrl(url);}
    root.querySelector('[data-mini-action="start"]')!.addEventListener('click', () => {this.area.focus(); void this.send({action:'start'});});
    root.querySelector('[data-mini-action="pause"]')!.addEventListener('click', () => {void this.send({action:this.frame?.paused?'resume':'pause'});});
    root.querySelector('[data-mini-action="quit"]')!.addEventListener('click', () => {void this.send({action:'quit'});});
    this.area.addEventListener('pointerdown', event => {
      if (this.config.id !== 'qinggong') return;
      this.area.setPointerCapture(event.pointerId); this.move(event.clientX,event.clientY);
    });
    this.area.addEventListener('pointermove', event => {
      if (this.config.id === 'qinggong' && (event.pointerType === 'mouse' || event.buttons > 0)) this.move(event.clientX,event.clientY);
    });
    this.area.addEventListener('keydown', event => {
      const offset: Record<string,number[]> = {ArrowLeft:[-80,0],ArrowRight:[80,0],ArrowUp:[0,-80],ArrowDown:[0,80]};
      const d=offset[event.key],hero=this.frame?.hero;
      if (!d || !hero || !this.frame) return;
      event.preventDefault(); void this.send({action:'move',x:hero.x+this.frame.targetSize/2+d[0],y:hero.y+this.frame.targetSize/2+d[1]});
    });
    document.addEventListener('visibilitychange',this.visibility);
    void this.tick();
  }

  pause() {if (this.frame?.started && !this.frame.finished) void this.send({action:'pause'});}
  destroy() {this.destroyed=true; cancelAnimationFrame(this.animation); document.removeEventListener('visibilitychange',this.visibility);}
  private move(x: number,y: number) {
    if (!this.frame?.started || this.frame.paused || this.frame.finished) return;
    const rect=this.area.getBoundingClientRect();
    void this.send({action:'move',x:(x-rect.left)*this.frame.width/rect.width,y:(y-rect.top)*this.frame.height/rect.height});
  }
  private async tick() {
    await this.send({action:'frame'});
    if (!this.destroyed && !this.completing) this.animation=requestAnimationFrame(()=>{void this.tick();});
  }
  private async send(input: Record<string,unknown>) {
    if (this.destroyed || this.completing) return;
    try {
      const frame=await miniGameInput(input);
      if (this.destroyed || this.completing) return;
      this.frame=frame; this.draw(frame);
      if (frame.finished) {this.completing=true; await this.complete();}
    } catch (error) {this.destroy(); this.fail(error);}
  }
  private draw(f: MiniGameFrame) {
    this.area.dataset.started=String(f.started); this.area.dataset.paused=String(f.paused);
    this.area.dataset.score=String(f.score);
    const touch=f.id==='touch';
    this.area.dataset.round=String(f.round??0);
    this.root.querySelector('#training-score')!.textContent=touch?`第 ${f.round} / ${f.totalRounds} 轮 · ${f.score} 分 / 100`:f.id==='qinggong'?`坚持 ${Math.floor(f.elapsed)} 秒`:`剩余 ${f.remaining} 秒 · 得分 ${f.score}`;
    const backdrop=this.root.querySelector<HTMLImageElement>('.touch-backdrop');
    if(backdrop?.naturalWidth)backdrop.style.width=`${100*backdrop.naturalWidth/f.width}%`;
    const start=this.root.querySelector<HTMLButtonElement>('[data-mini-action="start"]')!;
    start.hidden=f.started;
    const pause=this.root.querySelector<HTMLButtonElement>('[data-mini-action="pause"]')!;
    pause.disabled=!f.started||f.finished; pause.textContent=f.paused?'继续修炼':'暂停';
    this.root.querySelector('.training-status')!.textContent=f.paused?'修炼已暂停':f.started?'':'准备好后，点击开始修炼';
    const position=(node:HTMLElement,x:number,y:number)=>{node.style.left=`${100*x/f.width}%`;node.style.top=`${100*y/f.height}%`;node.style.width=`${100*f.targetSize/f.width}%`;node.style.height=`${100*f.targetSize/f.height}%`;};
    if(f.hero) position(this.root.querySelector('.training-hero')!,f.hero.x,f.hero.y);
    for(const t of f.targets){
      let node=this.targets.get(t.id);
      if(!node){
        node=document.createElement('button');node.className='training-target';node.dataset.target=t.id;
        node.innerHTML=touch?'<i class="touch-ring" aria-hidden="true"></i><img alt=""><span></span>':'<img alt=""><span></span>';
        if(touch)node.classList.add('touch-target');
        node.addEventListener('click',()=>{if(!this.frame?.paused) void this.send({action:'hit',id:t.id,generation:Number(node!.dataset.generation)});});
        this.root.querySelector('.training-targets')!.append(node);this.targets.set(t.id,node);
      }
      node.hidden=!t.visible;node.disabled=f.id==='qinggong'||f.paused||!f.started||touch&&(!!t.rating||(t.age??-1)<0);
      node.dataset.generation=String(t.generation);node.dataset.points=String(t.points);
      node.setAttribute('aria-label',t.itemId||`${t.id}，${t.points} 分`);
      const image=node.querySelector('img')!;
      const url=assetUrl(touch?this.config.pointIcons?.[t.id]??'':t.itemId?this.config.itemIcons[t.itemId]:this.config.portraits[t.id]);
      if(url && image.getAttribute('src')!==url) image.src=url;
      node.querySelector('span')!.textContent=t.itemId|| (f.id==='qinggong'?t.id:`${t.id} ${t.points>0?'+':''}${t.points}`);
      position(node,t.x,t.y);
      if(touch){
        node.style.left=`${100*(t.x+f.targetSize/2)/f.width}%`;node.style.top=`${100*(t.y+f.targetSize/2)/f.height}%`;
        node.dataset.age=String(t.age??-1);node.dataset.rating=t.rating||'';
        image.hidden=!!t.rating||!url;
        const labels:Record<string,string>={perfect:'精准 +3',good:'良好 +1',bad:'失准',miss:'错过'};
        node.querySelector('span')!.textContent=t.rating?labels[t.rating]:url?'':t.id;
        node.setAttribute('aria-label',`穴位 ${t.id}${t.rating?' · '+labels[t.rating]:''}`);
        const ring=node.querySelector<HTMLElement>('.touch-ring')!;
        ring.hidden=!!t.rating||(t.age??-1)<0;
        ring.style.transform=`translate(-50%,-50%) scale(${Math.abs(3-4*(t.age??0)/3)})`;
        node.classList.toggle('touch-aim',Math.abs((t.age??-1)-1.5)<.2);
      }
    }
  }
}
