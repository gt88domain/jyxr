import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createHarness} from './ui-harness.mjs';

const prepared=fileURLToPath(new URL('../../../artifacts/windrider-native/',import.meta.url));
const proof=JSON.parse(await readFile(prepared+'report.json','utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(proof.passed,true);
assert.equal(proof.contentSha256,hash(await readFile(new URL('../public/data/packs/worlds/en/content-package.json',import.meta.url))));
const h=await createHarness(process.env.GAME_WEB_REPORT||'white-horse',{}, {trace:false});
const {page,report,output,pass,click,state,ready,closeModal,noOverflow,finish}=h;
const observed=[],battles=[];
let failure;
async function audit(label){
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const text=await page.locator('#game-modal[open]').count()?await page.locator('#game-modal').innerText():await page.locator('body').innerText();
 assert.doesNotMatch(text,/[\u3400-\u9fff]/,label+': '+text);
}
async function checkpoint(name){
 const path=prepared+name+'.json';assert.equal(hash(await readFile(path)),proof.saves[name]);
 await page.locator('#import-file').setInputFiles(path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 assert.equal((await state()).phase,'world');
}
async function resolve(){
 for(let n=0;n<300;n++){
  let s=await state();
  if(s.phase==='dialogue'){
   assert.doesNotMatch(s.dialogue.text,/[\u3400-\u9fff]/);observed.push(s.dialogue.text);
   await click('[data-action="next"]');continue;
  }
  if(s.phase==='choice'){
   await audit('chapter choices');const index=s.dialogue.text==='How will you answer?'?1:0;
   await click(`[data-action="choice"][data-index="${index}"]`);continue;
  }
  if(s.phase==='combatants'){
   const allowed=s.combatantSelection.candidates.filter(c=>!c.forbidden).slice(0,s.combatantSelection.capacity);
   for(const c of allowed)await page.locator(`#combatants-form input[value="${c.id}"]`).check();
   await page.locator('#combatants-form button[type="submit"]').click();await ready();continue;
  }
  if(s.phase==='battle'){
   const id=s.battle.id;
   await click('[data-action="battle-speed"][data-id="1"]');
   await click('[data-action="battle-mode"][data-id="auto"]');
   // The player can open Inventory while auto-battling: it pauses the timer.
   // Select only an actually available medicine/target; never dispatch a hidden turn.
   for(let turn=0;turn<1200;turn++){
    s=await state();if(s.battle.outcome!=='ongoing')break;
    const tonic=s.inventory.find(i=>i.id==='小还丹'&&i.canUse);
    const target=tonic?.battleTargets?.find(t=>t.canUse&&t.hp>0&&t.hp<t.maxHp*.5);
    if(target){
     await click('[data-action="inventory"]');
     const now=await state(),item=now.inventory.find(i=>i.entryNumber===tonic.entryNumber);
     const recipient=item?.battleTargets?.find(t=>t.id===target.id&&t.canUse);
     if(item?.canUse&&recipient){
      await page.locator(`.battle-item-target[data-entry-number="${item.entryNumber}"]`).selectOption(recipient.id);
      await click(`[data-action="use-item"][data-entry-number="${item.entryNumber}"]`);
     }
     await closeModal();
    }
    await page.waitForTimeout(100);
   }
   s=await state();battles.push({id,outcome:s.battle.outcome});assert.equal(s.battle.outcome,'win',id);
   assert.ok(s.battle.events.some(e=>e.kind==='Damaged'&&e.amount>0));
   await click('[data-action="leave-battle"]');continue;
  }
  assert.equal(s.phase,'world');return s;
 }
 assert.fail('Chapter did not settle');
}
async function visit(id){
 if(await page.locator('#destination-search').count())await page.locator('#destination-search').fill('');
 await click(`[data-action="interact"][data-id="${id}"]`);return await resolve();
}
async function world(){for(let n=0;n<6&&(await state()).map.id!=='大地图';n++)await visit('返回');assert.equal((await state()).map.id,'大地图');}
async function travel(id){await world();return await visit(id);}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await checkpoint('start');await travel('哈萨克部落');await visit('李文秀');await audit('first meeting in camp');
 assert.ok(observed.some(t=>t.includes('Aldonza')&&t.includes('Dulcinea')));
 pass('chapter starts through the real camp entrance from an intact normal-growth checkpoint');
 for(let attempt=0;attempt<120&&!observed.includes('Until next time.');attempt++)await visit('李文秀');
 assert.ok(observed.includes('Until next time.'));
 pass('night encounter, actual ambush and peaceful answer preserve the source trust path');
 for(let attempt=0;attempt<80;attempt++){
  await travel('哈萨克部落');
  if((await state()).party.some(c=>c.definitionId==='李文秀'))break;
 }
 let s=await state();assert.ok(s.party.some(c=>c.definitionId==='李文秀'&&c.name==='Dulcinea'));
 await click('[data-action="party"]');await audit('Dulcinea in party');await closeModal();
 pass('Dulcinea actually joins after the unchanged trust gate');
 for(let attempt=0;attempt<80&&!observed.includes("Of course. The only one of us with four sensible feet.");attempt++)await travel('高昌迷宫');
 assert.ok(observed.includes("Of course. The only one of us with four sensible feet."));
 s=await state();assert.ok(s.inventory.some(i=>i.id==='黑血神针秘籍'&&i.name==='Bloodthorn Bolt Scroll'));
 await world();await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
 s=await state();assert.ok(s.party.some(c=>c.definitionId==='李文秀'&&c.name==='Dulcinea'));
 assert.ok(s.inventory.some(i=>i.id==='黑血神针秘籍'));
 await click('[data-action="party"]');await page.setViewportSize({width:375,height:812});await noOverflow('completed White Horse party on phone');await audit('completed party');
 await page.screenshot({path:output+'white-horse-party-mobile.png',fullPage:true});await closeModal();
 pass('real final victory, native scroll reward and recruited ally survive browser save/reload');
 // Both complete branches are also tested by the native normal-command run.
 // Import its intact alternate ending to check the shared UI/save contract.
 await checkpoint('knight-ending');s=await state();
 assert.ok(s.party.some(c=>c.definitionId==='陈达海'&&c.name==='Don Quixote'));
 assert.ok(!s.party.some(c=>c.definitionId==='李文秀'));
 assert.ok(s.inventory.some(i=>i.id==='河岳英灵集'&&i.name==="Heroes' Almanac"));
 assert.equal(s.adventure.morality,48);
 await click('[data-action="party"]');await audit('alternate recruited knight');await noOverflow('alternate knight party on phone');
 pass('native alternate ending has the knight, almanac, no false Dulcinea join and original morality cost');
 report.battles=battles;report.observedDialogue=observed;
}catch(error){failure=error;report.battles=battles;report.observedDialogue=observed;}
await finish(failure);
