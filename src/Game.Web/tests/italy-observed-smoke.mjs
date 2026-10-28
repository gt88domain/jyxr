import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const dir=process.env.PLAYTHROUGH_CHECKPOINTS;assert.ok(dir);
const file=dir+'/italy-trained.json',raw=await readFile(file);
const manifest=JSON.parse(await readFile(dir+'/manifest.json','utf8'));
assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.find(x=>x.name==='italy-trained').sha256);
const h=await createHarness('italy-observed',{viewport:{width:390,height:844}},{trace:false});
const {page,report,click,ready,state,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.outcomes=[];report.method='Unedited published normal-difficulty Italy-trained save; visible map, dialogue and automatic combat controls. An observed defeat is not a cleared chapter.';
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 report.start={sha256:createHash('sha256').update(raw).digest('hex'),hero:(await state()).hero};
 let battleId='',entered=false;
 for(let n=0;n<1500;n++){
  const s=await state();
  if(s.phase==='dialogue'){await click('[data-action="next"]');continue;}
  if(s.phase==='choice'){await click('[data-action="choice"][data-index="0"]');continue;}
  if(s.phase==='battle'){
   entered=true;battleId=s.battle.id;
   if(s.battle.outcome!=='ongoing'){
    report.outcomes.push({id:battleId,outcome:s.battle.outcome,units:s.battle.units});
    await click('[data-action="leave-battle"]');
    if(s.battle.outcome!=='win')break;
    continue;
   }
   const auto=page.locator('[data-action="battle-mode"][data-id="auto"][aria-pressed="false"]');
   if(await auto.count())await click('[data-action="battle-mode"][data-id="auto"]');
   await page.waitForTimeout(250);continue;
  }
  if(entered)break;
  const id=s.map.id==='大地图'?'风陵渡口':'返回';
  await click(`[data-action="interact"][data-id="${id}"]`);
 }
 assert.ok(report.outcomes.length,'Observe at least one real battle outcome');
 for(let n=0;n<20&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');
 report.ending={phase:(await state()).phase,map:(await state()).map?.id};
 if(report.outcomes.at(-1).outcome!=='win'){
  assert.ok((await state()).chapterJournal.completedStories.includes('鸳鸯刀正_风陵渡败'));
  await click('[data-action="save"]');await page.reload();
  await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
  assert.ok((await state()).chapterJournal.completedStories.includes('鸳鸯刀正_风陵渡败'));
  await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
  assert.ok(!(await state()).chapterJournal.completedStories.includes('鸳鸯刀正_风陵渡败'));
  report.recovery='Actual defeat persisted through save/reload; importing the intact pre-encounter save restored retry prerequisites.';
 }
 await page.screenshot({path:h.output+'italy-observed.png'});
 pass('Observed legal Italy continuation; real outcomes retained',report.outcomes.map(x=>({id:x.id,outcome:x.outcome})));
}catch(e){failure=e;}
await finish(failure);
