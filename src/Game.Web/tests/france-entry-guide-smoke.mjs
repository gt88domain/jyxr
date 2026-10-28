import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/opening-france.json','utf8'));
assert.ok(proof.passed&&proof.progressVerified);
const sources=[proof.beforeFrance,proof.checkpoint];
for(const source of sources)assert.equal(createHash('sha256').update(await readFile(source.path)).digest('hex'),source.sha256);
const h=await createHarness('france-entry-guide',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
report.sources=sources;report.method='Read the final caravan warning, completed Spain instruction and rescue objective using this new-game chain’s genuine prebattle and recruitment exports. No repeat battle, point allocation, travel or story choice.';let failure;
async function load(source){await closeModal();await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();}
async function unchanged(before){const after=await state();assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.deepEqual(after.party,before.party);assert.equal(after.silver,before.silver);}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});await load(sources[0]);let before=await state();assert.equal(before.silver,62);
 const guide=await page.locator('[data-guidance]').innerText();for(const text of ['Save before visiting','Only you and Milady','companions sit this one out','Threefold Swordplay Manual'])assert.ok(guide.includes(text),text);assert.doesNotMatch(guide,/[\u3400-\u9fff]/);
 const button=await page.locator('[data-guidance] [data-next-step]').boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(button.height>=44&&button.y+button.height<=nav.y,'Caravan action stays above the bottom navigation at 390px');
 await noOverflow('Real caravan warning and first-screen action at 390px');await page.screenshot({path:h.output+'france-caravan-warning.png'});
 await click('[data-action="quests"]');await page.locator('[data-journey-story="dulcinea-ending"] summary').click();const ending=await page.locator('[data-journey-story="dulcinea-ending"]').innerText();assert.match(ending,/her row and column/);assert.match(ending,/her own tile/);await closeModal();
 await click('[data-action="loadout"]');const lady=before.party.find(c=>c.definitionId==='李文秀');await page.locator('#managed-character').selectOption(lady.id);await ready();const managed=(await state()).managedCharacter;report.spells=managed.externalSkills;
 for(const id of ['黑血神针','流星锤']){const skill=managed.externalSkills.find(s=>s.id===id);assert.match(skill.description,/your own tile/);assert.match(skill.description,/row or column/);assert.doesNotMatch(skill.description,/[\u3400-\u9fff]/);}
 assert.equal(managed.cultivation.level,2);assert.equal(managed.cultivation.exp,74);assert.equal(managed.unspentStatPoints,30);await closeModal();await unchanged(before);
 pass('Actual prebattle goal names the fixed duo and save point; Spain diary and both learned spell descriptions explain self-centered casting without changing the earned build');
 await load(sources[1]);before=await state();assert.equal(before.silver,82);assert.ok(before.roster.some(c=>c.definitionId==='霍青桐'));assert.ok(!before.roster.some(c=>c.definitionId==='陈家洛'));const next=await page.locator('[data-guidance]').innerText();for(const text of ["Cardinal's prisoner",'50% chance','twelve guards','defeat ends the journey'])assert.ok(next.includes(text),text);
 await click('[data-action="quests"]');assert.match(await page.locator('#game-modal').innerText(),/Prepare your party and save first/);await closeModal();await unchanged(before);await noOverflow('Earned France rescue instructions at 390px');await page.screenshot({path:h.output+'france-rescue-reviewed.png'});
 pass('Recruitment save opens the original rescue objective, preserves both older story and party preparation, and warns about the existing chance and defeat consequence');
}catch(e){failure=e;}
await finish(failure);
