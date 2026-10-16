import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('progress-smoke');
const {page,report,output,pass,state,click,visible,closeModal,noOverflow}=h;
let failure;
try {
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  const before=await state();
  await click('[data-action="progress"]');await visible('.restoration-report');
  const counts=await page.locator('.restoration-counts').innerText();
  assert.match(counts,/1885\s*\/\s*1887/);assert.match(counts,/64\s*\/\s*158/);
  assert.match(await page.locator('.restoration-report').innerText(),/93 项只有元数据/);
  assert.equal(await page.locator('.restoration-category progress').count(),6);
  pass('current generated structure and talent counts appear alongside six explicitly estimated categories');
  await closeModal();await click('[data-action="guide"]');await click('[data-action="progress"]');
  await visible('.restoration-report');pass('progress report is also reachable from the play guide');
  await page.setViewportSize({width:375,height:812});await noOverflow('mobile progress overview');
  await page.locator('.restoration-section').last().scrollIntoViewIfNeeded();await noOverflow('mobile original strengths and flow advice');
  assert.match(await page.locator('.restoration-section').last().innerText(),/战前整备|战况|治疗/);
  await page.screenshot({path:output+'restoration-advice-mobile.png',fullPage:true});
  await closeModal();assert.deepEqual(await state(),before);
  pass('reading and scrolling the report leaves game state unchanged');
}catch(error){failure=error;}
await h.finish(failure);
