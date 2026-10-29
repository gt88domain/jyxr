import {cleaveImpactTiles} from './battle-cleave-aim.mjs';

// QA geometry, never a runtime mutation. Cast commands must still use a fresh
// host targets entry. Unknown shapes stop the caller rather than becoming Single.
const defaults={quanzhang:'single',qimen:'plus',daofa:'cleave',jianfa:'line'};
export function describeCast(pack,live){
 let base=pack.externalSkills.find(s=>s.id===live.id),form;
 if(!base){base=pack.externalSkills.find(s=>(form=s.formSkills?.find(f=>f.id===live.id)));}
 if(!base)return null;
 let shape=base.targeting?.impactType||defaults[base.type],power=base.powerBase+(live.level-1)*base.powerStep;
 for(const override of [...(base.levelOverrides||[])].filter(o=>o.level<=live.level).sort((a,b)=>a.level-b.level)){
  shape=override.targeting?.impactType||shape;if(override.powerOverride!=null)power=override.powerOverride;
 }
 if(form){shape=form.targeting?.impactType||shape;power+=form.powerExtra||0;}
 if(!['single','plus','cleave','line'].includes(shape))throw new Error('Unsupported QA impact shape: '+live.id+' '+shape);
 return {shape,power,control:!!form?.buffs?.some(b=>['麻痹','晕眩'].includes(b.id))};
}
export function impactCells(source,aim,shape,size,width,height){
 let cells;
 if(shape==='single')cells=[{x:aim.x,y:aim.y}];
 else if(shape==='plus'){cells=[];for(let offset=-size;offset<=size;offset++){cells.push({x:aim.x+offset,y:aim.y},{x:aim.x,y:aim.y+offset});}}
 else if(shape==='cleave')cells=cleaveImpactTiles(source,aim);
 else if(shape==='line'){const dx=aim.x-source.x,dy=aim.y-source.y,horizontal=Math.abs(dx)>=Math.abs(dy),sx=horizontal?(dx<0?-1:1):0,sy=horizontal?0:dy<0?-1:1;cells=Array.from({length:Math.max(1,size)},(_,i)=>({x:source.x+sx*(i+1),y:source.y+sy*(i+1)}));}
 else throw new Error('Unsupported QA impact shape: '+shape);
 return [...new Map(cells.filter(c=>c.x>=0&&c.y>=0&&c.x<width&&c.y<height).map(c=>[`${c.x},${c.y}`,c])).values()];
}
export function scoreAim(source,aim,skill,meta,enemies,width,height){
 const impact=impactCells(source,aim,meta.shape,skill.impactSize,width,height),hits=enemies.filter(e=>impact.some(p=>p.x===e.x&&p.y===e.y));
 return {impact,hitIds:hits.map(e=>e.id),score:hits.length?hits.length*10000+(meta.control?500:0)+meta.power*100-skill.mpCost*.1:0};
}
export function bestHostCast(battle,actor,pack){
 const enemies=battle.units.filter(u=>u.team!==actor.team&&u.alive),candidates=[];
 for(const aim of battle.targets){const skill=battle.skills.find(s=>s.id===aim.skillId&&s.available===true);if(!skill)continue;const meta=describeCast(pack,skill);if(!meta)continue;const score=scoreAim(actor,aim,skill,meta,enemies,battle.width,battle.height);if(score.score)candidates.push({aim,skill,meta,...score});}
 return candidates.sort((a,b)=>b.score-a.score)[0]||null;
}
export function planReachableMove(battle,actor,pack){
 const enemies=battle.units.filter(u=>u.team!==actor.team&&u.alive),available=battle.skills.filter(s=>s.available===true).map(skill=>({skill,meta:describeCast(pack,skill)})).filter(s=>s.meta);
 const metric=cell=>{
  let best=0;
  for(const {skill,meta} of available){
   const selfAllowed=battle.targets.some(t=>t.skillId===skill.id&&t.x===actor.x&&t.y===actor.y);
   for(let y=0;y<battle.height;y++)for(let x=0;x<battle.width;x++){
    if(Math.abs(x-cell.x)+Math.abs(y-cell.y)>skill.castSize||!selfAllowed&&x===cell.x&&y===cell.y)continue;
    best=Math.max(best,scoreAim(cell,{x,y},skill,meta,enemies,battle.width,battle.height).score);
   }
  }
  const distance=Math.min(...enemies.map(e=>Math.abs(e.x-cell.x)+Math.abs(e.y-cell.y))),aligned=enemies.filter(e=>e.x===cell.x||e.y===cell.y).length;
  // Immediate coverage wins; ties prefer fewer enemy firing lines and shorter
  // approach. This is a preference score, not a damage/survival prediction.
  return {score:best?best*100-aligned*10-distance:-distance*100-aligned*10,distance,aligned,bestCastScore:best};
 };
 const current=metric(actor),candidates=battle.reachable.filter(p=>p.x!==actor.x||p.y!==actor.y).map(cell=>({cell,metric:metric(cell)})).sort((a,b)=>b.metric.score-a.metric.score);
 return {current,candidates,cell:candidates[0]?.metric.score>current.score?candidates[0].cell:null};
}
