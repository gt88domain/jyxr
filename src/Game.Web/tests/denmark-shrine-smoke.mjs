import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
import {cleaveEnemyHits} from './battle-cleave-aim.mjs';
const prepared=process.env.KAI_PREPARED_SHRINE==='1',armored=process.env.KAI_ARMORED_SHRINE==='1';assert.ok(!(prepared&&armored),'Choose one genuine source');
const prefix=armored?'denmark-shrine-armored':prepared?'denmark-shrine-prepared':'denmark-shrine';
const source=armored?{path:'src/Game.Web/test-results/kai-armored-save.json',sha256:'4988c177ec98ebb3b30ef7576179d8d89f2c59dc34ce84316286dde9ec9f5180'}:prepared?{path:'src/Game.Web/test-results/kai-prepared-save.json',sha256:'c29ecd8b3ffce9721ed78c00ad7425cbd37287dda94e026e29aa4f677c916ad4'}:{path:'src/Game.Web/test-results/denmark-nightshade-spare-complete-save.json',sha256:'eb4052669e2c0fae10232c51ca5b34a6947c6b08cbb8506280d95ad61cc1da7e'};
if(prepared||armored){let exists=true;try{await access('src/Game.Web/test-results/'+prefix+'.json');}catch(e){if(e.code!=='ENOENT')throw e;exists=false;}assert.equal(exists,false,'Do not overwrite or repeat this bounded attempt');}
const hash=b=>createHash('sha256').update(b).digest('hex'),base=JSON.parse(await readFile(source.path));
for(const f of [source.path,armored?'src/Game.Web/test-results/backups/pre-kai-armored-battle-58e4bd1/kai-armored-save.json':prepared?'src/Game.Web/test-results/backups/pre-kai-prepared-shrine-ea0bdab/kai-prepared-save.json':'src/Game.Web/test-results/backups/pre-denmark-shrine-9b31c76/denmark-nightshade-spare-complete-save.json'])assert.equal(hash(await readFile(f)),source.sha256);
const pack=JSON.parse(await readFile('src/Game.Web/public/data/packs/worlds/en/content-package.json','utf8')),crosses=new Set(pack.externalSkills.filter(s=>s.type==='qimen').map(s=>s.id));
const cleaves=new Set(pack.externalSkills.filter(s=>s.type==='daofa'&&(!s.targeting?.impactType||s.targeting.impactType==='cleave')&&!s.levelOverrides?.some(o=>o.targeting)).map(s=>s.id));
const h=await createHarness(prefix,{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
report.source=source;report.initialStorage=await page.context().storageState({indexedDB:true});assert.deepEqual(report.initialStorage,{cookies:[],origins:[]});
report.sourceProfile={deathCount:base.profile.deathCount,killCount:base.profile.killCount};report.preparedAttempt=prepared;report.armoredAttempt=armored;
await page.addInitScript(()=>{window.shrineInitialLocalStorageKeys=Object.keys(localStorage);localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true}));});
report.method='Independent normal QA copy of the actual 330-silver ten-person spare/investigation result. World→Rainmarket→Rain Shrine→guildmaster once. No new choices, shopping, training, party reorder, clock farming or forced flags/chance. Attempt the native two-battle chain once with existing gear/skills and optional owned medicine. Preserve a natural defeat, test the ordinary defeat-page Load, and do not retry. This report’s passed flag covers checks; progressVerified requires the actual solo victory.';
if(prepared)report.method='One separately named attempt from the genuine 350-silver prepared QA export: owned blade, Frontier Cleave Rank 4, equipped Steadfast Rank 9 after two normal practices. Source profile death 1/kills 122. Normally leave Grimm’s home for Rainmarket and Rain Shrine. No further training, purchases, choices, reordering, time farming or edited saves. Existing medicine only; preserve any defeat and test ordinary Load. A prior prepared report prevents another run or overwrite.';
if(armored)report.method='One separately named attempt from the genuine 150-silver armored QA export: original bought heavy armor, 83 Defense, 19% critical resistance and movement penalty retained. Profile death 2/kills 129. Normally leave Crossroads for Rainmarket and Rain Shrine. No further purchases, practice, reordering, time/chance manipulation or edited saves. Use only actually available owned medicine; capture observed damage/events and Kai movement. Existing result prevents another attempt. Two wins are required before any neighboring ending is considered.';
report.ledger=[];report.dialogue=[];report.battles=[];report.actions=[];report.checkpoints=[];report.copyGaps=[];report.progressVerified=false;
const items=s=>s.inventory.map(i=>({id:i.id,count:i.count,entryNumber:i.entryNumber})),build=({hp,mp,...c})=>c;
const units=b=>b.units.map(u=>({id:u.id,definitionId:u.definitionId,name:u.name,team:u.team,hp:u.hp,maxHp:u.maxHp,mp:u.mp,maxMp:u.maxMp,alive:u.alive,x:u.x,y:u.y}));
async function persist(){await writeFile(h.output+prefix+'-progress.json',JSON.stringify(report,null,2));}
async function record(label){const s=await state();report.ledger.push({label,phase:s.phase,map:s.map.id,silver:s.silver,adventure:s.adventure,hero:s.hero,party:s.party,roster:s.roster,chapterJournal:s.chapterJournal,inventory:items(s)});await persist();return s;}
async function copy(label,selector='#app'){const text=await page.locator(selector).innerText();if(/[\u3400-\u9fff]/.test(text))report.copyGaps.push({label,text});return text;}
async function exportSave(name){await closeModal();await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const file=h.output+name+'.json';await (await waiting).saveAs(file);await closeModal();const p={path:'src/Game.Web/test-results/'+name+'.json',sha256:hash(await readFile(file))};report.checkpoints.push(p);await persist();return p;}
async function cellClick(x,y){const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();}
async function battle(){
 const s=await state(),entry={id:s.battle.id,firstObservedTick:s.battle.tick,opening:units(s.battle),silverBefore:s.silver,events:[],frames:[]},seenEvents=new Set();assert.ok(report.battles.length<2);
 if(report.battles.length===0){assert.equal(entry.id,'湘妃庙.田归农.阎基.战斗');assert.equal(entry.opening.filter(u=>u.team===1).length,3);assert.ok(entry.opening.some(u=>u.team===1&&u.definitionId==='胡斐'));}
 else{assert.equal(entry.id,'湘妃庙.胡斐单挑田归农阎基.战斗');assert.deepEqual(entry.opening.filter(u=>u.team===1).map(u=>u.definitionId),['胡斐']);report.beforeSolo={party:s.party,roster:s.roster,silver:s.silver,inventory:items(s)};}
 report.currentBattle=entry;await persist();await copy('Actual battle opening');await noOverflow('Actual '+entry.id+' at 390px');await page.screenshot({path:h.output+prefix+'-battle-'+report.battles.length+'.png'});
 for(let n=0;n<500;n++){
  const s=await state(),b=s.battle;
  for(const e of b.events||[])if(!seenEvents.has(e.sequence)){seenEvents.add(e.sequence);entry.events.push({...e,observedTick:b.tick});}
  entry.frames.push({tick:b.tick,activeUnitId:b.activeUnitId,units:units(b),skills:b.skills,targets:b.targets,action:b.action});entry.lastLogs=b.logs;
  if(b.outcome!=='ongoing'){Object.assign(entry,{outcome:b.outcome,tick:b.tick,timedOut:b.timedOut,ending:units(b)});report.battles.push(entry);delete report.currentBattle;await persist();await page.screenshot({path:h.output+prefix+'-outcome-'+report.battles.length+'.png'});await click('[data-action="leave-battle"]');return;}
  const u=b.units.find(u=>u.id===b.activeUnitId);if(u.team!==1){await page.waitForTimeout(100);continue;}
  const action={battle:b.id,actor:u.definitionId,tick:b.tick,hp:u.hp,mp:u.mp};
  if(u.definitionId==='胡斐'&&!entry.kaiMobility&&b.action.canMove)entry.kaiMobility={tick:b.tick,x:u.x,y:u.y,reachable:b.reachable,maxManhattan:Math.max(0,...b.reachable.map(c=>Math.abs(c.x-u.x)+Math.abs(c.y-u.y)))};
  const usable=id=>s.inventory.find(i=>i.id===id&&i.battleTargets?.some(t=>t.id===u.id&&t.canUse));
  const potion=u.hp<u.maxHp*.45?usable('天王保命丹')||(armored?usable('月饼')||usable('止血草'):null):armored&&u.mp<128&&u.hp<u.maxHp-130?usable('月饼'):null;
  if(potion){await click('[data-action="inventory"]');await page.locator(`.battle-item-target[data-entry-number="${potion.entryNumber}"]`).selectOption(u.id);await click(`[data-action="use-item"][data-entry-number="${potion.entryNumber}"]`);await closeModal();report.actions.push({...action,kind:'medicine',itemId:potion.id});await persist();continue;}
  const enemies=b.units.filter(e=>e.team!==1&&e.alive),ids=u.definitionId==='胡斐'?['胡家刀法']:u.definitionId==='主角'?['百花错拳.百花缭乱','密宗大手印','无上大力杵','野球拳']:b.skills.map(k=>k.id);
  const targets=b.targets.flatMap(t=>{const k=b.skills.find(k=>k.id===t.skillId&&k.available!==false);if(!k||!ids.includes(k.id))return [];const plus=crosses.has(k.id)||k.id==='百花错拳.百花缭乱',hits=cleaves.has(k.id)?cleaveEnemyHits(u,t,enemies):plus?enemies.filter(e=>(e.x===t.x||e.y===t.y)&&Math.abs(e.x-t.x)+Math.abs(e.y-t.y)<=k.impactSize).length:enemies.some(e=>e.id===t.targetId)?1:0;return hits?[{...t,skill:k,score:hits*1000+(ids.length-ids.indexOf(k.id))*20}]:[];}).sort((a,c)=>c.score-a.score);
  if(targets.length){const t=targets[0];await click('[data-action="battle-skills"]');await copy('Actual technique cards','#game-modal');await click(`[data-action="choose-battle-skill"][data-id="${t.skill.id}"]`);await cellClick(t.x,t.y);report.actions.push({...action,kind:'technique',id:t.skill.id,name:t.skill.name,rank:t.skill.level,cost:t.skill.mpCost,target:{x:t.x,y:t.y}});await persist();continue;}
  if(b.action.canMove&&b.reachable.length&&enemies.length){const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);report.actions.push({...action,kind:'move',x:cell.x,y:cell.y});continue;}}
  await click('[data-action="mobile-rest"]');report.actions.push({...action,kind:'rest'});await persist();
 }assert.fail('Bounded original battle did not finish');
}
async function settle(){for(let n=0;n<140;n++){
 const s=await state();if(s.phase==='dialogue'){report.dialogue.push({speaker:s.dialogue.speaker,text:s.dialogue.text});if(/[\u3400-\u9fff]/.test(s.dialogue.speaker+s.dialogue.text))report.copyGaps.push({label:'Actual dialogue',...s.dialogue});await click('[data-action="next"]');continue;}
 if(s.phase==='battle'){await battle();continue;}
 assert.ok(s.phase==='world'||s.phase==='gameover','No other story/choice is authorized');return s;
}assert.fail('Original chain did not settle');}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});report.initialLocalStorageKeys=await page.evaluate(()=>window.shrineInitialLocalStorageKeys);assert.deepEqual(report.initialLocalStorageKeys,[]);await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Genuine independent ten-person QA import');assert.equal(start.silver,armored?150:prepared?350:330);assert.equal(start.party.length,10);assert.equal(start.adventure.morality,54);assert.equal(start.hero.level,13);assert.equal(start.party.find(c=>c.definitionId==='胡斐').level,6);
 pass('Empty independent browser storage imports the genuine ten-person QA result without changing the protected nine-person baseline');
 if(prepared||armored){assert.equal(start.map.id,armored?'洛阳':'南贤居');await click('[data-action="interact"][data-id="返回"]');await settle();await record('Normal return from source town');}
 for(const id of ['衡阳','湘妃庙']){const before=await state();assert.ok(before.map.locations.some(l=>l.id===id&&l.action),'Stop at a genuinely unavailable entrance');await copy('Approach '+before.map.id);await click(`[data-action="interact"][data-id="${id}"]`);await settle();await record('Normal entrance '+id);}
 const before=await record('Before original shrine chain');assert.equal(before.map.id,'湘妃庙');assert.ok(before.map.locations.some(l=>l.id==='田归农'&&l.action));report.guide=await copy('Actual two-fight warning','[data-guidance]');assert.ok(report.guide.includes('Kai fights two poisoners ALONE'));const button=page.locator('[data-guidance] [data-next-step]'),box=await button.boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(box.height>=44&&box.y+box.height<=nav.y);await noOverflow('Original shrine entrance and preparation warning');
 await click('[data-action="save"]');report.beforeEncounter=await exportSave(prefix+'-before-encounter-save');await page.screenshot({path:h.output+prefix+'-before-encounter.png'});await click('[data-action="interact"][data-id="田归农"]');const ending=await settle();await record('Actual chain outcome');
 report.journeyOutcome=report.battles.at(-1)?.outcome;
 if(ending.phase==='gameover'){
  report.defeat=await copy('Actual original defeat page');assert.notEqual(report.journeyOutcome,'win');await page.screenshot({path:h.output+prefix+'-gameover.png'});await noOverflow('Actual defeat page with ordinary Load');await click('[data-action="load"]');const restored=await record('Defeat-page Load restored the real pre-encounter save');assert.equal(restored.phase,'world');assert.equal(restored.map.id,before.map.id);assert.equal(restored.silver,before.silver);assert.deepEqual(restored.party.map(build),before.party.map(build));assert.deepEqual(restored.adventure,before.adventure);assert.deepEqual(restored.chapterJournal,before.chapterJournal);assert.deepEqual(items(restored),items(before));
  report.restored=await exportSave(prefix+'-restored-after-defeat-save');const raw=JSON.parse(await readFile(report.restored.path));assert.equal(raw.profile.deathCount,base.profile.deathCount+1);report.profileAfterRecovery=raw.profile;report.recoveryVerified=true;
  pass('The natural defeat is retained without retry; the defeat-page Load restores the actual ten-person pre-encounter build, inventory, silver and story while keeping the original profile death count');
 }else{
  assert.equal(report.battles.length,2);assert.ok(report.battles.every(b=>b.outcome==='win'));assert.ok(ending.inventory.some(i=>i.id==='天龙宝剑'&&i.count===1));report.observed=await exportSave(prefix+'-won-save');report.progressVerified=true;
  pass('Both original fights actually won, including Kai alone; the source sword reward is present without injected growth or flags');
 }
 report.englishCopyVerified=report.copyGaps.length===0;assert.equal(hash(await readFile(source.path)),source.sha256);const protectedPath='src/Game.Web/test-results/denmark-remedy-complete-save.json';assert.equal(hash(await readFile(protectedPath)),'9640c7272be664e848a4ba19ee60f34f54f9cba5dd7335b325bbfa4fea786d3d');
 pass('Actual source QA save and protected original nine-person save stay byte-identical; no branch, earned result or profile was merged back');
}catch(e){failure=e;try{await record('Stopped at actual state');if((await state()).phase==='world')report.stopped=await exportSave(prefix+'-stopped-save');}catch(saveError){report.checkpointFailure=saveError.message;}}
await finish(failure);
