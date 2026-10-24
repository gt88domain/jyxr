import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {academyStep} from '../src/academy-guide.ts';
import {uiSurfaces} from '../src/ui-surfaces.ts';
const pack=JSON.parse(readFileSync(new URL('../public/data/packs/worlds/en/content-package.json',import.meta.url))).browser;
const graduation='门派大轮寺_大轮寺出师';
function state(map='门派大轮寺',done=[],days=1){return {pack,map:{id:map},chapterJournal:{completedStories:done},adventure:{days}};}
test('organization guide uses saved graduation, not the clock or a guessed training count',()=>{
 for(const day of [0,40,60,90]){
  const g=academyStep(state('门派大轮寺',[],day));assert.equal(g.graduated,false);
  assert.equal(g.route.find(r=>r.mapId==='门派大轮寺').locationId,'修炼密宗大手印');
 }
});
test('graduation points to the real two-stage exit and preserves the school route until departure',()=>{
 for(const map of ['门派大轮寺','大轮寺雪山']){
  const g=academyStep(state(map,[graduation],61));assert.equal(g.graduated,true);
  assert.equal(g.route.find(r=>r.mapId===map).locationId,map==='门派大轮寺'?'大轮寺雪山':'返回');
 }
 assert.equal(academyStep(state('大地图',[graduation],62)),null);
});
test('guidance reads never change a save, clock or random state',()=>{
 const s=state(),before=structuredClone(s),random=Math.random;
 Math.random=()=>{throw new Error('Guide must never roll an event');};
 try{for(let n=0;n<20;n++)academyStep(s);}finally{Math.random=random;}
 assert.deepEqual(s,before);
});
test('surface inventory has exactly 27 unique purposes and dedicated owners for new screens',()=>{
 assert.equal(uiSurfaces.length,27);assert.equal(new Set(uiSurfaces.map(s=>s[0])).size,27);
 for(const id of ['local-map','academy','quests'])assert.equal(uiSurfaces.find(s=>s[0]===id)[3],'replaced');
});
