import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {cleaveImpactTiles,cleaveEnemyHits} from './battle-cleave-aim.mjs';
const frame=JSON.parse(readFileSync(new URL('./fixtures/kai-cleave-armored-replay.json',import.meta.url)));
test('actual armored replay exposes an empty aim tile that clips the apothecary',()=>{
 assert.equal(frame.tick,200);
 const kai=frame.units.find(u=>u.team===1),enemies=frame.units.filter(u=>u.team===2&&u.alive),aim={x:5,y:2,targetId:null};
 assert.equal(Math.abs(aim.x-kai.x)+Math.abs(aim.y-kai.y),1);
 assert.ok(!frame.units.some(u=>u.x===aim.x&&u.y===aim.y));assert.equal(enemies.some(u=>u.x===aim.x&&u.y===aim.y),false,'The old direct-target heuristic gave this zero hits');
 assert.equal(cleaveEnemyHits(kai,aim,enemies),1);assert.deepEqual(cleaveImpactTiles(kai,aim),[{x:5,y:2},{x:5,y:1},{x:5,y:3}]);
});
test('upward cleave hits the three-tile row rather than the forward column',()=>{
 assert.deepEqual(cleaveImpactTiles({x:4,y:3},{x:4,y:2}),[{x:4,y:2},{x:3,y:2},{x:5,y:2}]);
 assert.equal(cleaveEnemyHits({x:4,y:3},{x:4,y:2},[{x:3,y:2},{x:5,y:2},{x:4,y:1}]),2);
});
test('a real host-authorized empty-tile cast matches native impact, MP use and side damage',()=>{
 const live=JSON.parse(readFileSync(new URL('./fixtures/kai-cleave-live-cast.json',import.meta.url))),host=live.host,caster=live.units.find(u=>u.id===host.activeUnitId),enemies=live.units.filter(u=>u.team!==caster.team&&u.alive);
 assert.equal(host.action.unitId,caster.id);assert.equal(host.action.canAttack,true);assert.equal(host.action.mainActionCommitted,false);assert.equal(host.skill.available,true);
 assert.ok(host.targets.some(t=>t.skillId===host.skill.id&&t.x===live.aim.x&&t.y===live.aim.y&&t.targetId===null));assert.ok(!live.units.some(u=>u.x===live.aim.x&&u.y===live.aim.y));
 assert.equal(cleaveEnemyHits(caster,live.aim,enemies),1);
 const sorted=cells=>cells.map(p=>`${p.x},${p.y}`).sort();assert.deepEqual(sorted(cleaveImpactTiles(caster,live.aim)),sorted(live.nativeCast.impactedPositions));
 assert.equal(live.nativeCast.unitId,caster.id);assert.equal(live.nativeCast.skillId,host.skill.id);assert.deepEqual(live.nativeCast.targetPosition,{x:live.aim.x,y:live.aim.y});assert.equal(live.mpBefore-live.mpAfter,host.skill.mpCost);
 const damaged=enemies.find(u=>u.id===live.nativeDamage.unitId);assert.ok(live.nativeCast.impactedPositions.some(p=>p.x===damaged.x&&p.y===damaged.y));assert.equal(live.nativeDamage.sourceUnitId,caster.id);assert.equal(live.nativeDamage.amount,375);
});
test('the frozen skill is a default heavy-weapon cleave without a targeting override',()=>{
 const pack=JSON.parse(readFileSync(new URL('../public/data/packs/jyx/content-package.json',import.meta.url))),skill=pack.externalSkills.find(s=>s.id==='胡家刀法');
 assert.equal(skill.type,'daofa');assert.equal(skill.targeting,undefined);assert.deepEqual(skill.levelOverrides,[]);
});
