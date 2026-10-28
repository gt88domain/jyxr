import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/opening-graduation.json','utf8'));assert.ok(proof.passed&&proof.progressVerified);
const lesson=proof.checkpoints.find(c=>c.path.endsWith('opening-training-session-10.json')),graduated=proof.graduationCheckpoint;
for(const p of [lesson,graduated])assert.equal(createHash('sha256').update(await readFile(p.path)).digest('hex'),p.sha256);
const h=await createHarness('graduation-copy',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;report.sources=[lesson,graduated];report.notices=[];let failure;
async function load(p){await closeModal();await page.locator('#import-file').setInputFiles(p.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();}
async function dialogue(){for(let n=0;n<40&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});await load(lesson);
 const start=await state();
 for(const id of ['修炼密宗大手印','修炼无上大力杵','修炼漫天花雨']){
  await click(`[data-action="interact"][data-id="${id}"]`);await dialogue();
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('rank +1.'));
  const text=await page.locator('#toast').innerText();assert.doesNotMatch(text,/[\u3400-\u9fff]/);report.notices.push({id,text});assert.equal((await state()).silver,start.silver);
 }
 await noOverflow('Actual repeated lesson notices at 390px');await page.screenshot({path:h.output+'graduation-rank-notice.png'});
 pass('All three real course rank-up notices use English skill names, numeric gains and the existing overflow summary without changing fees');
 await load(graduated);const before=await state(),detail=await page.locator('[data-guidance]').innerText();
 assert.match(detail,/first two party slots/);assert.match(detail,/slot 2/);assert.match(detail,/Gear & study/);
 const action=await page.locator('[data-guidance] [data-next-step]').boundingBox();assert.ok(action&&action.y>=0&&action.y+action.height<=844&&action.height>=44);
 await noOverflow('Actual graduation directions at 390px');await page.screenshot({path:h.output+'graduation-directions.png'});
 await click('[data-action="party"]');const roster=await state();assert.equal(roster.party[2].definitionId,'达尔巴');assert.doesNotMatch(await page.locator('#game-modal').innerText(),/[\u3400-\u9fff]/);await closeModal();
 const after=await state();assert.deepEqual(after.adventure,before.adventure);assert.equal(after.silver,before.silver);assert.deepEqual(after.chapterJournal,before.chapterJournal);
 pass('Graduation names the real third companion and explains the original two-slot practice; exit stays on the first screen and reading preserves progress');
}catch(e){failure=e;}
await finish(failure);
