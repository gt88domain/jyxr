import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('battle-item-smoke');
const {page,output,report,pass,ready,visible,click,state,continueDialogue,closeModal,noOverflow}=h;
let failure;
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await page.locator('#import-file').setInputFiles(output+'battle-item-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  await click('[data-action="interact"][data-id="阎基居"]');await continueDialogue();
  let current=await state(), target, medicine;
  assert.equal(current.battle.id,'阎基居.战斗');
  for(let turn=0;turn<100;turn++){
    medicine=current.inventory.find(i=>i.id==='小还丹');
    target=medicine.battleTargets.find(t=>t.canUse&&t.id!==current.battle.activeUnitId&&t.hp<t.maxHp);
    if(target)break;
    await click('[data-action="rest"]');current=await state();
    assert.equal(current.battle.outcome,'ongoing','Original fight must remain active before medicine');
  }
  assert.ok(target,'An actual original enemy must wound a reachable ally');
  const before=medicine.count, sequence=Math.max(0,...current.battle.events.map(e=>e.sequence));
  await click('[data-action="inventory"]');
  const selector=page.locator(`.battle-item-target[data-entry-number="${medicine.entryNumber}"]`);
  await selector.selectOption(target.id);
  assert.equal(await selector.inputValue(),target.id);
  await page.setViewportSize({width:375,height:812});await noOverflow('battle ally medicine at 375px');
  await page.screenshot({path:output+'battle-ally-medicine-mobile.png',fullPage:true});
  await click(`[data-action="use-item"][data-entry-number="${medicine.entryNumber}"]`);
  current=await state();
  assert.equal(current.inventory.find(i=>i.id==='小还丹').count,before-1);
  const healing=current.battle.events.find(e=>e.sequence>sequence&&e.kind==='Healed'&&e.unitId===target.id);
  assert.ok(healing?.amount>0,'Selected ally must receive real HP recovery');
  assert.ok(current.battle.events.some(e=>e.sequence>sequence&&e.kind==='ItemUsed'));
  await closeModal();
  pass('visible ally selector heals the chosen wounded teammate and consumes exactly one real medicine',{targetId:target.id,recoveredHp:healing.amount});
}catch(e){failure=e;}
await h.finish(failure);
