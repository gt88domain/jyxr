import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const prior=JSON.parse(await readFile('src/Game.Web/test-results/opening-spain-recruitment-observed.json','utf8')),source=prior.met;
assert.equal(createHash('sha256').update(await readFile(source.path)).digest('hex'),source.sha256);
const warehouse=JSON.parse(await readFile('src/Game.Web/test-results/opening-spain-warehouse-observed.json','utf8')).ready;
assert.equal(createHash('sha256').update(await readFile(warehouse.path)).digest('hex'),warehouse.sha256);
const h=await createHarness('spain-night-guide',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;report.sources=[source,warehouse];report.method='Read updated patrol and warehouse-entry directions on their genuine earned checkpoints. No repeat battle, date advance or choice.';let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const before=await state(),text=await page.locator('[data-guidance]').innerText();
 for(const phrase of ['Save on the map','Quiet visits','Return the supplies first','costs 5 trust','ends the journey','only you and Dulcinea'])assert.ok(text.includes(phrase),phrase);
 assert.doesNotMatch(text,/[\u3400-\u9fff]/);const button=await page.locator('[data-guidance] [data-next-step]').boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(button.height>=44&&button.y+button.height<=nav.y);
 await click('[data-action="quests"]');assert.match(await page.locator('#game-modal').innerText(),/costs 5 trust/);await closeModal();
 const after=await state();assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.equal(after.silver,before.silver);
 await noOverflow('Real night-patrol guidance at 390px');await page.screenshot({path:h.output+'spain-night-guidance.png'});
 pass('Night directions explain the actual save point, Trust effects, fatal optional test and fixed patrol team; reading preserves recorded facts');
 await page.locator('#import-file').setInputFiles(warehouse.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const entered=await state(),directions=await page.locator('[data-guidance]').innerText();assert.match(directions,/If no scene starts/);assert.match(directions,/use Back/);assert.match(directions,/50% chance/);
 await click('[data-action="quests"]');await closeModal();const reviewed=await state();assert.deepEqual(reviewed.adventure,entered.adventure);assert.deepEqual(reviewed.chapterJournal,entered.chapterJournal);assert.equal(reviewed.silver,21);
 await noOverflow('Real warehouse-entry directions at 390px');await page.screenshot({path:h.output+'spain-warehouse-guidance.png'});
 pass('Actual ready checkpoint explains a quiet warehouse visit and the existing retry without entering combat or changing progress');
}catch(e){failure=e;}
await finish(failure);
