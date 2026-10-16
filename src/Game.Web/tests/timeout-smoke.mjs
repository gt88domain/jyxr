import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('timeout-smoke');
const {page,output,report,pass,ready,visible,click,state,continueDialogue,noOverflow}=h;
let failure;
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await page.locator('#import-file').setInputFiles(output+'timeout-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  await click('[data-action="interact"][data-id="结伴练习"]');await continueDialogue();
  let current=await state();
  assert.equal(current.battle.tickLimit,3000);
  const silver=current.silver,experience=current.hero.experience;
  for(let turn=0;turn<200&&current.battle.outcome==='ongoing';turn++){
    assert.ok(current.battle.tick<=3000);
    assert.match(await page.locator('[data-battle-clock]').innerText(),/3000/);
    await click('[data-action="rest"]');current=await state();
  }
  assert.equal(current.battle.outcome,'lose');assert.equal(current.battle.tick,3001);assert.equal(current.battle.timedOut,true);
  assert.ok(current.battle.units.every(u=>u.alive));
  assert.equal(current.silver,silver);assert.equal(current.hero.experience,experience);
  await visible('[aria-label="战斗结算"]');
  assert.equal(await page.locator('.duel-result-seal').innerText(),'悟','Living units in a timeout cannot display a victory seal');
  assert.match(await page.locator('[aria-label="战斗结算"]').innerText(),/超出原版时限/);
  await page.setViewportSize({width:375,height:812});await noOverflow('timeout defeat at 375px');
  await page.screenshot({path:output+'battle-timeout-mobile.png',fullPage:true});
  await click('[data-action="leave-battle"]');await continueDialogue();
  current=await state();assert.equal(current.phase,'world');assert.equal(current.objectives.find(o=>o.id==='team').completed,false);
  pass('original battle timeout shows a real defeat with living units, no victory reward and original loss continuation');
}catch(e){failure=e;}
await h.finish(failure);
