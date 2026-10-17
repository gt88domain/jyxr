import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('survival-smoke');
const {page,output,report,pass,ready,click,state,continueDialogue,noOverflow,closeModal}=h;
let failure;
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});
  await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:60_000});
  await click('[data-action="settings"]');await page.locator('select[name="battleMode"]').selectOption('manual');await closeModal();
  await page.locator('#import-file').setInputFiles(output+'survival-recruits-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  let current=await state();assert.equal(current.phase,'world');assert.equal(current.map.id,'大地图');
  assert.equal(current.roster.length,11);assert.ok(current.roster.some(c=>c.definitionId==='平一指'));
  // The checkpoint has real world triggers; resolve an actual triggered fight
  // through visible auto controls if one occurs rather than suppressing it.
  for(let n=0;n<5&&!(current.phase==='world'&&current.map.id==='同福客栈');n++){
    assert.equal(current.map.id,'大地图');await click('[data-action="interact"][data-id="同福客栈"]');
    current=await continueDialogue();
    if(current.phase==='battle'){
      await click('[data-action="battle-mode"][data-id="auto"]');await click('[data-action="battle-speed"][data-id="4"]');
      await page.locator('[data-action="leave-battle"]').waitFor({state:'visible',timeout:180_000});
      await click('[data-action="leave-battle"]');current=await continueDialogue();
      await click('[data-action="settings"]');await page.locator('select[name="battleMode"]').selectOption('manual');await closeModal();
    }
  }
  assert.equal(current.phase,'world');assert.equal(current.map.id,'同福客栈');
  await click('[data-action="interact"][data-id="燕小六"]');current=await continueDialogue();
  if(current.phase==='world'){await click('[data-action="interact"][data-id="燕小六"]');current=await continueDialogue();}
  await click('[data-action="choice"][data-index="0"]');current=await continueDialogue();
  const arena=current.choices.find(c=>c.text==='沙漠4v4');assert.ok(arena);
  await click(`[data-action="choice"][data-index="${arena.index}"]`);await click('[data-action="choice"][data-index="1"]');
  await page.locator('#combatants-form').waitFor({state:'visible'});
  for(const id of ['主角','平一指','令狐冲','田伯光'])await page.locator(`input[name="character"][value="${id}"]`).check();
  await page.locator('#combatants-form button[type="submit"]').click();await ready();
  current=await state();assert.equal(current.phase,'battle');
  const doctor=current.battle.units.find(u=>u.definitionId==='平一指');assert.ok(doctor);
  pass('an unedited campaign save enters the original paid desert arena with the naturally recruited medical companion');
  let healing=false;
  for(let turn=0;turn<100&&!healing;turn++){
    assert.equal(current.battle.outcome,'ongoing');
    const last=Math.max(0,...current.battle.events.map(e=>e.sequence));
    await click('[data-action="rest"]');current=await state();
    const allies=new Set(current.battle.units.filter(u=>u.team===1).map(u=>u.id));
    const medical=current.battle.events.filter(e=>e.sequence>last&&e.kind==='FloatTextRequested'&&e.text?.startsWith('【医仙】'));
    healing=current.battle.activeUnitId===doctor.id&&medical.some(cue=>allies.has(cue.unitId)&&current.battle.events.some(e=>e.sequence>last&&e.kind==='Healed'&&e.amount>0&&e.unitId===cue.unitId));
  }
  assert.ok(healing,'The actual doctor must passively heal an enemy-inflicted wound on action readiness');
  pass('real medical talent heals an enemy-inflicted wound automatically when Ping Yizhi becomes active, without a manually cast healing skill');
  await page.screenshot({path:output+'survival-healing-desktop.png',fullPage:true});
  await page.setViewportSize({width:375,height:812});await noOverflow('medical talent battle on mobile');
  const before=await state();await click('[data-action="companions"]');
  await page.locator('[data-companion-search]').fill('平一指');await noOverflow('new recruit guide during manual battle');
  await page.screenshot({path:output+'survival-recruit-mobile.png',fullPage:true});
  await closeModal();assert.deepEqual((await state()).battle,before.battle);
  pass('the standalone recruitment guide stays read-only during the real medical battle');
}catch(error){failure=error;}
await h.finish(failure);
