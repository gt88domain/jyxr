import Phaser from 'phaser';
import {assetUrl} from './content';
import type {Battle, Unit} from './bridge';
import {BattleLighting} from './battle-lighting';
import {BattleSkillEffects} from './battle-effects';
import {BoardTapGuard} from './board-input';

export interface BoardOptions {selectedSkillId?: string; speed?: number; manual?: boolean; busy?: boolean; paused?: boolean; showGrid?: boolean; showDamage?: boolean; battleLighting?: boolean; reducedMotion?: boolean; intent?: 'move' | 'attack';}
type VisualBattle = Battle & {targets?: {x: number; y: number; skillId: string}[]};
interface Pawn {container: Phaser.GameObjects.Container; art: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | Phaser.GameObjects.Text; ring: Phaser.GameObjects.Graphics; bars: Phaser.GameObjects.Graphics; name: Phaser.GameObjects.Text; previous: Unit;}

export function boardGeometry(width: number, height: number, columns: number, rows: number) {
  const cell = Math.min((width - 24) / columns, (height - 92) / rows, 92);
  return {cell, left: (width - cell * columns) / 2, top: (height - cell * rows) * .65};
}

class BattleScene extends Phaser.Scene {
  private battle?: VisualBattle;
  private options: BoardOptions = {};
  private background?: Phaser.GameObjects.Image;
  private ground?: Phaser.GameObjects.Graphics;
  private hover?: Phaser.GameObjects.Graphics;
  private pawns = new Map<string, Pawn>();
  private eventSequence = -1;
  private spriteKeys = new Map<string, string>();
  private lighting?: BattleLighting;
  private effects?: BattleSkillEffects;
  private tapGuard=new BoardTapGuard();
  constructor(private onCell: (x: number, y: number, touch: boolean) => void, private parentElement: HTMLElement, initial: Battle) {
    super('battle'); this.battle = initial;
  }
  preload() {
    if (this.battle?.background) this.load.image('background', assetUrl(this.battle.background));
    const keys = new Map<string, string>();
    for (const unit of this.battle?.units || []) {
      if (!unit.sprite) continue;
      const source = unit.animation?.id || unit.sprite;
      let key = keys.get(source);
      if (!key) {
        key = 'pawn-' + keys.size; keys.set(source,key);
        if (unit.animation) this.load.atlas(key, assetUrl(unit.animation.texture), assetUrl(unit.animation.atlas));
        else this.load.image(key,assetUrl(unit.sprite));
      }
      this.spriteKeys.set(unit.id,key);
    }
  }
  create() {
    for (const unit of this.battle?.units || []) {
      const key = this.spriteKeys.get(unit.id);
      if (!key || !unit.animation || !this.textures.exists(key)) continue;
      for (const [name, clip] of Object.entries(unit.animation.clips)) {
        const animationKey = `${key}-${name}`;
        if (!this.anims.exists(animationKey)) this.anims.create({key: animationKey,
          frames: clip.frames.map(frame => ({key, frame})), frameRate: clip.frameRate,
          repeat: name === 'stand' || name === 'move' ? -1 : 0});
      }
    }
    this.cameras.main.setBackgroundColor('#52614a');
    if (this.textures.exists('background')) this.background = this.add.image(0, 0, 'background').setDepth(-10);
    this.lighting = new BattleLighting(this);
    this.effects = new BattleSkillEffects(this,this.parentElement);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.effects?.clear());
    this.ground = this.add.graphics().setDepth(-1);
    this.hover = this.add.graphics().setDepth(6);
    this.scale.on('resize', () => this.draw(true));
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.hover!.clear();
      if (!this.canAct()) return;
      const point = this.cellAt(pointer), {cell, left, top} = this.geometry();
      if (point) this.hover!.lineStyle(2, 0xffe1a5, .95).strokeRoundedRect(left + point.x * cell + 3, top + point.y * cell + 3, cell - 6, cell - 6, 7);
    });
    this.input.on('pointerout', () => this.hover?.clear());
    // Native pointer events preserve small movements before the browser's
    // touch-scroll threshold. Phaser's touch events alone can miss that drag.
    const canvas=this.game.canvas;
    let approvedTap:{cell:{x:number;y:number};touch:boolean;context:string;at:number}|undefined;
    const point=(event:PointerEvent)=>({id:event.pointerId,x:event.clientX,y:event.clientY});
    const local=(event:PointerEvent)=>{const box=canvas.getBoundingClientRect();return {x:(event.clientX-box.left)*this.scale.width/box.width,y:(event.clientY-box.top)*this.scale.height/box.height};};
    const start=(event:PointerEvent)=>{approvedTap=undefined;if(event.button===0)this.tapGuard.start(point(event),this.tapContext(local(event)),event.timeStamp);};
    const move=(event:PointerEvent)=>{for(const sample of event.getCoalescedEvents?.()||[])this.tapGuard.move(point(sample));this.tapGuard.move(point(event));};
    const finish=(event:PointerEvent)=>{
      const context=this.tapContext(local(event));
      const tapped=this.tapGuard.finish(point(event),context,event.timeStamp);
      if(!tapped||!this.canAct())return;
      const cell=this.cellAt(local(event));
      if(cell)approvedTap={cell,touch:event.pointerType==='touch'||event.pointerType==='pen',context,at:event.timeStamp};
    };
    // Open dialogs from click: opening on pointerup can retarget the following
    // compatibility click to the new backdrop and immediately close it.
    const click=(event:MouseEvent)=>{
      const approved=approvedTap;approvedTap=undefined;
      if(!approved||!this.canAct()||event.timeStamp-approved.at>500||approved.context!==this.tapContext(local(event as PointerEvent)))return;
      this.onCell(approved.cell.x,approved.cell.y,approved.touch);
    };
    const cancelled=()=>{approvedTap=undefined;this.tapGuard.reset();};
    const leave=()=>this.tapGuard.reset();
    canvas.addEventListener('pointerdown',start);
    canvas.addEventListener('pointermove',move,{passive:true});
    canvas.addEventListener('pointerup',finish);
    canvas.addEventListener('click',click);
    canvas.addEventListener('pointercancel',cancelled);
    canvas.addEventListener('pointerleave',leave);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',finish);
      canvas.removeEventListener('click',click);canvas.removeEventListener('pointercancel',cancelled);canvas.removeEventListener('pointerleave',leave);cancelled();
    });
    this.draw(true);
  }
  updateBattle(battle: Battle, options: BoardOptions) {
    this.battle = battle; this.options = options;
    if (this.sys.isActive()) {
      if (options.paused) this.tweens.pauseAll();else this.tweens.resumeAll();
      this.time.paused=!!options.paused;
      this.draw();
    }
  }
  private canAct() {return !!this.battle && !this.options.busy && this.options.manual !== false && this.battle.units.some(unit => unit.id === this.battle!.activeUnitId && unit.team === 1);}
  private tapContext(pointer:{x:number;y:number}) {
    const b=this.battle,active=b?.units.find(u=>u.id===b.activeUnitId),cell=this.cellAt(pointer);
    return JSON.stringify([b?.id,b?.tick,b?.activeUnitId,active?.x,active?.y,this.options.selectedSkillId,this.options.intent,this.options.manual,this.options.busy,this.scale.width,this.scale.height,cell?.x,cell?.y]);
  }
  private geometry() {return boardGeometry(this.scale.width, this.scale.height, this.battle!.width, this.battle!.height);}
  private cellAt(pointer: {x:number;y:number}) {
    if (!this.battle) return;
    const {cell, left, top} = this.geometry();
    const x = Math.floor((pointer.x - left) / cell), y = Math.floor((pointer.y - top) / cell);
    if (x >= 0 && y >= 0 && x < this.battle.width && y < this.battle.height) return {x, y};
  }
  private draw(resize = false) {
    if (!this.battle || !this.ground) return;
    const b = this.battle, {cell, left, top} = this.geometry();
    this.parentElement.dataset.boardGeometry = JSON.stringify({cell, left, top, width: b.width, height: b.height});
    const active = b.units.find(unit => unit.id === b.activeUnitId && unit.alive);
    const lit = this.options.battleLighting !== false;
    this.lighting?.update(this.scale.width, this.scale.height,
      left + ((active?.x ?? b.width / 2) + .5) * cell,
      top + ((active?.y ?? b.height / 2) + .7) * cell, cell, lit);
    this.parentElement.dataset.lighting = lit ? 'on' : 'off';
    if (this.background) {
      this.background.setPosition(this.scale.width / 2, this.scale.height / 2);
      this.background.setScale(Math.max(this.scale.width / this.background.width, this.scale.height / this.background.height));
    }
    const grid = this.ground.clear();
    grid.fillStyle(0x10251e, .18).fillRect(0, 0, this.scale.width, this.scale.height);
    grid.fillStyle(0xf8f0d3, .10).fillRoundedRect(left - 7, top - 7, cell * b.width + 14, cell * b.height + 14, 10);
    grid.lineStyle(1, 0xffe6ac, .45).strokeRoundedRect(left - 7, top - 7, cell * b.width + 14, cell * b.height + 14, 10);
    const targets = (b.targets ?? []).filter(point => point.skillId === this.options.selectedSkillId);
    for (let y = 0; y < b.height; y++) for (let x = 0; x < b.width; x++) {
      const reachable = this.canAct() && this.options.intent !== 'attack' && b.reachable.some(point => point.x === x && point.y === y);
      const attackable = this.canAct() && this.options.intent === 'attack' && targets.some(point => point.x === x && point.y === y);
      if (reachable || attackable || this.options.showGrid !== false) {
        grid.fillStyle(attackable ? 0xce7148 : reachable ? 0x79baa2 : 0xeee3c4, attackable ? .38 : reachable ? .32 : ((x + y) % 2 ? .045 : .10));
        grid.fillRoundedRect(left + x * cell + 1, top + y * cell + 1, cell - 2, cell - 2, 3);
      }
      if (this.options.showGrid !== false) grid.lineStyle(1, 0xffefd0, .19).strokeRect(left + x * cell, top + y * cell, cell, cell);
      if (reachable) grid.fillStyle(0xd6ffe2, .85).fillCircle(left + (x + .5) * cell, top + (y + .5) * cell, Math.max(2, cell * .035));
    }
    const current = new Set(b.units.map(unit => unit.id));
    for (const [id, pawn] of this.pawns) if (!current.has(id)) {pawn.container.destroy(true); this.pawns.delete(id);}
    for (const unit of b.units) this.drawPawn(unit, cell, left, top, resize);
    this.playEvents();
  }
  private drawPawn(unit: Unit, cell: number, left: number, top: number, resize: boolean) {
    const x = left + (unit.x + .5) * cell, y = top + (unit.y + .7) * cell;
    let pawn = this.pawns.get(unit.id);
    const first = !pawn;
    if (!pawn) {
      const container = this.add.container(x, y), ring = this.add.graphics();
      const key = this.spriteKeys.get(unit.id) || '';
      const art = this.textures.exists(key) ? unit.animation ? this.add.sprite(0, 0, key, unit.animation.clips.stand.frames[0]) : this.add.image(0, 0, key).setOrigin(.5, .92) : this.add.text(0, 0, unit.name.slice(0,1), {fontFamily: 'serif', fontSize: '32px', color: '#fff3cb', backgroundColor: unit.team === 1 ? '#325b48' : '#784937'}).setOrigin(.5, 1);
      const bars = this.add.graphics(), name = this.add.text(0, 0, '', {fontFamily: 'sans-serif', fontSize: '11px', color: '#fff5de', stroke: '#263d2d', strokeThickness: 3}).setOrigin(.5, 0);
      container.add([ring, art, bars, name]);
      pawn = {container, art, ring, bars, name, previous: {...unit}};
      this.pawns.set(unit.id, pawn);
      if (art instanceof Phaser.GameObjects.Sprite) art.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (pawn?.art.active) this.animate(pawn, 'stand');
      });
    }
    const previous = pawn.previous, moved = previous.x !== unit.x || previous.y !== unit.y;
    const reduced = this.options.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (moved && !resize) {
      this.animate(pawn, 'move');
      this.tweens.killTweensOf(pawn.container);
      this.tweens.add({targets: pawn.container, x, y, duration: reduced ? 0 : 340 / (this.options.speed || 1), ease: 'Sine.easeInOut', onComplete: () => {if (pawn?.art.active) this.animate(pawn, 'stand');}});
    } else if (first || resize) pawn.container.setPosition(x, y);
    pawn.container.setDepth(10 + unit.y);
    if (pawn.art instanceof Phaser.GameObjects.Sprite && unit.animation) {
      pawn.art.setScale(cell * 1.25 / unit.animation.baseHeight).setFlipX(unit.facing === 'left');
      pawn.art.anims.timeScale = this.options.speed || 1;
      if (reduced || this.options.paused || !unit.alive) pawn.art.anims.pause();
      else if (pawn.art.anims.isPaused) pawn.art.anims.resume();
      if (first || !pawn.art.anims.currentAnim) this.animate(pawn, 'stand');
    } else if (pawn.art instanceof Phaser.GameObjects.Image) {
      const size = cell * (unit.team === 1 ? 1.25 : 1.4);
      pawn.art.setDisplaySize(size, size).setOrigin(unit.team === 1 ? .56 : .5, .96);
      pawn.art.setFlipX(false);
    }
    else if (pawn.art instanceof Phaser.GameObjects.Text) pawn.art.setFontSize(Math.max(17, cell * .55));
    const active = unit.id === this.battle!.activeUnitId, ring = pawn.ring.clear();
    ring.fillStyle(0x102318, .32).fillEllipse(0, -cell * .04, cell * .78, cell * .26);
    ring.lineStyle(active ? 3 : 1.5, active ? 0xffd883 : unit.team === 1 ? 0x8bdbb5 : 0xd89d75, active ? .95 : .7).strokeEllipse(0, -cell * .04, cell * .85, cell * .32);
    if (active) ring.fillStyle(0xffd783).fillTriangle(-4, -cell * 1.5, 4, -cell * 1.5, 0, -cell * 1.4);
    const width = cell * .82, barY = cell * .08, bars = pawn.bars.clear();
    bars.fillStyle(0x1c2d24, .94).fillRoundedRect(-width / 2 - 1, barY - 1, width + 2, 7, 3);
    bars.fillStyle(unit.team === 1 ? 0xa7d1a5 : 0xe8a27e).fillRoundedRect(-width / 2, barY, width * Math.max(0, unit.hp / unit.maxHp), 5, 2);
    pawn.name.setPosition(0, barY + 9).setFontSize(Math.max(9, Math.min(12, cell * .18))).setText(unit.name);
    if (!first && this.battle!.events === undefined && unit.hp !== previous.hp) {
      const delta = unit.hp - previous.hp;
      if (this.options.showDamage !== false) {
        const floating = this.add.text(x, y - cell, `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`, {fontFamily: 'serif', fontSize: `${Math.max(19, cell * .44)}px`, fontStyle: 'bold', color: delta > 0 ? '#d0f3bc' : '#fff0d0', stroke: '#8d3f27', strokeThickness: 4}).setOrigin(.5).setDepth(80);
        this.tweens.add({targets: floating, y: y - cell * (reduced ? 1 : 1.7), alpha: 0, duration: Math.max(350, 900 / (this.options.speed || 1)), ease: 'Cubic.easeOut', onComplete: () => floating.destroy()});
      }
      if (delta < 0 && !reduced) {
        if (pawn.art instanceof Phaser.GameObjects.Image) {pawn.art.setTint(0xffc5a1); this.time.delayedCall(160, () => {if (pawn?.art.active && pawn.art instanceof Phaser.GameObjects.Image) pawn.art.clearTint();});}
        const hit = this.add.graphics().setDepth(70).lineStyle(3, 0xffe3ad, .9).strokeCircle(x, y - cell * .45, cell * .35);
        this.tweens.add({targets: hit, alpha: 0, duration: 180, onComplete: () => hit.destroy()});
      }
    }
    if(unit.alive||!previous.alive||this.options.reducedMotion)pawn.container.setAlpha(unit.alive?1:.25);
    pawn.previous = {...unit};
  }
  private animate(pawn: Pawn, action: string, allowDefeated=false) {
    if (!(pawn.art instanceof Phaser.GameObjects.Sprite)) return;
    const key = this.spriteKeys.get(pawn.previous.id), animation = `${key}-${action}`;
    if (!this.anims.exists(animation)) return;
    if (this.options.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches || this.options.paused || !pawn.previous.alive&&!allowDefeated) return;
    pawn.art.anims.resume();
    pawn.art.play(animation, true);
    this.parentElement.dataset.lastAnimation = JSON.stringify({unitId: pawn.previous.id, action});
    const actions = JSON.parse(this.parentElement.dataset.animationActions || '[]') as string[];
    this.parentElement.dataset.animationActions = JSON.stringify([...actions.slice(-15), action]);
  }
  private playEvents() {
    if(this.options.paused)return;
    const events = this.battle!.events;
    if (!events) return;
    if (this.eventSequence < 0) {this.eventSequence = Math.max(0, ...events.map(event => event.sequence)); return;}
    const {cell, left, top} = this.geometry();
    const reduced = this.options.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let floatIndex = 0;
    for (const event of events.filter(event => event.sequence > this.eventSequence)) {
      this.eventSequence = Math.max(this.eventSequence, event.sequence);
      this.parentElement.dataset.lastBattleEvent = JSON.stringify(event);
      const pawn = this.pawns.get(event.unitId);
      if (!pawn) continue;
      if (event.kind === 'SkillCast') {
        this.animate(pawn, 'attack');
        this.effects?.play(event,pawn.previous,this.geometry(),this.options.speed||1,!!reduced);
      }
      else if (event.kind === 'Damaged') this.animate(pawn, 'be');
      else if(event.kind==='UnitDefeated') {
        this.animate(pawn,'be',true);
        this.tweens.add({targets:pawn.container,alpha:.25,duration:reduced?0:420/(this.options.speed||1)});
      }
      const x = left + (pawn.previous.x + .5) * cell, y = top + (pawn.previous.y + .7) * cell;
      if (!reduced && !this.options.paused && this.options.battleLighting !== false &&
          (event.kind === 'Damaged' || event.kind === 'Healed' || event.kind === 'Lifesteal') && (event.amount ?? 0) > 0)
        this.lighting?.flash(x, y - cell * .35, cell, event.kind !== 'Damaged', this.options.speed || 1);
      let text = '', color = '#fff1d1';
      if (event.kind === 'Damaged' && event.amount != null) {
        text = `${event.critical ? '暴击 ' : ''}−${event.amount}`;
        this.parentElement.dataset.lastDamage = JSON.stringify(event);
        if (!reduced) {
          if (pawn.art instanceof Phaser.GameObjects.Image) {
            const image = pawn.art; image.setTint(0xffb593);
            this.time.delayedCall(140, () => {if (image.active) image.clearTint();});
          }
          const hit = this.add.graphics().setDepth(70).lineStyle(event.critical ? 4 : 2, 0xffe3ad, .9).strokeCircle(x, y - cell * .45, cell * .35);
          this.tweens.add({targets: hit, alpha: 0, duration: 140 / (this.options.speed || 1), onComplete: () => hit.destroy()});
        }
      } else if (event.kind === 'SkillCast') {text = event.skillName || ''; color = '#ead292';}
      else if (event.kind === 'FloatTextRequested') text = event.text || '';
      else if (event.kind === 'Healed' || event.kind === 'Lifesteal') {text = event.amount == null ? '气血恢复' : `气血 +${event.amount}`; color = '#cdf2bd';}
      else if (event.kind === 'MpRecovered') {text = event.amount == null ? '内力恢复' : `内力 +${event.amount}`; color = '#bce3ff';}
      if (!text || this.options.showDamage === false) continue;
      const isDamage = event.kind === 'Damaged';
      const floating = this.add.text(x, y - cell * (1 + floatIndex++ * .32), text, {fontFamily: 'serif', fontSize: `${Math.max(isDamage ? 18 : 12, cell * (isDamage ? .42 : .23))}px`, fontStyle: isDamage ? 'bold' : 'normal', color, stroke: isDamage ? '#87462c' : '#273e2c', strokeThickness: 3}).setOrigin(.5).setDepth(80);
      this.tweens.add({targets: floating, y: floating.y - cell * (reduced ? 0 : .6), alpha: 0, duration: Math.max(180, 620 / (this.options.speed || 1)), ease: 'Cubic.easeOut', onComplete: () => floating.destroy()});
    }
    this.parentElement.dataset.eventSequence = String(this.eventSequence);
  }
}

export class Board {
  private game: Phaser.Game;
  private scene: BattleScene;
  constructor(parent: HTMLElement, onCell: (x: number, y: number, touch: boolean) => void, battle: Battle) {
    this.scene = new BattleScene(onCell, parent, battle);
    this.game = new Phaser.Game({type: Phaser.CANVAS, parent, transparent: true, audio: {noAudio: true}, banner: false, disableContextMenu:true, input:{activePointers:2,touch:{capture:false}},
      scale: {mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight}, scene: [this.scene], render: {antialias: true, roundPixels: false}});
  }
  update(battle: Battle, options: BoardOptions = {}) {this.scene.updateBattle(battle, options);}
  destroy() {this.game.destroy(true);}
}
