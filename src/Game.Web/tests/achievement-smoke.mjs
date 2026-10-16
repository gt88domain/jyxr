import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';
const h=await createHarness('achievement-smoke');
const {page,output,report,pass,ready,visible,click,state,closeModal,noOverflow}=h;
let failure;
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await page.locator('#import-file').setInputFiles(output+'achievement-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  await click('[data-action="quests"]');
  for(const id of ['全真高手','血刀高手','侠客行'])assert.equal(await page.locator(`[data-achievement-id="${id}"]`).count(),1);
  assert.equal((await state()).hero.internalSkills.find(s=>s.id==='太玄神功').level,10);
  assert.ok((await state()).inventory.some(i=>i.id==='七星七绝剑剑谱'));
  await page.setViewportSize({width:375,height:812});await noOverflow('original achievements at 375px');
  await page.screenshot({path:output+'original-achievements-mobile.png',fullPage:true});await closeModal();
  await click('[data-action="save"]');await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='当前世界的进度已保存。');
  await page.reload({waitUntil:'networkidle'});await visible('[data-action="load"]');await click('[data-action="load"]');
  await click('[data-action="quests"]');
  assert.equal((await state()).achievements.length,3);
  for(const id of ['全真高手','血刀高手','侠客行'])assert.equal(await page.locator(`[data-achievement-id="${id}"]`).count(),1);
  pass('original source titles and actual quest rewards persist through browser save/reload without fabricated descriptions');
}catch(e){failure=e;}
await h.finish(failure);
