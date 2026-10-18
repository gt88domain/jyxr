export interface TapPoint {id:number; x:number; y:number;}

/** A tap is one short, stationary pointer in the same battle context. */
export class BoardTapGuard {
  private pointers=new Set<number>();
  private tap?: TapPoint & {at:number; context:string; cancelled:boolean};
  start(point:TapPoint,context:string,at=Date.now()) {
    this.pointers.add(point.id);
    if(this.pointers.size!==1){if(this.tap)this.tap.cancelled=true;return;}
    this.tap={...point,at,context,cancelled:false};
  }
  move(point:TapPoint) {
    if(this.tap?.id===point.id&&Math.hypot(point.x-this.tap.x,point.y-this.tap.y)>10)this.tap.cancelled=true;
  }
  finish(point:TapPoint,context:string,at=Date.now()):boolean {
    this.move(point);this.pointers.delete(point.id);
    const tap=this.tap;
    if(tap?.id===point.id)this.tap=undefined;
    return !!tap&&tap.id===point.id&&!tap.cancelled&&this.pointers.size===0&&tap.context===context&&at>=tap.at&&at-tap.at<800;
  }
  reset(){this.pointers.clear();this.tap=undefined;}
}
