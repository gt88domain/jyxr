import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const proof=JSON.parse(await readFile('src/Game.Web/test-results/italy-energy-allocation.json','utf8'));
assert.ok(proof.passed&&proof.progressVerified);
const source=proof.checkpoint;
for(const path of [source.path,'src/Game.Web/test-results/backups/pre-pinocchio-37823b7/italy-allocation-victory-save.json'])
 assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),source.sha256);
const h=await createHarness('pinocchio-training',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source=source;report.actions=[];report.copyGaps=[];report.snapshots=[];
report.method='Continue the genuine 256-silver, seven-member Italy victory. Use owned spare gear and the unassigned Threefold Swordplay Manual; normally move Pinocchio into slot two, then play one Team Practice. No purchases, borrowed guide, stat allocation, edited save, forced result or main-story progression.';
const build=({hp,mp,...c})=>c,items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));
async function record(label){const s=await state();report.snapshots.push({label,phase:s.phase,map:s.map.id,silver:s.silver,adventure:s.adventure,party:s.party,roster:s.roster,chapterJournal:s.chapterJournal,inventory:items(s)});await persist();return s;}
async function persist(){await writeFile(h.output+'pinocchio-training-progress.json',JSON.stringify(report,null,2));}
async function copyCheck(label){const text=await page.locator('#game-modal').innerText();if(/[\u3400-\u9fff]/.test(text))report.copyGaps.push({label,text});}
async function cellClick(x,y){const canvas=page.locator('#board-viewport canvas');await canvas.scrollIntoViewIfNeeded();const g=JSON.parse(await page.locator('#board-viewport').getAttribute('data-board-geometry')),box=await canvas.boundingBox(),size=await canvas.evaluate(c=>({w:c.width,h:c.height}));await page.mouse.click(box.x+(g.left+(x+.5)*g.cell)*box.width/size.w,box.y+(g.top+(y+.5)*g.cell)*box.height/size.h);await ready();}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(source.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Actual Italy victory before preparation');assert.equal(start.silver,256);assert.equal(start.party.length,7);assert.equal(start.adventure.morality,56);
 const pin=start.party.find(c=>c.definitionId==='袁冠南');assert.ok(pin&&pin.level===15);
 await click('[data-action="party"]');await click(`[data-roster-id="${pin.id}"] [data-panel="cultivation"]`);
 let s=await state();report.before=s.managedCharacter;report.books=s.inventory.filter(i=>i.kind==='skillBook');
 assert.equal(s.inventory.find(i=>i.id==='内功入门').training.mastered,true);
 assert.equal(s.inventory.find(i=>i.id==='火焰刀残篇').canCultivate,false);
 assert.equal(s.inventory.find(i=>i.id==='柔云剑法秘籍').canCultivate,false);
 const guide=s.inventory.find(i=>i.id==='三分剑术');assert.ok(guide.canCultivate);assert.deepEqual(guide.requirements,[]);assert.deepEqual(guide.training.assignedTo,[]);
 await copyCheck('New companion guide availability');
 // All three spare pieces came from the existing normal playthrough inventory.
 for(const entry of [20,28,22]){
  const item=(await state()).inventory.find(i=>i.entryNumber===entry);assert.ok(item.canEquip);
  await click(`.as-spare-gear [data-action="equip-item"][data-entry-number="${entry}"]`);
 }
 s=await state();assert.equal(s.managedCharacter.equipment.filter(g=>g.item).length,3);assert.equal(s.silver,256);await copyCheck('Owned spare equipment');
 await click(`.as-material [data-action="cultivate"][data-entry-number="${guide.entryNumber}"]`);
 s=await state();assert.equal(s.managedCharacter.cultivation.skillId,'三分剑法');assert.equal(s.managedCharacter.cultivation.level,1);
 assert.equal(s.managedCharacter.equippedInternalSkillId,'基本内功');report.studyBefore=s.managedCharacter.cultivation;
 await noOverflow('Real Pinocchio equipment and study at 390px');await page.screenshot({path:h.output+'pinocchio-training-prepared.png'});
 await click('[data-action="character"]');await page.locator('[data-talent-id="夫妻同心"] summary').click();await copyCheck('Pinocchio talent description');await closeModal();
 await click('[data-action="party"]');
 for(let n=0;n<6;n++){s=await state();const index=s.party.findIndex(c=>c.definitionId==='袁冠南');if(index===1)break;await click(`[data-roster-id="${pin.id}"] [data-action="party-order"][data-index="${index-1}"]`);}
 assert.equal((await state()).party[1].definitionId,'袁冠南');await closeModal();await record('Prepared and moved normally from seventh to second');
 for(let n=0;n<4&&(await state()).map.id!=='大地图';n++)await click('[data-action="interact"][data-id="返回"]');
 await click('[data-action="interact"][data-id="南贤居"]');await click('[data-action="interact"][data-id="结伴练习"]');
 for(let n=0;n<500;n++){
  s=await state();if(s.phase==='dialogue'){await click('[data-action="next"]');continue;}if(s.phase==='world')break;
  assert.equal(s.phase,'battle');const b=s.battle;
  if(!report.opening){report.opening={id:b.id,tick:b.tick,units:b.units};assert.deepEqual(b.units.filter(u=>u.team===1).map(u=>u.definitionId).sort(),['主角','袁冠南'].sort());await noOverflow('Pinocchio actually deployed in Team Practice');}
  if(b.outcome!=='ongoing'){report.battle={outcome:b.outcome,tick:b.tick,timedOut:b.timedOut,units:b.units};await click('[data-action="leave-battle"]');break;}
  const u=b.units.find(u=>u.id===b.activeUnitId);if(u.team!==1){await page.waitForTimeout(100);continue;}
  const action={tick:b.tick,actor:u.definitionId,beforeHp:u.hp,beforeMp:u.mp};
  if(u.definitionId!=='袁冠南'){await click('[data-action="mobile-rest"]');report.actions.push({...action,kind:'rest'});continue;}
  const enemies=b.units.filter(e=>e.team!==1&&e.alive),practiced=report.actions.filter(a=>a.skillId==='三分剑法').length;
  const target=['三分剑法','夫妻刀法'].slice(practiced>=2?1:0).map(id=>b.targets.find(t=>t.skillId===id&&enemies.some(e=>e.id===t.targetId)&&b.skills.some(k=>k.id===id&&k.available!==false))).find(Boolean);
  if(target){const skill=b.skills.find(k=>k.id===target.skillId);await click('[data-action="battle-skills"]');await copyCheck('Live Pinocchio techniques');await click(`[data-action="choose-battle-skill"][data-id="${target.skillId}"]`);await cellClick(target.x,target.y);report.actions.push({...action,kind:'technique',skillId:skill.id,skillName:skill.name,level:skill.level,energy:skill.mpCost,target:{x:target.x,y:target.y}});await persist();continue;}
  if(b.action.canMove&&b.reachable.length&&enemies.length){const distance=c=>Math.min(...enemies.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y))),cell=[...b.reachable].sort((a,c)=>distance(a)-distance(c))[0];if(distance(cell)<distance(u)){await click('[data-action="mobile-move"]');await cellClick(cell.x,cell.y);report.actions.push({...action,kind:'move',x:cell.x,y:cell.y});continue;}}
  await click('[data-action="mobile-rest"]');report.actions.push({...action,kind:'rest'});
 }
 await h.continueDialogue();s=await record('One actual Team Practice outcome');assert.ok(report.battle);assert.equal(report.battle.outcome,'win');assert.equal(s.silver,266);
 assert.ok(report.actions.some(a=>a.actor==='袁冠南'&&a.skillId==='三分剑法'));
 const after=s.roster.find(c=>c.definitionId==='袁冠南');report.studyAfter=after.cultivation;assert.ok(after.cultivation.level>1||after.cultivation.exp>0);
 assert.deepEqual(s.chapterJournal.completedStories,start.chapterJournal.completedStories);assert.equal(s.adventure.morality,start.adventure.morality);
 await click('[data-action="loadout"]');await page.locator('#managed-character').selectOption(pin.id);await ready();report.after=(await state()).managedCharacter;await copyCheck('Actual study gain');await closeModal();
 const before=await state();await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');s=await state();
 assert.deepEqual(s.party.map(build),before.party.map(build));assert.deepEqual(s.adventure,before.adventure);assert.deepEqual(s.chapterJournal,before.chapterJournal);assert.deepEqual(items(s),items(before));assert.equal(s.silver,266);
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const file=h.output+'pinocchio-trained-save.json';await (await waiting).saveAs(file);await closeModal();
 report.checkpoint={path:'src/Game.Web/test-results/pinocchio-trained-save.json',sha256:createHash('sha256').update(await readFile(file)).digest('hex')};report.progressVerified=true;report.englishCopyVerified=report.copyGaps.length===0;
 pass('Newly recruited Pinocchio uses owned gear and an unassigned guide, actually fights in slot two, earns study XP and 10 silver, and the seven-member party build persists without advancing a story milestone');
}catch(e){failure=e;}
await finish(failure);
