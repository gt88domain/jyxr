import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const folder=process.env.KNIGHT_REPORT_DIR||fileURLToPath(new URL('../../../artifacts/knight-branch-observed/',import.meta.url));
const native=JSON.parse(await readFile(folder+'report.json','utf8'));assert.ok(native.passed);
const h=await createHarness(process.env.GAME_WEB_REPORT||'knight-branch',{viewport:{width:390,height:844}},{trace:false});
const {page,report,click,ready,state,closeModal,noOverflow,pass,finish}=h;
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 const raw=await readFile(folder+'knight-ending.json');assert.equal(createHash('sha256').update(raw).digest('hex'),native.checkpoints['knight-ending']);
 await page.locator('#import-file').setInputFiles(folder+'knight-ending.json');await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const s=await state();assert.ok(s.roster.some(c=>c.definitionId==='陈达海'));assert.ok(!s.roster.some(c=>c.definitionId==='李文秀'));assert.equal(s.adventure.morality,48);
 await click('[data-action="quests"]');await page.locator('[data-journey-story="knight-ending"] summary').click();
 const detail=await page.locator('[data-journey-story="knight-ending"]').innerText();
 assert.match(detail,/Dulcinea stayed/);assert.match(detail,/slot two/);assert.match(detail,/Gines/);assert.doesNotMatch(detail,/[\u3400-\u9fff]/);
 await noOverflow('Knight recruitment and training reminder at 390px');await closeModal();
 await click('[data-action="party"]');assert.match(await page.locator('#game-modal').innerText(),/Don Quixote/);await noOverflow('Knight party roster at 390px');
 pass('Real alternate ending has only the knight, morality -2, and accurate recruitment and training guidance');
}catch(e){failure=e;}
await finish(failure);
