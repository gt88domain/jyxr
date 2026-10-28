import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const dir=process.env.PLAYTHROUGH_CHECKPOINTS;assert.ok(dir);
const file=dir+'/italy-trained.json',raw=await readFile(file);
const manifest=JSON.parse(await readFile(dir+'/manifest.json','utf8'));
assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.find(x=>x.name==='italy-trained').sha256);
const prepared=process.env.ITALY_PREPARE==='1';
const h=await createHarness(prepared?'italy-prepared':'italy-manual',{viewport:{width:390,height:844}},{trace:false});
const {page,report,click,ready,state,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.outcomes=[];report.method='Unedited published normal-difficulty Italy-trained save; visible map, dialogue, medicine and manual combat controls. An observed defeat is not a cleared chapter.';
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 report.start={sha256:createHash('sha256').update(raw).digest('hex'),hero:(await state()).hero};
 if(prepared){
  await click('[data-action="cultivation"]');
  const guide=(await state()).inventory.find(i=>i.id==='百花错拳谱');
  assert.ok(guide?.canCultivate,'The genuine existing manual must be available to the hero');
  await click(`[data-action="cultivate"][data-entry-number="${guide.entryNumber}"]`);await h.closeModal();
  assert.ok((await state()).hero.externalSkills.some(s=>s.id==='百花错拳'));
  report.preparation={method:'Select the already-owned Petalstorm Fist Manual through the training panel',hero:(await state()).hero};
 }
 let battleId='',entered=false;
 for(let n=0;n<1500;n++){
  const s=await state();
  if(s.phase==='dialogue'){await click('[data-action="next"]');continue;}
  if(s.phase==='choice'){await click('[data-action="choice"][data-index="0"]');continue;}
  if(s.phase==='battle'){
   entered=true;battleId=s.battle.id;
   if(s.battle.outcome!=='ongoing'){
    report.outcomes.push({id:battleId,outcome:s.battle.outcome,units:s.battle.units});
    await click('[data-action="leave-battle"]');
    if(s.battle.outcome!=='win')break;
    continue;
   }
   const b=s.battle,unit=b.units.find(u=>u.id===b.activeUnitId);
   if(unit.team!==1){await page.waitForTimeout(150);continue;}
   const tonic=s.inventory.find(i=>i.id==='小还丹'&&i.battleTargets?.some(t=>t.id===unit.id&&t.canUse));
   if(tonic&&unit.hp<unit.maxHp*.6){
    await click('[data-action="inventory"]');
    const target=page.locator(`.battle-item-target[data-entry-number="${tonic.entryNumber}"]`);
    if(await target.count())await target.selectOption(unit.id);
    await click(`[data-action="use-item"][data-entry-number="${tonic.entryNumber}"]`);
    await h.closeModal();report.medicine=(report.medicine||0)+1;continue;
   }
   const enemy=b.units.filter(u=>u.team!==1&&u.alive);
   const attacks=(b.targets||[]).filter(t=>enemy.some(u=>u.id===t.targetId))
    .sort((a,c)=>(b.skills.find(k=>k.id===c.skillId)?.rageCost||0)-(b.skills.find(k=>k.id===a.skillId)?.rageCost||0)||
      (enemy.find(e=>e.id===a.targetId)?.hp||0)-(enemy.find(e=>e.id===c.targetId)?.hp||0)||
      (b.skills.find(k=>k.id===a.skillId)?.mpCost||0)-(b.skills.find(k=>k.id===c.skillId)?.mpCost||0));
   async function cellClick(x,y){
    const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();
    const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry'));
    const box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));
    await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);
    await ready();
   }
   if(attacks.length){
    const t=attacks[0];
    await click(`[data-action="skill"][data-id="${t.skillId}"]`);
    await cellClick(t.x,t.y);continue;
   }
   if(b.action?.canMove&&b.reachable.length&&enemy.length){
    const distance=c=>Math.min(...enemy.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y)));
    const cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];
    if(distance(cell)<distance(unit)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);continue;}
   }
   await click('[data-action="mobile-rest"]');continue;
  }
  if(entered)break;
  const id=s.map.id==='大地图'?'风陵渡口':'返回';
  await click(`[data-action="interact"][data-id="${id}"]`);
 }
 assert.ok(report.outcomes.length,'Observe at least one real battle outcome');
 for(let n=0;n<20&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');
 report.ending={phase:(await state()).phase,map:(await state()).map?.id};
 if(report.outcomes.at(-1).id==='鸳鸯刀正风陵渡_战斗'&&report.outcomes.at(-1).outcome==='win'){
  assert.ok((await state()).chapterJournal.completedStories.includes('鸳鸯刀正_风陵渡胜'));
  assert.ok((await state()).roster.some(c=>c.definitionId==='袁冠南'));
  await click('[data-action="save"]');await page.reload();
  await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
  assert.ok((await state()).roster.some(c=>c.definitionId==='袁冠南'));
  report.recruitment='Pinocchio joined through the original victory story and remained after save/reload.';
 }
 if(report.outcomes.at(-1).outcome!=='win'){
  assert.ok((await state()).chapterJournal.completedStories.includes('鸳鸯刀正_风陵渡败'));
  await click('[data-action="save"]');await page.reload();
  await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
  assert.ok((await state()).chapterJournal.completedStories.includes('鸳鸯刀正_风陵渡败'));
  await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
  assert.ok(!(await state()).chapterJournal.completedStories.includes('鸳鸯刀正_风陵渡败'));
  report.recovery='Actual defeat persisted through save/reload; importing the intact pre-encounter save restored retry prerequisites.';
 }
 await page.screenshot({path:h.output+'italy-manual.png'});
 pass('Observed legal Italy continuation; real outcomes retained',report.outcomes.map(x=>({id:x.id,outcome:x.outcome})));
}catch(e){failure=e;}
await finish(failure);

