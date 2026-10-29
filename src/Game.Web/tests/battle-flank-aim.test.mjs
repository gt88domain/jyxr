import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {chooseFlankMove} from './battle-flank-aim.mjs';
import {cleaveEnemyHits} from './battle-cleave-aim.mjs';
test('the recorded first solo reachable set permits a side step instead of the old straight pursuit',()=>{
 const reachable=[{x:2,y:2},{x:3,y:2},{x:1,y:2},{x:2,y:3},{x:2,y:1}],choice=chooseFlankMove({x:2,y:2},{x:6,y:2},reachable);
 assert.deepEqual(choice.cell,{x:2,y:3});assert.ok(reachable.some(c=>c.x===choice.cell.x&&c.y===choice.cell.y));
});
test('the intent never invents the unobserved future diagonal destination',()=>{
 const choice=chooseFlankMove({x:3,y:2},{x:7,y:2},[{x:3,y:2}]);assert.equal(choice.cell,null);assert.deepEqual(choice.candidates,[]);
});
test('an already useful diagonal position is retained rather than circling closer',()=>{
 const choice=chooseFlankMove({x:6,y:3},{x:7,y:2},[{x:6,y:3},{x:5,y:3}]);assert.equal(choice.cell,null);assert.equal(choice.currentScore,0);
});
test('the actual stop retains a legal apothecary attack but no improving flank step or boss coverage',()=>{
 const f=JSON.parse(readFileSync(new URL('./fixtures/kai-flank-stopped.json',import.meta.url)));
 assert.equal(f.outcome,'ongoing');assert.equal(f.action.canMove,true);assert.equal(f.movementBudget.reported,false);
 assert.equal(chooseFlankMove(f.kai,f.boss,f.reachable).cell,null);assert.ok(!f.reachable.some(c=>c.x===3&&c.y===3),'canMove does not authorize stepping forward');
 assert.ok(f.targets.some(t=>cleaveEnemyHits(f.kai,t,[f.apothecary])>0));assert.ok(f.targets.every(t=>cleaveEnemyHits(f.kai,t,[f.boss])===0),'This is a limit of the boss-flank attempt, not a claim that the character has no legal combat action');
});
