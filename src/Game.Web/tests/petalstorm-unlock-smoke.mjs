import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/preparation-path.json','utf8'));assert.ok(proof.passed);
const file=proof.checkpoint.path,raw=await readFile(file);assert.equal(createHash('sha256').update(raw).digest('hex'),proof.checkpoint.sha256);
const activeOnly=process.env.PETAL_USE_ONLY==='1';
const manual=process.env.PETAL_MANUAL==='1';
const h=await createHarness(manual?'petalstorm-manual-unlock':activeOnly?'petalstorm-active-unlock':'petalstorm-unlock',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.method='Existing genuine armor preparation export; owned French reward manual; ordinary study, deployed practice, save/export and battle skill controls. No finale battle.';
report.practices=[];let failure;
async function settlePractice(){
 for(let n=0;n<400;n++){
  const s=await state();
  if(s.phase==='dialogue'){await click('[data-action="next"]');continue;}
  if(s.phase==='battle'){
   if(s.battle.outcome!=='ongoing'){assert.equal(s.battle.outcome,'win');await click('[data-action="leave-battle"]');continue;}
    if(manual){
     const b=s.battle,u=b.units.find(u=>u.id===b.activeUnitId);
     if(u.team!==1){await page.waitForTimeout(100);continue;}
     if(u.definitionId!=='主角'){await click('[data-action="mobile-rest"]');continue;}
     const enemies=b.units.filter(u=>u.team!==1&&u.alive);
     async function cellClick(x,y){
      const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();
      const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));
      await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();
     }
     const target=b.targets?.find(t=>t.skillId==='百花错拳'&&enemies.some(e=>e.id===t.targetId));
     if(target){await click('[data-action="skill"][data-id="百花错拳"]');await cellClick(target.x,target.y);continue;}
     if(b.action?.canMove&&b.reachable.length&&enemies.length){
      const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];
      if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);continue;}
     }
     await click('[data-action="mobile-rest"]');continue;
    }
   if(await page.locator('[data-action="battle-mode"][data-id="auto"][aria-pressed="false"]').count())await click('[data-action="battle-mode"][data-id="auto"]');
   await page.waitForTimeout(150);continue;
  }
  assert.equal(s.phase,'world');return;
 }assert.fail('Practice did not settle');
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 report.before={hero:(await state()).hero,silver:(await state()).silver};
 await click('[data-action="cultivation"]');const guide=(await state()).inventory.find(i=>i.id==='百花错拳谱');assert.ok(guide.canCultivate);
 await click(`[data-action="cultivate"][data-entry-number="${guide.entryNumber}"]`);await closeModal();
 if(activeOnly){
  await click('[data-action="loadout"]');await click('[data-action="toggle-skill"][data-id="野球拳"][data-active="false"]');await closeModal();
  assert.equal((await state()).hero.externalSkills.find(s=>s.id==='野球拳').active,false);
  report.trainingChoice='Temporarily disabled the competing basic technique through its ordinary skill toggle; no learned skill was removed.';
 }
 await click('[data-action="interact"][data-id="南贤居"]');
 for(let n=0;n<(manual?20:activeOnly?20:12);n++){
  await click('[data-action="interact"][data-id="结伴练习"]');await settlePractice();
  const learned=(await state()).hero.externalSkills.find(s=>s.id==='百花错拳');report.practices.push(learned);console.log('PRACTICE',n+1,learned.level,learned.exp);
  if(learned.level>=8)break;
 }
 const trained=await state();assert.ok(trained.hero.externalSkills.find(s=>s.id==='百花错拳').level>=8);assert.equal(trained.hero.equippedInternalSkillId,'武当心法');
 report.trained={hero:trained.hero,silver:trained.silver};
 if(activeOnly){await click('[data-action="loadout"]');await click('[data-action="toggle-skill"][data-id="野球拳"][data-active="true"]');await closeModal();}
 const savedSkills=(await state()).hero.externalSkills;
 await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');assert.deepEqual((await state()).hero.externalSkills,savedSkills);
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const exported=await waiting;await exported.saveAs(h.output+'petalstorm-unlocked-save.json');await closeModal();
 report.checkpoint={path:'src/Game.Web/test-results/petalstorm-unlocked-save.json',sha256:createHash('sha256').update(await readFile(h.output+'petalstorm-unlocked-save.json')).digest('hex')};
 await click('[data-action="interact"][data-id="结伴练习"]');
 for(let n=0;n<20&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');
 const s=await state();assert.equal(s.phase,'battle');const skill=s.battle.skills.find(s=>s.id==='百花错拳.百花缭乱');assert.ok(skill);report.unlocked=skill;
 assert.equal(skill.name,'Petalstorm Fist — Full Bloom');assert.equal(skill.rageCost,4);assert.equal(skill.cooldown,5);assert.equal(skill.castSize,3);assert.equal(skill.impactSize,2);
 await click('[data-action="battle-skills"]');const card=page.locator('.battle-skill-card').filter({has:page.locator('[data-action="choose-battle-skill"][data-id="百花错拳.百花缭乱"]')});
 assert.doesNotMatch(await card.innerText(),/[\u3400-\u9fff]/);assert.match(await card.innerText(),/Full Bloom/);assert.match(await card.innerText(),new RegExp(String(skill.mpCost)));
 await noOverflow('Unlocked Full Bloom card at 390px');await page.screenshot({path:h.output+'petalstorm-unlock-mobile.png'});await closeModal();await settlePractice();
 pass('Owned manual reaches the real unlock through practice; save/reload and English live skill costs, Rage, cooldown and range verified');
}catch(e){failure=e;}
await finish(failure);
