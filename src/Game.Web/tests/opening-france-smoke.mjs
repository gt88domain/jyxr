import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const proof=JSON.parse(await readFile('src/Game.Web/test-results/spain-final-ui.json','utf8'));
assert.ok(proof.passed);const resumeFile=process.env.FRANCE_RESUME_REPORT,resume=resumeFile?JSON.parse(await readFile(resumeFile,'utf8')):null;
const source=resume?resume.failureCheckpoint:proof.checkpoint;assert.ok(source);
assert.equal(createHash('sha256').update(await readFile(source.path)).digest('hex'),source.sha256);
const pack=JSON.parse(await readFile('src/Game.Web/public/data/packs/worlds/en/content-package.json','utf8'));
const roots=new Set(pack.externalSkills.map(s=>s.id));
const crosses=new Set(pack.externalSkills.filter(s=>s.type==='qimen').map(s=>s.id));
const h=await createHarness('opening-france',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source=source;report.upstreamReport=resumeFile||'spain-final-ui.json';report.method='Continue the intact new-game chain, including a normally saved failed practice when specified. Study the earned tome on Dulcinea, move her to slot two, use her spell by selecting her own tile in ordinary manual Team Practice, then follow the France goal to the real caravan recruitment fight. No spent attribute points, edited saves, grants or forced results.';
report.ledger=[];report.battles=[];report.actions=[];report.dialogue=[];report.copyGaps=[];report.checkpoints=[];let failure;
async function persist(){await writeFile(h.output+'opening-france-progress.json',JSON.stringify(report,null,2));}
async function record(label){const s=await state(),previous=report.ledger.at(-1);report.ledger.push({label,map:s.map.id,phase:s.phase,silver:s.silver,delta:previous?s.silver-previous.silver:0,adventure:s.adventure,chapter:s.chapterJournal,party:s.party,roster:s.roster,inventory:s.inventory.map(i=>({id:i.id,count:i.count}))});console.log('LEDGER',label,s.silver);await persist();return s;}
async function checkpoint(name){
 await closeModal();const before=await state();await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
 const after=await state(),build=({hp,mp,...c})=>c;assert.deepEqual(after.party.map(build),before.party.map(build));assert.deepEqual(build(after.hero),build(before.hero));assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.equal(after.silver,before.silver);assert.equal(after.map.id,before.map.id);
 const items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));assert.deepEqual(items(after),items(before));
 report.vitals=report.vitals||[];report.vitals.push({name,before:before.party.map(c=>({id:c.definitionId,hp:c.hp,mp:c.mp})),after:after.party.map(c=>({id:c.definitionId,hp:c.hp,mp:c.mp}))});
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');await (await waiting).saveAs(h.output+name+'.json');await closeModal();
 const point={path:'src/Game.Web/test-results/'+name+'.json',sha256:createHash('sha256').update(await readFile(h.output+name+'.json')).digest('hex')};report.checkpoints.push(point);await persist();return point;
}
async function cellClick(x,y){const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();}
async function battle(practice=false){
 const start=await state(),entry={id:start.battle.id,beforeSilver:start.silver,openingUnits:start.battle.units,medicine:[]};report.currentBattle=entry;console.log('BATTLE_START',entry.id);await persist();
 for(let n=0;n<650;n++){
  const s=await state(),b=s.battle;assert.ok(b);
  if(b.outcome!=='ongoing'){Object.assign(entry,{outcome:b.outcome,tick:b.tick,timedOut:b.timedOut,units:b.units});report.battles.push(entry);delete report.currentBattle;console.log('BATTLE_END',entry.id,b.outcome,b.tick);await click('[data-action="leave-battle"]');entry.afterSilver=(await state()).silver;await persist();assert.equal(b.outcome,'win','Record a real loss instead of treating it as progress');return;}
  const u=b.units.find(u=>u.id===b.activeUnitId);if(u.team!==1){await page.waitForTimeout(100);continue;}
  if(practice&&u.definitionId!=='李文秀'){await click('[data-action="mobile-rest"]');continue;}
  const enemies=b.units.filter(u=>u.team!==1&&u.alive),skills=b.skills.filter(s=>roots.has(s.id)&&s.available!==false&&(s.rageCost||0)===0&&(!practice||s.id==='黑血神针'));
  const medicineId=u.hp<u.maxHp*.45?'小还丹':u.mp<Math.min(...skills.map(s=>s.mpCost))?'九花玉露丸':null;
  const medicine=s.inventory.find(i=>i.id===medicineId&&i.canUse&&i.battleTargets?.some(t=>t.id===u.id&&t.canUse));
  if(medicine){await click('[data-action="inventory"]');await page.locator(`.battle-item-target[data-entry-number="${medicine.entryNumber}"]`).selectOption(u.id);await click(`[data-action="use-item"][data-entry-number="${medicine.entryNumber}"]`);await closeModal();entry.medicine.push({id:medicine.id,target:u.definitionId});continue;}
  const targets=b.targets.filter(t=>{const skill=skills.find(s=>s.id===t.skillId);return skill&&(enemies.some(e=>e.id===t.targetId)||(crosses.has(t.skillId)&&skill.castSize===0&&t.targetId===u.id&&enemies.some(e=>(e.x===u.x||e.y===u.y)&&Math.abs(e.x-u.x)+Math.abs(e.y-u.y)<=skill.impactSize)));});targets.sort((a,c)=>skills.find(s=>s.id===c.skillId).level-skills.find(s=>s.id===a.skillId).level||(enemies.find(e=>e.id===a.targetId)?.hp??0)-(enemies.find(e=>e.id===c.targetId)?.hp??0));
  if(targets.length){const t=targets[0],skill=skills.find(s=>s.id===t.skillId);await click('[data-action="battle-skills"]');await click(`[data-action="choose-battle-skill"][data-id="${t.skillId}"]`);await cellClick(t.x,t.y);report.actions.push({battle:entry.id,actor:u.definitionId,id:t.skillId,name:skill.name,rank:skill.level,energy:skill.mpCost,target:{x:t.x,y:t.y},actorPosition:{x:u.x,y:u.y}});continue;}
  if(b.action.canMove&&b.reachable.length&&enemies.length){const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);continue;}}
  await click('[data-action="mobile-rest"]');
 }assert.fail('The bounded real manual battle did not finish');
}
async function settle(practice=false){for(let n=0;n<150;n++){const s=await state();if(s.phase==='dialogue'){const line={speaker:s.dialogue.speaker,text:s.dialogue.text};report.dialogue.push(line);if(/[\u3400-\u9fff]/.test(line.text))report.copyGaps.push(line);await click('[data-action="next"]');continue;}if(s.phase==='battle'){await battle(practice);continue;}assert.equal(s.phase,'world','Stop for an unexpected choice instead of choosing unseen options');return s;}assert.fail('Encounter did not settle');}
async function visit(id,practice=false){await click(`[data-action="interact"][data-id="${id}"]`);return settle(practice);}
async function world(){for(let n=0;n<5&&(await state()).map.id!=='大地图';n++)await visit('返回');assert.equal((await state()).map.id,'大地图');}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Genuine Spain ending continues');assert.equal(start.silver,52);assert.equal(start.adventure.difficulty,'normal');assert.ok(!start.chapterJournal.completedStories.includes('书剑恩仇录_回族部落霍青桐'));
 const lady=start.party.find(c=>c.definitionId==='李文秀');assert.ok(lady);report.ladyBefore=start.roster.find(c=>c.id===lady.id);assert.equal(report.ladyBefore.unspentStatPoints,30);
 await click('[data-action="loadout"]');await page.locator('#managed-character').selectOption(lady.id);await ready();let s=await state();report.masteryBefore=s.managedCharacter.equippedInternalSkillId;const tome=s.inventory.find(i=>i.id==='黑血神针秘籍');assert.equal(tome.count,1);assert.ok(tome.canCultivate);
 if(s.managedCharacter.cultivation?.itemId!==tome.id)await click(`.as-material [data-action="cultivate"][data-entry-number="${tome.entryNumber}"]`);s=await state();report.studyBefore=s.managedCharacter.cultivation;assert.equal(report.studyBefore.level,1);assert.equal(s.managedCharacter.equippedInternalSkillId,report.masteryBefore);await noOverflow('Dulcinea studies her earned spell at 390px');await page.screenshot({path:h.output+'opening-dulcinea-study.png'});await closeModal();
 await click('[data-action="party"]');for(let n=0;n<start.party.length;n++){const index=(await state()).party.findIndex(c=>c.id===lady.id);if(index===1)break;await click(`[data-roster-id="${lady.id}"] [data-action="party-order"][data-index="${index-1}"]`);}await closeModal();assert.equal((await state()).party[1].definitionId,'李文秀');await world();await visit('南贤居');await visit('结伴练习',true);
 s=await record('Dulcinea actually practices her rewarded spell');assert.equal(s.silver,62);assert.deepEqual(report.battles[0].openingUnits.filter(u=>u.team===1).map(u=>u.definitionId).sort(),['主角','李文秀'].sort());assert.ok(report.actions.some(a=>a.actor==='李文秀'&&a.id==='黑血神针'));
 report.studyAfter=s.roster.find(c=>c.id===lady.id).cultivation;assert.ok(report.studyAfter.level>1||report.studyAfter.exp>0);assert.equal(s.roster.find(c=>c.id===lady.id).unspentStatPoints,30);report.trained=await checkpoint('opening-dulcinea-trained-save');pass('The earned spell is learned and actually used by Dulcinea in slot two; her original mastery, 30 points and training survive save/reload');
 await world();report.beforeFrance=await checkpoint('opening-france-caravan-ready-save');await click('[data-action="quests"]');assert.match(await page.locator('#game-modal').innerText(),/Help the Rose Caravan/);await closeModal();
 await click('[data-guidance] [data-next-step]');await settle();s=await record('Rose Caravan first recruitment outcome');assert.ok(s.chapterJournal.completedStories.includes('书剑恩仇录_回族部落霍青桐'));assert.ok(s.party.some(c=>c.definitionId==='霍青桐'));assert.ok(s.inventory.some(i=>i.id==='三分剑术'));assert.ok(!s.party.some(c=>c.definitionId==='陈家洛'));assert.equal(s.adventure.morality,start.adventure.morality);assert.equal(s.adventure.sect,start.adventure.sect);
 report.checkpoint=await checkpoint('opening-france-milady-joined-save');report.progressVerified=true;report.dialogueEnglishVerified=report.copyGaps.length===0;assert.match(await page.locator('[data-guidance]').innerText(),/Cardinal's prisoner/);await noOverflow('Real France rescue goal after recruitment at 390px');await page.screenshot({path:h.output+'opening-france-rescue-goal.png'});pass('Actual caravan fight recruits Milady and awards the original manual, preserves the same ledger and opens the rescue objective without recruiting D’Artagnan early');
}catch(e){failure=e;try{if((await state()).phase==='world')report.failureCheckpoint=await checkpoint('opening-france-observed-save');}catch(saveError){report.checkpointFailure=saveError.message;}}
await finish(failure);
