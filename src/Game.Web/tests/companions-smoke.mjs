import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('companions-smoke');
const {page,output,report,pass,state,click,ready,visible,closeModal,noOverflow}=h;
let failure;
async function search(text){await page.locator('[data-companion-search]').fill(text);}
async function open(){await click('[data-action="companions"]');await visible('.companion-browser');}
async function importSave(name){
  await closeModal();await page.locator('#import-file').setInputFiles(output+name);
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});
  await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:60_000});
  const before=await state();await open();
  assert.equal(await page.locator('.companion-card').count(),65);
  await search('令狐冲');await visible('[data-companion-detail="令狐冲"]');
  assert.match(await page.locator('.companion-morality').innerText(),/35 ≤ 道德 < 65.*35至64/);
  assert.match(await page.locator('.companion-priority').last().innerText(),/道德 ≥ 65[\s\S]*道德 < 35/);
  await page.screenshot({path:output+'companion-guide-desktop.png',fullPage:true});
  await page.setViewportSize({width:768,height:1024});await noOverflow('tablet companion guide and navigation');
  await page.setViewportSize({width:1440,height:900});
  pass('independent guide contains 65 role forms and preserves Linghu morality rejection order and exact 35–64 requirement');
  await search('田伯光');
  assert.equal(await page.locator('.companion-route').count(),2);
  for(const summary of await page.locator('.companion-path:not([open]) > summary').all())await summary.click();
  assert.match(await page.locator('.companion-reading').innerText(),/战斗胜利[\s\S]*战斗失败|战斗失败[\s\S]*战斗胜利/);
  await search('程英');
  assert.equal(await page.locator('[data-companion-id="程英.初级"]').count(),1);
  assert.equal(await page.locator('[data-companion-id="程英.高级"]').count(),1);
  await search('女主');
  assert.equal(await page.locator('.companion-route').count(),4);
  assert.match(await page.locator('.companion-reading').innerText(),/剧情随行/);
  assert.match(await page.locator('.companion-reading').innerText(),/加入参战队伍/);
  await page.setViewportSize({width:375,height:812});await noOverflow('mobile female companion route guide');
  await page.screenshot({path:output+'companion-heroine-mobile.png',fullPage:true});
  await search('令狐冲');await noOverflow('mobile source recruitment conditions');
  await page.screenshot({path:output+'companion-linghu-mobile.png',fullPage:true});
  await closeModal();assert.deepEqual(await state(),before);
  pass('alternative win/loss routes, variant cards and follow/member routes are readable without changing game state');

  await importSave('normal-campaign-save.json');const normal=await state();
  await click('[data-action="party"]');await open();
  await page.locator('[data-companion-filter]').selectOption('current');
  assert.equal(await page.locator('.companion-card').count(),7);
  assert.match(await page.locator('[data-companion-id="钟灵"]').innerText(),/参战中/);
  await closeModal();assert.deepEqual(await state(),normal);
  pass('party menu opens the guide and a real eight-member save shows its seven companions without counting the hero');

  await click('[data-action="party"]');
  await click('[data-action="party-placement"][data-id="钟灵"][data-placement="reserve"]');
  const reserve=await state();await open();await search('钟灵');
  assert.match(await page.locator('.companion-card').innerText(),/后备中/);
  await closeModal();assert.deepEqual(await state(),reserve);
  pass('real visible benching appears as reserve in the guide and browsing preserves that placement');

  await importSave('survival-recruits-save.json');const recruited=await state();await open();
  await page.locator('[data-companion-filter]').selectOption('current');
  assert.equal(await page.locator('.companion-card').count(),10);
  for(const name of ['蓝凤凰','平一指','曲非烟']){
    await search(name);assert.match(await page.locator('.companion-card').innerText(),/参战中[\s\S]*普通流程已验证/);
  }
  await closeModal();assert.deepEqual(await state(),recruited);
  pass('the new unedited continuous save shows all ten companions including naturally recruited Blue Phoenix, Ping Yizhi and Qu Feiyan');

  await importSave('management-save.json');await open();await search('女主');
  assert.match(await page.locator('.companion-profile').innerText(),/随行中/);
  await importSave('companions-member-save.json');await open();await search('女主');
  assert.match(await page.locator('.companion-profile').innerText(),/参战中/);
  pass('real follower and source-JOIN exports are displayed as different placements');
  await closeModal();await click('[data-action="guide"]');await click('[data-action="progress"]');await visible('.restoration-report');
  assert.equal(await page.locator('[data-feature-id]').count(),8);
  for(const [id,percentage] of Object.entries({battle:65,external:55,internal:60,special:70,legend:35,items:80,talents:60,companions:65}))
    assert.match(await page.locator(`[data-feature-id="${id}"] h4`).innerText(),new RegExp(`${percentage}%`));
  assert.match(await page.locator('[data-feature-id="battle"]').innerText(),/393.*391/);
  assert.match(await page.locator('[data-feature-id="companions"]').innerText(),/65.*80.*10/);
  await noOverflow('mobile eight-feature progress and gap report');
  await page.screenshot({path:output+'feature-progress-mobile.png',fullPage:true});
  pass('eight feature estimates show actual counts and specific missing behavior rather than equating data import with completion');
  await page.waitForLoadState('networkidle');
  const direct=new URL(report.baseURL);direct.searchParams.set('view','companions');
  await page.goto(direct.href,{waitUntil:'networkidle'});await page.locator('.companion-browser').waitFor({state:'visible',timeout:60_000});
  await noOverflow('direct companion guide at 375px');
  pass('the guide opens directly from its own shareable URL');
}catch(error){failure=error;}
await h.finish(failure);
