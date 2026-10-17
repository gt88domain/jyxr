import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('stage90-smoke');
const {page,report,output,pass,click,ready,state,visible,closeModal,noOverflow,continueDialogue}=h;
let failure;
await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.resolve()};});
async function stored(key){return page.evaluate(async key=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('jyxr-web',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  try{return await new Promise((resolve,reject)=>{const r=db.transaction('saves','readonly').objectStore('saves').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});}finally{db.close();}
},key);}
async function importFixture(name){await closeModal();await page.locator('#import-file').setInputFiles(output+name);await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();}
async function companions(){if(!await page.locator('[data-action="companions"]').filter({visible:true}).count())await click('[data-action="party"]');await click('[data-action="companions"]');await visible('.companion-browser');}
async function setting(name,checked){await click('[data-action="settings"]');await page.locator(`[name="${name}"]`).setChecked(checked);await closeModal();}
async function bench(name){await click('[data-action="party"]');await click(`[data-action="party-placement"][data-id="${name}"][data-placement="reserve"]`);await closeModal();}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90_000});
  const build=await page.evaluate(async()=>{const r=await fetch('./runtime/build-info.json');if(!r.ok)throw new Error('runtime build info');return r.json()});
  assert.equal(build.configuration,'Release');assert.equal(build.trimmed,false);assert.equal(build.aot,false);
  pass('actual Release WebAssembly boots with reflection retained and measured build metadata');
  await companions();await page.locator('[data-companion-search]').fill('阿九');
  await visible('[data-companion-detail="阿九"]');
  await page.locator('[data-map-access="公主寝宫"]>summary').first().click();
  const palace=page.locator('[data-map-access="公主寝宫"]').first();
  assert.match(await palace.innerText(),/天安门.*公主寝宫/);
  for(const summary of await palace.locator(':scope > details > summary').all())await summary.click();
  assert.match(await palace.innerText(),/皇宫太后7/);assert.match(await palace.innerText(),/接黄金3/);
  assert.ok(await page.locator('a[download="原版伙伴招募路线图册.md"]').count());
  await page.setViewportSize({width:375,height:812});await noOverflow('mobile palace prerequisites and source route guide');
  await page.screenshot({path:output+'stage90-companion-palace-mobile.png',fullPage:true});
  pass('guide preserves map access gates as well as local recruitment conditions, with a separate downloadable atlas');
  await importFixture('stage90-normal-routes-save.json');const original=await state();
  await companions();await page.locator('[data-companion-filter]').selectOption('current');
  assert.equal(await page.locator('.companion-card').count(),14);
  for(const name of ['阿朱','郭襄','袁承志','韦小宝']){await page.locator('[data-companion-search]').fill(name);assert.match(await page.locator('.companion-card').innerText(),/参战中.*|普通流程已验证/s);}
  await page.locator('[data-companion-search]').fill('令狐冲');
  assert.ok(await page.locator('[data-condition-met="yes"]').count()>0);
  await closeModal();assert.deepEqual(await state(),original);
  pass('unedited normal route contains fourteen companions, and live condition browsing preserves game state');
  const manual=await stored('slot:jyx');
  await bench('阿朱');const changed=await state();assert.equal(changed.roster.find(c=>c.definitionId==='阿朱').placement,'reserve');
  const automatic=await stored('auto:jyx');assert.ok(automatic);assert.deepEqual(await stored('slot:jyx'),manual);
  assert.ok(JSON.parse(automatic.data).formationReserveIds.includes('阿朱'));
  pass('automatic checkpoint stores actual formation changes while preserving the manual slot');
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="load"]').waitFor({timeout:90_000});
  await visible('[data-action="load-manual"]');await click('[data-action="load"]');
  assert.equal((await state()).roster.find(c=>c.definitionId==='阿朱').placement,'reserve');
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="load-manual"]').waitFor({timeout:90_000});await click('[data-action="load-manual"]');
  assert.equal((await state()).roster.find(c=>c.definitionId==='阿朱').placement,'member');
  pass('reload offers latest automatic progress and the independent older manual checkpoint');
  await setting('autoSave',false);const before=await stored('auto:jyx');await bench('郭襄');assert.deepEqual(await stored('auto:jyx'),before);
  await setting('autoSave',true);
  await page.evaluate(()=>{window.stage90Put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){if(String(key).startsWith('auto:'))throw new DOMException('Injected quota failure','QuotaExceededError');return window.stage90Put.call(this,value,key);};});
  await bench('阿朱');assert.equal((await state()).roster.find(c=>c.definitionId==='阿朱').placement,'reserve');
  assert.match(await page.locator('#toast').innerText(),/自动保存未能写入/);assert.deepEqual(await stored('auto:jyx'),before);assert.deepEqual(await stored('slot:jyx'),manual);
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.stage90Put;delete window.stage90Put;});
  pass('disabled autosave and injected storage failure preserve old saves and the completed action');
  await importFixture('battle-item-save.json');await setting('reducedMotion',false);
  await click('[data-action="interact"][data-id="阎基居"]');await continueDialogue();
  await click('[data-action="battle-mode"][data-id="auto"]');
  await page.waitForFunction(()=>Number(document.querySelector('#board-viewport')?.dataset.activeSkillEffects)>0,{timeout:30_000});
  await click('[data-action="battle-mode"][data-id="manual"]');await click('[data-action="battle-pause"]');
  await page.mouse.move(1,1);
  const effect=JSON.parse(await page.locator('#board-viewport').getAttribute('data-last-skill-effect'));
  const current=await state();const cast=current.battle.events.find(e=>e.sequence===effect.sequence);
  assert.equal(cast.kind,'SkillCast');assert.equal(effect.animationId,cast.animationId);assert.equal(effect.cells,cast.impactedPositions.length);assert.ok(effect.drawn<=48);
  const canvas=page.locator('#board-viewport canvas'),hash=b=>createHash('sha256').update(b).digest('hex');
  const paused=hash(await canvas.screenshot());await page.waitForTimeout(220);assert.equal(hash(await canvas.screenshot()),paused);assert.deepEqual(await state(),current);
  await page.screenshot({path:output+'stage90-real-skill-effects-mobile.png',fullPage:true});
  pass('actual cast geometry drives bounded skill effects, and pause freezes visuals without advancing battle rules');
  await noOverflow('mobile battle with original sprites and new skill effects');
}catch(error){failure=error;}
await h.finish(failure);
