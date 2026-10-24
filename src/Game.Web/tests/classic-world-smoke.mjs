import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHarness} from './ui-harness.mjs';
import {worldStatus} from '../src/world-status.ts';
const prepared=fileURLToPath(new URL('../../../artifacts/academy-journey/',import.meta.url));
const h=await createHarness(process.env.GAME_WEB_REPORT||'classic-world',{viewport:{width:390,height:844}},{trace:false});
const {page,report,output,pass,click,state,ready,continueDialogue,closeModal,noOverflow,finish}=h;
let failure;
async function load(name){await closeModal();await page.locator('#import-file').setInputFiles(prepared+name+'.json');await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();}
async function savedGame(){return page.evaluate(async()=>{const r=await window.loadJyxrRuntime(),a=await r.getAssemblyExports('Game.Web.Runtime');return JSON.parse(await a.Game.Web.Runtime.BrowserBridge.ExportSave()).game;});}
async function audit(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.doesNotMatch(await page.locator('[data-guided-world]').innerText(),/[\u3400-\u9fff]/);}
async function settle(){for(let n=0;n<30;n++){const s=await continueDialogue();if(s.phase!=='choice')return s;await click('[data-action="choice"][data-index="0"]');}assert.fail('Entry did not settle');}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await load('joined');let s=await state(),expected=worldStatus(s,'en');await audit();
 assert.equal(await page.locator('[data-world-affiliation] strong').innerText(),'Round Table');
 assert.equal(await page.locator('[data-world-affiliation]').getAttribute('title'),'Knights of the Round Table');
 assert.match(await page.locator('[data-world-clock]').innerText(),new RegExp(String(expected.day)));
 assert.ok((await page.locator('[data-world-clock]').innerText()).includes(expected.time));
 const before=await savedGame();await click('.system-nav [data-action="quests"]');await closeModal();assert.deepEqual(await savedGame(),before);
 pass('clock and organization show the actual saved time and affiliation without changing game state');
 for(const [width,height] of [[320,568],[375,667],[390,844],[1440,900]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));await noOverflow(`classic status ${width}×${height}`);
  const dock=await page.locator('.system-nav').boundingBox();
  const next=await page.locator('[data-guidance] [data-next-step]').boundingBox();
  assert.ok(next.y>=0&&next.y+next.height<=dock.y,`Next action hidden behind dock at ${width}×${height}: ${JSON.stringify({next,dock})}`);
  for(const name of ['loadout','inventory','party','quests','map-focus','more']){
   const button=await page.locator(`.system-nav [data-action="${name}"]`).boundingBox();assert.ok(button.x>=0&&button.x+button.width<=width+1);
  }
 }
 await page.setViewportSize({width:375,height:667});await page.screenshot({path:output+'classic-status-mobile.png'});
 pass('next action and common shortcuts stay usable above the dock, including 320×568 phones');
 await load('before-school-choice');await click('[data-action="interact"][data-id="南贤"]');s=await settle();
 if(s.phase==='world'){await click('[data-action="interact"][data-id="南贤"]');s=await settle();}
 assert.equal(s.phase,'sect');assert.equal(await page.locator('[data-action="select-sect"]').count(),9);
 for(const [id,name] of [['大轮寺','Knights of the Round Table'],['少林派','Shaolin Temple'],['血刀门',"Van Helsing's Hunters"]])assert.equal(await page.locator(`[data-academy-id="${id}"] h3`).innerText(),name);
 assert.doesNotMatch(await page.locator('.academy-picker').innerText(),/Grail Lodge|Dharma Courtyard|Dawn Hunters|[\u3400-\u9fff]/);
 await click('[data-action="select-sect"][data-id="大轮寺"]');await settle();assert.equal((await state()).adventure.sect,'大轮寺');
 assert.equal(await page.locator('[data-world-affiliation] strong').innerText(),'Round Table');
 pass('classic organization names appear in real entry choices and retain their original IDs');
 await load('departed');assert.equal((await state()).adventure.sect,'大轮寺');assert.equal(await page.locator('[data-world-affiliation] strong').innerText(),'Round Table');
 await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
 assert.equal((await state()).adventure.sect,'大轮寺');assert.equal(await page.locator('[data-world-affiliation] strong').innerText(),'Round Table');
 pass('graduation and browser save/reload preserve affiliation after the display rename');
 const zh=new URL(report.baseURL);zh.searchParams.set('lang','zh-CN');await page.goto(zh.href);await page.locator('[data-action="new"]').waitFor({timeout:120000});await load('joined');
 s=await state();expected=worldStatus(s,'zh-CN');assert.equal(await page.locator('[data-world-affiliation] strong').innerText(),'圆桌骑士团');assert.ok((await page.locator('[data-world-clock]').innerText()).includes(expected.time));
 await noOverflow('Chinese status comparison');pass('Chinese comparison uses the same time, organization and save identifiers');
}catch(error){failure=error;}
await finish(failure);
