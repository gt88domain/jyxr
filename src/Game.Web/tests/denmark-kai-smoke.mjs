import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const prior=JSON.parse(await readFile('src/Game.Web/test-results/pinocchio-training.json','utf8'));
assert.ok(prior.passed&&prior.progressVerified);
const resume=process.env.DENMARK_KAI_RESUME_REPORT?JSON.parse(await readFile(process.env.DENMARK_KAI_RESUME_REPORT,'utf8')):null;
const source=resume?resume.ready:prior.checkpoint;
for(const file of [prior.checkpoint.path,'src/Game.Web/test-results/backups/pre-denmark-kai-e06a5cd/pinocchio-trained-save.json'])assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),prior.checkpoint.sha256);
assert.equal(createHash('sha256').update(await readFile(source.path)).digest('hex'),source.sha256);
const h=await createHarness('denmark-kai',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source=source;report.actions=[];report.dialogue=[];report.copyGaps=[];report.ledger=[];
report.resumeReport=process.env.DENMARK_KAI_RESUME_REPORT||null;
report.method='Normal copy of the genuine 266-silver, seven-member post-Pinocchio practice save. Follow the guide from Grimm’s home to the available Kai invitation; play one original hero-only friendly match, then inspect recruitment and save/load. No clock farming, extra practice, purchases, edited saves, forced results, other Denmark encounters or Grimm world-story interaction.';
const build=({hp,mp,...c})=>c,items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));
async function persist(){await writeFile(h.output+'denmark-kai-progress.json',JSON.stringify(report,null,2));}
async function record(label){const s=await state();report.ledger.push({label,map:s.map.id,silver:s.silver,adventure:s.adventure,chapterJournal:s.chapterJournal,party:s.party,roster:s.roster,inventory:items(s)});await persist();return s;}
async function exportSave(name){await closeModal();await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const file=h.output+name+'.json';await (await waiting).saveAs(file);await closeModal();return {path:'src/Game.Web/test-results/'+name+'.json',sha256:createHash('sha256').update(await readFile(file)).digest('hex')};}
async function copyCheck(label,selector){const text=await page.locator(selector).innerText();if(/[\u3400-\u9fff]/.test(text))report.copyGaps.push({label,text});return text;}
async function cellClick(x,y){const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Genuine post-Pinocchio preparation');assert.equal(start.silver,266);assert.equal(start.party.length,7);assert.equal(start.adventure.morality,56);assert.ok(!start.roster.some(c=>['胡斐','华山胡斐'].includes(c.definitionId)));assert.ok(!start.chapterJournal.completedStories.includes('mainStory_黑暗的阴影1'));
 assert.equal(start.map.id,resume?'大地图':'南贤居');const first=await copyCheck('Guide from actual current map','[data-guidance]');assert.ok(first.includes('hero ALONE'));assert.ok(first.includes("Grimm's first letter"));
 if(!resume)await click('[data-guidance] [data-next-step]');let s=await state();assert.equal(s.map.id,'大地图');assert.equal(s.phase,'world');
 report.availableEntry=s.map.locations.find(l=>l.id==='胡斐居');assert.equal(report.availableEntry.action,'story');
 await click('[data-action="save"]');report.ready=await exportSave(resume?'denmark-kai-recheck-before-match-save':'denmark-kai-before-match-save');
 const button=await page.locator('[data-guidance] [data-next-step]').boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(button.height>=44&&button.y+button.height<=nav.y);
 await noOverflow('Actual Kai invitation and solo warning at 390px');await page.screenshot({path:h.output+'denmark-kai-invitation.png'});
 pass('The actual current save reaches the original Kai story entrance with no time farming or Grimm world-story advance');
 await click('[data-guidance] [data-next-step]');
 for(let n=0;n<200;n++){
  s=await state();if(s.phase==='world')break;
  if(s.phase==='dialogue'){report.dialogue.push({speaker:s.dialogue.speaker,text:s.dialogue.text});if(/[\u3400-\u9fff]/.test(s.dialogue.text))report.copyGaps.push({label:'Kai dialogue',text:s.dialogue.text});await click('[data-action="next"]');continue;}
  assert.equal(s.phase,'battle');const b=s.battle;
  if(!report.opening){report.opening={id:b.id,tick:b.tick,units:b.units};assert.equal(b.id,'胡斐居.战斗');assert.deepEqual(b.units.filter(u=>u.team===1).map(u=>u.definitionId),['主角']);await noOverflow('Actual original Kai hero-only match');await page.screenshot({path:h.output+'denmark-kai-match.png'});}
  if(b.outcome!=='ongoing'){report.battle={outcome:b.outcome,tick:b.tick,timedOut:b.timedOut,units:b.units};await click('[data-action="leave-battle"]');continue;}
  const u=b.units.find(u=>u.id===b.activeUnitId);if(u.team!==1){await page.waitForTimeout(100);continue;}
  const enemies=b.units.filter(e=>e.team!==1&&e.alive),action={tick:b.tick,hp:u.hp,mp:u.mp};
  const target=['密宗大手印','无上大力杵','野球拳'].map(id=>b.targets.find(t=>t.skillId===id&&enemies.some(e=>e.id===t.targetId)&&b.skills.some(k=>k.id===id&&k.available!==false))).find(Boolean);
  if(target){await click('[data-action="battle-skills"]');await copyCheck('Live hero technique sheet','#game-modal');await click(`[data-action="choose-battle-skill"][data-id="${target.skillId}"]`);await cellClick(target.x,target.y);report.actions.push({...action,kind:'technique',skillId:target.skillId,target:{x:target.x,y:target.y}});await persist();continue;}
  if(b.action.canMove&&b.reachable.length&&enemies.length){const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);report.actions.push({...action,kind:'move',x:cell.x,y:cell.y});continue;}}
  await click('[data-action="mobile-rest"]');report.actions.push({...action,kind:'rest'});
 }
 const ending=await record('Actual first Kai meeting outcome');assert.ok(report.battle);report.outcome=report.battle.outcome;
 if(report.outcome!=='win'){report.defeat=await exportSave('denmark-kai-defeat-save');assert.fail('The one actual Kai match lost; stop without automatic retries');}
 const kai=ending.roster.find(c=>c.definitionId==='胡斐');assert.ok(kai&&kai.name==='Kai');assert.equal(ending.party.length,8);assert.equal(ending.adventure.morality,56);assert.ok(ending.silver>=266);report.income=ending.silver-266;
 assert.ok(ending.chapterJournal.completedStories.includes('雪山飞狐_胡斐居.胜利'));assert.deepEqual(ending.chapterJournal.completedStories.filter(s=>s.startsWith('mainStory_')),start.chapterJournal.completedStories.filter(s=>s.startsWith('mainStory_')));
 report.nextEntry=(await state()).map.locations.find(l=>l.id==='阎基居');
 await click('[data-action="quests"]');await page.locator('[data-journey-story="denmark-kai-recruited"] > summary').click();
 const done=await copyCheck('Kai completed introduction card','[data-journey-story="denmark-kai-recruited"]');assert.ok(done.includes('not the whole Denmark story'));await page.locator('.journey-full > summary').click();await page.locator('.journey-journal > summary').click();report.journalText=await copyCheck('Real journal after Kai joins','.journey-full');assert.ok(report.journalText.includes('Kai joined the party.'));assert.equal(await page.locator('[data-journey-focus] > span').innerText(),"Denmark · Kai's Missing Pages");assert.ok(report.journalText.includes('An Unwelcome Shadow · Received'));await closeModal();
 await click('[data-action="party"]');await click('[data-roster-id="胡斐"] [data-panel="cultivation"]');report.kai=(await state()).managedCharacter;await copyCheck('Actual newly recruited Kai sheet','[data-adventurer-sheet]');await noOverflow('Actual Kai party preparation shortcut');await closeModal();
 const before=await state();await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');s=await state();
 assert.deepEqual(s.party.map(build),before.party.map(build));assert.deepEqual(s.adventure,before.adventure);assert.deepEqual(s.chapterJournal,before.chapterJournal);assert.deepEqual(items(s),items(before));assert.equal(s.silver,before.silver);
 report.checkpoint=await exportSave('denmark-kai-recruited-save');report.progressVerified=true;report.englishCopyVerified=report.copyGaps.length===0;
 pass('The original solo match actually wins and recruits Kai, with recorded income and unchanged Morality/world milestones; the eight-member party and chapter state survive save/load');
}catch(e){failure=e;try{if((await state()).phase==='world')report.observed=await exportSave('denmark-kai-observed-save');}catch(saveError){report.checkpointFailure=saveError.message;}}
await finish(failure);
