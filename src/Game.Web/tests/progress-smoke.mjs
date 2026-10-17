import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('progress-smoke');
const {page,report,output,pass,state,click,visible,closeModal,noOverflow}=h;
let failure;
try {
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  const before=await state();
  await click('[data-action="progress"]');await visible('.restoration-report');
  assert.match(await page.locator('.restoration-total').innerText(),/80%/);
  assert.match(await page.locator('.restoration-report').innerText(),/双儿、经验木头人、练功木头人/);
  const counts=await page.locator('.restoration-counts').innerText();
  assert.match(counts,/1885\s*\/\s*1887/);assert.match(counts,/147\s*\/\s*158/);
  assert.match(await page.locator('.restoration-report').innerText(),/5 项只有元数据/);
  assert.match(await page.locator('.restoration-report').innerText(),/5 项作为其他效果的联动条件/);
  assert.equal(await page.locator('.restoration-category progress').count(),6);
  assert.equal(await page.locator('[data-remaining-task]').count(),19);
  assert.equal(await page.locator('[data-remaining-group]').count(),7);
  assert.match(await page.locator('[data-remaining-group]').nth(2).textContent(),/吴钩霜雪[\s\S]*尚无可玩触发依据/);
  pass('current generated structure and talent counts appear alongside six explicitly estimated categories');
  await closeModal();await click('[data-action="guide"]');await click('[data-action="progress"]');
  await visible('.restoration-report');pass('progress report is also reachable from the play guide');
  await page.setViewportSize({width:375,height:812});await noOverflow('mobile progress overview');
  await page.locator('[data-remaining-tasks]>summary').click();
  assert.match(await page.locator('[data-remaining-tasks]').innerText(),/双儿、经验木头人、练功木头人/);
  await page.locator('[data-remaining-group]').nth(1).locator('summary').click();
  assert.match(await page.locator('[data-remaining-group]').nth(1).innerText(),/伤口撕裂[\s\S]*御剑[\s\S]*情花奇毒/);
  await page.locator('[data-remaining-group]').nth(1).scrollIntoViewIfNeeded();
  await noOverflow('mobile concrete remaining tasks and unconfirmed talent names');
  pass('19 actionable work items and seven live rule-name groups distinguish source gaps, implementation and deferred acceptance');
  await page.locator('.restoration-section').last().scrollIntoViewIfNeeded();await noOverflow('mobile original strengths and flow advice');
  assert.match(await page.locator('.restoration-section').last().innerText(),/战前整备|战况|治疗/);
  await page.screenshot({path:output+'restoration-advice-mobile.png',fullPage:true});
  await closeModal();assert.deepEqual(await state(),before);
  pass('reading and scrolling the report leaves game state unchanged');
}catch(error){failure=error;}
await h.finish(failure);
