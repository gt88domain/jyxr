import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const source={path:'src/Game.Web/test-results/denmark-remedy-complete-save.json',sha256:'9640c7272be664e848a4ba19ee60f34f54f9cba5dd7335b325bbfa4fea786d3d'};
const hash=data=>createHash('sha256').update(data).digest('hex');
for(const p of [source.path,'src/Game.Web/test-results/backups/pre-denmark-nightshade-a2dadf1/denmark-remedy-complete-save.json'])assert.equal(hash(await readFile(p)),source.sha256);
const base=JSON.parse(await readFile(source.path)),mainIds=s=>s.game.storyState.completedStoryIds.filter(id=>id.startsWith('mainStory_')).sort();
const pack=JSON.parse(await readFile('src/Game.Web/public/data/packs/worlds/en/content-package.json','utf8'));
const crosses=new Set(pack.externalSkills.filter(s=>s.type==='qimen').map(s=>s.id));
const h=await createHarness('denmark-nightshade-spare',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
report.source=source;report.initialStorage=await page.context().storageState({indexedDB:true});
assert.deepEqual(report.initialStorage,{cookies:[],origins:[]});
await page.addInitScript(()=>{window.nightshadeInitialLocalStorageKeys=Object.keys(localStorage);localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true}));});
report.method='Independent, nonpersistent cloud browser context, initially empty cookies/origins/localStorage/IndexedDB. Explicit normal import of unedited actual nine-person baseline. One normal world-entry check; no reroll or forced date/flags. If naturally victorious, QA chooses Spare him, then Don’t attack. Investigate. No official-player choice, merged rewards/profile, shopping, training or automatic retry. Only existing medicine may be used.';
report.ledger=[];report.battles=[];report.actions=[];report.dialogue=[];report.choices=[];report.checkpoints=[];report.copyGaps=[];
report.progressVerified=false;
const items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count})),build=({hp,mp,...c})=>c;
const units=b=>b.units.map(u=>({id:u.id,definitionId:u.definitionId,name:u.name,team:u.team,hp:u.hp,maxHp:u.maxHp,mp:u.mp,maxMp:u.maxMp,alive:u.alive,x:u.x,y:u.y}));
async function persist(){await writeFile(h.output+'denmark-nightshade-spare-progress.json',JSON.stringify(report,null,2));}
async function copy(label,selector='#app'){const text=await page.locator(selector).innerText();if(/[\u3400-\u9fff]/.test(text))report.copyGaps.push({label,text});return text;}
async function record(label){const s=await state();report.ledger.push({label,phase:s.phase,map:s.map.id,silver:s.silver,adventure:s.adventure,hero:s.hero,party:s.party,chapterJournal:s.chapterJournal,inventory:items(s)});await persist();return s;}
async function exportSave(name){await closeModal();await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const file=h.output+name+'.json';await (await waiting).saveAs(file);await closeModal();const p={path:'src/Game.Web/test-results/'+name+'.json',sha256:hash(await readFile(file))};report.checkpoints.push(p);await persist();return p;}
async function cellClick(x,y){const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();}
async function battle(){
 const s=await state(),entry={id:s.battle.id,opening:units(s.battle),silverBefore:s.silver};
 assert.equal(entry.id,'阎基居.战斗.七星海棠');assert.equal(report.battles.length,0);
 assert.deepEqual(entry.opening.filter(u=>u.team===1).map(u=>u.definitionId).sort(),['主角','胡斐'].sort());assert.equal(entry.opening.filter(u=>u.team===2).length,7);
 report.currentBattle=entry;await persist();await noOverflow('Actual Nightshade encounter at 390px');await page.screenshot({path:h.output+'denmark-nightshade-spare-battle.png'});
 for(let n=0;n<500;n++){
  const s=await state(),b=s.battle;
  if(b.outcome!=='ongoing'){Object.assign(entry,{outcome:b.outcome,tick:b.tick,timedOut:b.timedOut,ending:units(b)});report.battles.push(entry);delete report.currentBattle;await persist();await click('[data-action="leave-battle"]');assert.equal(b.outcome,'win','Natural defeat retained; no retry or edited save');return;}
  const u=b.units.find(u=>u.id===b.activeUnitId);if(u.team!==1){await page.waitForTimeout(100);continue;}
  const action={actor:u.definitionId,tick:b.tick,hp:u.hp,mp:u.mp};
  const potion=u.hp<u.maxHp*.45?s.inventory.find(i=>i.id==='天王保命丹'&&i.canUse&&i.battleTargets?.some(t=>t.id===u.id&&t.canUse)):null;
  if(potion){await click('[data-action="inventory"]');await page.locator(`.battle-item-target[data-entry-number="${potion.entryNumber}"]`).selectOption(u.id);await click(`[data-action="use-item"][data-entry-number="${potion.entryNumber}"]`);await closeModal();report.actions.push({...action,kind:'medicine',itemId:potion.id});await persist();continue;}
  const enemies=b.units.filter(e=>e.team!==1&&e.alive),ids=u.definitionId==='胡斐'?['胡家刀法']:['百花错拳.百花缭乱','密宗大手印','无上大力杵','野球拳'];
  const targets=b.targets.flatMap(t=>{const k=b.skills.find(k=>k.id===t.skillId&&k.available!==false);if(!k||!ids.includes(k.id))return [];const plus=crosses.has(k.id)||k.id==='百花错拳.百花缭乱',hits=plus?enemies.filter(e=>(e.x===t.x||e.y===t.y)&&Math.abs(e.x-t.x)+Math.abs(e.y-t.y)<=k.impactSize).length:enemies.some(e=>e.id===t.targetId)?1:0;return hits?[{...t,skill:k,score:hits*1000+(ids.length-ids.indexOf(k.id))*20}]:[];}).sort((a,c)=>c.score-a.score);
  if(targets.length){const t=targets[0];await click('[data-action="battle-skills"]');await copy('Actual live techniques','#game-modal');await click(`[data-action="choose-battle-skill"][data-id="${t.skill.id}"]`);await cellClick(t.x,t.y);report.actions.push({...action,kind:'technique',id:t.skill.id,name:t.skill.name,rank:t.skill.level,cost:t.skill.mpCost,target:{x:t.x,y:t.y}});await persist();continue;}
  if(b.action.canMove&&b.reachable.length&&enemies.length){const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);report.actions.push({...action,kind:'move',x:cell.x,y:cell.y});continue;}}
  await click('[data-action="mobile-rest"]');report.actions.push({...action,kind:'rest'});await persist();
 }assert.fail('Bounded normal battle did not finish');
}
async function settle(){
 for(let n=0;n<140;n++){
  const s=await state();
  if(s.phase==='dialogue'){report.dialogue.push({speaker:s.dialogue.speaker,text:s.dialogue.text});if(/[\u3400-\u9fff]/.test(s.dialogue.speaker+s.dialogue.text))report.copyGaps.push({label:'Actual dialogue',...s.dialogue});await click('[data-action="next"]');continue;}
  if(s.phase==='battle'){await battle();continue;}
  if(s.phase==='choice'){
   const count=report.choices.length;assert.ok(count<2,'No further choices authorized in this QA route');const options=await page.locator('[data-action="choice"]').allTextContents();
   if(count===0){assert.match(s.dialogue.text,/apothecary/);assert.match(options[0],/Kill him/);assert.match(options[1],/Spare him/);}else{assert.match(s.dialogue.text,/champion/);assert.match(options[0],/Kill him/);assert.match(options[1],/Don't attack/);}
   report.choices.push({qaOnly:true,index:1,prompt:s.dialogue.text,options,moralityBefore:s.adventure.morality});await persist();await page.screenshot({path:h.output+'denmark-nightshade-spare-choice-'+count+'.png'});await click('[data-action="choice"][data-index="1"]');continue;
  }
  if(s.phase==='gameover'){report.gameover=await page.locator('#app').innerText();await page.screenshot({path:h.output+'denmark-nightshade-spare-gameover.png'});assert.fail('Natural gameover retained; no automatic retry');}
  assert.equal(s.phase,'world');return s;
 }assert.fail('Bounded authored scene did not settle');
}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});report.initialLocalStorageKeys=await page.evaluate(()=>window.nightshadeInitialLocalStorageKeys);assert.deepEqual(report.initialLocalStorageKeys,[]);
 await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Explicit original import into empty isolated profile');assert.equal(start.silver,296);assert.equal(start.party.length,9);assert.equal(start.adventure.morality,56);
 await click('[data-action="save"]');report.imported=await exportSave('denmark-nightshade-spare-imported-save');const imported=JSON.parse(await readFile(report.imported.path));assert.deepEqual(imported.profile.unlockedAchievementIds,base.profile.unlockedAchievementIds);assert.deepEqual(mainIds(imported),mainIds(base));assert.deepEqual(imported.game.worldTriggerState,base.game.worldTriggerState);
 pass('Empty independent browser storage imports the exact genuine baseline and original profile, without inheriting another route’s titles');
 for(let n=0;(await state()).map.id!=='大地图';n++){assert.ok(n<3);const s=await state();assert.ok(['药王庄','衡阳'].includes(s.map.id));await copy('Normal approach '+s.map.id);await click('[data-action="interact"][data-id="返回"]');await settle();await record('Normal return '+n);}
 const world=await record('One normal world-entry check');report.worldEntry=world.map.locations.find(l=>l.id==='阎基居');
 if(!report.worldEntry?.action){report.entryUnavailable=true;await persist();pass('The original chance did not expose this entry; stopped without reroll, date changes, forced flags or a choice');}
 else{
  await click('[data-action="save"]');report.beforeEncounter=await exportSave('denmark-nightshade-spare-before-encounter-save');await copy('Actual world next step');await noOverflow('Next ingredient action before the real encounter');
  await click('[data-action="interact"][data-id="阎基居"]');await settle();const joined=await record('QA spared the apothecary after the actual win');
  assert.equal(report.choices.length,1);assert.equal(joined.party.length,10);assert.ok(joined.party.some(c=>c.definitionId==='阎基'));assert.equal(joined.adventure.morality,54);assert.ok(joined.inventory.some(i=>i.id==='七星海棠'&&i.count===1));
  report.afterSpare=await exportSave('denmark-nightshade-spare-recruited-save');await copy('Actual companion and return objective');
  assert.equal(joined.map.id,'大地图');await click('[data-action="interact"][data-id="苗人凤居"]');await settle();await click('[data-action="interact"][data-id="苗人凤"]');await settle();
  const ending=await record('QA declined to attack and accepted the investigation manual');assert.equal(report.choices.length,2);assert.equal(ending.party.length,10);assert.equal(ending.adventure.morality,54);assert.ok(ending.inventory.some(i=>i.id==='胡家刀法手抄本'&&i.count===1));
  report.observed=await exportSave('denmark-nightshade-spare-observed-save');await copy('Actual investigation outcome');
  await click('[data-action="quests"]');await page.locator('[data-journey-story="denmark-investigation"] > summary').click();await page.locator('.journey-full > summary').click();await page.locator('.journey-journal > summary').click();report.journal=await copy('Actual investigation journal','.journey-full');assert.ok(report.journal.includes('Frontier Cleave Manual'));await noOverflow('Actual investigation journal at 390px');await closeModal();
  const before=await state();await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');const after=await state();
  assert.deepEqual(after.party.map(build),before.party.map(build));assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.deepEqual(items(after),items(before));assert.equal(after.silver,before.silver);
  report.checkpoint=await exportSave('denmark-nightshade-spare-complete-save');const raw=JSON.parse(await readFile(report.checkpoint.path));assert.deepEqual(mainIds(raw),mainIds(base));assert.deepEqual(raw.game.worldTriggerState,base.game.worldTriggerState);assert.equal(raw.browserSaveVersion,base.browserSaveVersion);assert.equal(raw.game.version,base.game.version);
  assert.ok(raw.game.storyState.completedStoryIds.includes('雪山飞狐_阎基居.七星海棠.胜利.不杀'));assert.ok(!raw.game.storyState.completedStoryIds.includes('雪山飞狐_阎基居.七星海棠.胜利.杀'));assert.ok(!raw.profile.unlockedAchievementIds.includes('七星海棠'));assert.ok(!raw.game.storyState.completedStoryIds.includes('苗人凤居.阎基对峙.杀苗人凤_战斗'));
  report.progressVerified=true;report.englishCopyVerified=report.copyGaps.length===0;
  pass('One isolated normal QA route wins the original battle, spares the apothecary, declines the second attack and preserves actual rewards/profile through manual save/load; original HP/MP recovery is unchanged');
 }
 assert.equal(hash(await readFile(source.path)),source.sha256);assert.equal(hash(await readFile('src/Game.Web/test-results/backups/pre-denmark-nightshade-a2dadf1/denmark-remedy-complete-save.json')),source.sha256);
 pass('The protected 296-silver nine-person baseline and its backup remain byte-identical; QA choices and rewards stay in separate files');
}catch(e){failure=e;try{await record('Stopped at actual state');if((await state()).phase==='world'&&!report.observed)report.observed=await exportSave('denmark-nightshade-spare-stopped-save');}catch(saveError){report.checkpointFailure=saveError.message;}}
await finish(failure);
