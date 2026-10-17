import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('starting-companions-smoke');
const {page,output,report,state,click,ready,visible,pass,continueDialogue,closeModal,noOverflow}=h;
let failure;
async function importFixture(name){
  await closeModal();await page.locator('#import-file').setInputFiles(output+name);
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
}
async function previewRound(){
  await click('[data-action="begin-round-creation"]');
  for(let q=0;q<7;q++)await click(`[data-action="creation-answer"][data-question="${q}"][data-index="0"]`);
  await click('[data-action="creation-portrait"][data-id="头像.主角"]');
  return (await state()).creation;
}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});
  await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:60_000});
  await importFixture('starting-companion-round2-ready.json');
  const before=await state();
  let draft=await previewRound();
  assert.equal(draft.round,2);assert.equal(draft.startingCompanionCandidates.length,17);
  assert.match(await page.locator('[data-creation-companions]').innerText(),/17 名候选.*随机加入一名/);
  for(let i=0;i<3;i++)await click('[data-action="creation-roll"]');
  assert.deepEqual((await state()).party,before.party);
  assert.deepEqual((await state()).creation.startingCompanionCandidates,draft.startingCompanionCandidates);
  await page.setViewportSize({width:375,height:812});await noOverflow('mobile round-two companion reward preview');
  await page.locator('[data-creation-companions]>details>summary').click();
  assert.match(await page.locator('[data-creation-companions]').innerText(),/鲁连荣[\s\S]*阿九/);
  await page.screenshot({path:output+'starting-companion-preview-mobile.png',fullPage:true});
  await click('[data-action="close-modal"]');
  assert.deepEqual((await state()).party,before.party);
  assert.equal((await state()).ending.targetRound,2);
  pass('real visible round-two preview lists 17 candidates; rerolls and cancellation preserve the old roster');

  draft=await previewRound();await click('[data-action="creation-confirm"]');await continueDialogue();
  const started=await state(),ally=started.party.find(c=>!c.isHero);
  assert.equal(started.adventure.round,2);assert.equal(started.party.length,2);
  assert.ok(draft.startingCompanionCandidates.some(c=>c.id===ally.definitionId));assert.equal(started.yuanbao,13);
  await click('[data-action="party"]');
  assert.match(await page.locator('#game-modal').innerText(),new RegExp(ally.name));
  await closeModal();await click('[data-action="save"]');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='当前世界的进度已保存。');
  await page.reload({waitUntil:'networkidle'});await visible('[data-action="load"]');await click('[data-action="load"]');
  const loaded=await state();assert.equal(loaded.party.length,2);assert.deepEqual(loaded.party,started.party);
  assert.equal(loaded.profile.completionCount,started.profile.completionCount);
  pass('confirmation grants exactly one actual round-two companion, appears in party management and survives browser reload without duplication');

  await importFixture('starting-companion-yin-save.json');
  const yin=(await state()).party.find(c=>c.definitionId==='殷天正');assert.ok(yin);assert.equal(yin.id,'殷天正');
  await click('[data-action="library"]');await visible('.library-browser');
  await page.locator('[data-library-filter]').selectOption('characters');await page.locator('[data-library-search]').fill('殷天正');
  await visible('[data-library-detail="殷天正"]');
  assert.match(await page.locator('.library-reading').innerText(),/第3周目[\s\S]*确认人物后/);
  await closeModal();await click('[data-action="guide"]');await click('[data-action="progress"]');await visible('.restoration-report');
  assert.match(await page.locator('[data-feature-id="companions"]').innerText(),/65%[\s\S]*43 个已接入/);
  await noOverflow('mobile updated companion evidence and percentages');
  pass('source-backed Eagle King correction uses the real Yin Tianzheng definition and progress distinguishes 43 reward candidates from normal-playthrough recruits');
}catch(error){failure=error;}
await h.finish(failure);
