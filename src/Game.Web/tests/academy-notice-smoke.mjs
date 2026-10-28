import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/opening-academy.json','utf8'));assert.ok(proof.passed);
const source=proof.afterBout;assert.equal(createHash('sha256').update(await readFile(source.path)).digest('hex'),source.sha256);
const h=await createHarness('academy-notice',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;let failure;
report.source=source;report.method='Unedited earned apprentice-aftermath checkpoint; normal Grimm turn-in and Grail Lodge entry, then one actual first lesson. No battle replay or injected notification.';
async function dialogue(){for(let n=0;n<80&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 for(let n=0;n<3;n++)await click('[data-guidance] [data-next-step]');await dialogue();
 if((await state()).phase==='world'){await click('[data-action="interact"][data-id="南贤"]');await dialogue();}
 assert.equal((await state()).phase,'sect');await click('[data-action="select-sect"][data-id="大轮寺"]');await dialogue();
 const before=await state();assert.equal(before.map.id,'门派大轮寺');assert.ok(!before.hero.externalSkills.some(s=>s.id==='密宗大手印'));
 await click('[data-action="save"]');await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');
 await (await waiting).saveAs(h.output+'opening-grail-before-first-lesson-save.json');await closeModal();
 report.beforeLesson={path:'src/Game.Web/test-results/opening-grail-before-first-lesson-save.json',sha256:createHash('sha256').update(await readFile(h.output+'opening-grail-before-first-lesson-save.json')).digest('hex')};
 await click('[data-guidance] [data-next-step]');await dialogue();
 await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('learned Iron Seal Strike (Rank 1).'));
 report.toast=await page.locator('#toast').innerText();assert.doesNotMatch(report.toast,/[\u3400-\u9fff]/);assert.match(report.toast,/1 more in Notifications/);
 const toast=await page.locator('#toast').boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(toast.y+toast.height<=nav.y,'Notice must not cover the common bottom controls');
 await noOverflow('Actual learned-skill notice at 390px');await page.screenshot({path:h.output+'academy-notice-mobile.png'});
 const learned=(await state()).hero.externalSkills.find(s=>s.id==='密宗大手印');assert.equal(learned.level,1);assert.equal((await state()).silver,before.silver);
 await click('[data-action="history"]');assert.equal(await page.locator('.activity-list p').filter({hasText:/^Rowan learned Iron Seal Strike \(Rank 1\)\.$/}).count(),1);
 await noOverflow('Actual learned-skill history at 390px');
 pass('Real first-lesson toast and saved-history presentation use English names, rank and overflow summary while preserving skill level and currency');
}catch(e){failure=e;}
await finish(failure);
