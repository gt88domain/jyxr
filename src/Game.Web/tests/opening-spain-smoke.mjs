import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/opening-hatter.json','utf8'));assert.ok(proof.passed);
const resumeFile=process.env.SPAIN_RESUME_REPORT,resume=resumeFile?JSON.parse(await readFile(resumeFile,'utf8')):null;
const input=resume?resume.recruited:proof.checkpoint;assert.ok(input);
assert.equal(createHash('sha256').update(await readFile(input.path)).digest('hex'),input.sha256);
const pack=JSON.parse(await readFile('src/Game.Web/public/data/packs/worlds/en/content-package.json','utf8')),roots=new Set(pack.externalSkills.map(s=>s.id));
const h=await createHarness('opening-spain',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source=input;report.upstreamReport=resumeFile||'opening-hatter.json';report.method='Continue the genuine graduated-party chain, optionally from its earned recruitment milestone. Actual goal navigation, original timed/chance encounters, pro-villager choices, visible manual techniques and owned medicine, real shop preparation, recruitment, reward and save controls. No old Spain archive, injected state, forced battle or chance/date commands.';
report.ledger=[];report.dialogue=[];report.choices=[];report.battles=[];report.actions=[];report.encounters=[];report.checkpoints=[];report.copyGaps=[];let failure;
const done=(s,id)=>s.chapterJournal.completedStories.includes(id);
async function persist(){await writeFile(h.output+'opening-spain-progress.json',JSON.stringify(report,null,2));}
async function record(label){
 const s=await state(),last=report.ledger.at(-1);report.ledger.push({label,phase:s.phase,map:s.map.id,silver:s.silver,delta:last?s.silver-last.silver:0,adventure:s.adventure,trust:s.chapterJournal.trust,stories:s.chapterJournal.completedStories,hero:s.hero,party:s.party,roster:s.roster,inventory:s.inventory.map(i=>({id:i.id,name:i.name,count:i.count})),guide:await page.locator('[data-guidance]').innerText().catch(()=>null)});
 console.log('LEDGER',label,s.silver,'trust',s.chapterJournal.trust);await persist();return s;
}
async function checkpoint(name,reload=false){
 await closeModal();const before=await state();await click('[data-action="save"]');
 if(reload){await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');const after=await state(),build=({hp,mp,...c})=>c;
  assert.deepEqual(build(after.hero),build(before.hero));assert.deepEqual(after.party.map(build),before.party.map(build));assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.equal(after.silver,before.silver);assert.equal(after.map.id,before.map.id);
  const items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));assert.deepEqual(items(after),items(before));}
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');await (await waiting).saveAs(h.output+name+'.json');await closeModal();
 const after=await state(),p={path:'src/Game.Web/test-results/'+name+'.json',sha256:createHash('sha256').update(await readFile(h.output+name+'.json')).digest('hex'),map:after.map.id,silver:after.silver,trust:after.chapterJournal.trust,vitals:{before:{hp:before.hero.hp,mp:before.hero.mp},after:{hp:after.hero.hp,mp:after.hero.mp}}};report.checkpoints.push(p);await persist();return p;
}
async function cellClick(x,y){
 const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));
 await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();
}
async function battle(){
 const started=await state(),entry={id:started.battle.id,beforeSilver:started.silver,openingUnits:started.battle.units,medicine:[]};console.log('BATTLE_START',entry.id);await persist();
 for(let n=0;n<650;n++){
  const s=await state(),b=s.battle;assert.ok(b);
  if(b.outcome!=='ongoing'){
   Object.assign(entry,{outcome:b.outcome,tick:b.tick,timedOut:b.timedOut,units:b.units});report.battles.push(entry);console.log('BATTLE_END',entry.id,b.outcome,b.tick);
   await click('[data-action="leave-battle"]');entry.afterSilver=(await state()).silver;await persist();assert.equal(b.outcome,'win','Preserve a real failed battle instead of continuing as if won');return;
  }
  const u=b.units.find(u=>u.id===b.activeUnitId);if(u.team!==1){await page.waitForTimeout(100);continue;}
  const enemies=b.units.filter(u=>u.team!==1&&u.alive),skills=b.skills.filter(s=>roots.has(s.id)&&s.available!==false&&(s.rageCost||0)===0);
  const medicineId=u.hp<u.maxHp*.45?'小还丹':u.mp<Math.min(...b.skills.filter(s=>roots.has(s.id)).map(s=>s.mpCost))?'九花玉露丸':null;
  const medicine=s.inventory.find(i=>i.id===medicineId&&i.canUse&&i.battleTargets?.some(t=>t.id===u.id&&t.canUse));
  if(medicine){
   await click('[data-action="inventory"]');await page.locator(`.battle-item-target[data-entry-number="${medicine.entryNumber}"]`).selectOption(u.id);await click(`[data-action="use-item"][data-entry-number="${medicine.entryNumber}"]`);await closeModal();entry.medicine.push({id:medicine.id,target:u.definitionId,beforeHp:u.hp,beforeMp:u.mp});continue;
  }
  const targets=b.targets.filter(t=>skills.some(s=>s.id===t.skillId)&&enemies.some(e=>e.id===t.targetId));
  targets.sort((a,c)=>skills.find(s=>s.id===c.skillId).level-skills.find(s=>s.id===a.skillId).level||enemies.find(e=>e.id===a.targetId).hp-enemies.find(e=>e.id===c.targetId).hp);
  if(targets.length){const t=targets[0],skill=skills.find(s=>s.id===t.skillId);await click('[data-action="battle-skills"]');await click(`[data-action="choose-battle-skill"][data-id="${t.skillId}"]`);await cellClick(t.x,t.y);report.actions.push({battle:entry.id,actor:u.definitionId,kind:'technique',id:t.skillId,name:skill.name,rank:skill.level,energy:skill.mpCost,x:t.x,y:t.y});continue;}
  if(b.action.canMove&&b.reachable.length&&enemies.length){const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);continue;}}
  await click('[data-action="mobile-rest"]');
 }assert.fail('Manual battle exceeded the bounded normal action path');
}
async function settle(){
 for(let n=0;n<220;n++){
  const s=await state();
  if(s.phase==='dialogue'){report.dialogue.push({speaker:s.dialogue.speaker,text:s.dialogue.text,day:s.adventure.days});if(/[\u3400-\u9fff]/.test(s.dialogue.text))report.copyGaps.push({kind:'dialogue',text:s.dialogue.text});await click('[data-action="next"]');continue;}
  if(s.phase==='choice'){const index=s.dialogue.text==='How will you answer?'?1:0;report.choices.push({prompt:s.dialogue.text,options:s.choices,index,beforeTrust:s.chapterJournal.trust,morality:s.adventure.morality});await click(`[data-action="choice"][data-index="${index}"]`);continue;}
  if(s.phase==='combatants'){
   const c=s.combatantSelection,selected=c.candidates.filter(c=>c.required&&!c.forbidden).map(c=>c.id);for(const candidate of c.candidates)if(!candidate.forbidden&&!selected.includes(candidate.id)&&selected.length<c.capacity)selected.push(candidate.id);
   for(const candidate of c.candidates){const box=page.locator(`#combatants-form input[value="${candidate.id}"]`);if(!await box.isDisabled())await box.setChecked(selected.includes(candidate.id));}
   report.choices.push({kind:'combatants',selected});await page.locator('#combatants-form button[type="submit"]').click();await ready();continue;
  }
  if(s.phase==='battle'){await battle();continue;}
  assert.ok(['world','shop'].includes(s.phase));return s;
 }assert.fail('Spain encounter did not settle');
}
async function visit(id){await click(`[data-action="interact"][data-id="${id}"]`);return settle();}
async function world(){for(let n=0;n<5&&(await state()).map.id!=='大地图';n++)await visit('返回');assert.equal((await state()).map.id,'大地图');}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});await page.locator('#import-file').setInputFiles(input.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Continued genuine graduated-party chain');assert.equal(start.silver,resume?input.silver:150);assert.ok(start.objectives.every(o=>o.completed));assert.equal(start.adventure.difficulty,'normal');
 if(resume){assert.ok(done(start,'白马啸西风_李文秀加入'));assert.ok(start.party.some(c=>c.definitionId==='李文秀'));assert.ok(start.chapterJournal.trust>=60);}
 if(!done(start,'白马啸西风_初次见面')){
  await click('[data-action="quests"]');assert.match(await page.locator('#game-modal').innerText(),/Meet Dulcinea at Windrider Camp/);await closeModal();
  for(let n=0;n<3;n++)await click('[data-guidance] [data-next-step]');await settle();await record('Met Aldonza and Dulcinea at Windrider Camp');report.met=await checkpoint('opening-spain-met-save',true);
 }
 for(let n=0;n<72&&!done(await state(),'白马啸西风_李文秀出走');n++){
  const before=await state();report.encounters.push({kind:'night-check',attempt:n+1,slot:before.adventure.timeSlot,day:before.adventure.days,trust:before.chapterJournal.trust});await visit('李文秀');
 }
 let s=await record(resume?'Restored earned night-patrol progress':'Night patrol and peaceful trainer answer');assert.ok(done(s,'白马啸西风_李文秀出走'));if(!resume){report.night=await checkpoint('opening-spain-night-save',true);pass('Original nighttime chance gate, real ambush and peaceful answer progress through visible controls and survive save/reload');}
 for(let n=0;n<45&&!done(await state(),'白马啸西风_李文秀加入')&&!done(await state(),'白马啸西风_前往高昌');n++){
  await world();report.encounters.push({kind:'camp-return',attempt:n+1});await visit('哈萨克部落');
 }
 s=await record(resume?'Restored earned recruitment branch':'Camp conflict and original recruitment branch');assert.ok(s.roster.some(c=>c.definitionId==='李文秀'),'This observed pro-villager route must actually meet the original trust threshold');assert.ok(s.chapterJournal.trust>=60);assert.equal(s.adventure.morality,start.adventure.morality);assert.ok(!s.roster.some(c=>c.definitionId==='陈达海'));
 if(!resume)report.recruited=await checkpoint('opening-spain-recruited-save',true);pass(resume?'Earned recruitment milestone restores Dulcinea at the original trust threshold with unchanged Morality':'Stand with Dulcinea uses the original trust gate, keeps Morality and does not also recruit the knight');
 await world();await visit('洛阳');await visit('商店');s=await state();assert.equal(s.phase,'shop');const armor=s.shop.products.find(p=>p.itemId==='粗布道袍');assert.equal(armor.price,150);assert.ok(armor.canBuy);const budget=s.silver;
 await click(`[data-action="buy-item"][data-id="${armor.id}"]`);assert.equal((await state()).silver,budget-150);await click('[data-action="close-shop"]');await record('Bought original-price armor for Dulcinea');
 await click('[data-action="loadout"]');const lady=(await state()).party.find(c=>c.definitionId==='李文秀');await page.locator('#managed-character').selectOption(lady.id);await ready();const gear=(await state()).inventory.find(i=>i.id==='粗布道袍');assert.ok(gear.canEquip);await click(`.as-spare-gear [data-action="equip-item"][data-entry-number="${gear.entryNumber}"]`);report.beforeReward=(await state()).managedCharacter;await closeModal();await world();report.ready=await checkpoint('opening-spain-warehouse-ready-save',true);
 for(let n=0;n<30&&!done(await state(),'白马啸西风_完结2');n++){report.encounters.push({kind:'warehouse-entry',attempt:n+1});await visit('高昌迷宫');if(!done(await state(),'白马啸西风_完结2'))await world();}
 s=await record('Warehouse victory and Dulcinea ending');assert.ok(done(s,'白马啸西风_完结2'));assert.ok(s.inventory.some(i=>i.id==='黑血神针秘籍'&&i.count===1));assert.ok(s.party.some(c=>c.definitionId==='李文秀'));assert.equal(s.adventure.sect,'大轮寺');assert.equal(s.adventure.morality,start.adventure.morality);
 await click('[data-action="loadout"]');await page.locator('#managed-character').selectOption(lady.id);await ready();report.afterReward=(await state()).managedCharacter;await closeModal();
 const base=(c,id)=>c.attributes.find(a=>a.id===id).baseValue;for(const [id,gain] of [['qimen',40],['max_hp',500],['max_mp',500]])assert.ok(base(report.afterReward,id)-base(report.beforeReward,id)>=gain,id+' original ending reward');assert.ok(report.afterReward.unspentStatPoints-report.beforeReward.unspentStatPoints>=30);
 report.checkpoint=await checkpoint('opening-spain-complete-save',true);report.progressVerified=true;report.dialogueEnglishVerified=report.copyGaps.length===0;
 await click('[data-action="quests"]');await page.locator('[data-journey-story="dulcinea-ending"] summary').click();assert.match(await page.locator('[data-journey-story="dulcinea-ending"]').innerText(),/supplies are going home/);await noOverflow('Real Spain ending and next route at 390px');await page.screenshot({path:h.output+'opening-spain-ending.png'});await closeModal();
 pass('Original warehouse battle and exact reward categories, trained party, Morality, money and recorded progress survive save/reload');
}catch(e){failure=e;}
await finish(failure);
