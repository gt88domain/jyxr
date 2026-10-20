import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHarness} from './ui-harness.mjs';

// Run browser-smoke first: its exported save proves the authentic opening and
// first battle. This test continues that real journey, without adding items.
const h = await createHarness(process.env.GAME_WEB_REPORT||'modern-jyx-smoke');
const {page, output, report, pass, ready, visible, click, state, continueDialogue, closeModal, rejectImport, noOverflow} = h;
const legacyPath = fileURLToPath(new URL('./fixtures/legacy-v1-save.json', import.meta.url));
const baselinePath = `${output}exported-save.json`;
const count = (s, id) => s.inventory.filter(item => item.id === id).reduce((sum,item)=>sum+item.count,0);
const objective = (s, id) => s.objectives.find(item => item.id === id);
async function location(id) {await click(`[data-action="interact"][data-id="${id}"]`);}
async function revisitIfAvailable(id) {
  const button = page.locator(`[data-action="interact"][data-id="${id}"]`);
  // A completed one-time event may be hidden or disabled. If a follow-up
  // event remains, actually visit it to prove it cannot duplicate the reward.
  if (await button.count() && await button.isEnabled()) {await location(id); await continueDialogue();}
}
async function choice(index = 0) {await visible(`[data-action="choice"][data-index="${index}"]`); await click(`[data-action="choice"][data-index="${index}"]`);}
async function importFile(path) {
  const chooser = page.waitForEvent('filechooser');
  await page.locator('[data-action="import"]').click();
  await (await chooser).setFiles(path);
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === '存档已导入。');
  await visible('.world-screen');
}
async function reloadTitle() {await closeModal(); await page.reload({waitUntil: 'networkidle'}); await visible('[data-action="new"]');}
async function selectPack(id) {await click(`[data-action="select-pack"][data-id="${id}"]`); assert.equal((await state()).pack.id, id);}
async function saveAndExport(packId) {
  await click('[data-action="save"]');
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === '当前世界的进度已保存。');
  await click('[data-action="inventory"]');
  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-action="download-save"]').click();
  const download = await downloadEvent;
  const path = `${output}${packId}-chapter-save.json`;
  await download.saveAs(path);
  const exported = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(exported.browserSaveVersion, 2);
  assert.equal(exported.packId, packId);
  await closeModal();
  return {path, exported};
}
async function finishBattle(label, companionId) {
  await visible('.duel-screen');
  const before = await state();
  assert.equal(before.phase, 'battle');
  const friendlies = before.battle.units.filter(unit => unit.team === 1);
  assert.equal(friendlies.length, 2, `${label}: both actual party members must enter the battle`);
  assert.ok(before.party.some(member => member.definitionId === companionId));
  assert.ok(friendlies.some(unit => unit.name === before.party.find(member => member.definitionId === companionId).name),
    `${label}: companion must be represented by a real allied battle unit`);
  // Speed persists too. Do not click an already-selected setting behind a
  // settlement overlay when an automatic encounter finishes immediately.
  const fast = page.locator('[data-action="battle-speed"][data-id="4"]');
  if (await fast.getAttribute('aria-pressed') !== 'true' && before.battle.outcome === 'ongoing') await click('[data-action="battle-speed"][data-id="4"]');
  await page.screenshot({path: `${output}${label}-battle.png`, fullPage: true});
  const auto = page.locator('[data-action="battle-mode"][data-id="auto"]');
  // Auto mode persists between encounters. A short fight may already finish
  // while its screenshot is captured; never wait on its disabled mode button.
  if (await auto.getAttribute('aria-pressed') !== 'true' && await auto.isEnabled()) await click('[data-action="battle-mode"][data-id="auto"]');
  await page.locator('[data-action="leave-battle"]').waitFor({state: 'visible', timeout: 180_000});
  const after = await state();
  assert.equal(after.battle.outcome, 'win', `${label}: actual battle must be won`);
  assert.ok(after.battle.events.some(event => event.kind === 'Damaged' && event.amount > 0), 'Real damage facts must exist');
  await click('[data-action="leave-battle"]');
  await continueDialogue();
  pass(`${label}: real two-member party wins and settles`, {battleId: before.battle.name,
    friendlyUnits: friendlies.map(unit => ({id: unit.id, name: unit.name})), enemyCount: before.battle.units.length - friendlies.length});
}
async function buy(itemId) {
  const before = await state();
  const product = before.shop.products.find(item => item.itemId === itemId);
  assert.ok(product?.canBuy, `${itemId} must be an actually purchasable product`);
  await click(`[data-action="buy-item"][data-id="${product.id}"]`);
  const after = await state();
  assert.equal(after.silver, before.silver - product.price, 'Buying must debit the real price');
  assert.equal(count(after, itemId), count(before, itemId) + 1, 'Buying must add exactly one real item');
  for(const existing of before.inventory.filter(item=>item.id===itemId&&item.affixes?.length))
    assert.deepEqual(after.inventory.find(item=>item.entryNumber===existing.entryNumber),existing,'Buying a stack must preserve separately rolled equipment instances');
  const updated = after.shop.products.find(item => item.id === product.id);
  assert.equal(updated.purchased, product.purchased + 1, 'Purchase accounting must update');
  if (product.remaining !== null) assert.equal(updated.remaining, product.remaining - 1, 'Limited stock must decrease');
  return after;
}
async function equip(itemId) {
  await click('[data-action="equipment"]');
  const before = await state();
  const entry = before.inventory.filter(item => item.id === itemId).at(-1);
  assert.ok(entry?.canEquip);
  await click(`[data-action="equip-item"][data-entry-number="${entry.entryNumber}"]`);
  const after = await state();
  assert.ok(after.hero.equipment.some(slot => slot.item?.id === itemId));
  assert.equal(count(after, itemId), count(before, itemId) - 1);
  await closeModal();
}
async function cultivate(itemId) {
  await click('[data-action="cultivation"]');
  const entry = (await state()).inventory.find(item => item.id === itemId);
  assert.ok(entry?.canCultivate, `${itemId} must be a real trainable book`);
  await click(`[data-action="cultivate"][data-entry-number="${entry.entryNumber}"]`);
  assert.equal((await state()).hero.cultivation.itemId, itemId);
  await closeModal();
}
function persisted(s) {
  return {packId: s.pack.id, name: s.hero.name, silver: s.silver, mapId: s.map.id,
    equipment: s.hero.equipment, cultivation: s.hero.cultivation,
    inventory: s.inventory.map(item => ({id: item.id, count: item.count})),
    party: s.party.map(member => ({id: member.id, definitionId: member.definitionId, level: member.level})), objectives: s.objectives};
}

const requests=[];page.on('request',r=>requests.push(r.url()));
await page.addInitScript(()=>{
  for(const [name,key] of [['jyxr-web','slot:jyx'],['jyxr-modern-western','slot:frontier']]){
    const request=indexedDB.open(name,1);
    request.onupgradeneeded=()=>{const store=request.result.createObjectStore('saves');store.put({marker:'frozen-'+name},key);};
    request.onsuccess=()=>request.result.close();
  }
  for(const key of ['jyxr.preferences.v1','jyxr-modern-western.preferences.v1'])
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({interfaceStyle:'classic',battleSpeed:4}));
});
let failure;
try {
  const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
  assert.equal(baseline.browserSaveVersion, 2, 'Run the current browser-smoke before chapter-smoke');
  assert.equal(baseline.packId, 'jyx');
  await page.goto(report.baseURL, {waitUntil: 'networkidle'});
  await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:90_000});
  assert.equal((await state()).pack.id,'jyx');
  assert.ok(await page.locator('[data-action="load"]').isDisabled());
  assert.equal(await page.locator('html').getAttribute('data-interface'),'modern');
  pass('modular Jin Yong boots without reading original or western app storage');
  await importFile(legacyPath);
  const legacy = await state();
  assert.equal(legacy.pack.id, 'jyx');
  assert.equal(legacy.hero.name, '云游测试侠');
  assert.equal(legacy.map.id, '小村');
  assert.equal(legacy.silver, 10);
  assert.equal(legacy.hero.cultivation.itemId, '内功入门');
  assert.equal(objective(legacy, 'training').completed, false, 'Old v1 cannot prove a won battle and must not invent a victory');
  pass('authentic pre-pack v1 browser save imports without inventing battle records');
  await reloadTitle();
  await importFile(baselinePath);
  assert.equal(objective(await state(), 'training').completed, true);
  await location('南贤居');
  await location('南贤');
  await continueDialogue();
  await choice(0);
  await continueDialogue();
  await choice(0);
  await continueDialogue();
  const tutorial = await state();
  assert.equal(tutorial.map.id, '大地图');
  assert.equal(tutorial.silver, 310, 'Original 300-silver tutorial reward must add to the original 10-silver training reward');
  pass('source tutorial grants 300 silver and opens the configured world route');
  await location('洛阳');
  const carriedPotions = count(await state(), '小还丹');
  await location('商店');
  await continueDialogue();
  await choice(0);
  await continueDialogue();
  const gifts = await state();
  assert.equal(count(gifts, '小还丹'), carriedPotions + 5, 'Add the five original tutorial potions to original creation supplies');
  assert.equal(count(gifts, '罗汉拳谱'), 1, 'Original fist-book choice must grant its real book');
  await location('商店');
  await visible('.shop-screen');
  assert.equal(count(await state(), '小还丹'), carriedPotions + 5, 'Reopening the shop must not repeat tutorial gifts');
  await buy('粗布道袍');
  await buy('小还丹');
  // Exhaust affordable medicine using UI purchases, then verify the real
  // insufficient-funds control cannot change silver or inventory.
  for (let attempts = 0; attempts < 12; attempts++) {
    const current = await state();
    if (!current.shop.products.find(item => item.itemId === '小还丹')?.canBuy) break;
    await buy('小还丹');
  }
  const poor = await state();
  const medicine = poor.shop.products.find(item => item.itemId === '小还丹');
  assert.ok(poor.silver < medicine.price, 'The test must reach genuine insufficient funds');
  assert.equal(await page.locator(`[data-action="buy-item"][data-id="${medicine.id}"]`).isDisabled(), true);
  const sale = poor.shop.sellable.find(item => item.id === '小还丹');
  assert.ok(sale?.price > 0);
  await click(`[data-action="sell-item"][data-entry-number="${sale.entryNumber}"]`);
  const sold = await state();
  assert.equal(sold.silver, poor.silver + sale.price);
  assert.equal(count(sold, '小还丹'), count(poor, '小还丹') - 1);
  await page.setViewportSize({width: 375, height: 812});
  await noOverflow('mobile real shop');
  await page.screenshot({path: `${output}chapter-shop-mobile.png`, fullPage: true});
  await page.setViewportSize({width: 1440, height: 900});
  await click('[data-action="close-shop"]');
  await continueDialogue();
  await equip('粗布道袍');
  pass('real shop preserves gift uniqueness, purchase/stock/currency accounting, insufficient funds and selling');
  await location('返回');
  await location('万劫谷');
  await location('钟灵');
  await continueDialogue();
  await choice(0);
  await continueDialogue();
  assert.equal((await state()).party.filter(member => member.definitionId === '钟灵').length, 1);
  await revisitIfAvailable('钟灵');
  assert.equal((await state()).party.filter(member => member.definitionId === '钟灵').length, 1, 'A one-time recruitment may not duplicate a companion');
  await click('[data-action="party"]');
  assert.match(await page.locator('#game-modal').innerText(), /钟灵/);
  await page.setViewportSize({width: 375, height: 812});
  await noOverflow('mobile party');
  await page.screenshot({path: `${output}chapter-party-mobile.png`, fullPage: true});
  await page.setViewportSize({width: 1440, height: 900});
  await closeModal();
  await location('返回');
  await location('南贤居');
  await location('结伴练习');
  await continueDialogue();
  await finishBattle('jyx-team', '钟灵');
  await location('章节回顾');
  await continueDialogue();
  const jyxSave = await saveAndExport('jyx');
  assert.ok((await state()).objectives.every(item => item.completed), 'Every original-campaign chapter objective must be actually satisfied');
  await click('[data-action="quests"]');
  await page.screenshot({path: `${output}jyx-chapter-complete.png`, fullPage: true});
  await closeModal();
  const jyxFinished = persisted(await state());
  pass('original chapter reaches its ending with real equipment, cultivation, party, shop and team battle');


  await reloadTitle();await click('[data-action="load"]');
  assert.deepEqual(persisted(await state()),jyxFinished);
  const wrong=JSON.parse(await readFile(jyxSave.path,'utf8'));wrong.packId='frontier';
  const wrongPath=output+'wrong-pack-for-modern-jyx.json';await writeFile(wrongPath,JSON.stringify(wrong));
  await rejectImport(wrongPath,/另一套内容|内容包|世界/);
  assert.deepEqual(persisted(await state()),jyxFinished);
  pass('complete chapter survives refresh and rejected foreign-pack imports');

  await click('[data-action="companions"]');await page.locator('[data-companion-search]').waitFor();
  await page.locator('[data-companion-search]').fill('钟灵');
  await page.locator('[data-companion-id="钟灵"]').click();
  assert.match(await page.locator('.companion-reading').innerText(),/加入|队伍/);
  assert.deepEqual(persisted(await state()),jyxFinished);await closeModal();
  await click('[data-action="library"]');await page.locator('[data-library-search]').waitFor();
  await page.locator('[data-library-filter]').selectOption('items');
  await page.locator('[data-library-search]').fill('内功入门');
  await page.waitForFunction(()=>document.querySelector('.library-list')?.textContent.includes('内功入门'));
  assert.deepEqual(persisted(await state()),jyxFinished);await closeModal();
  pass('optional companion conditions and source library load without changing the session');
  for(const width of [375,320]){
    await page.setViewportSize({width,height:812});await noOverflow('modern Jin Yong world at'+width);
    for(const panel of ['character','equipment','cultivation','party','quests','settings','companions','library']){
      await click('[data-action="'+panel+'"]');
      if(panel==='companions')await page.locator('[data-companion-search]').waitFor();
      if(panel==='library')await page.locator('[data-library-search]').waitFor();
      await noOverflow('modern Jin Yong '+panel+' at'+width);await closeModal();
    }
  }
  await page.screenshot({path:output+'modern-jyx-mobile.png',fullPage:true});
  const sentinels=await page.evaluate(async()=>Promise.all([['jyxr-web','slot:jyx'],['jyxr-modern-western','slot:frontier']].map(([name,key])=>new Promise((resolve,reject)=>{
    const request=indexedDB.open(name,1);
    request.onsuccess=()=>{const db=request.result,tx=db.transaction('saves','readonly'),get=tx.objectStore('saves').get(key);get.onsuccess=()=>resolve(get.result);get.onerror=()=>reject(get.error);tx.oncomplete=()=>db.close();};
    request.onerror=()=>reject(request.error);
  }))));
  assert.deepEqual(sentinels,[{marker:'frozen-jyxr-web'},{marker:'frozen-jyxr-modern-western'}]);
  for(const key of ['jyxr.preferences.v1','jyxr-modern-western.preferences.v1'])
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).interfaceStyle,key),'classic');
  assert.ok(!requests.some(url=>/\/data\/packs\/frontier\//.test(url)));
  pass('old app and western saves/preferences remain intact; no western content is fetched');
} catch(error){failure=error;}
await h.finish(failure);
