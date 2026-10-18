import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';
const h=await createHarness(process.env.GAME_WEB_REPORT||'navigation-smoke',{viewport:{width:375,height:812},isMobile:true,hasTouch:true});
const {page,report,output,pass,ready,click,state,closeModal,noOverflow}=h;
await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.resolve();};});
let failure;
async function importFile(file){await closeModal();await page.locator('#import-file').setInputFiles(output+file);await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();}
async function primary(){
  const buttons=page.locator('.system-nav button').filter({visible:true});
  assert.deepEqual(await buttons.evaluateAll(nodes=>nodes.map(n=>n.dataset.action)),['character','equipment','cultivation','inventory','party','more']);
  for(const target of await buttons.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {action:n.dataset.action,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}))){
    assert.ok(target.width>=44&&target.height>=44&&target.x>=0&&target.right<=await page.evaluate(()=>innerWidth)&&target.y>=0&&target.bottom<=await page.evaluate(()=>innerHeight),JSON.stringify(target));
  }
  for(const action of ['save','history']){
    const r=await page.locator(`.topbar [data-action="${action}"]`).boundingBox();
    assert.ok(r.width>=44&&r.height>=44&&r.y>=0&&r.y+r.height<=await page.evaluate(()=>innerHeight),JSON.stringify(r));
  }
}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90_000});
  await importFile('management-save.json');const start=await state();
  for(const width of [375,320,768,1440]){await page.setViewportSize({width,height:width===320?740:width===375?812:900});await page.evaluate(()=>scrollTo(0,0));await primary();await noOverflow('modern first screen '+width);}
  pass('six frequent actions plus save/notification remain on screen with at least44px targets from320px to desktop');
  await page.setViewportSize({width:375,height:812});await page.screenshot({path:output+'navigation-modern-first-screen.png'});
  await click('[data-action="more"]');
  for(const action of ['quests','history','settings','companions','library','load','worlds','guide','progress'])assert.ok(await page.locator(`.more-menu [data-action="${action}"]`).isVisible());
  await noOverflow('mobile secondary menu');await page.screenshot({path:output+'navigation-more-mobile.png'});
  await click('[data-action="settings"]');await page.locator('[name="interfaceStyle"]').waitFor();assert.equal(await page.locator('.more-menu').count(),0);await closeModal();
  assert.deepEqual(await state(),start);pass('secondary menu exposes infrequent tools; opening settings preserves the complete game state');
  await click('[data-action="equipment"]');await page.locator('#managed-character').selectOption('钟灵');await ready();
  await click('[data-action="unequip-item"][data-slot="Weapon"]');await closeModal();
  const changed=await state();assert.ok(changed.activity.some(a=>a.kind==='operation'&&/卸下/.test(a.message)));
  await click('[data-action="history"]');assert.ok(await page.locator('[data-activity-kind="operation"]').count()>0);
  await page.locator('[data-activity-filter]').selectOption('operation');
  assert.ok(await page.locator('[data-activity-kind="operation"]').filter({visible:true}).count()>0);
  assert.equal(await page.locator('[data-activity-kind="story"]').filter({visible:true}).count(),0);
  await page.locator('[data-activity-search]').fill('不存在的操作');assert.ok(await page.locator('[data-activity-empty]').isVisible());
  await page.locator('[data-activity-search]').fill('卸下');assert.ok(await page.locator('[data-activity-kind="operation"]').filter({visible:true}).count()>0);
  assert.deepEqual(await state(),changed);await noOverflow('history filters at375px');await page.screenshot({path:output+'navigation-history-mobile.png'});await closeModal();
  pass('accepted equipment operations enter persistent history; search and category filters do not change game data');
  await click('[data-action="save"]');await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90_000});await click('[data-action="load"]');
  const restored=await state();assert.equal(restored.journeyId,changed.journeyId);
  assert.deepEqual(restored.activity.slice(0,changed.activity.length),changed.activity);
  assert.equal(restored.activity.at(-1).message,'已读取浏览器存档。');
  assert.equal(await page.locator('[data-notice-count]').isVisible(),false);
  pass('browser save/reload preserves actual operation history and does not replay old reward notifications');
  await click('[data-action="worlds"]');await click('[data-action="select-pack"][data-id="frontier"]');await importFile('frontier-chapter-save.json');
  await click('[data-action="interact"][data-id="quartermaster"]');const shop=await state();
  const product=shop.shop.products.find(p=>p.canBuy&&p.price<=shop.silver);assert.ok(product);
  await click(`[data-action="buy-item"][data-id="${product.id}"]`);const bought=await state();
  assert.equal(bought.silver,shop.silver-product.price);
  const reward=bought.activity.find(a=>a.kind==='item'&&a.notice&&a.id>(shop.activity.at(-1)?.id||0));assert.ok(reward);
  await click('[data-action="close-shop"]');await page.locator('[data-notice-count]').waitFor({state:'visible'});await click('[data-action="history"]');
  await page.locator('[data-activity-filter]').selectOption('item');assert.ok(await page.locator('[data-activity-kind="item"]').filter({visible:true}).count()>0);
  assert.equal(await page.locator('[data-notice-count]').isVisible(),false);await closeModal();
  assert.ok(!(await state()).activity.some(a=>a.message.includes('钟灵')));pass('real shop inventory events create reward notifications, unread badges clear on reading, and world histories remain isolated');
}catch(error){failure=error;}finally{await h.finish(failure);}
