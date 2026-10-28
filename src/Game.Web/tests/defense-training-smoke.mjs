import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const dir=process.env.PLAYTHROUGH_CHECKPOINTS;assert.ok(dir);
const file=dir+'/italy-trained.json',raw=await readFile(file),manifest=JSON.parse(await readFile(dir+'/manifest.json','utf8'));
assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.find(x=>x.name==='italy-trained').sha256);
const h=await createHarness('defense-training',{viewport:{width:390,height:844}},{trace:false});
const {page,report,click,ready,state,closeModal,pass,noOverflow,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.method='Unedited genuine normal save; existing French reward manual; visible study, equip, practice, save and reload controls. No finale victory claim.';
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 await click('[data-action="cultivation"]');
 const start=await state();let guide=start.inventory.find(i=>i.id==='武当心法抄本');assert.ok(guide);
 report.before=start.hero;
 if(!guide.canCultivate&&guide.training?.assignedTo?.length){
  const owner=guide.training.assignedTo[0];
  await page.locator('#managed-character').selectOption(owner.id);await ready();
  const learned=(await state()).managedCharacter.internalSkills;
  await click('[data-action="clear-cultivation"]');
  assert.deepEqual((await state()).managedCharacter.internalSkills,learned,'Pausing study must preserve learned mastery ranks');
  report.reassignedFrom=owner;
  await page.locator('#managed-character').selectOption(start.hero.id);await ready();
  guide=(await state()).inventory.find(i=>i.id==='武当心法抄本');
 }
 assert.ok(guide.canCultivate,'Use the same real copy after the companion pauses study');
 await click(`[data-action="cultivate"][data-entry-number="${guide.entryNumber}"]`);
 await click('[data-action="equip-internal"][data-id="武当心法"]');await closeModal();
 await click('[data-action="interact"][data-id="南贤居"]');
 report.practices=[];
 for(let practice=0;practice<8;practice++){
  await click('[data-action="interact"][data-id="结伴练习"]');
  for(let n=0;n<400;n++){
   const s=await state();
   if(s.phase==='dialogue'){await click('[data-action="next"]');continue;}
   if(s.phase==='battle'){
    if(s.battle.outcome!=='ongoing'){assert.equal(s.battle.outcome,'win');await click('[data-action="leave-battle"]');continue;}
    if(await page.locator('[data-action="battle-mode"][data-id="auto"][aria-pressed="false"]').count())await click('[data-action="battle-mode"][data-id="auto"]');
    await page.waitForTimeout(150);continue;
   }
   assert.equal(s.phase,'world');break;
  }
  const learned=(await state()).hero.internalSkills.find(s=>s.id==='武当心法');report.practices.push(learned);
  console.log('PRACTICE',practice+1,learned.level,learned.exp);
  if(learned.level>=10)break;
 }
 const trained=await state();assert.ok(trained.hero.internalSkills.find(s=>s.id==='武当心法').level>1);
 assert.equal(trained.hero.equippedInternalSkillId,'武当心法');report.after=trained.hero;
 await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
 const reloaded=await state();assert.deepEqual(reloaded.hero.internalSkills,trained.hero.internalSkills);assert.equal(reloaded.hero.equippedInternalSkillId,'武当心法');
 await click('[data-action="inventory"]');
 const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const download=await waiting;
 await download.saveAs(h.output+'defense-trained-save.json');
 report.checkpoint={path:'src/Game.Web/test-results/defense-trained-save.json',sha256:createHash('sha256').update(await readFile(h.output+'defense-trained-save.json')).digest('hex')};
 await closeModal();
 await click('[data-action="cultivation"]');await noOverflow('Defensive mastery study at 390px');await page.screenshot({path:h.output+'defense-training-mobile.png'});
 pass('Existing French reward trains through real deployed practice; equipped mastery and learned ranks survive save/reload');
}catch(e){failure=e;}
await finish(failure);
