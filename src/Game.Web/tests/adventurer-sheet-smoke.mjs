import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHarness} from './ui-harness.mjs';
const prepared=fileURLToPath(new URL('../../../artifacts/sheet-native/',import.meta.url));
const h=await createHarness(process.env.GAME_WEB_REPORT||'adventurer-sheet',{}, {trace:false});
const {page,report,output,pass,click,state,ready,closeModal,noOverflow,finish}=h;
let failure;
async function load(name){
 await closeModal();await page.locator('#import-file').setInputFiles(prepared+name+'.json');
 await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
}
async function audit(){
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const text=await page.locator('[data-adventurer-sheet]').innerText();
 assert.doesNotMatch(text,/[\u3400-\u9fff]/);assert.doesNotMatch(text,/Mastery Scroll|Choose a scroll first|no longer add any effect/);
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await load('fresh-normal');await click('[data-action="loadout"]');await audit();
 assert.ok((await state()).hero.internalSkills.some(s=>s.id==='基本内功'));
 assert.equal(await page.locator('[data-loadout-slot="Weapon"] h4').innerText(),'Wooden Practice Blade');
 await noOverflow('adventurer sheet desktop');
 await page.locator('#game-modal').screenshot({path:output+'adventurer-sheet-desktop.png'});
 pass('live character sheet shows a real starter weapon, learned passive and mastery manual');
 await click('[data-loadout-slot="Weapon"] [data-action="unequip-item"]');
 let s=await state();assert.equal(s.hero.equipment.find(x=>x.slot==='Weapon').item,null);
 const blade=s.inventory.find(i=>i.id==='木刀');assert.ok(blade.canEquip);
 await click(`.as-spare-gear [data-action="equip-item"][data-entry-number="${blade.entryNumber}"]`);
 assert.equal((await state()).hero.equipment.find(x=>x.slot==='Weapon').item.id,'木刀');
 const manual=(await state()).inventory.find(i=>i.id==='内功入门');
 assert.equal(manual.name,'Steadfast Mastery Manual');
 await click(`.as-material [data-action="cultivate"][data-entry-number="${manual.entryNumber}"]`);
 assert.equal((await state()).hero.cultivation.itemId,'内功入门');
 await click('.as-mastery-options [data-action="clear-internal"]');
 assert.equal((await state()).hero.equippedInternalSkillId,null);
 assert.equal((await state()).hero.cultivation.itemId,'内功入门');
 await click('.as-mastery-options [data-action="equip-internal"][data-id="基本内功"]');
 assert.equal((await state()).hero.equippedInternalSkillId,'基本内功');
 await page.setViewportSize({width:390,height:844});await noOverflow('adventurer sheet phone');await audit();
 const character=await page.locator('.as-character').boundingBox();
 assert.ok(character.height<260,'Character summary must stay compact on a phone');
 const doll=await page.locator('.as-paperdoll').boundingBox(),identity=await page.locator('.as-identity').boundingBox();
 assert.ok(identity.x>doll.x+60,'Name and mastery must sit beside the portrait, not collide with it');
 await page.locator('#game-modal').evaluate(el=>el.scrollTo(0,0));
 await page.screenshot({path:output+'adventurer-sheet-mobile.png',fullPage:false});
 pass('real equip, unequip, study and passive selection work on the new sheet without changing rule IDs');
 await closeModal();await click('[data-action="save"]');
 const preview=new URL(report.baseURL);preview.searchParams.set('screen','loadout');await page.goto(preview.href);
 await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
 await page.locator('[data-adventurer-sheet]').waitFor();await audit();
 s=await state();assert.equal(s.hero.cultivation.itemId,'内功入门');assert.equal(s.hero.equippedInternalSkillId,'基本内功');
 assert.equal(s.hero.equipment.find(x=>x.slot==='Weapon').item.id,'木刀');
 pass('preview URL opens the real saved character and preserves gear, passive and study');
 await load('completed-primer');await click('[data-action="loadout"]');await audit();
 const primer=(await state()).inventory.find(i=>i.id==='内功入门');
 assert.equal(primer.training.mastered,true);assert.equal(primer.canCultivate,false);
 const card=page.locator('.as-material[data-item-id="内功入门"]');
 assert.match(await card.innerText(),/Already learned|Book completed/);
 assert.ok(await card.locator('[data-action="cultivate"]').isDisabled());
 assert.match(await card.innerText(),/learned everything/);
 await noOverflow('completed primer on phone');
 pass('completed primer explains its status instead of asking the player to press a disabled study button');
 await load('ready-hard');await click('[data-action="loadout"]');await audit();
 s=await state();assert.equal(s.adventure.difficulty,'hard');
 assert.equal(s.hero.equipment.find(x=>x.slot==='Weapon').item.id,'木刀');
 await page.setViewportSize({width:1440,height:1000});await noOverflow('hard-mode starter sheet');
 pass('new hard character also has real starter gear and the original basic mastery');
}catch(error){failure=error;}
await finish(failure);
