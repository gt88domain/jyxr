import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('journal-smoke');
const {page,output,report,pass,ready,visible,click,state,closeModal,noOverflow}=h;
let failure;
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await page.locator('#import-file').setInputFiles(output+'normal-campaign-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  let current=await state();assert.equal(current.hero.level,22);assert.equal(current.party.length,8);
  assert.match(await page.locator('.chapter-progress').innerText(),/江湖消息.*3\s*\/\s*4/s);
  await click('[data-action="quests"]');
  for(const id of ['mainStory_黑暗的阴影','mainStory_神秘剑客','mainStory_组织1'])assert.match(await page.locator(`[data-milestone-id="${id}"]`).innerText(),/已发生/);
  assert.match(await page.locator('[data-milestone-id="mainStory_紧急"]').innerText(),/尚未发生.*25.*8/s);
  await page.locator('.journey-journal summary').click();
  assert.match(await page.locator('.journey-journal').innerText(),/两页胡家刀法/);
  assert.match(await page.locator('.journey-journal').innerText(),/程灵素/);
  const journal=current.journal,milestones=current.milestones;
  await page.setViewportSize({width:375,height:812});await noOverflow('normal campaign journal at 375px');
  await page.screenshot({path:output+'normal-campaign-journal-mobile.png',fullPage:true});await closeModal();
  await click('[data-action="save"]');await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='当前世界的进度已保存。');
  await page.reload({waitUntil:'networkidle'});await visible('[data-action="load"]');await click('[data-action="load"]');
  current=await state();assert.deepEqual(current.journal,journal);assert.deepEqual(current.milestones,milestones);
  pass('unedited normal campaign shows actual source quest history and mainline requirements across browser save/reload');
}catch(e){failure=e;}
await h.finish(failure);
