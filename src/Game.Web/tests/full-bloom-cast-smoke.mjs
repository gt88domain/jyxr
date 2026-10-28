import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/petalstorm-manual-unlock.json','utf8'));assert.ok(proof.passed);
const raw=await readFile(proof.checkpoint.path);assert.equal(createHash('sha256').update(raw).digest('hex'),proof.checkpoint.sha256);
const h=await createHarness('full-bloom-cast',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,pass,noOverflow,finish}=h;let failure;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleMode:'manual',battleSpeed:4,musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.actions=[];report.method='Unedited earned rank-eight export; ordinary practice. Existing Rallying Cry and rest actions generate Rage; Full Bloom is selected and cast through visible controls. No finale.';
async function cellClick(x,y){
 const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();
 const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));
 await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(proof.checkpoint.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 await click('[data-action="interact"][data-id="结伴练习"]');for(let n=0;n<20&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');
 const begin=(await state()).battle;report.before=begin;assert.equal(begin.skills.find(s=>s.id==='百花错拳.百花缭乱').available,false);
 let cast=false;
 for(let n=0;n<80;n++){
  const s=await state(),b=s.battle;assert.equal(s.phase,'battle');assert.equal(b.outcome,'ongoing');
  const actor=b.units.find(u=>u.id===b.activeUnitId);
  if(actor.team!==1){await page.waitForTimeout(100);continue;}
  if(actor.definitionId!=='主角'){await click('[data-action="mobile-rest"]');continue;}
  const form=b.skills.find(s=>s.id==='百花错拳.百花缭乱'),rally=b.skills.find(s=>s.id==='打鸡血');
  const enemies=b.units.filter(u=>u.team!==1&&u.alive),target=b.targets.find(t=>t.skillId===form.id&&enemies.some(e=>e.id===t.targetId));
  if(form.available&&target){
   report.resourcesBeforeCast=actor;assert.ok(actor.rage>=4);
   await click('[data-action="battle-skills"]');const button=page.locator('[data-action="choose-battle-skill"][data-id="百花错拳.百花缭乱"]');assert.ok(await button.isEnabled());
   await button.scrollIntoViewIfNeeded();await noOverflow('Full Bloom available after real Rage gain');await page.screenshot({path:h.output+'full-bloom-ready-mobile.png'});
   await click('[data-action="choose-battle-skill"][data-id="百花错拳.百花缭乱"]');await cellClick(target.x,target.y);
   const result=(await state()).battle;assert.ok(result.events.some(e=>e.kind==='SkillCast'&&e.skillId===form.id));
   report.afterCast=result;report.actions.push({kind:'cast',skillId:form.id,x:target.x,y:target.y});cast=true;break;
  }
  if(!form.available&&rally?.available&&actor.rage<4){
   await click('[data-action="skill"][data-id="打鸡血"]');await cellClick(actor.x,actor.y);report.actions.push({kind:'rally',beforeRage:actor.rage});continue;
  }
  if(form.available&&b.action?.canMove&&enemies.length&&b.reachable.length){
   const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];
   if(distance(cell)<distance(actor)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);report.actions.push({kind:'move',x:cell.x,y:cell.y});continue;}
  }
  await click('[data-action="mobile-rest"]');report.actions.push({kind:'rest',rage:actor.rage});
 }
 assert.ok(cast,'Generate the actual resource and cast without setting Rage or forcing an outcome');
 for(let n=0;n<500;n++){
  const s=await state();
  if(s.phase==='dialogue'){await click('[data-action="next"]');continue;}
  if(s.phase==='world')break;
  assert.equal(s.phase,'battle');
  if(s.battle.outcome!=='ongoing'){assert.equal(s.battle.outcome,'win');await click('[data-action="leave-battle"]');continue;}
  if(await page.locator('[data-action="battle-mode"][data-id="auto"][aria-pressed="false"]').count())await click('[data-action="battle-mode"][data-id="auto"]');
  await page.waitForTimeout(100);
 }
 assert.equal((await state()).phase,'world');await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
 assert.ok((await state()).hero.externalSkills.find(s=>s.id==='百花错拳').level>=8);
 pass('Rage gating changes through ordinary actions; the unlocked technique actually casts and the practice returns, saves and reloads');
}catch(e){failure=e;}
await finish(failure);
