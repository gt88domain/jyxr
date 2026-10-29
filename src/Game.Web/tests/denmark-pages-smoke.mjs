import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const prior=JSON.parse(await readFile('src/Game.Web/test-results/denmark-kai.json','utf8'));
assert.ok(prior.passed&&prior.progressVerified);const source=prior.checkpoint;
for(const file of [source.path,'src/Game.Web/test-results/backups/pre-denmark-pages-46631a7/denmark-kai-recruited-save.json'])assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),source.sha256);
const h=await createHarness('denmark-pages',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source=source;report.actions=[];report.dialogue=[];report.ledger=[];report.copyGaps=[];
report.method='Genuine 276-silver, eight-member Kai recruitment export. Follow the original pages entrance once with the existing lineup and builds; verify required Hero+Kai deployment, actual rewards and journal, then save/load. No extra training, shopping, medicine, party reorder, edited saves, clock farming, Grimm interaction or later poison/kill-spare scenes. Export the actual world outcome before optional UI assertions.';
const build=({hp,mp,...c})=>c,items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));
const count=(s,id)=>s.inventory.filter(i=>i.id===id).reduce((n,i)=>n+i.count,0);
const units=b=>b.units.map(u=>({id:u.id,definitionId:u.definitionId,name:u.name,team:u.team,hp:u.hp,maxHp:u.maxHp,mp:u.mp,maxMp:u.maxMp,alive:u.alive,x:u.x,y:u.y}));
async function persist(){await writeFile(h.output+'denmark-pages-progress.json',JSON.stringify(report,null,2));}
async function record(label){const s=await state();report.ledger.push({label,map:s.map.id,silver:s.silver,adventure:s.adventure,hero:s.hero,party:s.party,roster:s.roster,chapterJournal:s.chapterJournal,inventory:items(s)});await persist();return s;}
async function exportSave(name){await closeModal();await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const file=h.output+name+'.json';await (await waiting).saveAs(file);await closeModal();return {path:'src/Game.Web/test-results/'+name+'.json',sha256:createHash('sha256').update(await readFile(file)).digest('hex')};}
async function copyCheck(label,selector){const text=await page.locator(selector).innerText();if(/[\u3400-\u9fff]/.test(text))report.copyGaps.push({label,text});return text;}
async function cellClick(x,y){const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Genuine eight-member Kai recruitment');assert.equal(start.silver,276);assert.equal(start.party.length,8);assert.equal(start.hero.level,12);assert.equal(start.party[7].definitionId,'胡斐');assert.equal(start.adventure.morality,56);
 assert.equal(start.map.id,'大地图');assert.ok(!start.chapterJournal.completedStories.includes('mainStory_黑暗的阴影1'));
 const entry=start.map.locations.find(l=>l.id==='阎基居');assert.equal(entry.action,'story');report.availableEntry=entry;
 const guide=await copyCheck('Preparation guide','[data-guidance]');for(const t of ['Your hero and Kai','loss or timeout ends this journey','Save before'])assert.ok(guide.includes(t),t);
 const button=await page.locator('[data-guidance] [data-next-step]').boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(button.height>=44&&button.y+button.height<=nav.y);
 await click('[data-action="save"]');report.ready=await exportSave('denmark-pages-before-fight-save');await noOverflow('Actual missing-pages entrance and fatal-defeat warning');await page.screenshot({path:h.output+'denmark-pages-invitation.png'});
 pass('The genuine eight-member save has the original pages entrance and a first-screen warning before the mandatory fight');
 await click('[data-guidance] [data-next-step]');
 for(let n=0;n<250;n++){
  const s=await state();if(s.phase==='world'||s.phase==='gameover')break;
  if(s.phase==='dialogue'){const d={speaker:s.dialogue.speaker,text:s.dialogue.text,pages:count(s,'两页胡家刀法'),remedy:count(s,'天王保命丹')};report.dialogue.push(d);if(/[\u3400-\u9fff]/.test(d.text+d.speaker))report.copyGaps.push({label:'Pages dialogue',...d});await click('[data-action="next"]');continue;}
  assert.equal(s.phase,'battle');const b=s.battle;
  if(!report.opening){report.opening={id:b.id,tick:b.tick,units:units(b),skills:b.skills};assert.equal(b.id,'阎基居.战斗');assert.deepEqual(b.units.filter(u=>u.team===1).map(u=>u.definitionId).sort(),['主角','胡斐'].sort());assert.equal(b.units.find(u=>u.definitionId==='阎基').name,'The Apothecary');await noOverflow('Actual required Hero and eighth-slot Kai deployment');await page.screenshot({path:h.output+'denmark-pages-battle.png'});}
  if(b.outcome!=='ongoing'){report.battle={outcome:b.outcome,tick:b.tick,timedOut:b.timedOut,units:units(b)};await click('[data-action="leave-battle"]');continue;}
  const u=b.units.find(u=>u.id===b.activeUnitId);if(u.team!==1){await page.waitForTimeout(100);continue;}
  const enemies=b.units.filter(e=>e.team!==1&&e.alive),action={actor:u.definitionId,tick:b.tick,hp:u.hp,mp:u.mp};
  const priorities=u.definitionId==='胡斐'?['胡家刀法']:['密宗大手印','无上大力杵','野球拳'];
  const target=priorities.map(id=>b.targets.find(t=>t.skillId===id&&enemies.some(e=>e.id===t.targetId)&&b.skills.some(k=>k.id===id&&k.available!==false))).find(Boolean);
  if(target){const skill=b.skills.find(k=>k.id===target.skillId);await click('[data-action="battle-skills"]');await copyCheck('Live techniques','#game-modal');await click(`[data-action="choose-battle-skill"][data-id="${target.skillId}"]`);await cellClick(target.x,target.y);report.actions.push({...action,kind:'technique',skillId:skill.id,skillName:skill.name,rank:skill.level,energy:skill.mpCost,target:{x:target.x,y:target.y}});await persist();continue;}
  if(b.action.canMove&&b.reachable.length&&enemies.length){const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);report.actions.push({...action,kind:'move',x:cell.x,y:cell.y});continue;}}
  await click('[data-action="mobile-rest"]');report.actions.push({...action,kind:'rest'});
 }
 const ending=await record('One real missing-pages outcome');assert.ok(report.battle);
 if(ending.phase==='gameover'){
  report.gameover=await copyCheck('Actual gameover','#app');await page.screenshot({path:h.output+'denmark-pages-gameover.png'});await click('[data-action="load"]');const restored=await state();assert.equal(restored.silver,276);assert.deepEqual(restored.party.map(build),start.party.map(build));assert.deepEqual(restored.chapterJournal,start.chapterJournal);report.recovered=await exportSave('denmark-pages-recovered-save');assert.fail('The one actual trial ended the journey; real recovery retained, no second attempt');
 }
 assert.equal(ending.phase,'world');report.observed=await exportSave('denmark-pages-outcome-save');
 assert.equal(report.battle.outcome,'win');assert.ok(ending.chapterJournal.completedStories.includes('雪山飞狐_阎基居.两页刀法.胜利'));
 assert.equal(count(ending,'两页胡家刀法'),count(start,'两页胡家刀法')+1);assert.ok(count(ending,'天王保命丹')>=count(start,'天王保命丹')+1);
 assert.equal(ending.party.length,8);assert.equal(ending.adventure.morality,56);report.income=ending.silver-start.silver;
 assert.deepEqual(ending.chapterJournal.completedStories.filter(s=>s.startsWith('mainStory_')),start.chapterJournal.completedStories.filter(s=>s.startsWith('mainStory_')));
 await click('[data-action="quests"]');await page.locator('[data-journey-story="denmark-pages-found"] > summary').click();const completion=await copyCheck('Actual pages conclusion','[data-journey-story="denmark-pages-found"]');assert.ok(completion.includes('not the whole Denmark story'));
 await page.locator('.journey-full > summary').click();await page.locator('.journey-journal > summary').click();report.journal=await copyCheck('Actual pages journal','.journey-full');assert.ok(report.journal.includes('Recovered Kai'));assert.ok(report.journal.includes('Frontier Cleave Pages'));await closeModal();
 await click('[data-action="party"]');await click('[data-roster-id="胡斐"] [data-panel="cultivation"]');const managed=await state();report.kai=managed.managedCharacter;report.rewardPages=managed.inventory.find(i=>i.id==='两页胡家刀法');report.remedy=managed.inventory.find(i=>i.id==='天王保命丹');
 assert.equal(report.kai.cultivation,null);assert.equal(report.rewardPages.training.studyLimit,5);assert.ok(report.rewardPages.requirements.every(r=>r.met));assert.equal(report.rewardPages.name,'Frontier Cleave Pages');
 await copyCheck('Kai and the actual reusable reward guide','[data-adventurer-sheet]');await noOverflow('Actual reward requirements and unassigned Kai study');await page.screenshot({path:h.output+'denmark-pages-reward-study.png'});await closeModal();
 const before=await state();await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');const after=await state();
 assert.deepEqual(after.party.map(build),before.party.map(build));assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.deepEqual(items(after),items(before));assert.equal(after.silver,before.silver);
 report.checkpoint=await exportSave('denmark-pages-complete-save');const raw=JSON.parse(await readFile(report.checkpoint.path)),old=JSON.parse(await readFile(source.path));assert.deepEqual(raw.game.worldTriggerState,old.game.worldTriggerState);
 report.progressVerified=true;report.englishCopyVerified=report.copyGaps.length===0;
 pass('The original required pair actually wins; the fixed pages and remedy, English journal and eight-party state survive save/load without another world event or automatic training');
}catch(e){failure=e;try{if((await state()).phase==='world'&&!report.observed)report.observed=await exportSave('denmark-pages-observed-save');}catch(saveError){report.checkpointFailure=saveError.message;}}
await finish(failure);
