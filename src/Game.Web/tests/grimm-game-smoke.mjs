import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHarness} from './ui-harness.mjs';
import {completeCreation} from './creation-controls.mjs';
const skin=JSON.parse(await readFile(new URL('../content/worlds/grimm-skin.json',import.meta.url),'utf8'));
const h=await createHarness(process.env.GAME_WEB_REPORT||'grimm-game');
const {page,report,output,pass,ready,visible,click,state,continueDialogue,closeModal,noOverflow,finish}=h;
await page.addInitScript(()=>{
 for(const key of ['jyxr.preferences.v1','jyxr-modern-jyx.preferences.v1'])localStorage.setItem(key,'original-sentinel');
 localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,musicVolume:0,effectsVolume:0}));
});
async function start(name){
 await click('[data-action="new"]');await page.locator('#hero-name').fill(name);await page.locator('#character-form button[type="submit"]').click();await ready();
 await completeCreation(page,click);await continueDialogue();
}
async function firstGrimm(locale,name){
 const before=await state();assert.equal(before.map.id,'南贤屋内');
 const guide=before.map.locations.find(l=>l.id==='南贤');assert.equal(guide.name,skin.name[locale]);
 assert.equal(guide.image,skin.portrait);
 assert.equal(before.map.locations[0].id,'南贤');
 assert.equal(await page.locator('[data-action="interact"][data-id="南贤"]').count(),1);
 await click('[data-action="interact"][data-id="南贤"]');
 const talking=await state();assert.equal(talking.phase,'dialogue');assert.equal(talking.map.id,'南贤屋内');
 assert.equal(talking.dialogue.speaker,skin.name[locale]);assert.equal(talking.dialogue.text,skin.dialogueEdits['新手村_南贤开场'][0].lines[0].text[locale]);
 assert.equal(talking.dialogue.portrait,skin.portrait);
 await page.locator('.dialogue-portrait').evaluate(img=>img.decode());
 assert.equal(await page.locator('.dialogue-portrait').evaluate(img=>img.naturalWidth),1024);
 assert.equal(await page.locator('.system-nav').count(),1);assert.equal(await page.locator('.world-screen').count(),1);
 assert.equal(await page.locator('#opening').count(),0);
 await noOverflow(locale+' original dialogue frame');
 pass(locale+': Grimm occupies the original guide location and dialogue portrait slot');
 return talking;
}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:120000});
 let current=await state();assert.equal(current.pack.id,'jyx');assert.equal(current.pack.title,skin.title.en);
 assert.equal(await page.locator('[data-action="load"]').isDisabled(),true);
 pass('actual shared C# game boots in an isolated fantasy app, with original rule identity');
 await start('测试旅人');await firstGrimm('en','测试旅人');
 await page.screenshot({path:output+'grimm-game-desktop.png',fullPage:true});
 await page.setViewportSize({width:375,height:812});await noOverflow('mobile original gameplay and Grimm dialogue');
 await page.screenshot({path:output+'grimm-game-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:900});
 for(const line of skin.dialogueEdits['新手村_南贤开场'][0].lines){
  assert.equal((await state()).dialogue.text,line.text.en);await click('[data-action="next"]');
 }
 await continueDialogue();current=await state();assert.equal(current.phase,'world');assert.equal(current.map.id,'小村');
 assert.equal(current.inventory.find(i=>i.id==='内功入门').count,1);assert.equal(current.silver,0);
 assert.ok(current.objectives.find(o=>o.id==='opening').completed);
 pass('the brief opening retains the original jump, one manual reward and no invented money');
 await click('[data-action="interact"][data-id="南贤居"]');
 await click('[data-action="interact"][data-id="南贤"]');
 for(const index of [2,3,4,5,6]){
  await click('[data-action="choice"][data-index="'+index+'"]');await continueDialogue();
  assert.equal((await state()).phase,'choice');
 }
 await click('[data-action="choice"][data-index="1"]');await continueDialogue();
 await click('[data-action="interact"][data-id="小村"]');
 assert.equal((await state()).inventory.find(i=>i.id==='内功入门').count,1);
 pass('all five rewritten Grimm questions return to the same menu without duplicating rewards');
 await click('[data-action="cultivation"]');const book=current.inventory.find(i=>i.id==='内功入门');
 await click('[data-action="cultivate"][data-entry-number="'+book.entryNumber+'"]');
 assert.equal((await state()).hero.cultivation.itemId,'内功入门');await closeModal();
 await click('[data-action="equipment"]');current=await state();const hat=current.inventory.find(i=>i.id==='草帽');
 await click('[data-action="equip-item"][data-entry-number="'+hat.entryNumber+'"]');
 assert.ok((await state()).hero.equipment.some(s=>s.item?.id==='草帽'));await closeModal();
 pass('existing cultivation and equipment operations remain functional after the reskin');
 await click('[data-action="interact"][data-id="杂货店"]');
 current=await state();assert.equal(current.dialogue.speaker,skin.speakerNames['商人'].en);
 assert.equal(current.dialogue.text,skin.dialogueEdits['杂货店_商店教程'][0].lines[0].text.en);
 await continueDialogue();current=await state();assert.equal(current.phase,'shop');
 assert.equal(current.shop.name,skin.definitions.shops['新手村.杂货店'].name.en);
 assert.equal(current.shop.products.find(p=>p.itemId==='小还丹').price,100);
 assert.equal(current.shop.products.find(p=>p.itemId==='小还丹').name,skin.definitions.items['小还丹'].name.en);
 await click('[data-action="close-shop"]');
 pass('rewritten shopkeeper opens the original shop with localized names and the original price');
 await click('[data-action="interact"][data-id="武师"]');await continueDialogue();
 for(const [index,segment] of [[2,'新手村_武师1'],[3,'新手村_武师2'],[4,'新手村_武师3'],[5,'新手村_武师4'],[6,'新手村_武师5'],[7,'新手村_武师6']]){
  await click('[data-action="choice"][data-index="'+index+'"]');
  for(const line of skin.dialogueEdits[segment][0].lines){
   current=await state();assert.equal(current.dialogue.text,line.text.en);assert.equal(current.dialogue.speaker,skin.speakerNames['武师'].en);
   await click('[data-action="next"]');
  }
  assert.equal((await state()).phase,'choice');
 }
 pass('all six instructor lessons execute new dialogue and preserve the original choice destinations');
 await click('[data-action="choice"][data-index="0"]');await continueDialogue();current=await state();
 assert.equal(current.phase,'battle');assert.equal(current.battle.units.length,2);
 assert.equal(current.battle.units.find(u=>u.team===2).name,skin.speakerNames['木头人'].en);
 if(current.battle.outcome==='ongoing')await click('[data-action="battle-mode"][data-id="auto"]');
 await page.locator('[data-action="leave-battle"]').waitFor({state:'visible',timeout:180000});
 // Random character rolls and the unchanged AI do not guarantee victory.
 // Verify honest settlement for either outcome, without weakening source rules.
 current=await state();assert.ok(['win','lose'].includes(current.battle.outcome));assert.ok(current.battle.events.some(e=>e.kind==='Damaged'&&e.amount>0));
 const outcome=current.battle.outcome,timedOut=current.battle.timedOut;
 if(timedOut)assert.equal(outcome,'lose','The original time limit must not be converted into a fake victory');
 await click('[data-action="leave-battle"]');await continueDialogue();
 await click('[data-action="choice"][data-index="1"]');await continueDialogue();current=await state();
 assert.equal(current.phase,'world');assert.equal(current.silver,outcome==='win'?10:0);assert.equal(current.hero.cultivation.itemId,'内功入门');
 assert.equal(current.objectives.find(o=>o.id==='training').completed,outcome==='win');
 pass('the original instructor route executes a real battle with unchanged victory or defeat settlement',{outcome,timedOut});
 await click('[data-action="save"]');await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='当前世界的进度已保存。');
 const saved=await state();await page.reload();await page.locator('[data-action="load"]').waitFor({state:'visible',timeout:120000});await click('[data-action="load"]');
 current=await state();assert.equal(current.silver,saved.silver);assert.equal(current.map.id,saved.map.id);assert.equal(current.hero.cultivation.itemId,'内功入门');
 assert.ok(current.hero.equipment.some(s=>s.item?.id==='草帽'));
 pass('real save and reload retain training, equipment and battle reward');
 const chinese=new URL(report.baseURL);chinese.searchParams.set('lang','zh-CN');await page.goto(chinese.href);await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:120000});
 await start('文案对照');await firstGrimm('zh-CN','文案对照');assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
 const stores=await page.evaluate(async()=>({old:localStorage.getItem('jyxr.preferences.v1'),modern:localStorage.getItem('jyxr-modern-jyx.preferences.v1'),dbs:(await indexedDB.databases()).map(d=>d.name)}));
 assert.equal(stores.old,'original-sentinel');assert.equal(stores.modern,'original-sentinel');assert.deepEqual(stores.dbs,['jyxr-fantasy-worlds']);
 pass('Chinese script uses the same real game while original app storage stays untouched');
}catch(error){failure=error;}
await finish(failure);
