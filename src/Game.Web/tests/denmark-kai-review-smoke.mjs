import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/denmark-kai.json','utf8'));
assert.ok(proof.passed&&proof.progressVerified&&proof.englishCopyVerified);
for(const p of [proof.ready,proof.checkpoint])assert.equal(createHash('sha256').update(await readFile(p.path)).digest('hex'),p.sha256);
const h=await createHarness('denmark-kai-review',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
report.sources=[proof.ready,proof.checkpoint];report.method='Read-only final wording review of the actual pre-match and recruited exports. No repeat combat, travel, training, rewards or world-story interaction.';
async function load(p){await closeModal();await page.locator('#import-file').setInputFiles(p.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();}
async function unchanged(before){const after=await state();assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.deepEqual(after.party,before.party);assert.equal(after.silver,before.silver);}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});await load(proof.ready);let before=await state();assert.equal(before.silver,266);
 const text=await page.locator('[data-guidance]').innerText();assert.ok(text.includes('hero ALONE'));assert.ok(text.includes("before discussing Grimm's first letter"));assert.doesNotMatch(text,/[\u3400-\u9fff]/);
 const button=await page.locator('[data-guidance] [data-next-step]').boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(button.height>=44&&button.y+button.height<=nav.y);
 assert.equal(before.map.locations.find(l=>l.id==='胡斐居').action,'story');
 await noOverflow('Final natural-English Kai invitation at 390px');await page.screenshot({path:h.output+'denmark-kai-invitation-reviewed.png'});await unchanged(before);
 pass('The actual available invitation explains the solo match and Grimm’s first letter in plain English, with an actionable first-screen button');
 await load(proof.checkpoint);before=await state();assert.equal(before.silver,276);assert.equal(before.party.length,8);assert.equal(before.adventure.morality,56);
 await click('[data-action="quests"]');await page.locator('[data-journey-story="denmark-kai-recruited"] > summary').click();
 assert.ok((await page.locator('[data-journey-story="denmark-kai-recruited"]').innerText()).includes('not the whole Denmark story'));
 await page.locator('.journey-full > summary').click();await page.locator('.journey-journal > summary').click();
 assert.equal(await page.locator('[data-journey-focus] > span').innerText(),'Denmark · Meet Kai');
 const journal=await page.locator('.journey-full').innerText();assert.ok(journal.includes('An Unwelcome Shadow · Received'));assert.ok(journal.includes('Kai joined the party.'));assert.doesNotMatch(journal,/[\u3400-\u9fff]/);
 await noOverflow('Actual Kai conclusion, journal and correct story title');await closeModal();await unchanged(before);
 pass('The genuine conclusion and nested journal use the current chapter title; received news does not claim its follow-up was completed');
 await click('[data-action="party"]');await click('[data-roster-id="胡斐"] [data-panel="cultivation"]');
 const kai=(await state()).managedCharacter;assert.equal(kai.level,4);assert.equal(kai.externalSkills.find(s=>s.id==='胡家刀法').level,3);assert.equal(kai.internalSkills.find(s=>s.id==='基本内功').level,5);assert.equal(kai.cultivation,null);assert.ok(kai.equipment.every(g=>!g.item));
 assert.doesNotMatch(await page.locator('[data-adventurer-sheet]').innerText(),/[\u3400-\u9fff]/);await closeModal();await unchanged(before);
 pass('Kai’s actual untrained build is inspectable through Party → Study; no gear, guide or growth is added by reading it');
}catch(e){failure=e;}
await finish(failure);
