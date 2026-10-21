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
 await interact('南贤居');await interact('南贤');await talk();assert.equal((await state()).phase,'choice');await audit('Grimm choices');
 await click('[data-action="choice"][data-index="0"]');await talk();await audit('tutorial offer');
 await click('[data-action="choice"][data-index="0"]');await talk();assert.equal((await state()).map.id,'大地图');assert.equal((await state()).silver,300);await audit('world map');
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
 s=await state();assert.equal(s.phase,'battle');
 if(s.battle.outcome==='ongoing')await click('[data-action="battle-mode"][data-id="auto"]');
 await page.locator('[data-action="leave-battle"]').waitFor({state:'visible',timeout:180000});
 const outcome=(await state()).battle.outcome;await click('[data-action="leave-battle"]');await talk();
 assert.equal((await state()).phase,'world');pass('practice route settles the real battle and its authored outcome',{outcome});
 await interact('返回');await interact('南贤居');await interact('南贤');await talk();
 if((await state()).phase==='world'){await interact('南贤');await talk();}
 await audit('school selection');assert.equal((await state()).phase,'sect');
 await click('[data-action="select-sect"][data-id="无门派"]');await talk();await audit('independent traveller');
 if((await state()).map.id!=='大地图')await interact('返回');
 await interact('万劫谷');await audit('Healer vale');await interact('钟灵');await talk();await audit('Eir recruitment');
 await click('[data-action="choice"][data-index="0"]');await talk();
 s=await state();assert.ok(s.party.some(c=>c.id==='钟灵'&&c.name==='Eir'));await click('[data-action="party"]');await audit('Eir in party');await closeModal();
 await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({state:'visible',timeout:120000});await click('[data-action="load"]');
 s=await state();assert.ok(s.party.some(c=>c.id==='钟灵'&&c.name==='Eir'));assert.equal(s.hero.name,'Wren');
 await click('[data-action="history"]');await audit('notifications and operation history');await closeModal();
 const native=await page.evaluate(async()=>{const r=await window.loadJyxrRuntime();const a=await r.getAssemblyExports('Game.Web.Runtime');return JSON.parse(await a.Game.Web.Runtime.BrowserBridge.Dispatch('{"type":"state"}')).state;});
 assert.ok(native.hero.externalSkills.some(s=>s.name==='野球拳'));assert.ok(s.hero.externalSkills.some(s=>s.name==="Scrapper's Fist"));
 pass('recruitment and save/load preserve canonical rule names while displaying the new identity');
 await page.setViewportSize({width:375,height:812});await noOverflow('English chapter on phone');await page.screenshot({path:output+'bulk-chapter-mobile.png',fullPage:true});
 report.untranslated=untranslated;assert.deepEqual(untranslated,[],'Visible chapter and core UI must be English');
 pass('chapter screens and seven core panels contain no visible Chinese text');
}catch(error){failure=error;report.untranslated=untranslated;}
await finish(failure);
