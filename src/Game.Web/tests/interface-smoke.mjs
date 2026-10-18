import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';
const h=await createHarness(process.env.GAME_WEB_REPORT||'interface-smoke',{hasTouch:true});
const {page,report,output,pass,click,ready,state,visible,closeModal,noOverflow,continueDialogue}=h;
await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.resolve();};});
await page.addInitScript(()=>{const key='jyxr.preferences.v1';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({battleSpeed:2,effectsVolume:.7,largeText:false}));});
let failure;
async function style(value){await click('[data-action="settings"]');await page.locator('[name="interfaceStyle"]').selectOption(value);await page.waitForFunction(v=>document.documentElement.dataset.interface===v,value);await closeModal();}
async function importFile(name){await page.locator('#import-file').setInputFiles(output+name);await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();}
async function screenshot(name){await page.screenshot({path:output+'interface-'+name+'.png'});}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90_000});
  assert.equal(await page.locator('html').getAttribute('data-interface'),'modern');const title=await state();
  await click('[data-action="settings"]');assert.equal(await page.locator('[name="battleSpeed"]').inputValue(),'2');await closeModal();
  await style('classic');assert.deepEqual(await state(),title);await noOverflow('classic title');await screenshot('classic-title');
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90_000});
  assert.equal(await page.locator('html').getAttribute('data-interface'),'classic');
  pass('old preferences retain their speed, modern is the default, switching does not start a game and classic survives reload');
  await click('[data-action="settings"]');await click('[data-action="original-interface-reference"]');
  await page.waitForFunction(()=>[...document.querySelectorAll('.interface-reference-gallery img')].length===3&&[...document.querySelectorAll('.interface-reference-gallery img')].every(i=>i.complete&&i.naturalWidth>0));
  const image=page.locator('.interface-reference-gallery img').first();assert.equal(await image.evaluate(i=>i.naturalWidth),800);
  assert.match(await page.locator('#game-modal').innerText(),/Silverlight 0\.6\.x[\s\S]*不是浏览器重制版[\s\S]*尚非 Unity/);
  const unchanged=await state();await click('[data-action="interface-style"][data-id="modern"]');assert.deepEqual(await state(),unchanged);
  await click('[data-action="interface-style"][data-id="classic"]');assert.deepEqual(await state(),unchanged);await screenshot('original-reference');
  await closeModal();pass('reference gallery displays actual original screenshot and panels, clearly labels their version, and shares the style setting');
  await importFile('management-save.json');const world=await state();
  await style('modern');assert.deepEqual(await state(),world);await screenshot('modern-world');
  await style('classic');assert.deepEqual(await state(),world);
  const nav=await page.locator('.system-nav').boundingBox();assert.ok(nav.y+nav.height>840&&nav.y+nav.height<=900);
  await noOverflow('classic desktop world and original icon menu');await screenshot('classic-world');
  pass('world styles share the complete state and classic places the original icon menu at the bottom');
  for(const panel of ['character','equipment','cultivation','inventory','party','quests']){
    await click(`[data-action="${panel}"]`);await noOverflow('classic '+panel);
    if(panel==='equipment'){
      const selected=await page.locator('.panel-tabs [aria-selected="true"]').evaluate(n=>getComputedStyle(n).backgroundImage);
      const other=await page.locator('.panel-tabs [aria-selected="false"]').first().evaluate(n=>getComputedStyle(n).backgroundImage);assert.notEqual(selected,other);
      await screenshot('classic-equipment');
    }
    await closeModal();assert.deepEqual(await state(),world);
  }
  pass('character, equipment, training, inventory, party and journal remain usable without mutating the game');
  await page.setViewportSize({width:375,height:812});await noOverflow('classic mobile world');await screenshot('classic-world-mobile');
  await click('[data-action="inventory"]');await noOverflow('classic mobile inventory');await closeModal();
  await style('modern');assert.deepEqual(await state(),world);await noOverflow('modern mobile world after switching');
  await style('classic');assert.deepEqual(await state(),world);await page.setViewportSize({width:320,height:740});await noOverflow('classic 320px world');
  const targets=await page.locator('.system-nav button').evaluateAll(nodes=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
  assert.ok(targets.every(t=>t.w>=44&&t.h>=44));
  pass('375px and 320px retain scrollable, reachable menu controls and one shared world state');
  await page.setViewportSize({width:1440,height:900});await closeModal();await importFile('battle-item-save.json');
  await click('[data-action="interact"][data-id="阎基居"]');const dialogue=await state();assert.equal(dialogue.phase,'dialogue');
  await style('modern');assert.deepEqual(await state(),dialogue);await style('classic');assert.deepEqual(await state(),dialogue);await screenshot('classic-dialogue');
  pass('switching during original dialogue preserves its current line, speaker and story position');
  await continueDialogue();
  await click('[data-action="skill"][data-id="打鸡血"]');await click('[data-action="battle-pause"]');
  await page.locator('#board-viewport[data-board-geometry]').waitFor();const before=await state();
  await style('modern');assert.deepEqual(await state(),before);await screenshot('modern-battle');
  await style('classic');assert.deepEqual(await state(),before);await screenshot('classic-battle');
  assert.equal(await page.locator('[data-action="skill"][data-id="打鸡血"]').getAttribute('aria-pressed'),'true');
  const fits=await page.locator('.duel-screen').boundingBox();assert.ok(fits.y+fits.height<=901);
  await noOverflow('classic desktop paused battle');
  await page.setViewportSize({width:375,height:812});await style('modern');assert.deepEqual(await state(),before);
  await style('classic');assert.deepEqual(await state(),before);await noOverflow('classic mobile paused battle');
  assert.equal(await page.locator('[data-action="skill"][data-id="打鸡血"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-action="mobile-pause"]').innerText(),'继续');
  await page.setViewportSize({width:844,height:390});await noOverflow('classic touch landscape');assert.deepEqual(await state(),before);
  pass('battle switches both ways on desktop and touch screens, preserving HP, MP, turn, selected state and explicit pause');
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90_000});
  await click('[data-action="worlds"]');await click('[data-action="select-pack"][data-id="frontier"]');await importFile('frontier-chapter-save.json');
  const western=await state();await style('modern');assert.deepEqual(await state(),western);await style('classic');assert.deepEqual(await state(),western);
  await noOverflow('same interface preferences with western content');
  pass('the same two interfaces also preserve the independent second content pack without changing its characters or items');
  await click('[data-action="interact"][data-id="quartermaster"]');await visible('.shop-screen');const shop=await state();assert.equal(shop.phase,'shop');
  await style('modern');assert.deepEqual(await state(),shop);await style('classic');assert.deepEqual(await state(),shop);await noOverflow('classic live shop');await screenshot('classic-shop');
  pass('an open shop can switch styles without changing money, stock, items or pending interaction');
}catch(error){failure=error;}finally{await h.finish(failure);}
