import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness(process.env.GAME_WEB_REPORT||'midgame-smoke');
const {page,output,report,pass,click,state,ready,closeModal,noOverflow,continueDialogue}=h;
const prepared=fileURLToPath(new URL('../test-results/midgame/',import.meta.url));
const contentPath=new URL('../public/data/packs/jyx/content-package.json',import.meta.url);
const content=JSON.parse(await readFile(contentPath,'utf8'));
const provenance=JSON.parse(await readFile(prepared+'provenance.json','utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(provenance.contentSha256,sha(await readFile(contentPath)));
async function importFile(path){await closeModal();await page.locator('#import-file').setInputFiles(path);await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();}
async function checkpoint(name){assert.equal(sha(await readFile(prepared+name+'.json')),provenance.checkpoints[name].sha256);await importFile(prepared+name+'.json');}
async function location(id){
  if(await page.locator('#destination-search').count())await page.locator('#destination-search').fill(id);
  // Map controls change the SPA session, not the document. Wait for the actual
  // runtime state instead of Chromium's unrelated navigation signal.
  await page.locator(`[data-action="interact"][data-id="${id}"]`).click({noWaitAfter:true});
  await ready();
}
const battles=[];
async function resolve(allowLoss=false){
  for(let n=0;n<200;n++){
    const current=await state();
    if(current.phase==='dialogue'){await continueDialogue();continue;}
    if(current.phase==='choice'){await click(`[data-action="choice"][data-index="${current.choices[0].index??0}"]`);continue;}
    if(current.phase==='battle'){
      if(current.battle.outcome==='ongoing')for(const selector of ['[data-action="battle-speed"][data-id="4"]','[data-action="battle-mode"][data-id="auto"]']){
        const button=page.locator(selector);if(await button.isEnabled()&&await button.getAttribute('aria-pressed')!=='true')await click(selector);
      }
      await page.locator('[data-action="leave-battle"]').waitFor({timeout:180000});
      const done=await state();assert.ok((allowLoss?['win','lose']:['win']).includes(done.battle.outcome));battles.push({id:done.battle.id,outcome:done.battle.outcome});
      assert.ok(done.battle.events.some(e=>e.kind==='Damaged'&&e.amount>0));await click('[data-action="leave-battle"]');continue;
    }
    if(allowLoss&&current.phase==='gameover')return current;
    assert.equal(current.phase,'world','Expected a normal map continuation');return current;
  }
  assert.fail('Route did not settle');
}
async function navigate(target){
  for(let n=0;n<60;n++){
    const current=await resolve();if(current.map.id===target)return;
    const queue=[{id:current.map.id,steps:[]}],seen=new Set([current.map.id]);let path;
    for(const entry of queue){
      if(entry.id===target){path=entry.steps;break;}
      for(const place of content.maps.find(m=>m.id===entry.id).locations)for(const event of place.events){
        const next=/^map\('([^']+)'\)$/.exec(event.action)?.[1];
        if(next&&!seen.has(next)){seen.add(next);queue.push({id:next,steps:[...entry.steps,place.id]});}
      }
    }
    assert.ok(path?.length,`No data-backed path to ${target}`);await location(path[0]);
  }
  assert.fail('Map route did not finish');
}
function durable(s){return {map:s.map.id,hero:s.hero,roster:s.roster,inventory:s.inventory,silver:s.silver,objectives:s.objectives,milestones:s.milestones,tutorial:s.tutorial};}
let failure;
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({timeout:90000});
  await importFile(output+'jyx-chapter-save.json');
  const teaching=await state();assert.ok(teaching.objectives.every(goal=>goal.completed));assert.ok(teaching.tutorial);
  assert.equal(await page.locator('.chapter-progress').getAttribute('data-journey-focus'),'tutorial');
  await click('[data-action="quests"]');assert.match(await page.locator('.journey-focus[data-journey-focus="tutorial"]').innerText(),/购买药品完成/);
  assert.match(await page.locator('#game-modal').innerText(),/教学任务仍在进行/);await closeModal();assert.deepEqual(durable(await state()),durable(teaching));
  pass('completed experience goals cannot hide the unfinished original teaching task');

  await checkpoint('medicine');const middle=await state();
  const originalMiddle=JSON.parse(await readFile(prepared+'medicine.json','utf8')).game;
  assert.equal(middle.hero.level,originalMiddle.characters.find(c=>c.id==='主角').level);
  assert.deepEqual(middle.party.map(c=>c.id),originalMiddle.party.memberIds);
  for(const id of ['钟灵','田伯光','胡斐','程灵素','阎基'])assert.ok(middle.party.some(c=>c.definitionId===id));
  assert.equal(await page.locator('.chapter-progress').getAttribute('data-journey-focus'),'mainline');
  pass('unedited normal-growth journey preserves every actual party member and the first mainline facts',{level:middle.hero.level,members:middle.party.map(c=>c.id)});
  await navigate('华山后山');const atMountain=await state();
  await click('[data-action="quests"]');await click('[data-action="companion-clues"]');await page.locator('[data-companion-filter]').waitFor();
  assert.equal(await page.locator('[data-companion-filter]').inputValue(),'here');assert.match(await page.locator('[data-companion-map-notice]').innerText(),/华山后山/);
  await page.locator('[data-companion-search]').fill('令狐冲');await page.locator('[data-companion-detail="令狐冲"]').waitFor();
  assert.match(await page.locator('.companion-morality').innerText(),/35 ≤ 道德 < 65/);assert.ok(await page.locator('[data-condition-met="yes"]').count());
  await closeModal();assert.deepEqual(durable(await state()),durable(atMountain));await location('令狐冲');await resolve();
  assert.ok((await state()).party.some(c=>c.definitionId==='令狐冲'));assert.equal((await state()).party.length,middle.party.length+1);
  pass('real mountain traversal, read-only conditions and original Linghu recruitment add exactly one member');
  await navigate('五毒教');await location('蓝凤凰');await resolve();
  assert.ok((await state()).party.some(c=>c.definitionId==='蓝凤凰'));
  assert.equal((await state()).inventory.find(i=>i.id==='毒龙鞭法秘籍').count,1);
  const fullPartyCount=(await state()).party.length;
  assert.equal(fullPartyCount,middle.party.length+2);
  pass('the original Linghu prerequisite unlocks Lan Fenghuang and her real manual reward');

  await click('[data-action="party"]');await click('[data-action="manage-character"][data-id="钟灵"]');await click('[data-action="equipment"]');
  let managed=await state(),entry=managed.inventory.find(i=>i.kind==='equipment'&&i.canEquip);
  if(!entry){
    await page.locator('#managed-character').selectOption('主角');await ready();const worn=(await state()).managedCharacter.equipment.find(s=>s.item);assert.ok(worn);
    await click(`[data-action="unequip-item"][data-slot="${worn.slot}"]`);await page.locator('#managed-character').selectOption('钟灵');await ready();
    entry=(await state()).inventory.find(i=>i.kind==='equipment'&&i.canEquip);assert.ok(entry);
  }
  const beforePreview=durable(await state());await click(`[data-action="preview-equipment"][data-entry-number="${entry.entryNumber}"]`);
  await page.locator('[data-preview-character="钟灵"]').waitFor();assert.deepEqual(durable(await state()),beforePreview);
  const expected=await page.locator('[data-preview-stat]').evaluateAll(rows=>rows.map(row=>({id:row.dataset.previewStat,after:Number(row.querySelectorAll('td')[1].textContent.replace(/[,%\s]/g,'')),percent:row.querySelectorAll('td')[1].textContent.includes('%')})));
  await click('[data-action="confirm-equipment-preview"]');managed=await state();
  for(const stat of expected){const actual=managed.managedCharacter.attributes.find(a=>a.id===stat.id).value;assert.ok(Math.abs(actual-(stat.percent?stat.after/100:stat.after))<.011);}
  const gear=managed.managedCharacter.equipment.find(s=>s.item?.id===entry.id);assert.ok(gear);const gearId=gear.item.instanceId;
  await click('[data-action="cultivation"]');managed=await state();
  const book=managed.inventory.find(i=>i.kind==='skillBook'&&i.canCultivate&&![...(managed.managedCharacter.internalSkills||[]),...(managed.managedCharacter.externalSkills||[])].some(s=>s.id===i.training?.skillId&&s.level>=s.maxLevel));assert.ok(book);
  await click(`[data-action="cultivate"][data-entry-number="${book.entryNumber}"]`);const study=(await state()).managedCharacter.cultivation;assert.ok(study);
  await closeModal();await click('[data-action="party"]');await click('[data-action="party-placement"][data-id="钟灵"][data-placement="reserve"]');
  assert.equal((await state()).party.length,fullPartyCount-1);await closeModal();await click('[data-action="save"]');
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="load"]').waitFor({timeout:90000});await click('[data-action="load"]');
  let restored=await state();assert.equal(restored.roster.find(c=>c.id==='钟灵').formationStatus,'reserve');assert.equal(restored.roster.find(c=>c.id==='钟灵').equipment.find(s=>s.item?.id===entry.id).item.instanceId,gearId);
  await click('[data-action="party"]');await click('[data-action="party-placement"][data-id="钟灵"][data-placement="member"]');
  for(let n=0;n<8;n++){const index=(await state()).party.findIndex(c=>c.id==='钟灵');if(index===1)break;await click(`[data-action="party-order"][data-id="钟灵"][data-index="${index-1}"]`);}
  assert.equal((await state()).party[1].id,'钟灵');await closeModal();
  pass('companion gear comparison, real study, reserve, reload and rejoining preserve equipment identity');
  await navigate('南贤居');await location('结伴练习');await resolve();restored=await state();
  const grown=restored.roster.find(c=>c.id==='钟灵').cultivation;assert.ok(grown.level>study.level||grown.exp>study.exp);
  pass('the reordered party really fights and the selected companion manual gains experience');

  await navigate('松鼠旅馆');await click('[data-action="inventory"]');await click('[data-action="chest"]');
  const chestBefore=await state();const item=chestBefore.chest.inventory.find(i=>i.canDeposit&&chestBefore.inventory.some(v=>v.entryNumber===i.entryNumber&&v.kind==='consumable'));assert.ok(item);
  await click(`[data-action="chest-deposit"][data-entry-number="${item.entryNumber}"]`);assert.equal((await state()).chest.stored,chestBefore.chest.stored+1);
  const stored=(await state()).chest.entries.find(i=>i.id===item.id);assert.ok(stored);
  await click(`[data-action="chest-withdraw"][data-entry-number="${stored.entryNumber}"]`);assert.equal((await state()).chest.stored,chestBefore.chest.stored);
  await closeModal();await click('[data-action="save"]');const saved=durable(await state());
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="load"]').waitFor({timeout:90000});await click('[data-action="load"]');assert.deepEqual(durable(await state()),saved);
  pass('the actual inn storage shortcut deposits and withdraws items with stable saves');

  if(fullPartyCount>=8&&(await state()).hero.level>=15){
    let challengeObserved=false;
    for(let attempt=0;attempt<8&&!challengeObserved;attempt++){
      await navigate('南贤居');await click('[data-action="save"]');const beforeFight=durable(await state()),previousBattles=battles.length;
      await location('南贤');const result=await resolve(true);
      challengeObserved=battles.length>previousBattles;
      if(result.phase==='gameover'){
        assert.equal(await page.locator('.special-interaction [data-action="save-ending"]').count(),0);
        await click('.special-interaction [data-action="load"]');assert.deepEqual(durable(await state()),beforeFight);
        pass('a real fatal mainline battle restores the pre-battle save through the visible recovery button');
      }
    }
    assert.ok(challengeObserved,'The original pending mainline battle must actually start');
    pass('eight real party members open the original mysterious-swordsman continuation',{battles});
  }

  if(provenance.checkpoints.chapter2){
    await checkpoint('chapter2');const later=await state();assert.ok(later.party.length>=7);
    const originalLater=JSON.parse(await readFile(prepared+'chapter2.json','utf8')).game;
    assert.equal(later.hero.level,originalLater.characters.find(c=>c.id==='主角').level);
    assert.deepEqual(later.party.map(c=>c.id),originalLater.party.memberIds);
    const mainline=originalLater.storyState.completedStoryIds;
    assert.ok(mainline.includes('mainStory_黑暗的阴影胜'));
    const targets=['mainStory_神秘剑客5','mainStory_组织1'];
    report.laterRouteTargets={completed:targets.filter(id=>mainline.includes(id)),notCompleted:targets.filter(id=>!mainline.includes(id))};
    pass('later unedited checkpoint preserves actual growth and distinguishes completed from unfinished routes',{level:later.hero.level,...report.laterRouteTargets});
  }else{
    assert.equal(provenance.chapter2Attempt.outcome,'gameover');
    assert.equal(sha(await readFile(prepared+'loss-checkpoint.json')),provenance.chapter2Attempt.checkpointSha256);
    await importFile(prepared+'loss-checkpoint.json');const beforeChallenge=durable(await state());await click('[data-action="save"]');
    const action=JSON.parse(await readFile(prepared+'loss-action.json','utf8'));assert.equal((await state()).map.id,action.mapId);
    await location(action.locationId);const afterChallenge=await resolve(true);
    if(afterChallenge.phase==='gameover'){
      assert.equal(await page.locator('.special-interaction [data-action="save-ending"]').count(),0);
      await click('.special-interaction [data-action="load"]');assert.deepEqual(durable(await state()),beforeChallenge);
      pass('actual fatal original battle exposes recovery and restores the real pre-battle save');
    }else pass('replayed original battle wins through actual rules; recorded native losing route remains separate');
    report.nativeLosingRoute=provenance.chapter2Attempt;
  }
  const pending=(await state()).milestones.find(m=>!m.completed);assert.ok(pending);
  await click('[data-action="quests"]');assert.equal(await page.locator('.journey-focus').getAttribute('data-journey-focus'),'mainline');
  assert.match(await page.locator('.journey-focus').innerText(),new RegExp(pending.title));
  for(const requirement of pending.requirements)assert.ok((await page.locator('.journey-focus').innerText()).includes(requirement));await closeModal();
  const layoutPartyCount=(await state()).party.length;
  for(const width of [375,320]){await page.setViewportSize({width,height:812});await noOverflow('midgame map at'+width);for(const panel of ['party','cultivation','quests']){await click(`[data-action="${panel}"]`);await noOverflow(layoutPartyCount+'-member '+panel+' at'+width);await closeModal();}}
  await page.screenshot({path:output+'midgame-modern-mobile.png',fullPage:true});await click('[data-action="save"]');
  pass('midgame party and actual mainline facts retain clear next clues on narrow screens',{browserBattles:battles});
}catch(error){failure=error;}
await h.finish(failure);
