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
test('the frozen skill is a default heavy-weapon cleave without a targeting override',()=>{
 const pack=JSON.parse(readFileSync(new URL('../public/data/packs/jyx/content-package.json',import.meta.url))),skill=pack.externalSkills.find(s=>s.id==='胡家刀法');
 assert.equal(skill.type,'daofa');assert.equal(skill.targeting,undefined);assert.deepEqual(skill.levelOverrides,[]);
});
