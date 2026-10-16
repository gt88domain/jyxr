import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('flow-smoke');
const {page,output,report,pass,ready,visible,click,state,continueDialogue,noOverflow}=h;
async function importFile(name){await page.locator('#import-file').setInputFiles(output+name);await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();}
async function resume(){await page.reload({waitUntil:'networkidle'});await visible('[data-action="load"]');await click('[data-action="load"]');}
async function saveEnding(){await click('[data-action="save-ending"]');await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='当前世界的进度已保存。');}
async function location(id){if(await page.locator('#destination-search').count())await page.locator('#destination-search').fill(id);await click(`[data-action="interact"][data-id="${id}"]`);}
let failure;
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await importFile('flow-next-save.json');assert.equal((await state()).ending.kind,'next');
  await page.setViewportSize({width:375,height:812});await noOverflow('pending round transition at 375px');
  await saveEnding();await resume();
  assert.equal((await state()).ending.targetRound,2);assert.equal((await state()).profile.completionCount,1);
  const downloadEvent=page.waitForEvent('download');await page.locator('[data-action="download-save"]').click();
  const download=await downloadEvent;await download.saveAs(output+'flow-browser-ending.json');
  const backup=JSON.parse(await readFile(output+'flow-browser-ending.json','utf8'));assert.equal(backup.ending.targetRound,2);
  await page.screenshot({path:output+'original-next-round-mobile.png',fullPage:true});
  pass('pending original ending saves, reloads and exports without repeating completion');
  await click('[data-action="begin-round-creation"]');await visible('.creation-modal');
  await click('[data-action="close-modal"]');assert.equal((await state()).ending.kind,'next');
  await click('[data-action="begin-round-creation"]');
  for(let i=0;i<7;i++)await click(`[data-action="creation-answer"][data-question="${i}"][data-index="0"]`);
  await click('[data-action="creation-portrait"][data-id="头像.主角"]');
  const preview=(await state()).creation;assert.equal(preview.round,2);
  assert.ok(preview.preview.items.some(i=>i.id==='王母蟠桃'));assert.ok(preview.preview.items.some(i=>i.id==='道家仙丹'));
  assert.ok(!preview.preview.items.some(i=>i.id==='新手礼包-大蟠桃'));
  await noOverflow('second-round creation at 375px');
  await page.screenshot({path:output+'original-round-two-creation-mobile.png',fullPage:true});
  await click('[data-action="creation-confirm"]');await continueDialogue();
  const round=await state();assert.equal(round.adventure.round,2);assert.equal(round.silver,6100);
  assert.equal(round.party.length,1);assert.equal(round.chest.stored,1);assert.equal(round.yuanbao,7);assert.equal(round.profile.completionCount,1);
  await click('[data-action="save"]');await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='当前世界的进度已保存。');await resume();
  assert.equal((await state()).adventure.round,2);assert.equal((await state()).chest.stored,1);
  pass('real round-two questions and original rewards rebuild the party, retain chest/profile and save the new opening');
  await importFile('flow-complete-save.json');await saveEnding();await resume();
  assert.equal((await state()).ending.kind,'complete');assert.equal((await state()).profile.completionCount,2);
  assert.equal(await page.locator('[data-action="begin-round-creation"]').count(),0);
  await page.screenshot({path:output+'original-complete-ending-mobile.png',fullPage:true});
  pass('completed original ending remains complete after browser reload with no duplicate profile reward');

  // Explicit isolated high-stat/prerequisite fixture. The four enemy definitions
  // and every action/outcome remain original; this is not a balance playthrough.
  await importFile('flow-huashan-ready-save.json');await page.setViewportSize({width:1440,height:900});
  await location('返回');await location('华山');await continueDialogue();
  const used=new Set();
  for(let stage=0;stage<4;stage++){
    await visible('#combatants-form');const selection=(await state()).combatantSelection;
    assert.ok(selection.candidates.filter(c=>used.has(c.id)).every(c=>c.forbidden));
    const candidate=selection.candidates.find(c=>!c.forbidden);used.add(candidate.id);
    await page.locator(`input[name="character"][value="${candidate.id}"]`).check();
    if(stage===0){await page.setViewportSize({width:375,height:812});await noOverflow('Huashan deployment at 375px');await page.screenshot({path:output+'original-huashan-deployment-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:900});}
    await page.locator('#combatants-form button[type="submit"]').click();await ready();await visible('.duel-screen');
    const s=await state();assert.match(s.battle.id,/^华山论剑\./);
    const speed=page.locator('[data-action="battle-speed"][data-id="4"]');if(await speed.isEnabled()&&await speed.getAttribute('aria-pressed')!=='true')await click('[data-action="battle-speed"][data-id="4"]');
    const auto=page.locator('[data-action="battle-mode"][data-id="auto"]');if(await auto.isEnabled()&&await auto.getAttribute('aria-pressed')!=='true')await click('[data-action="battle-mode"][data-id="auto"]');
    await page.locator('[data-action="leave-battle"]').waitFor({state:'visible',timeout:180000});
    assert.equal((await state()).battle.outcome,'win');await click('[data-action="leave-battle"]');await continueDialogue();
  }
  for(let i=0;i<20&&(await state()).phase==='choice';i++){await click('[data-action="choice"][data-index="1"]');await continueDialogue();}
  assert.equal(used.size,4);assert.equal((await state()).ending.kind,'complete');
  pass('four original Huashan battles, one-use companions and actual epilogue finish through visible controls using an isolated routing fixture');
}catch(e){failure=e;}
await h.finish(failure);
