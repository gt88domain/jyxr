import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness(process.env.GAME_WEB_REPORT||'original-modern-smoke',{hasTouch:true});
const {page,report,output,pass,click,ready,state,closeModal,noOverflow}=h;
await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.resolve();};});
let failure;
async function style(value){await closeModal();await click('[data-action="settings"]');await page.locator('[name="interfaceStyle"]').selectOption(value);await closeModal();}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90000});
  await page.locator('#import-file').setInputFiles(output+'management-save.json');await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  const original=await state();await style('classic');await click('[data-action="character"]');
  const live=page.locator('[data-classic-sheet="character"]');await live.waitFor();
  assert.equal(await live.locator('.classic-sheet-person h3').innerText(),original.managedCharacter.name);
  assert.equal(await live.locator('[data-sheet-resource="hp"] meter').getAttribute('value'),String(original.managedCharacter.hp));
  const contrast=await live.locator('.profile-vitals').evaluate(element=>{
    const rgb=getComputedStyle(element).color.match(/[\d.]+/g).slice(0,3).map(Number);
    const luminance=channels=>channels.map(value=>value/255).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
    const values=[luminance(rgb),luminance([222,201,159])].sort((a,b)=>b-a);return (values[0]+0.05)/(values[1]+0.05);
  });assert.ok(contrast>=4.5,'live text must remain legible on the paper background');
  await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.classic-sheet img')].map(image=>image.decode()));});
  assert.deepEqual(await state(),original);pass('classic character sheet displays actual selected character, resources and decoded later-version artwork without changing state');
  const talent=page.locator('[data-talent-id]').first();await talent.locator('summary').click();assert.ok((await talent.locator('p').first().innerText()).length>0);
  assert.deepEqual(await state(),original);pass('talent descriptions are readable by touch instead of requiring hover');
  await click('.classic-sheet-person [data-action="equipment"]');await page.locator('#managed-character').selectOption('钟灵');await ready();
  await click('[data-action="unequip-item"][data-slot="Weapon"]');const beforeEquip=await state();
  assert.equal(beforeEquip.managedCharacter.id,'钟灵');
  await click('[data-item-id="木刀"] [data-action="equip-item"]');
  assert.equal((await state()).managedCharacter.equipment.find(s=>s.slot==='Weapon').item.id,'木刀');
  pass('classic equipment navigation equips the selected companion through the real inventory service');
  await click('.classic-sheet-person [data-action="cultivation"]');await click('[data-action="clear-cultivation"]');
  assert.equal((await state()).managedCharacter.cultivation,null);
  await click('[data-item-id="内功入门"] [data-action="cultivate"]');
  const trained=await state();assert.equal(trained.managedCharacter.cultivation.itemId,'内功入门');
  assert.equal(trained.inventory.find(i=>i.id==='内功入门').count,beforeEquip.inventory.find(i=>i.id==='内功入门').count);
  assert.ok(await page.locator('[data-skill-parameters]').count()>0);
  pass('classic training pauses and resumes an actual manual without consuming it and shows runtime skill parameters');
  for(const width of [375,320]){
    await page.setViewportSize({width,height:812});
    for(const panel of ['character','equipment','cultivation']){
      await click(`.classic-sheet-person [data-action="${panel}"]`);await noOverflow('live classic '+panel+' at '+width);
      const controls=await page.locator('.classic-sheet-person nav button').evaluateAll(nodes=>nodes.map(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height})));
      assert.ok(controls.every(c=>c.width>=44&&c.height>=44));
    }
  }
  await page.screenshot({path:output+'original-modern-classic-mobile.png'});
  await page.setViewportSize({width:1440,height:900});await click('.classic-sheet-person [data-action="character"]');await page.screenshot({path:output+'original-modern-classic-desktop.png'});
  const beforeStyle=await state();await style('modern');await click('[data-action="character"]');assert.equal(await page.locator('[data-classic-sheet]').count(),0);assert.deepEqual(await state(),beforeStyle);
  pass('modern and classic views preserve the same real equipment and cultivation state');
  await closeModal();await click('[data-action="quests"]');await click('[data-action="companion-clues"]');await page.locator('.companion-browser').waitFor();
  const beforeGuide=await state();assert.equal(await page.locator('[data-companion-filter]').inputValue(),'here');
  const catalog=JSON.parse(await readFile(new URL('../public/data/companion-catalog.json',import.meta.url),'utf8'));
  const expected=catalog.characters.filter(c=>c.routes.some(r=>!r.debug&&r.paths.some(p=>p.entry.map===beforeGuide.map.id))).map(c=>c.id).sort();
  assert.deepEqual((await page.locator('[data-companion-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.companionId))).sort(),expected);
  assert.match(await page.locator('[data-companion-map-notice]').innerText(),/是否触发仍取决于条件/);
  await page.locator('[data-companion-filter]').selectOption('all');assert.equal(await page.locator('[data-companion-id]').count(),65);
  assert.deepEqual(await state(),beforeGuide);pass('current-map recruitment clues use original catalog entries and never bypass conditions, roll probability or change story progress');
  await closeModal();await click('[data-action="save"]');await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="load"]').waitFor({timeout:90000});await click('[data-action="load"]');
  const restored=await state();assert.equal(restored.roster.find(c=>c.id==='钟灵').equipment.find(e=>e.slot==='Weapon').item.id,'木刀');
  assert.equal(restored.roster.find(c=>c.id==='钟灵').cultivation.itemId,'内功入门');pass('real equipment and training choices survive manual save and browser reload');
}catch(error){failure=error;}finally{await h.finish(failure);}
