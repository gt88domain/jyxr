import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
import {completeCreation} from './creation-controls.mjs';
const prepared=fileURLToPath(new URL('../../../artifacts/academy-journey/',import.meta.url));
const native=JSON.parse(await readFile(prepared+'report.json','utf8'));assert.ok(native.passed);
for(const snapshot of native.snapshots){const data=await readFile(prepared+snapshot.name+'.json');assert.equal(createHash('sha256').update(data).digest('hex'),snapshot.sha256);}
const h=await createHarness(process.env.GAME_WEB_REPORT||'guided-interface',{viewport:{width:390,height:844}},{trace:false});
const {page,report,output,pass,click,state,ready,continueDialogue,closeModal,noOverflow,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,musicVolume:0,effectsVolume:0,reducedMotion:true})));
let failure;
async function load(name){await closeModal();await page.locator('#import-file').setInputFiles(prepared+name+'.json');await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();}
async function audit(selector='[data-guided-world]'){
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 assert.doesNotMatch(await page.locator(selector).innerText(),/[\u3400-\u9fff]/);
}
async function inFirstScreen(selector,label){
 const b=await page.locator(selector).first().boundingBox();
 assert.ok(b&&b.y>=0&&b.y+b.height<=844,`${label} outside the phone viewport: ${JSON.stringify(b)}`);
}
async function settle(){
 for(let n=0;n<30;n++){
  const s=await continueDialogue();if(s.phase!=='choice')return s;
  await click('[data-action="choice"][data-index="0"]');
 }
 assert.fail('School entry interaction did not settle');
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await click('[data-action="new"]');await page.locator('#hero-name').fill('Wren');await page.locator('#character-form button[type="submit"]').click();await ready();
 await completeCreation(page,click);await continueDialogue();await audit();await noOverflow('fresh 390px world');
 for(const a of ['loadout','inventory','party','quests','map-focus','more'])await inFirstScreen(`.system-nav [data-action="${a}"]`,a);
 await inFirstScreen('[data-guidance] [data-next-step]','next step');
 await click('[data-guidance] [data-next-step]');assert.equal((await state()).dialogue.speaker,'Grimm');await continueDialogue();
 assert.equal((await state()).map.id,'小村');await click('[data-guidance] [data-next-step]');
 const blade=(await state()).inventory.find(i=>i.id==='木刀');
 await click(`.as-spare-gear [data-action="equip-item"][data-entry-number="${blade.entryNumber}"]`);
 const book=(await state()).inventory.find(i=>i.id==='内功入门');
 await click(`.as-material [data-action="cultivate"][data-entry-number="${book.entryNumber}"]`);await closeModal();await audit();
 for(const selector of ['.gw-next-actions [data-next-step]','.gw-preparation','[data-world-destinations] h2'])await inFirstScreen(selector,selector);
 await page.screenshot({path:output+'guided-world-mobile.png'});
 for(const a of ['inventory','party','quests']){
  await click(`.system-nav [data-action="${a}"]`);await noOverflow(a+' on phone');
  for(const b of ['loadout','inventory','party','quests'])assert.ok(await page.locator(`.guided-panel-shortcuts [data-action="${b}"]`).isVisible());
  await closeModal();
 }
 await click('.system-nav [data-action="quests"]');await audit('#game-modal');
 // The real route button must close this dialog before talking to the instructor.
 await click('.journey-next [data-next-step]');assert.equal(await page.locator('#game-modal[open]').count(),0);assert.equal((await state()).dialogue.speaker,'Instructor');
 await continueDialogue();await click('[data-action="choice"][data-index="1"]');await continueDialogue();
 pass('visible new-character flow equips the real weapon, studies the manual, and follows the goal to the actual instructor');
 await load('before-school-choice');await click('[data-action="interact"][data-id="南贤"]');let s=await settle();
 if(s.phase==='world'){await click('[data-action="interact"][data-id="南贤"]');s=await settle();}
 assert.equal(s.phase,'sect');await audit('.academy-picker');await noOverflow('organization picker phone');
 const first=page.locator('.academy-cards>article').first();assert.equal(await first.getAttribute('data-academy-id'),'大轮寺');
 await inFirstScreen('[data-academy-id="大轮寺"] [data-action="select-sect"]','join organization');
 assert.equal(await page.locator('[data-action="select-sect"]').count(),9);
 await page.screenshot({path:output+'guided-academy-mobile.png'});
 await click('[data-action="select-sect"][data-id="大轮寺"]');await settle();s=await state();assert.equal(s.adventure.sect,'大轮寺');assert.equal(s.map.id,'门派大轮寺');
 await audit();assert.match(await page.locator('[data-guidance]').innerText(),/60 adventure days/);await inFirstScreen('[data-guidance] [data-next-step]','train now');
 await click('[data-guidance] [data-next-step]');await settle();s=await state();assert.ok(s.hero.externalSkills.find(k=>k.id==='密宗大手印').level>=1);
 await page.screenshot({path:output+'guided-training-mobile.png'});await noOverflow('organization training phone');
 pass('all nine original organizations remain; the guided one joins, teaches and explains the original day gate');
 await load('near-graduation');await click('[data-guidance] [data-next-step]');await settle();s=await state();
 assert.ok(s.party.some(c=>c.definitionId==='达尔巴'));assert.ok(s.chapterJournal.completedStories.includes('门派大轮寺_大轮寺出师'));
 assert.equal(s.party.find(c=>c.definitionId==='达尔巴').name,'The Mad Hatter');await audit();
 await click('.gw-next-actions [data-action="loadout"]');await page.locator('#managed-character').selectOption(s.party.find(c=>c.definitionId==='达尔巴').id);await ready();
 assert.equal((await state()).managedCharacter.definitionId,'达尔巴');await closeModal();
 await click('[data-guidance] [data-next-step]');assert.equal((await state()).map.id,'大轮寺雪山');await audit();
 await click('[data-guidance] [data-next-step]');s=await state();assert.equal(s.map.id,'大地图');assert.equal(s.adventure.sect,'大轮寺');
 await click('.system-nav [data-action="map-focus"]');
 await page.locator('#destination-search').fill("Grimm");
 await click('[data-atlas-place][data-id="南贤居"]');assert.equal((await state()).map.id,'南贤居');
 await click('.gw-place[data-id="返回"]');assert.equal((await state()).map.id,'大地图');
 pass('world-map destination cards remain clickable after moving the atlas into its new screen');
 await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');s=await state();
 assert.equal(s.map.id,'大地图');assert.ok(s.party.some(c=>c.definitionId==='达尔巴'));assert.equal(s.adventure.sect,'大轮寺');
 await noOverflow('world atlas after graduation');
 pass('real training triggers graduation and named companion; visible two-step departure and save/reload preserve affiliation');
 await load('joined');
 for(const width of [320,360,390,768,1440]){
  await page.setViewportSize({width,height:width>=768?900:844});await noOverflow('guided world '+width);
  if(width<=390){await inFirstScreen('[data-guidance] [data-next-step]','training shortcut '+width);await inFirstScreen('.system-nav [data-action="quests"]','goals '+width);}
 }
 await page.screenshot({path:output+'guided-training-desktop.png'});
 const zh=new URL(report.baseURL);zh.searchParams.set('lang','zh-CN');await page.goto(zh.href);await page.locator('[data-action="new"]').waitFor({timeout:120000});await load('joined');
 assert.match(await page.locator('[data-guidance]').innerText(),/圣杯/);assert.equal((await state()).adventure.sect,'大轮寺');await noOverflow('Chinese comparison');
 pass('320–1440px layout and Chinese comparison keep the same live route');
}catch(error){failure=error;}
await finish(failure);
