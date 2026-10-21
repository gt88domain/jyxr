import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHarness} from './ui-harness.mjs';
import {completeCreation} from './creation-controls.mjs';
const skin=JSON.parse(await readFile(new URL('../content/worlds/grimm-skin.json',import.meta.url),'utf8'));
const h=await createHarness(process.env.GAME_WEB_REPORT||'grimm-copy');
const {page,report,output,pass,ready,click,state,continueDialogue,noOverflow,finish}=h;
const lines=skin.dialogueEdits['新手村_南贤开场'][0].lines;
let failure;
try{
 for(const locale of ['en','zh-CN']){
  const url=new URL(report.baseURL);url.searchParams.set('lang',locale);
  await page.goto(url.href);await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:120000});
  assert.equal((await state()).pack.title,skin.title[locale]);assert.doesNotMatch(await page.title(),/thirteen|十三/i);
  await click('[data-action="new"]');await page.locator('#hero-name').fill('文案旅人');await page.locator('#character-form button[type="submit"]').click();await ready();
  await completeCreation(page,click);await continueDialogue();
  let current=await state();assert.equal(current.map.id,'南贤屋内');assert.equal(current.map.locations[0].id,'南贤');
  await click('[data-action="interact"][data-id="南贤"]');
  pass(locale+': new title and guide retain the original game location');
  await page.setViewportSize({width:375,height:812});await noOverflow(locale+' brief opening on phone');
  await page.screenshot({path:output+'grimm-brief-'+locale+'.png',fullPage:true});
  assert.equal(lines.length,6);
  for(const line of lines){
   current=await state();assert.equal(current.phase,'dialogue');assert.equal(current.dialogue.text,line.text[locale]);
   assert.equal(current.dialogue.speaker,line.speaker==='主角'?'文案旅人':skin.name[locale]);
   assert.doesNotMatch(current.dialogue.text,/thirteen|fourteen|十三|十四/i);
   await click('[data-action="next"]');
  }
  assert.equal((await state()).dialogue.text,skin.dialogueEdits['新手村_小村介绍'][0].lines[0].text[locale]);
  pass(locale+': exactly six background lines explain Grimm, childhood tales, summoning and help');
  await continueDialogue();current=await state();
  assert.equal(current.phase,'world');assert.equal(current.map.id,'小村');assert.equal(current.inventory.find(i=>i.id==='内功入门').count,1);assert.equal(current.silver,0);
  assert.ok(current.objectives.find(o=>o.id==='opening').completed);
  pass(locale+': compressed village explanation keeps the original manual reward and exit');
 }
}catch(error){failure=error;}
await finish(failure);
