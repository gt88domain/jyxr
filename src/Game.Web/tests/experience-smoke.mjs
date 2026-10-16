import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('experience-smoke');
const {page,output,report,pass,ready,visible,click,state,closeModal,noOverflow}=h;
let failure;
try {
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await page.locator('#import-file').setInputFiles(output+'experience-old-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  let current=await state();
  assert.equal(current.hero.level,22);assert.equal(current.hero.experience,10253);assert.equal(current.hero.nextLevelExperience,11285);
  assert.equal(current.party.length,8);
  await click('[data-action="inventory"]');
  const downloaded=page.waitForEvent('download');await click('[data-action="download-save"]');
  const file=await downloaded;await file.saveAs(output+'experience-migrated-save.json');
  const migrated=JSON.parse(await readFile(output+'experience-migrated-save.json','utf8'));
  assert.equal(migrated.characterExperienceCurve,'LegacyCumulative');
  await closeModal();await click('[data-action="save"]');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='当前世界的进度已保存。');
  await page.reload({waitUntil:'networkidle'});await visible('[data-action="load"]');await click('[data-action="load"]');
  current=await state();assert.equal(current.hero.level,22);assert.equal(current.hero.experience,10253);
  pass('old real Lv22/eight-member save migrates in WASM, exports its curve, and reloads without repeated conversion');

  await page.locator('#import-file').setInputFiles(output+'experience-emergency-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  current=await state();assert.equal(current.hero.level,25);assert.equal(current.milestones.filter(m=>m.completed).length,4);
  await click('[data-action="quests"]');
  assert.match(await page.locator('[data-milestone-id="mainStory_紧急"]').innerText(),/已发生/);
  await page.locator('.journey-journal summary').click();
  assert.match(await page.locator('.journey-journal').innerText(),/蒙古大军南下/);
  await page.setViewportSize({width:375,height:812});await noOverflow('actual emergency mainline journal at 375px');
  await page.screenshot({path:output+'experience-emergency-mobile.png',fullPage:true});
  pass('actual normal-growth Lv25 emergency victory, source journal and fourth milestone load in the browser');
  await closeModal();
  await page.locator('#import-file').setInputFiles(output+'experience-gameover-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  current=await state();assert.equal(current.phase,'gameover');assert.equal(current.profile.deathCount,1);assert.equal(current.profile.completionCount,0);
  await noOverflow('original implicit story game-over at 375px');
  await page.screenshot({path:output+'experience-gameover-mobile.png',fullPage:true});
  await page.reload({waitUntil:'networkidle'});await visible('[data-action="load"]');await click('[data-action="load"]');
  current=await state();assert.equal(current.phase,'gameover');assert.equal(current.profile.deathCount,1);
  pass('real implicit final-battle defeat renders the original game-over path and reloads without recording another death');
}catch(error){failure=error;}
await h.finish(failure);
