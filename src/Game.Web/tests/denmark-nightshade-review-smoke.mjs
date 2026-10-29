import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/denmark-nightshade-spare.json','utf8'));
assert.ok(proof.passed&&proof.progressVerified&&proof.englishCopyVerified);
for(const p of [proof.source,proof.imported,proof.beforeEncounter,proof.afterSpare,proof.checkpoint])assert.equal(createHash('sha256').update(await readFile(p.path)).digest('hex'),p.sha256);
const h=await createHarness('denmark-nightshade-review',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
report.method='Display review of real before/after QA exports in another independent browser. No travel, fight, encounter activation, choice, saving or export. Import can re-evaluate original probabilistic map availability; this review does not require a chance event to reappear. The original baseline and tested ten-person result are not overwritten.';
const items=s=>s.inventory.map(i=>({id:i.id,count:i.count,entryNumber:i.entryNumber}));
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});report.guidance=[];
 for(const p of [proof.imported,proof.beforeEncounter,proof.afterSpare,proof.checkpoint]){
  await page.locator('#import-file').setInputFiles(p.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
  const before=await state(),text=await page.locator('#app').innerText();assert.doesNotMatch(text,/[\u3400-\u9fff]/);
  let action=page.locator('[data-guidance] [data-next-step]');const count=await action.count();
  if(count===0){assert.equal(p.path,proof.beforeEncounter.path);assert.equal(before.map.id,'大地图');assert.ok(!before.map.locations.some(l=>l.id==='阎基居'&&l.action));assert.ok(text.includes('50% chance'));report.importedEntryUnavailable=true;action=page.locator('[data-guidance] [data-action="loadout"]');}
  assert.equal(await action.count(),1);const b=await action.boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(b.height>=44&&b.y+b.height<=nav.y,'First-screen action at '+before.map.id);report.guidance.push({source:p,map:before.map.id,eventButton:count===1,button:await action.innerText(),bounds:b});
  await noOverflow('Actual ingredient path '+before.map.name);const after=await state();assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.party,before.party);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.deepEqual(items(after),items(before));assert.equal(after.silver,before.silver);
 }
 pass('Real exports keep English guidance and 44px first-screen actions; the existing chance is respected, with Gear & study available when the imported event is absent');
 const before=await state();assert.equal(before.silver,330);assert.equal(before.party.length,10);assert.equal(before.adventure.morality,54);
 for(const id of ['白马啸西风_完结2','书剑恩仇录_庖丁解牛胜','鸳鸯刀正_风陵渡胜'])assert.ok(before.chapterJournal.completedStories.includes(id));
 await click('[data-action="party"]');await click('[data-roster-id="阎基"] [data-panel="cultivation"]');report.apothecary=(await state()).managedCharacter;assert.equal(report.apothecary.level,10);assert.equal(report.apothecary.cultivation,null);assert.ok(report.apothecary.equipment.every(e=>!e.item));await noOverflow('Actual apothecary equipment and study entry');
 await click('[data-action="character"]');await page.locator('[data-talent-id="自我主义"] > summary').click();report.apothecaryTalent=await page.locator('[data-talent-id="自我主义"]').innerText();assert.ok(report.apothecaryTalent.includes('Self-Interest'));assert.doesNotMatch(await page.locator('#game-modal').innerText(),/[\u3400-\u9fff]/);await closeModal();
 await click('[data-action="inventory"]');report.bag=await page.locator('#game-modal').innerText();assert.ok(report.bag.includes('Nightshade Blossom'));assert.ok(report.bag.includes('Frontier Cleave Manual'));assert.doesNotMatch(report.bag,/[\u3400-\u9fff]/);await closeModal();
 const after=await state();assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.party,before.party);assert.deepEqual(items(after),items(before));assert.equal(after.silver,before.silver);await page.screenshot({path:h.output+'denmark-nightshade-investigation-reviewed.png'});
 pass('Three prior chapters persist; the actual tenth companion has readable gear/study access and talent copy, and both original quest rewards have English names without training or consuming them');
}catch(e){failure=e;}
await finish(failure);
