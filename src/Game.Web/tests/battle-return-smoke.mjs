import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('battle-return-smoke');
const {page,output,report,pass,ready,visible,click,state,continueDialogue,noOverflow}=h;
let failure;
async function duel(){
  await click('[data-action="interact"][data-id="燕小六"]');let s=await continueDialogue();
  if(s.phase==='world'){await click('[data-action="interact"][data-id="燕小六"]');s=await continueDialogue();}
  assert.equal(s.phase,'choice');await click('[data-action="choice"][data-index="0"]');s=await continueDialogue();
  const choice=s.choices.find(c=>c.text==='单挑战');assert.ok(choice);
  await click(`[data-action="choice"][data-index="${choice.index}"]`);await click('[data-action="choice"][data-index="5"]');
  await visible('#combatants-form');await page.locator('input[name="character"][value="主角"]').check();
  await page.locator('#combatants-form button[type="submit"]').click();await ready();
  s=await state();assert.ok(s.battle.tick>0,'The retry must advance real time instead of starting with dead participants');
  if(s.battle.outcome==='ongoing'){
    await click('[data-action="battle-speed"][data-id="4"]');await click('[data-action="battle-mode"][data-id="auto"]');
  }
  await visible('[data-action="leave-battle"]');s=await state();
  assert.equal(s.battle.outcome,'lose');assert.equal(s.battle.units.find(u=>u.team===1).hp,0);
  await click('[data-action="leave-battle"]');await continueDialogue();return await state();
}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await page.locator('#import-file').setInputFiles(output+'battle-return-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  const before=await state();
  for(let attempt=0;attempt<2;attempt++){
    const returned=await duel();assert.equal(returned.phase,'world');assert.equal(returned.map.id,'同福客栈');
    assert.equal(returned.hero.hp,returned.hero.maxHp);assert.equal(returned.hero.mp,returned.hero.maxMp);
    assert.equal(returned.silver,before.silver-25*(attempt+1),'Map recovery preserves the actual two original entry fees');
  }
  await page.setViewportSize({width:375,height:812});await noOverflow('same-map recovery after actual defeat at 375px');
  await page.screenshot({path:output+'arena-defeat-map-recovery-mobile.png',fullPage:true});
  pass('two visible original high-tier arena defeats recover at the map boundary and allow a live retry with no reload or travel');
}catch(e){failure=e;}
await h.finish(failure);
