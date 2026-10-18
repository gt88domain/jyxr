import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';
const h=await createHarness(process.env.GAME_WEB_REPORT||'late-reference-smoke');
const {page,report,output,pass,click,ready,state,closeModal,noOverflow}=h;
await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.resolve();};});
let failure;
async function decoded(){await page.waitForFunction(()=>[...document.querySelectorAll('.late-stage image')].length>0);await page.evaluate(async()=>{for(const n of document.querySelectorAll('.late-stage image')){const image=new Image();image.src=n.getAttribute('href');await image.decode();}});}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90_000});
  await page.locator('#import-file').setInputFiles(output+'management-save.json');await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  const before=await state();const preference=await page.locator('html').getAttribute('data-interface');
  await click('[data-action="late-reference"]');await page.locator('[data-late-stage="map"]').waitFor();await decoded();
  assert.match(await page.locator('.late-reference').innerText(),/X1\.1\.0\.6[\s\S]*只读/);
  const source=page.locator('[data-source-node="/Canvas/ButtonPanel/ButtonZhuangtai"]');assert.equal(await source.getAttribute('x'),'1043.1');assert.equal(await source.getAttribute('y'),'410.7');
  await page.screenshot({path:output+'late-reference-map-desktop.png'});pass('late map preview renders actual1.1 scene coordinates and original textures with an explicit reconstruction label');
  for(const scene of ['character','battle']){await page.locator(`[data-late-scene="${scene}"]`).click();await decoded();await noOverflow('late '+scene+' desktop');await page.screenshot({path:output+'late-reference-'+scene+'-desktop.png'});}
  assert.deepEqual(await state(),before);pass('map, character and battle scene previews are read-only and never run the old battle or mutate the current game');
  await page.locator('[data-late-tab="differences"]').click();assert.match(await page.locator('[data-late-content]').innerText(),/打包数据[\s\S]*MOD 模板/);assert.equal(await page.locator('[data-late-content]>details').count(),9);pass('version comparison distinguishes bundled, editor and template datasets and exposes specific field examples');
  await page.locator('[data-late-tab="talents"]').click();assert.equal(await page.locator('[data-late-talent]').count(),5);
  assert.match(await page.locator('[data-late-talent="御剑"]').innerText(),/天山剑法[\s\S]*12/);
  assert.match(await page.locator('[data-late-content]').innerText(),/71 项/);pass('all five talent questions and all71 partial talent names are available, with the exact level12 grant of御剑');
  await page.locator('[data-late-tab="legends"]').click();assert.equal(await page.locator('[data-late-legend]').count(),137);
  assert.ok(await page.locator('.late-legends').getByText(/天赋；不检查等级/).count()>0);
  const talentRecipe=await page.locator('[data-late-legend="潇湘夜雨.一剑落九雁-百变千幻云雾十三式"]').innerText();
  assert.match(talentRecipe,/琴胆剑心（天赋；不检查等级）/);assert.doesNotMatch(talentRecipe,/琴胆剑心\s*≥\s*10级/);
  assert.match(await page.locator('[data-late-content]').innerText(),/107[\s\S]*缺省为0/);
  await page.locator('[data-late-search]').fill('万劫闪电貂');assert.equal(await page.locator('[data-late-legend]').filter({visible:true}).count(),1);
  await page.locator('[data-late-search]').fill('不存在的奥义');assert.ok(await page.locator('[data-late-no-match]').isVisible());pass('137 independent legend records remain searchable, including both known trigger issues and107 numeric differences');
  await page.locator('[data-late-tab="rounds"]').click();assert.match(await page.locator('[data-late-content]').innerText(),/17 选1[\s\S]*10 选1[\s\S]*7 选1[\s\S]*9 选1/);
  assert.match(await page.locator('[data-late-content]').innerText(),/无悔实时存档/);assert.match(await page.locator('[data-late-content]').innerText(),/8 个直接/);pass('round progression lists actual growth, chest, rewards, conditional events and remaining difficulty/save differences');
  for(const width of [375,320]){
    await page.setViewportSize({width,height:812});await noOverflow('late rules at'+width);
    await page.locator('[data-late-tab="layout"]').click();await decoded();await noOverflow('late UI preview at'+width);
    await page.locator('[data-late-natural]').check();assert.equal(await page.locator('.late-stage svg').evaluate(n=>n.getBoundingClientRect().width),1140);await noOverflow('natural-size preview scrolls inside its container at'+width);
  }
  await page.screenshot({path:output+'late-reference-mobile.png'});
  assert.deepEqual(await state(),before);assert.equal(await page.locator('html').getAttribute('data-interface'),preference);await closeModal();pass('all reference tabs, filters and mobile zoom preserve the full native state and the chosen modern/classic interface');
  await click('[data-action="settings"]');await click('[data-action="original-interface-reference"]');await click('[data-action="late-reference"]');await page.locator('[data-late-stage]').waitFor();await decoded();
  pass('settings original-interface reference links to the correct later-version comparison');
}catch(error){failure=error;}finally{await h.finish(failure);}
