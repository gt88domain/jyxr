import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createHarness} from './ui-harness.mjs';
const dir=fileURLToPath(new URL('../../../artifacts/three-story-playthrough/',import.meta.url));
const name=process.env.GAME_WEB_REPORT||'three-story-browser';
const baseline=process.env.GAME_WEB_BASELINE==='1';
const native=JSON.parse(await readFile(dir+'report.json','utf8'));
const h=await createHarness(name,{viewport:{width:390,height:844}},{trace:false});
const {page,report,pass,click,ready,state,closeModal,noOverflow,finish}=h;
await page.addInitScript(()=>{
 localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,musicVolume:0,effectsVolume:0,reducedMotion:true}));
 window.__storyPerformance={longTasks:[]};
 new PerformanceObserver(list=>{for(const e of list.getEntries())window.__storyPerformance.longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});
});
let failure;
async function load(checkpoint){
 const raw=await readFile(dir+checkpoint+'.json');
 assert.equal(createHash('sha256').update(raw).digest('hex'),native.checkpoints[checkpoint]);
 await closeModal();await page.locator('#import-file').setInputFiles(dir+checkpoint+'.json');await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
}
const performance={ui:[],runtime:[]};
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await load('spain-complete');
 const s=await state();assert.ok(s.roster.some(c=>c.definitionId==='李文秀'));
 if(!baseline){
  assert.equal(await page.locator('[data-story-stage]').getAttribute('data-story-stage'),'france-meet');
  assert.doesNotMatch(await page.locator('[data-guidance]').innerText(),/[\u3400-\u9fff]/);
  pass('After Spain, the real guide advances to France without changing its completed story flags');
 }
 await noOverflow('Spain completion at 390px');
 await load('france-complete');
 const f=await state();for(const id of ['霍青桐','陈家洛'])assert.ok(f.roster.some(c=>c.definitionId===id));
 assert.ok(!f.roster.some(c=>c.definitionId==='文泰来'));
 if(!baseline){
  assert.equal(await page.locator('[data-story-stage]').getAttribute('data-story-stage'),'italy-night');
  assert.match(await page.locator('[data-guidance]').innerText(),/ALONE/);
  pass('France preserves both real recruits; Italy warns about the solo finale before entry');
 }
 await noOverflow('France completion at 390px');
 if(!baseline){
  await click('[data-action="quests"]');
  assert.equal(await page.locator('[data-journey-story]').count(),3);
  await page.locator('[data-journey-story="france-complete"] summary').click();
  assert.match(await page.locator('#game-modal').innerText(),/courier.*not another recruit/);
  await noOverflow('three route summaries at 390px');await closeModal();
 }
 for(const action of ['party','cultivation','equipment']){
  await click(`[data-action="${action}"]`);await closeModal();
  for(let n=0;n<5;n++){
   const start=await page.evaluate(()=>performance.now());
   await click(`[data-action="${action}"]`);
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   performance.ui.push({action,ms:await page.evaluate(start=>performance.now()-start,start)});
   await noOverflow(`${action} at 390px`);await closeModal();
  }
 }
 performance.runtime=await page.evaluate(async()=>{
  const r=await window.loadJyxrRuntime(),a=await r.getAssemblyExports('Game.Web.Runtime');
  const result=[];
  for(let n=0;n<15;n++){
   const start=performance.now(),raw=await a.Game.Web.Runtime.BrowserBridge.Dispatch('{"type":"state"}');
   const dispatchMs=performance.now()-start,p=performance.now();JSON.parse(raw);
   result.push({dispatchMs,parseMs:performance.now()-p,bytes:new TextEncoder().encode(raw).length});
  }return result;
 });
 performance.longTasks=await page.evaluate(()=>window.__storyPerformance.longTasks);
 if(!baseline){
  await page.screenshot({path:h.output+'three-story-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:900});await noOverflow('three stories at desktop width');
 }
 pass('Real WASM imports, party, training, equipment, phone layout and read-only runtime timings recorded');
 await writeFile(h.output+name+'-performance.json',JSON.stringify(performance,null,2)+'\n');
}catch(error){failure=error;}
await finish(failure);
