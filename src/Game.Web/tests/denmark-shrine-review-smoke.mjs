import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/denmark-shrine.json','utf8'));
assert.ok(proof.passed&&proof.recoveryVerified);assert.equal(proof.journeyOutcome,'lose');assert.equal(proof.progressVerified,false);
for(const p of [proof.source,proof.beforeEncounter,proof.restored])assert.equal(createHash('sha256').update(await readFile(p.path)).digest('hex'),p.sha256);
const h=await createHarness('denmark-shrine-review',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,state,noOverflow,pass,finish}=h;
report.method='Display-only import of actual 330-silver source, pre-encounter and defeat-restored exports. No travel, battle, choice, saving, export or retry; cannot recheck a live-battle toast from a world save.';report.progressVerified=false;report.actualJourneyOutcome='lose';report.liveBattleToastAfterFix='NOT_RUN';report.guidance=[];
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 for(const p of [proof.source,proof.beforeEncounter,proof.restored]){
  await page.locator('#import-file').setInputFiles(p.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
  const before=await state();assert.equal(before.silver,330);assert.equal(before.party.length,10);assert.equal(before.adventure.morality,54);assert.equal(before.party.find(c=>c.definitionId==='胡斐').level,6);
  assert.doesNotMatch(await page.locator('#app').innerText(),/[\u3400-\u9fff]/);const guide=await page.locator('[data-guidance]').innerText();assert.ok(guide.includes('Kai fights two poisoners ALONE'));assert.ok(guide.includes('If you killed the apothecary'));
  const button=page.locator('[data-guidance] [data-next-step]');assert.equal(await button.count(),1);const box=await button.boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(box.height>=44&&box.y+box.height<=nav.y);report.guidance.push({source:p,button:await button.innerText(),bounds:box});
  assert.equal(before.pack.displayCatalog.byCategory.characters['田归农'].name,'The Guildmaster');assert.equal(before.pack.displayCatalog.byCategory.characters['变态田归农'].name,'The Guildmaster');
  await noOverflow('Actual source or restored '+before.map.name);const after=await state();assert.deepEqual(after.party,before.party);assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.deepEqual(after.inventory,before.inventory);assert.equal(after.silver,before.silver);
 }
 await page.screenshot({path:h.output+'denmark-shrine-restored-reviewed.png'});
 pass('Real source, pre-encounter and restored exports keep English warnings, correct shared role names and 44px first-screen actions without retrying the defeated battle');
}catch(e){failure=e;}
await finish(failure);
