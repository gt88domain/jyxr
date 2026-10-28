import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/opening-academy.json','utf8'));assert.ok(proof.passed);
assert.equal(createHash('sha256').update(await readFile(proof.checkpoint.path)).digest('hex'),proof.checkpoint.sha256);
const h=await createHarness('opening-graduation',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source=proof.checkpoint;report.method='Continue the genuine 130-silver first-lesson export. Equip the earned entry garb, alternate existing lessons by visible map actions, settle the actual visitor bout, graduate and depart normally. No date/resource commands, old graduation archive, save editing or forced victory.';
report.lessons=[];report.battles=[];report.dialogue=[];report.copyGaps=[];report.checkpoints=[];let failure;
const graduated=s=>s.chapterJournal.completedStories.includes('门派大轮寺_大轮寺出师');
const courseIds=['修炼无上大力杵','修炼漫天花雨','修炼密宗大手印'];
async function persist(){await writeFile(h.output+'opening-graduation-progress.json',JSON.stringify(report,null,2));}
async function inspectToast(label){
 const text=await page.locator('#toast').innerText();if(/[\u3400-\u9fff]/.test(text))report.copyGaps.push({label,kind:'toast',text});return text;
}
async function settle(){
 for(let n=0;n<120;n++){
  const s=await state();
  if(s.phase==='dialogue'){
   report.dialogue.push({speaker:s.dialogue.speaker,text:s.dialogue.text,day:s.adventure.days});
   if(/[\u3400-\u9fff]/.test(s.dialogue.text))report.copyGaps.push({kind:'dialogue',text:s.dialogue.text,day:s.adventure.days});
   await click('[data-action="next"]');continue;
  }
  if(s.phase==='choice'){
   report.dialogue.push({choice:s.choices,prompt:s.dialogue,index:0,day:s.adventure.days});await click('[data-action="choice"][data-index="0"]');continue;
  }
  if(s.phase==='battle'){
   console.log('BATTLE_START',s.battle.id,s.adventure.days);
   if(s.battle.outcome==='ongoing'){
    if(await page.locator('[data-action="battle-mode"][data-id="auto"][aria-pressed="false"]').count())await click('[data-action="battle-mode"][data-id="auto"]');
    await page.locator('[data-action="leave-battle"]').waitFor({state:'visible',timeout:180000});
   }
   const ended=(await state()).battle;report.battles.push({id:ended.id,outcome:ended.outcome,tick:ended.tick,timedOut:ended.timedOut,units:ended.units,logs:ended.logs});
   assert.ok(['win','lose'].includes(ended.outcome));console.log('BATTLE_END',ended.id,ended.outcome,ended.tick);await persist();
   await click('[data-action="leave-battle"]');continue;
  }
  assert.equal(s.phase,'world');return s;
 }assert.fail('Training event did not settle');
}
async function checkpoint(name,reload=false){
 await closeModal();const before=await state();await click('[data-action="save"]');
 if(reload){
  await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');const after=await state();
  const build=({hp,mp,...c})=>c;assert.deepEqual(build(after.hero),build(before.hero));assert.deepEqual(after.party.map(build),before.party.map(build));assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.equal(after.silver,before.silver);assert.equal(after.map.id,before.map.id);
  const items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));assert.deepEqual(items(after),items(before));
 }
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');await (await waiting).saveAs(h.output+name+'.json');await closeModal();
 const after=await state(),result={path:'src/Game.Web/test-results/'+name+'.json',sha256:createHash('sha256').update(await readFile(h.output+name+'.json')).digest('hex'),day:after.adventure.days,map:after.map.id,silver:after.silver,vitals:{before:{hp:before.hero.hp,mp:before.hero.mp},after:{hp:after.hero.hp,mp:after.hero.mp}}};report.checkpoints.push(result);await persist();return result;
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(proof.checkpoint.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await state();report.start={hero:start.hero,party:start.party,roster:start.roster,days:start.adventure.days,silver:start.silver};assert.equal(start.silver,130);assert.equal(start.adventure.difficulty,'normal');assert.equal(start.map.id,'门派大轮寺');assert.ok(!graduated(start));
 await click('[data-action="loadout"]');await page.locator('#managed-character').selectOption(start.hero.id);await ready();const garb=(await state()).inventory.find(i=>i.id==='大轮寺装束');assert.ok(garb.canEquip);
 await click(`.as-spare-gear [data-action="equip-item"][data-entry-number="${garb.entryNumber}"]`);await closeModal();assert.ok((await state()).hero.equipment.some(e=>e.item?.id==='大轮寺装束'));assert.equal((await state()).silver,130);
 report.prepared=await checkpoint('opening-academy-prepared-save');
 for(let n=0;n<65&&!graduated(await state());n++){
  const before=await state();assert.equal(before.map.id,'门派大轮寺');
  if(before.adventure.days>=58)report.beforeGraduation=await checkpoint('opening-before-graduation-day-'+before.adventure.days);
  const course=courseIds[n%courseIds.length];await click(`[data-action="interact"][data-id="${course}"]`);const after=await settle();
  const row={number:n+1,course,beforeDay:before.adventure.days,day:after.adventure.days,beforeSilver:before.silver,silver:after.silver,graduated:graduated(after),skills:after.hero.externalSkills,attributes:after.hero.attributes,toast:await inspectToast(course)};
  report.lessons.push(row);assert.ok(after.adventure.days>before.adventure.days);if(row.graduated)assert.ok(row.day>60,'The original strict day gate must hold');
  console.log('LESSON',row.number,course,row.beforeDay,'->',row.day,'silver',row.silver,'graduated',row.graduated);await persist();
  if(!row.graduated&&n%10===9)await checkpoint('opening-training-session-'+(n+1),true);
 }
 const earned=await state();assert.ok(graduated(earned));assert.ok(earned.adventure.days>60);assert.equal(earned.adventure.sect,'大轮寺');assert.equal(report.battles.length,1);
 assert.equal(earned.party.filter(c=>c.definitionId==='达尔巴').length,1);assert.equal(earned.party.find(c=>c.definitionId==='达尔巴').name,'The Mad Hatter');assert.ok(earned.party.some(c=>c.definitionId==='钟灵'));
 report.graduated={hero:earned.hero,party:earned.party,roster:earned.roster,day:earned.adventure.days,silver:earned.silver,guide:await page.locator('[data-guidance]').innerText()};
 report.graduationCheckpoint=await checkpoint('opening-graduated-save',true);await noOverflow('Actual graduation at 390px');await page.screenshot({path:h.output+'opening-graduation-mobile.png'});
 pass('Normal training and the visitor bout reach the original graduation gate and actual named companion; saved builds, inventory, money and story persist');
 await click('[data-guidance] [data-next-step]');assert.equal((await state()).map.id,'大轮寺雪山');await click('[data-guidance] [data-next-step]');const departed=await state();assert.equal(departed.map.id,'大地图');assert.equal(departed.adventure.sect,'大轮寺');assert.equal(departed.silver,earned.silver);
 report.departed={hero:departed.hero,party:departed.party,roster:departed.roster,days:departed.adventure.days,silver:departed.silver,goals:departed.objectives};
 report.checkpoint=await checkpoint('opening-graduated-world-save',true);report.progressVerified=true;report.englishCopyVerified=report.copyGaps.length===0;
 await noOverflow('Graduated party on the real world map at 390px');await page.screenshot({path:h.output+'opening-graduated-world.png'});
 pass('The existing two-step mountain departure opens only after graduation; affiliation and three real party members survive save/reload');
}catch(e){failure=e;}
await finish(failure);
