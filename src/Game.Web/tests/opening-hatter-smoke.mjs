import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/opening-graduation.json','utf8'));assert.ok(proof.passed&&proof.progressVerified);
assert.equal(createHash('sha256').update(await readFile(proof.checkpoint.path)).digest('hex'),proof.checkpoint.sha256);
const h=await createHarness('opening-hatter',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source=proof.checkpoint;report.actions=[];report.method='Genuine newly graduated world export. Reorder the real third companion into slot two; temporarily lend Eir’s owned manual, use the learned technique in one manual practice, return that same copy, then save/reload. No edited save, resource grant or forced battle result.';
let failure;
async function select(id){await page.locator('#managed-character').selectOption(id);await ready();}
async function cellClick(x,y){
 const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();
 const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));
 await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(proof.checkpoint.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await state(),eir=start.party.find(c=>c.definitionId==='钟灵'),hatter=start.party.find(c=>c.definitionId==='达尔巴');assert.ok(eir&&hatter);assert.equal(start.silver,140);report.start={party:start.party,roster:start.roster,silver:start.silver};
 await click('[data-action="party"]');await click(`[data-roster-id="${hatter.id}"] [data-action="party-order"][data-index="1"]`);assert.equal((await state()).party[1].definitionId,'达尔巴');await closeModal();
 await click('[data-action="loadout"]');await select(eir.id);report.eirSkillsBefore=(await state()).managedCharacter.externalSkills;
 assert.equal((await state()).managedCharacter.cultivation.itemId,'罗汉拳谱');await click('[data-action="clear-cultivation"]');assert.deepEqual((await state()).managedCharacter.externalSkills,report.eirSkillsBefore);
 await select(hatter.id);let s=await state();const guide=s.inventory.find(i=>i.id==='罗汉拳谱');assert.ok(guide.canCultivate);assert.equal(guide.count,1);
 report.mastery=s.managedCharacter.equippedInternalSkillId;await click(`.as-material [data-action="cultivate"][data-entry-number="${guide.entryNumber}"]`);s=await state();report.studyBefore=s.managedCharacter.cultivation;assert.equal(report.studyBefore.level,1);assert.equal(s.managedCharacter.equippedInternalSkillId,report.mastery);
 await noOverflow('Newly recruited companion study at 390px');await page.screenshot({path:h.output+'opening-hatter-study.png'});await closeModal();
 await click('[data-action="interact"][data-id="南贤居"]');await click('[data-action="interact"][data-id="结伴练习"]');
 for(let n=0;n<500;n++){
  s=await state();
  if(s.phase==='dialogue'){await click('[data-action="next"]');continue;}
  if(s.phase==='world')break;
  assert.equal(s.phase,'battle');const b=s.battle;
  if(b.outcome!=='ongoing'){
   report.battle={outcome:b.outcome,tick:b.tick,timedOut:b.timedOut,units:b.units};assert.equal(b.outcome,'win');await click('[data-action="leave-battle"]');continue;
  }
  assert.ok(b.units.some(u=>u.team===1&&u.definitionId==='达尔巴'));assert.ok(!b.units.some(u=>u.definitionId==='钟灵'));
  const u=b.units.find(u=>u.id===b.activeUnitId);if(u.team!==1){await page.waitForTimeout(100);continue;}
  if(u.definitionId!=='达尔巴'){await click('[data-action="mobile-rest"]');continue;}
  const enemies=b.units.filter(u=>u.team!==1&&u.alive),target=b.targets.find(t=>t.skillId==='罗汉拳'&&enemies.some(e=>e.id===t.targetId));
  if(target){
   await click('[data-action="battle-skills"]');await click('[data-action="choose-battle-skill"][data-id="罗汉拳"]');await cellClick(target.x,target.y);report.actions.push({kind:'technique',skill:'罗汉拳',x:target.x,y:target.y});continue;
  }
  if(b.action.canMove&&b.reachable.length&&enemies.length){
   const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];
   if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);report.actions.push({kind:'move',x:cell.x,y:cell.y});continue;}
  }
  await click('[data-action="mobile-rest"]');
 }
 s=await state();assert.equal(s.phase,'world');assert.ok(report.battle);assert.equal(s.silver,start.silver+10);assert.ok(report.actions.some(a=>a.kind==='technique'));
 const learned=s.roster.find(c=>c.definitionId==='达尔巴').cultivation;report.studyAfter=learned;assert.ok(learned.level>1||learned.exp>0);
 await click('[data-action="loadout"]');await select(hatter.id);const hatterSkills=(await state()).managedCharacter.externalSkills;await click('[data-action="clear-cultivation"]');assert.deepEqual((await state()).managedCharacter.externalSkills,hatterSkills);
 await select(eir.id);assert.deepEqual((await state()).managedCharacter.externalSkills,report.eirSkillsBefore);const returned=(await state()).inventory.find(i=>i.id==='罗汉拳谱');assert.equal(returned.count,1);assert.ok(returned.canCultivate);
 await click(`.as-material [data-action="cultivate"][data-entry-number="${returned.entryNumber}"]`);await closeModal();
 const before=await state();report.after={hero:before.hero,roster:before.roster,party:before.party,silver:before.silver,goals:before.objectives};assert.equal(before.roster.find(c=>c.definitionId==='钟灵').cultivation.level,3);assert.equal(before.roster.find(c=>c.definitionId==='钟灵').cultivation.exp,14);assert.equal(before.roster.find(c=>c.definitionId==='达尔巴').cultivation,null);
 await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');s=await state();
 const build=({hp,mp,...c})=>c;assert.deepEqual(build(s.hero),build(before.hero));assert.deepEqual(s.party.map(build),before.party.map(build));assert.deepEqual(s.adventure,before.adventure);assert.deepEqual(s.chapterJournal,before.chapterJournal);assert.equal(s.silver,before.silver);
 assert.deepEqual(s.roster.map(c=>({id:c.id,cultivation:c.cultivation})),before.roster.map(c=>({id:c.id,cultivation:c.cultivation})));
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');await (await waiting).saveAs(h.output+'opening-graduated-party-trained-save.json');await closeModal();
 report.checkpoint={path:'src/Game.Web/test-results/opening-graduated-party-trained-save.json',sha256:createHash('sha256').update(await readFile(h.output+'opening-graduated-party-trained-save.json')).digest('hex')};
 await click('[data-action="loadout"]');await select(hatter.id);assert.equal((await state()).managedCharacter.equippedInternalSkillId,report.mastery);assert.deepEqual((await state()).managedCharacter.externalSkills,hatterSkills);
 await noOverflow('Trained graduation companion after save/reload');await page.screenshot({path:h.output+'opening-hatter-trained.png'});
 pass('Actual new companion learns and uses the borrowed guide in his deployed slot; the same single copy returns to Eir without losing either build, and save/reload preserves the party and earned silver');
}catch(e){failure=e;}
await finish(failure);
