import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createHarness} from './ui-harness.mjs';

const prepared=fileURLToPath(new URL('../../../artifacts/windrider-training-normal/',import.meta.url));
const proof=JSON.parse(await readFile(prepared+'report.json','utf8'));
assert.equal(proof.passed,true);
const h=await createHarness(process.env.GAME_WEB_REPORT||'windrider-training',{}, {trace:false});
const {page,report,output,pass,click,state,ready,closeModal,noOverflow,finish}=h;
let failure;
async function audit(){
 const root=await page.locator('#game-modal[open]').count()?page.locator('#game-modal'):page.locator('body');
 assert.doesNotMatch(await root.innerText(),/[\u3400-\u9fff]/);
}
async function load(name){
 await closeModal();
 const raw=await readFile(prepared+name+'.json');
 assert.equal(createHash('sha256').update(raw).digest('hex'),proof.saves[name]);
 await page.locator('#import-file').setInputFiles(prepared+name+'.json');
 await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
}
async function gameSave(){return page.evaluate(async()=>{
 const r=await window.loadJyxrRuntime(),a=await r.getAssemblyExports('Game.Web.Runtime');
 return JSON.parse(await a.Game.Web.Runtime.BrowserBridge.ExportSave()).game;
});}
async function visit(id){
 if(await page.locator('#destination-search').count())await page.locator('#destination-search').fill('');
 await click(`[data-action="interact"][data-id="${id}"]`);
}
async function practice(){
 await visit('结伴练习');
 for(let n=0;n<3000;n++){
  const s=await state();
  if(s.phase==='dialogue'){await click('[data-action="next"]');continue;}
  if(s.phase==='combatants'){
   const allowed=s.combatantSelection.candidates.filter(c=>!c.forbidden).slice(0,s.combatantSelection.capacity);
   for(const c of allowed)await page.locator(`#combatants-form input[value="${c.id}"]`).check();
   await page.locator('#combatants-form button[type="submit"]').click();await ready();continue;
  }
  if(s.phase==='battle'){
   if(s.battle.outcome!=='ongoing'){assert.equal(s.battle.outcome,'win');await click('[data-action="leave-battle"]');continue;}
   if(await page.locator('[data-action="battle-mode"][data-id="auto"][aria-pressed="false"]').count()){
    await click('[data-action="battle-speed"][data-id="4"]');
    await click('[data-action="battle-mode"][data-id="auto"]');
   }
   await page.waitForTimeout(75);continue;
  }
  assert.equal(s.phase,'world');return;
 }
 assert.fail('Practice did not finish');
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 for(const [name,stage] of [['start','meet'],['met','night'],['night','camp-conflict'],['recruited','warrens'],['alternate-ready','alternate-warrens'],['knight-ending','france-meet']]){
  await load(name);assert.equal(await page.locator('[data-story-stage]').getAttribute('data-story-stage'),stage);
  const before=await gameSave();
  await click('[data-action="quests"]');await audit();await closeModal();
  assert.deepEqual(await gameSave(),before,'Viewing guidance must preserve actual clock, flags, rewards and RNG');
  const s=await state();
  if(s.map.id==='大地图'&&['meet','warrens','alternate-warrens'].includes(stage)){
   assert.equal(await page.locator('[data-atlas-recommended]').getAttribute('data-id'),stage==='meet'?'哈萨克部落':'高昌迷宫');
  }
 }
 pass('six real progress checkpoints show the correct branch and destination without advancing time or RNG');
 await load('dulcinea-ending');
 assert.equal(await page.locator('[data-story-stage]').getAttribute('data-story-stage'),'france-meet');
 await page.setViewportSize({width:375,height:812});await noOverflow('chapter guidance on phone');
 await page.screenshot({path:output+'windrider-guide-mobile.png',fullPage:true});
 await click('[data-action="party"]');await audit();
 const card=page.locator('[data-roster-id="李文秀"]');
 assert.match(await card.locator('[data-companion-preparation]').innerText(),/Unspent points/);
 await click('[data-roster-id="李文秀"] [data-action="party-order"][data-index="1"]');
 assert.equal((await state()).party[1].definitionId,'李文秀');
 await click('[data-roster-id="李文秀"] [data-panel="equipment"]');
 assert.equal((await state()).managedCharacter.definitionId,'李文秀');
 assert.equal(await page.locator('#managed-character').inputValue(),(await state()).managedCharacter.id);
 let s=await state(),gear=s.inventory.find(i=>i.kind==='equipment'&&i.canEquip);
 if(!gear){
  const equipped=s.managedCharacter.equipment.find(x=>x.item);assert.ok(equipped);
  await click(`[data-action="unequip-item"][data-slot="${equipped.slot}"]`);
  s=await state();gear=s.inventory.find(i=>i.id===equipped.item.id&&i.canEquip);
 }
 assert.ok(gear);await click(`[data-action="equip-item"][data-entry-number="${gear.entryNumber}"]`);
 assert.ok((await state()).managedCharacter.equipment.some(x=>x.item?.id===gear.id));
 await click('#game-modal [data-action="character"]');
 const points=(await state()).managedCharacter.unspentStatPoints;assert.ok(points>=30);
 for(let n=0;n<points;n++)await click('[data-action="allocate-stat"][data-stat="qimen"]');
 assert.equal((await state()).managedCharacter.unspentStatPoints,0);
 await click('#game-modal [role="tab"][data-action="cultivation"]');
 s=await state();const scroll=s.inventory.find(i=>i.id==='黑血神针秘籍');assert.ok(scroll.canCultivate);
 await click(`[data-action="cultivate"][data-entry-number="${scroll.entryNumber}"]`);
 await click('[data-action="clear-internal"]');
 assert.equal((await state()).managedCharacter.cultivation.itemId,'黑血神针秘籍');
 await click('[data-action="equip-internal"][data-id="基本内功"]');
 const beforeTraining=(await state()).managedCharacter.cultivation;
 assert.equal(beforeTraining.level,1);assert.equal(beforeTraining.exp,0);
 await noOverflow('companion equipment, points, mastery and scroll controls on phone');await audit();
 await closeModal();
 pass('visible controls equip Dulcinea, spend her actual reward points, assign Bloodthorn Bolt and set mastery separately');
 await visit('南贤居');await practice();
 s=await state();assert.equal(s.phase,'world');
 const ally=s.roster.find(c=>c.definitionId==='李文秀');
 assert.ok(ally.cultivation.level>1||ally.cultivation.exp>0,'Actually deployed companion must earn scroll XP');
 await click('[data-action="save"]');await page.reload();
 await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
 await click('[data-action="party"]');await click('[data-roster-id="李文秀"] [data-panel="cultivation"]');
 s=await state();assert.equal(s.managedCharacter.cultivation.itemId,'黑血神针秘籍');
 assert.equal(s.managedCharacter.cultivation.level,ally.cultivation.level);assert.equal(s.managedCharacter.cultivation.exp,ally.cultivation.exp);
 assert.equal(s.managedCharacter.equippedInternalSkillId,'基本内功');assert.equal(s.managedCharacter.unspentStatPoints,0);
 assert.ok(s.managedCharacter.equipment.some(x=>x.item?.id===gear.id));
 await noOverflow('trained companion after browser save/reload');await audit();
 await page.screenshot({path:output+'windrider-training-mobile.png',fullPage:true});
 report.cultivation={before:beforeTraining,after:s.managedCharacter.cultivation};
 pass('a real team practice grants reward-scroll XP; equipment, spent points, mastery and training survive browser save/reload');
 await closeModal();await visit('返回');await visit('长安');await visit('长安西市');await visit('商店');
 s=await state();assert.equal(s.phase,'shop');
 const product=s.shop.products.find(p=>p.itemId==='全真心法秘籍');assert.ok(product.canBuy);
 const silver=s.silver;await click(`[data-action="buy-item"][data-id="${product.id}"]`);
 assert.equal((await state()).silver,silver-product.price);await click('[data-action="close-shop"]');
 await click('[data-action="party"]');await click('[data-roster-id="李文秀"] [data-panel="cultivation"]');
 s=await state();const masteryScroll=s.inventory.find(i=>i.id==='全真心法秘籍');assert.ok(masteryScroll.canCultivate);
 await click(`[data-action="cultivate"][data-entry-number="${masteryScroll.entryNumber}"]`);
 await click('[data-action="equip-internal"][data-id="全真心法"]');
 const masteryBefore=(await state()).managedCharacter.cultivation;
 assert.equal(masteryBefore.level,1);assert.equal(masteryBefore.exp,0);await audit();await closeModal();
 await visit('返回');await visit('返回');await visit('南贤居');await practice();
 s=await state();const trainedMastery=s.roster.find(c=>c.definitionId==='李文秀').cultivation;
 assert.ok(trainedMastery.level>1||trainedMastery.exp>0);
 await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
 await click('[data-action="party"]');await click('[data-roster-id="李文秀"] [data-panel="cultivation"]');
 s=await state();assert.equal(s.managedCharacter.equippedInternalSkillId,'全真心法');
 assert.equal(s.managedCharacter.cultivation.itemId,'全真心法秘籍');
 assert.equal(s.managedCharacter.cultivation.level,trainedMastery.level);assert.equal(s.managedCharacter.cultivation.exp,trainedMastery.exp);
 assert.ok(s.managedCharacter.externalSkills.some(k=>k.id==='黑血神针'&&(k.level>1||k.exp>0)));
 report.mastery={before:masteryBefore,after:s.managedCharacter.cultivation};
 await audit();await noOverflow('new companion mastery after study, combat and reload');
 pass('a purchased mastery scroll teaches a new passive, earns real combat XP and survives reload alongside the learned spell');
}catch(error){failure=error;}
await finish(failure);
