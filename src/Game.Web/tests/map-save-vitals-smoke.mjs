import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/opening-ledger.json','utf8'));assert.ok(proof.passed);
assert.equal(createHash('sha256').update(await readFile(proof.checkpoint.path)).digest('hex'),proof.checkpoint.sha256);
const resources=s=>({hp:s.hero.hp,maxHp:s.hero.maxHp,mp:s.hero.mp,maxMp:s.hero.maxMp,silver:s.silver,map:s.map.id});

// Diagnose existing behavior only. A report passing means the discrepancy was
// reproduced, not that exact current-resource persistence has been repaired.
for(const route of ['load','travel']){
 const h=await createHarness('map-save-vitals-'+route,{viewport:{width:390,height:844}},{trace:false});
 const {page,report,ready,click,state,closeModal,pass,finish}=h;let failure;
 report.source=proof.checkpoint;report.diagnosisOnly=true;report.method='Two isolated branches from the same unedited genuine opening export; actual turn-in and original apprentice choice. Compare saving/loading in place with ordinary travel, without changing rules or save data.';
 async function dialogue(){for(let n=0;n<80&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');}
 try{
  await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
  await page.locator('#import-file').setInputFiles(proof.checkpoint.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();report.start=resources(await state());
  for(let n=0;n<3;n++)await click('[data-guidance] [data-next-step]');await dialogue();assert.equal((await state()).phase,'choice');await click('[data-action="choice"][data-index="0"]');await dialogue();
  const before=await state();assert.equal(before.phase,'world');report.afterTurnIn=resources(before);
  assert.equal(before.hero.maxHp,report.start.maxHp+100);assert.equal(before.hero.maxMp,report.start.maxMp+100);assert.equal(before.hero.hp,report.start.hp);assert.equal(before.hero.mp,report.start.mp);assert.equal(before.silver,260);
  await click('[data-action="guide"]');await closeModal();report.afterReading=resources(await state());assert.deepEqual(report.afterReading,report.afterTurnIn);
  await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const file=h.output+'map-save-vitals-'+route+'-raw.json';await (await waiting).saveAs(file);await closeModal();
  const raw=JSON.parse(await readFile(file,'utf8')),hero=raw.game.characters.find(c=>c.id==='主角');assert.ok(hero);report.savedCharacterFields=Object.keys(hero);
  for(const key of ['currentHp','currentMp','hp','mp'])assert.equal(key in hero,false,'Current resource fields are absent from the existing character record');
  await click('[data-action="save"]');report.afterSave=resources(await state());assert.deepEqual(report.afterSave,report.afterTurnIn);
  if(route==='travel'){
   await click('[data-action="interact"][data-id="返回"]');report.afterTravel=resources(await state());
   assert.equal(report.afterTravel.map,'大地图');assert.equal(report.afterTravel.hp,before.hero.maxHp);assert.equal(report.afterTravel.mp,before.hero.maxMp);assert.equal(report.afterTravel.silver,260);
   await click('[data-action="save"]');
  }
  await page.reload();await page.locator('[data-action="new"]').waitFor({timeout:120000});
  // A separate manual button only appears when a newer autosave exists.
  report.loadingAction=await page.locator('[data-action="load-manual"]').isVisible()?'load-manual':'load';
  await click(`[data-action="${report.loadingAction}"]`);report.afterLoad=resources(await state());
  assert.equal(report.afterLoad.hp,before.hero.maxHp);assert.equal(report.afterLoad.mp,before.hero.maxMp);assert.equal(report.afterLoad.silver,260);
  if(route==='load'){assert.equal(report.afterLoad.map,report.afterTurnIn.map);assert.notEqual(report.afterLoad.hp,report.afterSave.hp);}
  else assert.deepEqual(report.afterLoad,report.afterTravel);
  pass(route==='load'?'Reproduced in-place resource normalization after save/reload; saving and reading alone leave current values unchanged':'Ordinary travel already restores resources before loading; the full-resource map save then reloads without another change');
 }catch(e){failure=e;}
 await finish(failure);if(failure)break;
}
