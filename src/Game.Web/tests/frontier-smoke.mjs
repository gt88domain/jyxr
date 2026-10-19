import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness(process.env.GAME_WEB_REPORT||'frontier-smoke');
const {page,report,output,pass,click,ready,state,continueDialogue,closeModal,noOverflow,rejectImport}=h;
const requests=[];page.on('request',r=>requests.push(r.url()));
// Only the retired app's namespace is seeded; the new journey is played
// entirely through visible controls and must not read or overwrite this data.
await page.addInitScript(()=>{
  localStorage.setItem('jyxr.preferences.v1',JSON.stringify({interfaceStyle:'classic',battleMode:'auto'}));
  const request=indexedDB.open('jyxr-web',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('saves');
  request.onsuccess=()=>{const db=request.result,tx=db.transaction('saves','readwrite');tx.objectStore('saves').put({marker:'frozen-original'},'slot:frontier');tx.oncomplete=()=>db.close();};
});
let failure;
const count=(s,id)=>(s.inventory||[]).filter(i=>i.id===id).reduce((n,i)=>n+i.count,0);
const location=id=>click(`[data-action="interact"][data-id="${id}"]`);
const choice=index=>click(`[data-action="choice"][data-index="${index}"]`);
async function equip(id){await click('[data-action="equipment"]');await click(`[data-item-id="${id}"] [data-action="equip-item"]`);assert.ok((await state()).hero.equipment.some(e=>e.item?.id===id));await closeModal();}
async function battle(label,manual=false){
  await page.locator('#board-viewport[data-board-geometry]').waitFor();
  const before=await state();assert.equal(before.battle.units.filter(u=>u.team===1).length,2);
  if(manual)assert.equal(before.battle.outcome,'ongoing');
  if(manual){
    const actor=before.battle.units.find(u=>u.id===before.battle.activeUnitId);assert.equal(actor.team,1);
    const point=[...before.battle.reachable].sort((a,b)=>b.x-a.x||a.y-b.y)[0];assert.ok(point);
    const box=await page.locator('#board-viewport canvas').boundingBox();
    const geometry=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry'));
    await page.mouse.click(box.x+geometry.left+(point.x+.5)*geometry.cell,box.y+geometry.top+(point.y+.5)*geometry.cell);await ready();
    const moved=(await state()).battle.units.find(u=>u.id===actor.id);assert.equal(moved.x,point.x);assert.equal(moved.y,point.y);
    pass('manual movement uses the actual board and the shared engine');
  }
  const speed=page.locator('[data-action="battle-speed"][data-id="4"]');
  if(before.battle.outcome==='ongoing'&&await speed.getAttribute('aria-pressed')!=='true'&&await speed.isEnabled())await click('[data-action="battle-speed"][data-id="4"]');
  const auto=page.locator('[data-action="battle-mode"][data-id="auto"]');
  if(await auto.getAttribute('aria-pressed')!=='true'&&await auto.isEnabled())await click('[data-action="battle-mode"][data-id="auto"]');
  await page.locator('[data-action="leave-battle"]').waitFor({timeout:180000});
  const finished=await state();assert.equal(finished.battle.outcome,'win');
  assert.ok(finished.battle.events.some(e=>e.kind==='Damaged'&&e.amount>0));
  await page.screenshot({path:output+label+'.png'});await click('[data-action="leave-battle"]');await continueDialogue();
  pass(label+' wins and settles with both actual party members');
}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90000});
  assert.equal((await state()).pack.id,'frontier');assert.equal(await page.locator('html').getAttribute('data-interface'),'modern');
  assert.ok(await page.locator('[data-action="load"]').isDisabled());assert.doesNotMatch(await page.locator('body').innerText(),/原版资料馆|复原进度|金庸群侠传/);
  pass('independent application boots directly into the western module and ignores original preferences and save slots');
  await click('[data-action="new"]');await page.locator('#hero-name').fill('边境验收佣兵');await page.locator('#character-form button[type="submit"]').click();await ready();await continueDialogue();
  assert.equal((await state()).silver,80);assert.equal(count(await state(),'frontier_field_dressing'),2);
  await location('mara');await continueDialogue();await choice(1);await continueDialogue();assert.equal((await state()).party.length,1);
  await click('[data-action="save"]');await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="load"]').waitFor({timeout:90000});await click('[data-action="load"]');
  await location('mara');await continueDialogue();await choice(0);await continueDialogue();await location('mara');await continueDialogue();assert.equal((await state()).party.length,2);
  pass('declining recruitment, saving, reloading and reconsidering cannot permanently lock the chapter or duplicate Mara');
  await equip('frontier_arming_sword');await click('[data-action="cultivation"]');await click('[data-item-id="frontier_breathing_notes"] [data-action="cultivate"]');assert.equal((await state()).hero.cultivation.itemId,'frontier_breathing_notes');await closeModal();
  await location('quartermaster');const shop=await state();const product=shop.shop.products.find(p=>p.itemId==='frontier_padded_jack');
  await click(`[data-action="buy-item"][data-id="${product.id}"]`);assert.equal((await state()).silver,shop.silver-product.price);
  await page.setViewportSize({width:375,height:812});await noOverflow('western shop at375px');await page.setViewportSize({width:1440,height:900});
  await click('[data-action="close-shop"]');await equip('frontier_padded_jack');
  await click('[data-action="character"]');assert.match(await page.locator('.profile-stats').innerText(),/力量[\s\S]*意志/);await closeModal();
  pass('real equipment, western stat labels, manual training and shop accounting use shared services');
  await location('east-road');const gate=page.locator('[data-action="interact"][data-id="watchtower"]');assert.ok(await gate.count()===0||await gate.isDisabled());
  await location('roadblock');await continueDialogue();await battle('frontier-road-new',true);
  await location('watchtower');await location('storehouse');await continueDialogue();await choice(0);await continueDialogue();await battle('frontier-ruins-new');
  assert.equal(count(await state(),'frontier_sealed_ledger'),1);await location('old-road');await location('camp');
  const before=await state();await location('captain');await continueDialogue();const paid=await state();assert.equal(paid.silver,before.silver+120);
  const again=page.locator('[data-action="interact"][data-id="captain"]');if(await again.isEnabled()){await location('captain');await continueDialogue();}assert.equal((await state()).silver,paid.silver);
  pass('three-map exploration returns the real ledger and pays the commission once');
  const learned=(await state()).hero.internalSkills.find(s=>s.id==='frontier_steady_breath');assert.ok(learned.level>1||learned.exp>0);
  await click('[data-action="save"]');assert.ok((await state()).objectives.every(o=>o.completed));
  await click('[data-action="inventory"]');const downloadEvent=page.waitForEvent('download');await click('[data-action="download-save"]');const download=await downloadEvent;const savePath=output+'frontier-modern-completed.json';await download.saveAs(savePath);await closeModal();
  assert.equal(JSON.parse(await readFile(savePath,'utf8')).packId,'frontier');
  const finished=await state();await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="load"]').waitFor({timeout:90000});await click('[data-action="load"]');
  const restored=await state();for(const field of ['silver','inventory','objectives','party'])assert.deepEqual(restored[field],finished[field]);
  await rejectImport(new URL('./fixtures/legacy-v1-save.json',import.meta.url).pathname,/另一套内容|内容包|世界/);
  assert.deepEqual((await state()).inventory,restored.inventory);pass('all nine objectives, actual training growth, export, reload and rejected cross-game import preserve the completed journey');
  for(const width of [375,320]){await page.setViewportSize({width,height:812});await noOverflow('western world at'+width);for(const panel of ['character','equipment','cultivation','party','quests','settings']){await click(`[data-action="${panel}"]`);await noOverflow('western '+panel+' at'+width);await closeModal();}}
  await page.screenshot({path:output+'frontier-modern-mobile.png'});
  const original=await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('jyxr-web',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('saves','readonly'),get=tx.objectStore('saves').get('slot:frontier');get.onsuccess=()=>resolve(get.result);tx.oncomplete=()=>db.close();get.onerror=()=>reject(get.error);};request.onerror=()=>reject(request.error);}));
  assert.deepEqual(original,{marker:'frozen-original'});assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('jyxr.preferences.v1')).interfaceStyle),'classic');
  assert.ok(!requests.some(url=>/\/data\/(library|packs\/jyx)|\/art\/legacy/.test(url)));pass('original storage stays untouched and western play never requests original content or artwork');
}catch(error){failure=error;}finally{await h.finish(failure);}
