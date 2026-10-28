import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
import {completeCreation} from './creation-controls.mjs';

const h=await createHarness('opening-ledger',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.method='Fresh isolated character, original penniless questionnaire, no imports, rerolls, save editing or resource commands. At most three genuine instructor attempts, normal Welcome Elixir preparation after a loss, Grimm field assignment, original Crossroads gifts and one actual purchase.';
report.ledger=[];report.dialogue=[];report.practices=[];let failure;
async function record(label){
 const s=await state();
 const row={label,phase:s.phase,map:s.map?.id,silver:s.silver,heroLevel:s.hero.level,
  inventory:s.inventory.map(i=>({id:i.id,name:i.name,count:i.count})),
  nextStep:await page.locator('[data-guidance]').innerText().catch(()=>null)};
 report.ledger.push(row);console.log('LEDGER',label,s.silver);
 await writeFile(h.output+'opening-ledger-progress.json',JSON.stringify(report,null,2));return s;
}
async function dialogue(){
 for(let n=0;n<80;n++){
  const s=await state();if(s.phase!=='dialogue')return s;
  report.dialogue.push({speaker:s.dialogue.speaker,text:s.dialogue.text});await click('[data-action="next"]');
 }assert.fail('Opening dialogue did not settle');
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await click('[data-action="new"]');await page.locator('#hero-name').fill('Rowan');await page.locator('#character-form button[type="submit"]').click();await ready();
 await completeCreation(page,click);await dialogue();let s=await record('Character confirmed');assert.equal(s.silver,0);assert.equal(s.adventure.difficulty,'normal');report.difficulty=s.adventure.difficulty;
 await click('[data-guidance] [data-next-step]');await dialogue();s=await record('Grimm opening and mastery manual');
 assert.equal(s.map.id,'小村');assert.equal(s.silver,0);assert.equal(s.inventory.find(i=>i.id==='内功入门')?.count,1);
 assert.ok(report.dialogue.some(line=>line.text==='Open Gear & study and select the Steadfast Mastery Manual.'));
 await click('[data-action="loadout"]');
 for(const id of ['木刀','草帽']){const item=(await state()).inventory.find(i=>i.id===id);assert.ok(item);await click(`.as-spare-gear [data-action="equip-item"][data-entry-number="${item.entryNumber}"]`);}
 const book=(await state()).inventory.find(i=>i.id==='内功入门');await click(`.as-material [data-action="cultivate"][data-entry-number="${book.entryNumber}"]`);await closeModal();
 s=await record('Equipped starter gear and selected study');assert.equal(s.silver,0);assert.equal(s.hero.cultivation.itemId,'内功入门');
 await noOverflow('Fresh opening preparation at 390px');
 await click('[data-action="interact"][data-id="杂货店"]');await dialogue();s=await state();assert.equal(s.phase,'shop');
 report.firstShop=s.shop;const villageProduct=[...s.shop.products].sort((a,b)=>a.price-b.price)[0];assert.ok(villageProduct&&villageProduct.price>0);
 assert.ok(await page.locator(`[data-action="buy-item"][data-id="${villageProduct.id}"]`).isDisabled());
 await page.screenshot({path:h.output+'opening-ledger-first-shop.png'});await click('[data-action="close-shop"]');
 pass('A genuine penniless opening receives its existing gear and manual, with no invented silver; unaffordable supplies stay unavailable');
 // Follow the field assignment after one win; the instructor has a real level cap.
 for(let n=0;n<3&&!report.practices.some(p=>p.outcome==='win');n++){
  if(n>0){
   await click('[data-action="inventory"]');const elixir=(await state()).inventory.find(i=>i.id==='新手礼包-大蟠桃');assert.ok(elixir?.canUse);
   await click(`[data-action="use-item"][data-entry-number="${elixir.entryNumber}"]`);await closeModal();await record('Used one owned Welcome Elixir before retry');
  }
  const before=await state();await click('[data-action="interact"][data-id="武师"]');await dialogue();assert.equal((await state()).phase,'choice');
  await click('[data-action="choice"][data-index="0"]');await dialogue();s=await state();assert.equal(s.phase,'battle');
  await click('[data-action="battle-mode"][data-id="auto"]');
  await page.locator('[data-action="leave-battle"]').waitFor({state:'visible',timeout:180000});
  s=await state();const battle={number:n+1,outcome:s.battle.outcome,timedOut:s.battle.timedOut,tick:s.battle.tick};report.practices.push(battle);
  await click('[data-action="leave-battle"]');await dialogue();
  if((await state()).phase==='choice'){await click('[data-action="choice"][data-index="1"]');await dialogue();}
  s=await record(`Instructor practice ${n+1}: ${battle.outcome}`);assert.equal(s.phase,'world');
  assert.equal(s.silver-before.silver,battle.outcome==='win'?10:0,'Only actual victories pay the unchanged ten-silver reward');
 }
 assert.ok(report.practices.some(p=>p.outcome==='win'),'Do not invent a won introductory practice');
 assert.equal((await state()).silver,10,'Only the actual victory earns silver');
 await click('[data-guidance] [data-next-step]');await click('[data-guidance] [data-next-step]');await dialogue();
 assert.equal((await state()).phase,'choice');await click('[data-action="choice"][data-index="0"]');await dialogue();
 assert.equal((await state()).phase,'choice');await click('[data-action="choice"][data-index="0"]');await dialogue();
 s=await record('Accepted Grimm field assignment');assert.equal(s.map.id,'大地图');assert.equal(s.silver,310);
 await click('[data-guidance] [data-next-step]');await click('[data-guidance] [data-next-step]');await dialogue();
 assert.equal((await state()).phase,'choice');await click('[data-action="choice"][data-index="0"]');await dialogue();
 s=await record('Crossroads one-time guide and tonic gifts');assert.equal(s.silver,310);
 assert.equal(s.inventory.find(i=>i.id==='小还丹')?.count,8);assert.equal(s.inventory.find(i=>i.id==='罗汉拳谱')?.count,1);
 await click('[data-action="interact"][data-id="商店"]');s=await state();assert.equal(s.phase,'shop');
 assert.equal(s.inventory.find(i=>i.id==='小还丹')?.count,8,'Reopening cannot repeat the one-time gifts');
 const product=s.shop.products.find(p=>p.itemId==='小还丹');assert.ok(product);assert.equal(product.price,50);
 const beforeMoney=s.silver,beforeCount=s.inventory.find(i=>i.id===product.itemId)?.count||0;
 await click(`[data-action="buy-item"][data-id="${product.id}"]`);s=await state();
 assert.equal(s.silver,beforeMoney-product.price);assert.equal(s.inventory.find(i=>i.id===product.itemId)?.count,beforeCount+1);
 report.purchase={id:product.itemId,name:product.name,price:product.price,beforeMoney,afterMoney:s.silver,beforeCount,afterCount:beforeCount+1};
 await click('[data-action="close-shop"]');const saved=await record('First normally earned supply purchase');
 await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');s=await state();
 assert.equal(s.silver,saved.silver);assert.deepEqual(s.inventory,saved.inventory);assert.deepEqual(s.hero,saved.hero);
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');await (await waiting).saveAs(h.output+'opening-earned-supply-save.json');await closeModal();
 report.checkpoint={path:'src/Game.Web/test-results/opening-earned-supply-save.json',sha256:createHash('sha256').update(await readFile(h.output+'opening-earned-supply-save.json')).digest('hex')};
 await noOverflow('Saved opening after earned purchase at 390px');await page.screenshot({path:h.output+'opening-ledger-prepared.png'});
 pass('Actual practice outcomes pay 10 only for victory; original 300-silver assignment, one-time gifts and 50-silver purchase reconcile; save, reload and export preserve the result',report.purchase);
}catch(e){failure=e;}
await finish(failure);
