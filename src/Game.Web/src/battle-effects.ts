import Phaser from 'phaser';
import type {BattleEvent} from './bridge';

interface Geometry {cell: number; left: number; top: number;}

export class BattleSkillEffects {
  private active = new Set<Phaser.GameObjects.Container>();
  constructor(private scene: Phaser.Scene, private host: HTMLElement) {}

  play(event: BattleEvent, source: {x: number; y: number}, geometry: Geometry, speed: number, reduced: boolean) {
    const visual=event.visual;
    if (!visual || !event.targetPosition) return;
    const {cell,left,top}=geometry;
    const target=event.targetPosition;
    const x=left+(target.x+.5)*cell,y=top+(target.y+.38)*cell;
    const container=this.scene.add.container(x,y).setDepth(60);
    this.active.add(container);
    const graphic=this.scene.add.graphics();container.add(graphic);
    const cells=event.impactedPositions?.length?event.impactedPositions:[target];
    // One graphics object and one tween per cast; large areas have a bounded
    // presentation cost. The complete logical area remains in the Core event.
    const shown=cells.length>48?cells.filter((_,i)=>i%Math.ceil(cells.length/48)===0):cells;
    const color=visual.color;
    const radius=cell*(event.isLegend ? .48 : .32);
    graphic.lineStyle(reduced?1:2,color,.9);
    for (const [index,point] of shown.entries()) {
      const px=(point.x-target.x)*cell,py=(point.y-target.y)*cell;
      if (reduced) {graphic.strokeCircle(px,py,radius*.45);continue;}
      graphic.fillStyle(color,.18);
      switch(visual.style) {
        case 'slash':
          graphic.lineStyle(event.isLegend?5:3,color,.95).lineBetween(px-radius,py+radius,px+radius,py-radius);
          graphic.lineStyle(1,0xffffff,.65).lineBetween(px-radius*.6,py+radius,px+radius,py-radius*.6);break;
        case 'flame':
          graphic.fillStyle(color,.55).fillTriangle(px-radius,py+radius,px,py-radius*1.5,px+radius,py+radius);
          graphic.fillStyle(0xffecd0,.8).fillTriangle(px-radius*.35,py+radius*.5,px,py-radius*.7,px+radius*.35,py+radius*.5);break;
        case 'petal':
          for(let i=0;i<5;i++){const a=i*Math.PI*2/5+index*.4;graphic.fillStyle(color,.55).fillEllipse(px+Math.cos(a)*radius*.6,py+Math.sin(a)*radius*.6,radius*.7,radius*.4);}break;
        case 'vortex':
          for(let i=0;i<3;i++){graphic.lineStyle(2,color,.8-i*.15).beginPath().arc(px,py,radius*(.45+i*.3),i*1.2,i*1.2+Math.PI*1.5).strokePath();}break;
        case 'strike':
        case 'burst':
          for(let i=0;i<7;i++){const a=i*Math.PI*2/7;graphic.lineBetween(px+Math.cos(a)*radius*.4,py+Math.sin(a)*radius*.4,px+Math.cos(a)*radius,py+Math.sin(a)*radius);}graphic.strokeCircle(px,py,radius*.35);break;
        case 'ring':
          graphic.strokeCircle(px,py,radius).strokeCircle(px,py,radius*.55);break;
        default:graphic.fillCircle(px,py,radius*.55).strokeCircle(px,py,radius);
      }
    }
    if(!reduced && ['orb','slash','flame'].includes(visual.style)) {
      const trail=this.scene.add.graphics().lineStyle(2,color,.5)
        .lineBetween(left+(source.x+.5)*cell-x,top+(source.y+.38)*cell-y,0,0);
      container.addAt(trail,0);
    }
    this.host.dataset.lastSkillEffect=JSON.stringify({sequence:event.sequence,animationId:event.animationId,style:visual.style,cells:cells.length,drawn:shown.length,reduced});
    const finish=()=>{this.active.delete(container);container.destroy(true);this.host.dataset.activeSkillEffects=String(this.active.size);};
    this.host.dataset.activeSkillEffects=String(this.active.size);
    this.scene.tweens.add({targets:container,alpha:0,scaleX:reduced?1:1.12,scaleY:reduced?1:1.12,
      duration:Math.max(90,Math.min(900,visual.duration)/(speed||1)),ease:'Sine.easeOut',onComplete:finish});
  }

  clear() {
    for(const container of this.active){this.scene.tweens.killTweensOf(container);container.destroy(true);}
    this.active.clear();this.host.dataset.activeSkillEffects='0';
  }
}
