import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const prior=JSON.parse(await readFile('src/Game.Web/test-results/denmark-pages-review.json','utf8'));
assert.ok(prior.passed&&prior.progressVerified);const source=prior.checkpoint;
for(const f of [source.path,'src/Game.Web/test-results/backups/pre-denmark-remedy-659b475/denmark-pages-complete-save.json'])assert.equal(createHash('sha256').update(await readFile(f)).digest('hex'),source.sha256);
const pack=JSON.parse(await readFile('src/Game.Web/public/data/packs/worlds/en/content-package.json','utf8'));
const crosses=new Set(pack.externalSkills.filter(s=>s.type==='qimen').map(s=>s.id));
const h=await createHarness('denmark-remedy',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source=source;report.ledger=[];report.checkpoints=[];report.actions=[];report.dialogue=[];report.battles=[];report.copyGaps=[];
report.method='Normal copy of the genuine 286-silver, eight-member pages conclusion. Follow real guide buttons through Winter Cottage, the original rescue, and the Rainmarket forest route to ask Gerda for help. Handle at most two naturally selected forest encounters. No forced clock/chance/flags, purchases, training, party reorder, Grimm interaction or kill/spare choice. Only existing battle medicine may be used if needed. Export each real outcome before optional UI checks.';
const build=({hp,mp,...c})=>c,items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));
const units=b=>b.units.map(u=>({id:u.id,definitionId:u.definitionId,name:u.name,team:u.team,hp:u.hp,maxHp:u.maxHp,mp:u.mp,maxMp:u.maxMp,alive:u.alive,x:u.x,y:u.y}));
async function persist(){await writeFile(h.output+'denmark-remedy-progress.json',JSON.stringify(report,null,2));}
async function record(label){const s=await state();report.ledger.push({label,phase:s.phase,map:s.map.id,silver:s.silver,adventure:s.adventure,hero:s.hero,party:s.party,roster:s.roster,chapterJournal:s.chapterJournal,inventory:items(s)});await persist();return s;}
async function exportSave(name){await closeModal();await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const f=h.output+name+'.json';await (await waiting).saveAs(f);await closeModal();const p={path:'src/Game.Web/test-results/'+name+'.json',sha256:createHash('sha256').update(await readFile(f)).digest('hex')};report.checkpoints.push(p);await persist();return p;}
async function copyCheck(label,selector){const text=await page.locator(selector).innerText();if(/[\u3400-\u9fff]/.test(text))report.copyGaps.push({label,text});return text;}
async function cellClick(x,y){const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();}
async function battle(){
 let s=await state();const entry={id:s.battle.id,opening:units(s.battle),silverBefore:s.silver};
 if(entry.id==='苗人凤居.苗人凤被毒.战斗')assert.deepEqual(entry.opening.filter(u=>u.team===1).map(u=>u.definitionId).sort(),['主角','胡斐'].sort());
 else assert.ok(report.battles.filter(b=>b.id!=='苗人凤居.苗人凤被毒.战斗').length<2,'Stop rather than farm repeated forest encounters');
 report.currentBattle=entry;await persist();await noOverflow('Actual '+entry.id+' at 390px');await page.screenshot({path:h.output+'denmark-remedy-battle-'+report.battles.length+'.png'});
 for(let n=0;n<500;n++){
  s=await state();const b=s.battle;assert.ok(b);
  if(b.outcome!=='ongoing'){Object.assign(entry,{outcome:b.outcome,tick:b.tick,timedOut:b.timedOut,ending:units(b)});report.battles.push(entry);delete report.currentBattle;await persist();await click('[data-action="leave-battle"]');return;}
  const u=b.units.find(u=>u.id===b.activeUnitId);if(u.team!==1){await page.waitForTimeout(100);continue;}
  const action={battle:b.id,actor:u.definitionId,tick:b.tick,hp:u.hp,mp:u.mp};
  const potion=u.hp<u.maxHp*.45?s.inventory.find(i=>i.id==='天王保命丹'&&i.canUse&&i.battleTargets?.some(t=>t.id===u.id&&t.canUse)):null;
  if(potion){await click('[data-action="inventory"]');await page.locator(`.battle-item-target[data-entry-number="${potion.entryNumber}"]`).selectOption(u.id);await click(`[data-action="use-item"][data-entry-number="${potion.entryNumber}"]`);await closeModal();report.actions.push({...action,kind:'medicine',itemId:potion.id});await persist();continue;}
  const enemies=b.units.filter(e=>e.team!==1&&e.alive),ids=u.definitionId==='胡斐'?['胡家刀法']:u.definitionId==='主角'?['百花错拳.百花缭乱','密宗大手印','无上大力杵','野球拳']:b.skills.map(k=>k.id);
  const targets=b.targets.flatMap(t=>{const k=b.skills.find(k=>k.id===t.skillId&&k.available!==false);if(!k||!ids.includes(k.id))return [];const plus=crosses.has(k.id)||k.id==='百花错拳.百花缭乱';const hits=plus?enemies.filter(e=>(e.x===t.x||e.y===t.y)&&Math.abs(e.x-t.x)+Math.abs(e.y-t.y)<=k.impactSize).length:enemies.some(e=>e.id===t.targetId)?1:0;return hits?[{...t,skill:k,hits,score:hits*1000+(ids.length-ids.indexOf(k.id))*20}]:[];}).sort((a,c)=>c.score-a.score);
  if(targets.length){const t=targets[0];await click('[data-action="battle-skills"]');await copyCheck('Live techniques','#game-modal');await click(`[data-action="choose-battle-skill"][data-id="${t.skill.id}"]`);await cellClick(t.x,t.y);report.actions.push({...action,kind:'technique',skillId:t.skill.id,name:t.skill.name,rank:t.skill.level,cost:t.skill.mpCost,target:{x:t.x,y:t.y},visibleTargets:t.hits});await persist();continue;}
  if(b.action.canMove&&b.reachable.length&&enemies.length){const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);report.actions.push({...action,kind:'move',x:cell.x,y:cell.y});continue;}}
  await click('[data-action="mobile-rest"]');report.actions.push({...action,kind:'rest'});
 }assert.fail('Bounded original battle did not finish');
}
async function settle(){
 for(let n=0;n<120;n++){
  const s=await state();
  if(s.phase==='dialogue'){const d={speaker:s.dialogue.speaker,text:s.dialogue.text};report.dialogue.push(d);if(/[\u3400-\u9fff]/.test(d.speaker+d.text))report.copyGaps.push({label:'Dialogue',...d});await click('[data-action="next"]');continue;}
  if(s.phase==='battle'){await battle();continue;}
  if(s.phase==='choice'){report.unexpectedChoice={prompt:s.dialogue.text,options:s.choices};await page.screenshot({path:h.output+'denmark-remedy-unselected-choice.png'});assert.fail('Stopped before an unapproved story choice; previous normal checkpoint retained');}
  if(s.phase==='gameover'){report.gameover=await page.locator('#app').innerText();await page.screenshot({path:h.output+'denmark-remedy-gameover.png'});assert.fail('Real original defeat ended the journey; no automatic retry');}
  assert.equal(s.phase,'world');return s;
 }assert.fail('Original scene did not settle');
}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Genuine pages conclusion');assert.equal(start.silver,286);assert.equal(start.party.length,8);assert.equal(start.hero.level,12);assert.equal(start.party[7].definitionId,'胡斐');
 assert.ok(!start.chapterJournal.completedStories.includes('mainStory_黑暗的阴影1'));
 for(let n=0;n<16;n++){
  let s=await state();if(s.roster.some(c=>c.definitionId==='程灵素'))break;
  await copyCheck('Map '+s.map.id,'#app');
  await click('[data-action="save"]');report.lastBefore=await exportSave('denmark-remedy-before-guide-'+n+'-save');
  const action=page.locator('[data-guidance] [data-next-step]');assert.equal(await action.count(),1,'Stop if the original next entry is not available');report.ledger.at(-1).nextId=await action.getAttribute('data-id');
  if(s.map.id==='苗人凤居'&&!s.chapterJournal.completedStories.includes('雪山飞狐_苗人凤居.苗人凤被毒.胜利')){
   const text=await page.locator('[data-guidance]').innerText();assert.ok(text.includes('Kai is required; two party members fight'));assert.ok(text.includes('loss or timeout ends this journey'));report.beforeRescue=report.lastBefore;await page.screenshot({path:h.output+'denmark-remedy-before-letter.png'});
  }
  const battleCount=report.battles.length;await click('[data-guidance] [data-next-step]');s=await settle();await record('Normal guide step '+n);
  if(report.battles.length>battleCount){report.lastOutcome=await exportSave('denmark-remedy-after-battle-'+report.battles.length+'-save');for(const b of report.battles.slice(battleCount))assert.equal(b.outcome,'win');}
 }
 const ending=await record('Gerda help outcome');assert.ok(ending.roster.some(c=>c.definitionId==='程灵素'),'No unbounded search if Gerda was not reached');
 report.observed=await exportSave('denmark-remedy-gerda-observed-save');assert.equal(ending.party.length,9);assert.equal(ending.adventure.morality,start.adventure.morality);
 assert.ok(report.battles.some(b=>b.id==='苗人凤居.苗人凤被毒.战斗'&&b.outcome==='win'));assert.ok(ending.chapterJournal.completedStories.includes('雪山飞狐_药王庄.程灵素.求药'));
 assert.deepEqual(ending.chapterJournal.completedStories.filter(s=>s.startsWith('mainStory_')),start.chapterJournal.completedStories.filter(s=>s.startsWith('mainStory_')));
 await click('[data-action="quests"]');await page.locator('[data-journey-story="denmark-gerda-joined"] > summary').click();const done=await copyCheck('Gerda help card','[data-journey-story="denmark-gerda-joined"]');assert.ok(done.includes('joining the party does not cure him'));await page.locator('.journey-full > summary').click();await page.locator('.journey-journal > summary').click();report.journal=await copyCheck('Actual antidote quest journal','.journey-full');assert.ok(report.journal.includes('Nightshade Blossom'));await closeModal();
 await click('[data-action="party"]');await click('[data-roster-id="程灵素"] [data-panel="cultivation"]');report.gerda=(await state()).managedCharacter;await copyCheck('Gerda build','[data-adventurer-sheet]');await noOverflow('Actual ninth companion preparation');await page.screenshot({path:h.output+'denmark-remedy-gerda-sheet.png'});
 await click('[data-action="character"]');for(const summary of await page.locator('[data-talent-id] > summary').all())await summary.click();await copyCheck('Gerda talent descriptions','#game-modal');await closeModal();
 const before=await state();await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');const after=await state();
 assert.deepEqual(after.party.map(build),before.party.map(build));assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.deepEqual(items(after),items(before));assert.equal(after.silver,before.silver);
 report.checkpoint=await exportSave('denmark-remedy-gerda-save');const raw=JSON.parse(await readFile(report.checkpoint.path)),base=JSON.parse(await readFile(source.path));assert.deepEqual(raw.game.worldTriggerState,base.game.worldTriggerState);assert.ok(!raw.game.storyState.completedStoryIds.some(id=>id.startsWith('雪山飞狐_阎基居.七星海棠')));
 report.progressVerified=true;report.englishCopyVerified=report.copyGaps.length===0;
 pass('The original rescue and woodland path reach Gerda, who joins with an uncured champion and a Nightshade lead; save/load retains nine builds, real income and world windows without choosing kill/spare');
}catch(e){failure=e;try{if((await state()).phase==='world'&&!report.observed)report.observed=await exportSave('denmark-remedy-observed-save');}catch(saveError){report.checkpointFailure=saveError.message;}}
await finish(failure);
