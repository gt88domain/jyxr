import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';
const h=await createHarness(process.env.GAME_WEB_REPORT||'bulk-chapter');
const {page,report,output,pass,ready,click,state,continueDialogue,closeModal,noOverflow,finish}=h;
const untranslated=[];
async function audit(label){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const texts=await page.evaluate(()=>{
  const root=document.querySelector('#game-modal[open]')||document.body;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const result=[];
  while(walker.nextNode()){
   const n=walker.currentNode,e=n.parentElement;
   if(e&&!e.closest('script,style,code,pre')&&e.getClientRects().length&&/[\u3400-\u9fff]/.test(n.textContent))result.push(n.textContent.trim());
  }
  return [...new Set(result)];
 });
 if(texts.length)untranslated.push({label,texts});
 console.log('AUDIT',label,JSON.stringify(texts));
}
async function interact(id){await click(`[data-action="interact"][data-id="${id}"]`);}
async function battle(label,requireWin=false){
 let s=await state();assert.equal(s.phase,'battle');
 const fast=page.locator('[data-action="battle-speed"][data-id="4"]');
 if(s.battle.outcome==='ongoing'&&await fast.isEnabled()&&await fast.getAttribute('aria-pressed')!=='true')await click('[data-action="battle-speed"][data-id="4"]');
 const auto=page.locator('[data-action="battle-mode"][data-id="auto"]');
 if((await state()).battle.outcome==='ongoing'&&await auto.isEnabled()&&await auto.getAttribute('aria-pressed')!=='true')await click('[data-action="battle-mode"][data-id="auto"]');
 await page.locator('[data-action="leave-battle"]').waitFor({state:'visible',timeout:180000});
 s=await state();const outcome=s.battle.outcome;
 if(requireWin)assert.equal(outcome,'win',label+' needs a real victory');
 assert.ok(s.battle.events.some(e=>e.kind==='Damaged'&&e.amount>0));
 await click('[data-action="leave-battle"]');await talk();pass(label,{outcome});return outcome;
}
async function talk(){
 for(let i=0;i<100;i++){
  const s=await state();if(s.phase!=='dialogue')return s;
  assert.doesNotMatch(s.dialogue.text,/[\u3400-\u9fff]/,s.dialogue.text);
  await click('[data-action="next"]');
 }
 assert.fail('Unexpectedly long chapter dialogue');
}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:120000});await audit('title');
 await click('[data-action="new"]');await audit('new journey');await page.locator('#hero-name').fill('Wren');await page.locator('#character-form button[type="submit"]').click();await ready();
 for(const [question,answer] of [3,3,0,0,0,0,0].entries()){
  await audit('question '+question);await click(`[data-action="creation-answer"][data-question="${question}"][data-index="${answer}"]`);
 }
 await audit('portrait');await click('[data-action="creation-portrait"][data-id="头像.主角"]');await audit('character preview');await click('[data-action="creation-confirm"]');await talk();await audit('Grimm room');
 await interact('南贤');await talk();assert.equal((await state()).map.id,'小村');await audit('village');
 for(const panel of ['character','equipment','cultivation','inventory','party','quests','settings']){
  await click(`[data-action="${panel}"]`);await audit(panel);await closeModal();
 }
 await click('[data-action="equipment"]');
 const hat=(await state()).inventory.find(item=>item.id==='草帽');
 await click(`[data-action="preview-equipment"][data-entry-number="${hat.entryNumber}"]`);await audit('equipment comparison');
 await click(`[data-action="confirm-equipment-preview"][data-entry-number="${hat.entryNumber}"]`);await closeModal();
 await click('[data-action="cultivation"]');
 const scroll=(await state()).inventory.find(item=>item.id==='内功入门');
 assert.equal(scroll.name,'Steady Breath Scroll');await click(`[data-action="cultivate"][data-entry-number="${scroll.entryNumber}"]`);await closeModal();
 await click('[data-action="inventory"]');
 let elixir=(await state()).inventory.find(item=>item.id==='新手礼包-大蟠桃');
 assert.equal(elixir.name,"Wayfarer's Welcome Elixir");
 const beforeElixir=await state();await click(`[data-action="use-item"][data-entry-number="${elixir.entryNumber}"]`);
 assert.equal((await state()).hero.maxHp,beforeElixir.hero.maxHp+100);assert.equal((await state()).hero.maxMp,beforeElixir.hero.maxMp+100);await closeModal();
 await interact('武师');await talk();await click('[data-action="choice"][data-index="0"]');await talk();
 await audit('opening practice with renamed spell');await battle('first practice settles without inventing a victory');
 await click('[data-action="choice"][data-index="1"]');await talk();
 assert.equal((await state()).objectives.find(o=>o.id==='training').completed,true);
 await interact('南贤居');await interact('南贤');await talk();assert.equal((await state()).phase,'choice');await audit('Grimm choices');
 await click('[data-action="choice"][data-index="0"]');await talk();await audit('tutorial offer');
 const beforeBudget=(await state()).silver;
 await click('[data-action="choice"][data-index="0"]');await talk();assert.equal((await state()).map.id,'大地图');assert.equal((await state()).silver,beforeBudget+300);await audit('world map');
 await interact('洛阳');await audit('Crossroads');await interact('商店');await talk();await audit('manual choice');await click('[data-action="choice"][data-index="0"]');await talk();
 assert.ok((await state()).inventory.find(i=>i.id==='小还丹').count>=5);await interact('商店');await audit('supply shop');
 let s=await state();const product=s.shop.products.find(p=>p.itemId==='小还丹');const silver=s.silver;
 await click(`[data-action="buy-item"][data-id="${product.id}"]`);assert.equal((await state()).silver,silver-product.price);await click('[data-action="close-shop"]');
 pass('shopping quest preserves its manual, five tonics, prices and actual purchase');
 await interact('返回');await interact('南贤居');await interact('南贤');await talk();
 // Reward dialogue returns to the map; ask again for the next assignment.
 if((await state()).phase==='world'){await interact('南贤');await talk();}
 await audit('training assignment');assert.equal((await state()).phase,'choice');
 await click('[data-action="choice"][data-index="0"]');await talk();
 if((await state()).map.id==='南贤居')await interact('返回');
 await interact('洛阳');await interact('小孩');await talk();await audit('apprentice battle');
 await battle('practice route settles the real battle and its authored outcome');assert.equal((await state()).phase,'world');
 await interact('返回');await interact('南贤居');await interact('南贤');await talk();
 if((await state()).phase==='world'){await interact('南贤');await talk();}
 await audit('school selection');assert.equal((await state()).phase,'sect');
 await click('[data-action="select-sect"][data-id="无门派"]');await talk();await audit('independent traveller');
 if((await state()).map.id!=='大地图')await interact('返回');
 await interact('万劫谷');await audit('Healer vale');await interact('钟灵');await talk();await audit('Eir recruitment');
 await click('[data-action="choice"][data-index="0"]');await talk();
 s=await state();assert.ok(s.party.some(c=>c.id==='钟灵'&&c.name==='Eir'));await click('[data-action="party"]');await audit('Eir in party');await closeModal();
 await interact('返回');await interact('南贤居');await interact('结伴练习');await talk();
 s=await state();assert.equal(s.battle.units.filter(u=>u.team===1).length,2);assert.ok(s.battle.units.some(u=>u.definitionId==='钟灵'||u.name==='Eir'));
 await battle('two real companions win and settle team practice',true);await audit('team practice settled');
 await interact('章节回顾');
 assert.match((await state()).dialogue.text,/two travellers become a team/);await audit('field notes dialogue');await talk();
 await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({state:'visible',timeout:120000});await click('[data-action="load"]');
 s=await state();assert.ok(s.party.some(c=>c.id==='钟灵'&&c.name==='Eir'));assert.equal(s.hero.name,'Wren');
 assert.equal(s.hero.cultivation.itemId,'内功入门');assert.ok(s.hero.equipment.some(slot=>slot.item?.id==='草帽'));
 assert.equal(s.objectives.length,9);assert.ok(s.objectives.every(o=>o.completed),JSON.stringify(s.objectives));
 pass('all nine opening goals persist after a genuine save/load',{goals:s.objectives.map(o=>({id:o.id,completed:o.completed})),mapId:s.map.id,companion:s.party.find(c=>c.id==='钟灵').name});
 await page.locator('[data-opening-guide="complete"]').waitFor();await audit('all nine goals complete after reload');
 await click('[data-action="quests"]');await audit('completed chapter checklist');await closeModal();
 await click('[data-action="inventory"]');await audit('renamed supplies and actual random drops');await closeModal();
 await click('[data-action="history"]');await audit('notifications and operation history');await closeModal();
 const native=await page.evaluate(async()=>{const r=await window.loadJyxrRuntime();const a=await r.getAssemblyExports('Game.Web.Runtime');return JSON.parse(await a.Game.Web.Runtime.BrowserBridge.Dispatch('{"type":"state"}')).state;});
 assert.ok(native.hero.externalSkills.some(s=>s.name==='野球拳'));assert.ok(s.hero.externalSkills.some(s=>s.name==="Wayfarer's Arcane Strike"));
 pass('recruitment and save/load preserve canonical rule names while displaying the new identity');
 await page.setViewportSize({width:375,height:812});await noOverflow('English chapter on phone');await page.screenshot({path:output+'bulk-chapter-mobile.png',fullPage:true});
 report.untranslated=untranslated;assert.deepEqual(untranslated,[],'Visible chapter and core UI must be English');
 pass('chapter screens and seven core panels contain no visible Chinese text');
}catch(error){failure=error;report.untranslated=untranslated;}
await finish(failure);
