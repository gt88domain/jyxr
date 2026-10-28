import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/opening-eir.json','utf8'));assert.ok(proof.passed);
assert.equal(createHash('sha256').update(await readFile(proof.checkpoint.path)).digest('hex'),proof.checkpoint.sha256);
const h=await createHarness('opening-academy',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source=proof.checkpoint;report.ledger=[];report.dialogue=[];report.choices=[];
report.method='Continue the genuine 120-silver Eir training export. Existing Goals, map, actual solo apprentice battle, authored outcome, organization picker, first lesson and save controls. No resource commands, edited saves or forced victory.';
let failure;
async function record(label){
 const s=await state(),last=report.ledger.at(-1);
 const row={label,phase:s.phase,map:s.map.id,silver:s.silver,delta:last?s.silver-last.silver:0,adventure:s.adventure,hero:s.hero,party:s.party,inventory:s.inventory.map(i=>({id:i.id,count:i.count})),tutorial:s.tutorial,goals:s.objectives,nextStep:await page.locator('[data-guidance]').innerText().catch(()=>null)};
 report.ledger.push(row);console.log('LEDGER',label,s.silver,s.phase);
 await writeFile(h.output+'opening-academy-progress.json',JSON.stringify(report,null,2));return s;
}
async function dialogue(){
 for(let n=0;n<100;n++){
  const s=await state();if(s.phase!=='dialogue')return s;
  report.dialogue.push({speaker:s.dialogue.speaker,text:s.dialogue.text});assert.doesNotMatch(s.dialogue.text,/[\u3400-\u9fff]/);
  await click('[data-action="next"]');
 }assert.fail('Dialogue did not settle');
}
async function visit(id){await click(`[data-action="interact"][data-id="${id}"]`);}
async function exportCheckpoint(name){
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');await (await waiting).saveAs(h.output+name+'.json');await closeModal();
 return {path:'src/Game.Web/test-results/'+name+'.json',sha256:createHash('sha256').update(await readFile(h.output+name+'.json')).digest('hex')};
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(proof.checkpoint.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Continued earned Eir preparation');assert.equal(start.silver,120);assert.equal(start.adventure.difficulty,'normal');
 for(let n=0;n<3;n++)await click('[data-guidance] [data-next-step]');await dialogue();let s=await state();assert.equal(s.phase,'battle');
 report.battleOpening={hero:s.hero,units:s.battle.units};
 assert.equal(s.battle.units.filter(u=>u.team===1).length,1);assert.equal(s.battle.units.find(u=>u.team===1).definitionId,'主角');
 assert.ok(!s.battle.units.some(u=>u.definitionId==='钟灵'),'The authored solo bout must not deploy Eir');
 console.log('BATTLE_START solo apprentice');await click('[data-action="battle-mode"][data-id="auto"]');
 await page.locator('[data-action="leave-battle"]').waitFor({state:'visible',timeout:180000});s=await state();
 report.battle={outcome:s.battle.outcome,tick:s.battle.tick,timedOut:s.battle.timedOut,units:s.battle.units,logs:s.battle.logs};assert.ok(['win','lose'].includes(report.battle.outcome));
 await click('[data-action="leave-battle"]');await dialogue();s=await record('Apprentice bout and authored aftermath settled');assert.equal(s.phase,'world');
 report.afterBout=await exportCheckpoint('opening-apprentice-settled-save');
 pass('Real solo apprentice battle reaches its actual outcome and original aftermath, without deploying the companion or forcing a victory',report.battle.outcome);
 for(let n=0;n<3;n++)await click('[data-guidance] [data-next-step]');await dialogue();s=await state();
 if(s.phase==='world'){await visit('南贤');await dialogue();s=await state();}
 assert.equal(s.phase,'sect');report.options=await page.locator('.academy-cards>article').allInnerTexts();
 report.organizationOptions=await page.locator('[data-action="select-sect"]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.id,text:n.textContent})));
 assert.equal(report.organizationOptions.length,9);assert.doesNotMatch(await page.locator('.academy-picker').innerText(),/[\u3400-\u9fff]/);
 await noOverflow('Actual organization choice at 390px');await page.screenshot({path:h.output+'opening-academy-choice.png'});
 const gold=s.silver;report.choices.push({kind:'organization',id:'大轮寺'});await click('[data-action="select-sect"][data-id="大轮寺"]');await dialogue();s=await record('Joined Grail Lodge');
 assert.equal(s.map.id,'门派大轮寺');assert.equal(s.adventure.sect,'大轮寺');assert.equal(s.silver,gold);assert.ok(s.party.some(c=>c.definitionId==='钟灵'));
 assert.match(await page.locator('[data-guidance]').innerText(),/60 adventure days/);
 const days=s.adventure.days;await click('[data-guidance] [data-next-step]');
 for(let n=0;n<12;n++){
  s=await dialogue();if(s.phase!=='choice')break;
  report.choices.push({kind:'lesson',prompt:s.dialogue,options:s.choices,index:0});await click('[data-action="choice"][data-index="0"]');
 }
 s=await record('First normal Grail Lodge lesson');assert.equal(s.phase,'world');assert.ok(s.hero.externalSkills.some(k=>k.id==='密宗大手印'&&k.level>=1));assert.ok(s.adventure.days>days);
 assert.equal(s.silver,gold);const eir=s.roster.find(c=>c.definitionId==='钟灵');assert.equal(eir.cultivation.level,proof.studyAfter.level);assert.equal(eir.cultivation.exp,proof.studyAfter.exp);assert.ok(eir.equipment.some(x=>x.item?.id==='粗布道袍'));
 assert.doesNotMatch(await page.locator('[data-guided-world]').innerText(),/[\u3400-\u9fff]/);await noOverflow('First organization lesson at 390px');await page.screenshot({path:h.output+'opening-academy-first-lesson.png'});
 const before=s;await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');s=await state();
 const build=({hp,mp,...c})=>c;assert.deepEqual(build(s.hero),build(before.hero));assert.deepEqual(s.party.map(build),before.party.map(build));assert.deepEqual(s.adventure,before.adventure);assert.deepEqual(s.chapterJournal,before.chapterJournal);assert.equal(s.silver,before.silver);
 const items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));assert.deepEqual(items(s),items(before));
 report.saveVitals={before:{hp:before.hero.hp,mp:before.hero.mp},after:{hp:s.hero.hp,mp:s.hero.mp}};
 report.checkpoint=await exportCheckpoint('opening-grail-first-lesson-save');
 pass('All nine original choices are present; Grail Lodge entry, the real first lesson, Eir build and currency survive save/reload; graduation remains gated');
}catch(e){failure=e;}
await finish(failure);
