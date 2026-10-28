import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/petalstorm-manual-unlock.json','utf8'));assert.ok(proof.passed);
const file=proof.checkpoint.path,raw=await readFile(file);assert.equal(createHash('sha256').update(raw).digest('hex'),proof.checkpoint.sha256);
const h=await createHarness('petalstorm-card',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 assert.equal((await state()).hero.externalSkills.find(s=>s.id==='百花错拳').level,8);
 await click('[data-action="interact"][data-id="结伴练习"]');for(let n=0;n<20&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');
 const before=(await state()).battle,skill=before.skills.find(s=>s.id==='百花错拳.百花缭乱');assert.ok(skill);assert.equal(skill.available,false);
 await click('[data-action="battle-skills"]');assert.doesNotMatch(await page.locator('#game-modal').innerText(),/[\u3400-\u9fff]/);
 const card=page.locator('.battle-skill-card').filter({has:page.locator('[data-action="choose-battle-skill"][data-id="百花错拳.百花缭乱"]')});
 assert.match(await card.innerText(),/Energy 128 · Base Rage 4 · Range 3 tiles · Area 2 · Cooldown 5 turns/);
 assert.equal(await card.locator('[data-skill-reason]').textContent(),'Not enough Rage.');assert.ok(await card.locator('button').isDisabled());
 await card.scrollIntoViewIfNeeded();await noOverflow('Complete English Full Bloom card at 390px');await page.screenshot({path:h.output+'petalstorm-card-mobile.png'});
 await closeModal();assert.deepEqual((await state()).battle,before);
 pass('Earned rank-eight export exposes an entirely English skill sheet, exact live requirements and a correctly disabled Rage action; reading does not advance battle');
}catch(e){failure=e;}
await finish(failure);
