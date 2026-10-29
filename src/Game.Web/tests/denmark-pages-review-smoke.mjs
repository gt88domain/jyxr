import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const proof=JSON.parse(await readFile('src/Game.Web/test-results/denmark-pages-name-observed.json','utf8'));
assert.equal(proof.battle.outcome,'win');assert.ok(proof.observed);assert.equal(proof.income,10);
for(const p of [proof.ready,proof.observed])assert.equal(createHash('sha256').update(await readFile(p.path)).digest('hex'),p.sha256);
const h=await createHarness('denmark-pages-review',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
report.sources=[proof.ready,proof.observed];report.actualCombatReport='denmark-pages-name-observed.json';
report.method='Review the actual before-fight and real victory exports after fixing the Pages naming suffix. No repeated battle, travel, purchases, training, item use, inventory grants or world-story advancement. Save/load uses an isolated browser profile. Historical journal strings are not rewritten.';
const build=({hp,mp,...c})=>c,items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));
async function load(p){await closeModal();await page.locator('#import-file').setInputFiles(p.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();}
async function unchanged(before){const s=await state();assert.deepEqual(s.party,before.party);assert.deepEqual(s.adventure,before.adventure);assert.deepEqual(s.chapterJournal,before.chapterJournal);assert.deepEqual(items(s),items(before));assert.equal(s.silver,before.silver);}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});await load(proof.ready);let before=await state();
 assert.equal(before.silver,276);assert.equal(before.party[7].definitionId,'胡斐');assert.equal(before.map.locations.find(l=>l.id==='阎基居').action,'story');
 const warning=await page.locator('[data-guidance]').innerText();assert.ok(warning.includes('Your hero and Kai'));assert.ok(warning.includes('loss or timeout ends this journey'));assert.ok(!warning.includes('Pages Manual'));assert.doesNotMatch(warning,/[\u3400-\u9fff]/);
 const button=await page.locator('[data-guidance] [data-next-step]').boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(button.height>=44&&button.y+button.height<=nav.y);await noOverflow('Final pages warning and actual entry at 390px');await page.screenshot({path:h.output+'denmark-pages-invitation-reviewed.png'});await unchanged(before);
 pass('Real pre-fight save retains the warning and eighth-slot Kai; reading the final guide does not travel or consume the invitation');
 await load(proof.observed);before=await state();assert.equal(before.silver,286);assert.equal(before.party.length,8);assert.equal(before.adventure.morality,56);
 const pages=before.inventory.find(i=>i.id==='两页胡家刀法'),remedy=before.inventory.find(i=>i.id==='天王保命丹');assert.equal(pages.count,1);assert.equal(remedy.count,1);assert.equal(pages.name,'Frontier Cleave Pages');
 await click('[data-action="quests"]');await page.locator('[data-journey-story="denmark-pages-found"] > summary').click();
 report.pagesGuide=await page.locator('[data-journey-story="denmark-pages-found"]').innerText();for(const t of ['not the whole Denmark story','Winter Cottage','Kai is required; two party members fight'])assert.ok(report.pagesGuide.includes(t),t);
 await page.locator('.journey-full > summary').click();await page.locator('.journey-journal > summary').click();report.journal=await page.locator('.journey-full').innerText();assert.ok(report.journal.includes('Recovered Kai'));assert.ok(report.journal.includes('Last-Light Remedy'));assert.doesNotMatch(report.journal,/[\u3400-\u9fff]/);await noOverflow('Real pages reward and nested journal');await closeModal();await unchanged(before);
 pass('The genuine world outcome contains one reusable pages item and one remedy, with the recorded quest flag and English journal; it is not a full Denmark ending');
 await click('[data-action="party"]');await click('[data-roster-id="胡斐"] [data-panel="cultivation"]');let s=await state();report.kai=s.managedCharacter;report.rewardPages=s.inventory.find(i=>i.id==='两页胡家刀法');
 assert.equal(report.kai.cultivation,null);assert.equal(report.rewardPages.training.studyLimit,5);assert.ok(report.rewardPages.canCultivate);assert.ok(report.rewardPages.requirements.every(r=>r.met));
 const card=page.locator('.as-material[data-item-id="两页胡家刀法"]');assert.equal(await card.locator('h4').innerText(),'Frontier Cleave Pages');assert.ok((await card.innerText()).includes('Rank 5'));await card.locator('.as-requirements summary').click();
 assert.ok((await card.innerText()).includes('Current 50 / Required 45'));assert.ok((await card.innerText()).includes('Current 72 / Required 60'));assert.equal(await card.locator('[data-action="cultivate"]').isDisabled(),false);
 assert.doesNotMatch(await page.locator('[data-adventurer-sheet]').innerText(),/[\u3400-\u9fff]/);await noOverflow('Correct Pages label and actual Kai requirements');await card.scrollIntoViewIfNeeded();await page.screenshot({path:h.output+'denmark-pages-reward-reviewed.png'});await closeModal();await unchanged(before);
 pass('Kai can inspect Heavy Weapons 50/45 and Insight 72/60, a Rank 5 teaching limit and the available guide; no study is assigned merely by receiving or viewing it');
 const saveBefore=await state();await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');s=await state();
 assert.deepEqual(s.party.map(build),saveBefore.party.map(build));assert.deepEqual(s.adventure,saveBefore.adventure);assert.deepEqual(s.chapterJournal,saveBefore.chapterJournal);assert.deepEqual(items(s),items(saveBefore));assert.equal(s.silver,286);
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const file=h.output+'denmark-pages-complete-save.json';await (await waiting).saveAs(file);await closeModal();
 report.checkpoint={path:'src/Game.Web/test-results/denmark-pages-complete-save.json',sha256:createHash('sha256').update(await readFile(file)).digest('hex')};
 const raw=JSON.parse(await readFile(file)),original=JSON.parse(await readFile(proof.source.path));assert.deepEqual(raw.game.worldTriggerState,original.game.worldTriggerState);report.worldTriggerState=raw.game.worldTriggerState;report.progressVerified=true;
 pass('Manual save/load and actual export retain the eight-person builds, fixed rewards, 286 silver and original world-trigger state; current Health/Energy remain a separate known boundary');
}catch(e){failure=e;}
await finish(failure);
