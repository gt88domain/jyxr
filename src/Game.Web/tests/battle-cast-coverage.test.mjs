import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {describeCast,impactCells,bestHostCast,planReachableMove} from './battle-cast-coverage.mjs';
const pack=JSON.parse(readFileSync(new URL('../public/data/packs/jyx/content-package.json',import.meta.url)));
test('current party skills resolve to the frozen Single, Plus, Cleave and Line shapes',()=>{
 for(const [id,level,shape] of [['密宗大手印',16,'single'],['无上大力杵',15,'plus'],['百花错拳.百花缭乱',10,'plus'],['夫妻刀法',7,'cleave'],['三分剑法',4,'line']])assert.equal(describeCast(pack,{id,level}).shape,shape);
 assert.equal(describeCast(pack,{id:'打鸡血',level:1}),null);
});
test('Plus is centered on the aim and does not hit diagonal tiles',()=>{
 const cells=impactCells({x:2,y:2},{x:4,y:2},'plus',2,11,4);assert.ok(cells.some(p=>p.x===6&&p.y===2));assert.ok(cells.some(p=>p.x===4&&p.y===0));assert.ok(!cells.some(p=>p.x===5&&p.y===1));assert.equal(new Set(cells.map(p=>p.x+','+p.y)).size,cells.length);
});
test('Single stays one tile even with an impactSize value of five',()=>{
 assert.deepEqual(impactCells({x:0,y:0},{x:3,y:0},'single',5,11,4),[{x:3,y:0}]);
});
test('Cleave clips the grid edge and Line can hit beyond an empty neighboring aim',()=>{
 assert.deepEqual(impactCells({x:6,y:3},{x:7,y:3},'cleave',1,11,4),[{x:7,y:3},{x:7,y:2}]);
 assert.deepEqual(impactCells({x:2,y:2},{x:3,y:2},'line',4,11,4),[{x:3,y:2},{x:4,y:2},{x:5,y:2},{x:6,y:2}]);
});
test('cast selection only returns actual host targets, including empty-tile side hits',()=>{
 const f=JSON.parse(readFileSync(new URL('./fixtures/kai-cleave-live-cast.json',import.meta.url))),actor=f.units[0],battle={width:11,height:4,units:f.units,skills:[{...f.host.skill,id:'胡家刀法',impactSize:1}],targets:f.host.targets};
 const cast=bestHostCast(battle,actor,pack);assert.ok(battle.targets.includes(cast.aim));assert.equal(cast.aim.targetId,null);assert.deepEqual(cast.hitIds,['participant_2_battle_2_阎基']);assert.equal(bestHostCast({...battle,targets:[]},actor,pack),null);
});
test('movement intent cannot invent a future tile absent from the host reachable list',()=>{
 const actor={id:'hero',team:1,alive:true,x:2,y:2},enemy={id:'enemy',team:2,alive:true,x:8,y:1},battle={width:11,height:4,units:[actor,enemy],skills:[{id:'密宗大手印',level:16,available:true,castSize:3,impactSize:1,mpCost:352}],targets:[],reachable:[{x:2,y:2},{x:3,y:2}]};
 assert.deepEqual(planReachableMove(battle,actor,pack).cell,{x:3,y:2});assert.equal(planReachableMove({...battle,reachable:[{x:2,y:2}]},actor,pack).cell,null);
});
test('all four shapes match real native impacts and Energy use from the one recruitment attempt',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/britain-recruitment-casts.json',import.meta.url))),sorted=cells=>cells.map(p=>p.x+','+p.y).sort();
 assert.deepEqual(fixture.cases.map(c=>c.shape),['single','plus','cleave','line']);
 for(const c of fixture.cases){assert.equal(c.skill.available,true);assert.equal(c.native.isLegend,false);assert.equal(describeCast(pack,c.skill).shape,c.shape);assert.equal(c.native.skillId,c.skill.id);assert.equal(c.selectedHostTarget.skillId,c.skill.id);assert.equal(c.native.unitId,c.actor.id);assert.deepEqual(c.native.targetPosition,{x:c.selectedHostTarget.x,y:c.selectedHostTarget.y});assert.equal(c.mpBefore-c.mpAfter,c.skill.mpCost);assert.deepEqual(sorted(impactCells(c.actor,c.selectedHostTarget,c.shape,c.skill.impactSize,fixture.grid.width,fixture.grid.height)),sorted(c.native.impactedPositions));}
});
test('the actual Musashi-route interruption frame can inspect usable skills without requiring an unavailable Star form',()=>{
 const f=JSON.parse(readFileSync(new URL('./fixtures/musashi-route-disabled-star.json',import.meta.url))),b=f.battle,actor=b.units.find(u=>u.id===b.activeUnitId);
 assert.equal(b.tick,83);
 const star=b.skills.find(s=>s.id==='庖丁解牛.游刃有余');
 assert.equal(star.available,false);assert.equal(star.reason,'怒气不足。');
 assert.equal(describeCast(pack,star),null);
 assert.doesNotThrow(()=>b.skills.map(s=>describeCast(pack,s)));
 const cast=bestHostCast(b,actor,pack);
 assert.ok(cast);assert.equal(cast.skill.available,true);assert.ok(b.targets.includes(cast.aim));
 assert.ok(cast.hitIds.length>0);assert.notEqual(cast.skill.id,star.id);
});
test('making the same Star form available in an offline fixture still stops unsupported geometry',()=>{
 const f=JSON.parse(readFileSync(new URL('./fixtures/musashi-route-disabled-star.json',import.meta.url))),star=f.battle.skills.find(s=>s.id==='庖丁解牛.游刃有余');
 assert.throws(()=>describeCast(pack,{...star,available:true}),/Unsupported QA impact shape: 庖丁解牛\.游刃有余 star/);
});
