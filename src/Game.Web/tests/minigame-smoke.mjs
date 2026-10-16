import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('minigame-smoke');
const {page,output,report,pass,ready,visible,click,state,continueDialogue,noOverflow}=h;
async function location(id){if(await page.locator('#destination-search').count())await page.locator('#destination-search').fill(id);await click(`[data-action="interact"][data-id="${id}"]`);}
async function choose(){await click('[data-action="choice"][data-index="0"]');await continueDialogue();}
async function train(npc){
  await location(npc);await continueDialogue();
  // Each original NPC has its own first-use inn introduction event. Finish it
  // before using that NPC's repeatable training event.
  if((await state()).phase==='world'){await location(npc);await continueDialogue();}
  assert.equal((await state()).phase,'choice');await choose();await visible('#training-area');
}
let failure;
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await page.locator('#import-file').setInputFiles(output+'management-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  await location('返回');await location('同福客栈');await location('佟湘玉');await continueDialogue();
  const before=await state();await train('佟湘玉');
  assert.equal((await state()).miniGame.id,'qinggong');assert.equal((await state()).silver,before.silver-10);
  await page.waitForFunction(()=>[...document.querySelectorAll('.training-target img,.training-hero')].every(i=>i.complete&&i.naturalWidth>0));
  await page.setViewportSize({width:375,height:812});await noOverflow('lightness training at 375px');
  await page.screenshot({path:output+'original-lightness-mobile.png',fullPage:true});
  await click('[data-mini-action="start"]');
  assert.equal(await page.locator('[data-mini-action="start"]').isVisible(),false,'Started training must hide its start control');
  await click('[data-mini-action="pause"]');
  await page.waitForFunction(()=>document.querySelector('#training-area')?.dataset.paused==='true');
  const paused=await page.locator('#training-score').innerText();await page.waitForTimeout(250);
  assert.equal(await page.locator('#training-score').innerText(),paused);
  assert.equal((await state()).phase,'minigame');
  pass('original lightness entry charges ten silver, loads original portraits and pauses actual training');
  await page.setViewportSize({width:1440,height:900});await click('[data-mini-action="pause"]');
  // Deliberately move onto a real moving obstacle through ordinary pointer input.
  for(let i=0;i<5&&(await state()).phase==='minigame';i++){
    const box=await page.locator('.training-target[data-target="东"]').boundingBox();
    if(box)await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await page.waitForTimeout(50);
  }
  await page.waitForFunction(()=>!document.querySelector('#training-area'));await ready();await continueDialogue();
  assert.equal((await state()).phase,'world');
  pass('real lightness collision settles through original reward and growth dialogue');
  const afterLightness=await state();
  await train('白展堂');assert.equal((await state()).miniGame.id,'dianxue');
  assert.equal((await state()).silver,afterLightness.silver-10);
  await click('[data-mini-action="start"]');
  assert.equal(await page.locator('[data-mini-action="start"]').isVisible(),false);
  const plus=page.locator('.training-target[data-target="西"]');await plus.waitFor({state:'visible'});
  await plus.click();
  await page.waitForFunction(()=>document.querySelector('#training-area')?.dataset.score==='4');
  const bad=page.locator('.training-target[data-target="东"]');await bad.waitFor({state:'visible'});await bad.click();
  await page.waitForFunction(()=>document.querySelector('#training-area')?.dataset.score==='2');
  await click('[data-mini-action="pause"]');
  await page.waitForFunction(()=>document.querySelector('#training-area')?.dataset.paused==='true');
  await page.setViewportSize({width:375,height:812});await noOverflow('strength training at 375px');
  await page.screenshot({path:output+'original-strength-mobile.png',fullPage:true});
  pass('original point targets really add four and subtract two, with readable mobile training controls');
  await click('[data-mini-action="quit"]');await page.waitForFunction(()=>!document.querySelector('#training-area'));await ready();await continueDialogue();
  assert.equal((await state()).phase,'world');
  await click('[data-action="save"]');await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='当前世界的进度已保存。');
  await page.reload({waitUntil:'networkidle'});await visible('[data-action="load"]');await click('[data-action="load"]');
  const saved=await state();
  for(const npc of ['佟湘玉','白展堂']){
    await location(npc);await continueDialogue();await choose();
    assert.equal((await state()).phase,'world');assert.equal((await state()).silver,saved.silver);
  }
  pass('earned strength result settles and both original monthly cooldowns survive browser save/reload');
}catch(e){failure=e;}
await h.finish(failure);
