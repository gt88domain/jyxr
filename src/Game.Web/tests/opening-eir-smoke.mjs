import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const proof=JSON.parse(await readFile('src/Game.Web/test-results/opening-ledger.json','utf8'));assert.ok(proof.passed);
assert.equal(createHash('sha256').update(await readFile(proof.checkpoint.path)).digest('hex'),proof.checkpoint.sha256);
const h=await createHarness('opening-eir',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,battleMode:'manual',musicVolume:0,effectsVolume:0,reducedMotion:true})));
report.source={report:'opening-ledger.json',checkpoint:proof.checkpoint};
report.method='Continue the unedited, genuinely earned 260-silver opening checkpoint. Visible turn-in, Eir recruitment, shop purchase, equipment, study, real practice and save controls only. No old trained checkpoint or resource commands.';
report.ledger=[];report.dialogue=[];report.checkpoints=[];let failure;
async function record(label){
 const s=await state(),prior=report.ledger.at(-1);
 const row={label,phase:s.phase,map:s.map.id,silver:s.silver,delta:prior?s.silver-prior.silver:0,adventure:s.adventure,
  hero:s.hero,party:s.party,inventory:s.inventory.map(i=>({id:i.id,name:i.name,count:i.count})),
  tutorial:s.tutorial,goals:s.objectives,nextStep:await page.locator('[data-guidance]').innerText().catch(()=>null)};
 report.ledger.push(row);console.log('LEDGER',label,s.silver,row.delta);
 await writeFile(h.output+'opening-eir-progress.json',JSON.stringify(report,null,2));return s;
}
async function dialogue(){
 for(let n=0;n<80;n++){
  const s=await state();if(s.phase!=='dialogue')return s;
  report.dialogue.push({speaker:s.dialogue.speaker,text:s.dialogue.text});await click('[data-action="next"]');
 }assert.fail('Dialogue did not settle');
}
async function visit(id){await click(`[data-action="interact"][data-id="${id}"]`);}
async function checkpoint(name){
 await closeModal();const before=await state();await click('[data-action="save"]');
 await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');const after=await state();
 // CharacterRecord persists builds, not transient CurrentHp/CurrentMp.
 // Record that existing boundary explicitly instead of claiming exact vitals.
 const build=({hp,mp,...c})=>c;
 assert.deepEqual(build(after.hero),build(before.hero),name+': hero build');
 assert.deepEqual(after.party.map(build),before.party.map(build),name+': party builds');
 for(const field of ['chapterJournal','adventure'])assert.deepEqual(after[field],before[field],name+': '+field);
 const resourceChanges=[];
 for(const c of before.party){
  const loaded=after.party.find(x=>x.id===c.id);assert.ok(loaded);
  if(c.hp!==loaded.hp||c.mp!==loaded.mp){
   resourceChanges.push({id:c.id,before:{hp:c.hp,mp:c.mp},after:{hp:loaded.hp,mp:loaded.mp}});
   assert.equal(loaded.hp,loaded.maxHp);assert.equal(loaded.mp,loaded.maxMp);
  }
 }
 const items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));
 assert.deepEqual(items(after),items(before),name+': owned item instances and quantities');
 assert.equal(after.silver,before.silver);assert.equal(after.map.id,before.map.id);
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');
 await (await waiting).saveAs(h.output+name+'.json');await closeModal();
 const result={path:'src/Game.Web/test-results/'+name+'.json',sha256:createHash('sha256').update(await readFile(h.output+name+'.json')).digest('hex'),resourceChanges};
 report.checkpoints.push(result);return result;
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(proof.checkpoint.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const start=await record('Continued genuine opening purchase');assert.equal(start.silver,260);assert.equal(start.adventure.difficulty,'normal');
 for(let n=0;n<3;n++)await click('[data-guidance] [data-next-step]');
 await dialogue();let s=await record('Reported supplies to Grimm');assert.equal(s.phase,'choice');assert.equal(s.map.id,'南贤居');
 assert.equal(s.silver,260);assert.equal(s.hero.maxHp,start.hero.maxHp+100);assert.equal(s.hero.maxMp,start.hero.maxMp+100);
 report.nextLessonChoice=await page.locator('body').innerText();await click('[data-action="choice"][data-index="0"]');await dialogue();
 s=await record('Accepted friendly apprentice assignment');assert.equal(s.phase,'world');
 await click('[data-action="history"]');const history=await page.locator('#game-modal').innerText();
 assert.match(history,/Rowan · Maximum Health \+100/);assert.match(history,/Rowan · Maximum Energy \+100/);assert.doesNotMatch(history,/\bmax_(?:hp|mp)\b/);
 await noOverflow('Actual turn-in reward history at 390px');await page.screenshot({path:h.output+'opening-eir-rewards.png'});await closeModal();
 await checkpoint('opening-delivered-save');pass('Real supply turn-in gives the original Health and Energy bonuses, preserves silver, and survives save/reload');
 if((await state()).map.id==='南贤居')await visit('返回');await visit('万劫谷');await visit('钟灵');await dialogue();
 assert.equal((await state()).phase,'choice');report.recruitmentChoice=await page.locator('body').innerText();
 await click('[data-action="choice"][data-index="0"]');await dialogue();s=await record('Eir joined after accepting the search');
 assert.equal(s.party.filter(c=>c.definitionId==='钟灵').length,1);assert.equal(s.party.find(c=>c.definitionId==='钟灵').name,'Eir');assert.equal(s.silver,260);
 await checkpoint('opening-eir-recruited-save');
 await click('[data-action="party"]');assert.doesNotMatch(await page.locator('#game-modal').innerText(),/[\u3400-\u9fff]/);await noOverflow('Eir recruitment and party at 390px');
 await page.screenshot({path:h.output+'opening-eir-party.png'});await closeModal();
 pass('The original search choice recruits Eir once without a recruitment fee; real party and save/reload preserve her');
 await visit('返回');await visit('洛阳');await visit('商店');s=await state();assert.equal(s.phase,'shop');
 const armor=s.shop.products.find(p=>p.itemId==='粗布道袍');assert.ok(armor?.canBuy);assert.equal(armor.price,150);
 await click(`[data-action="buy-item"][data-id="${armor.id}"]`);assert.equal((await state()).silver,110);await click('[data-action="close-shop"]');await record('Bought one Traveler Robe for Eir');
 await click('[data-action="loadout"]');const eir=(await state()).party.find(c=>c.definitionId==='钟灵');
 await page.locator('#managed-character').selectOption(eir.id);await ready();
 s=await state();assert.equal(s.managedCharacter.definitionId,'钟灵');
 const gear=s.inventory.find(i=>i.id==='粗布道袍');assert.ok(gear.canEquip);
 await click(`.as-spare-gear [data-action="equip-item"][data-entry-number="${gear.entryNumber}"]`);
 const book=(await state()).inventory.find(i=>i.id==='罗汉拳谱');assert.ok(book.canCultivate);
 await click(`.as-material [data-action="cultivate"][data-entry-number="${book.entryNumber}"]`);
 s=await state();const studyBefore=s.managedCharacter.cultivation;report.studyBefore=studyBefore;
 assert.equal(studyBefore.itemId,'罗汉拳谱');assert.equal(s.managedCharacter.equippedInternalSkillId,'基本内功');assert.ok(s.managedCharacter.equipment.some(x=>x.item?.id==='粗布道袍'));
 assert.doesNotMatch(await page.locator('#game-modal').innerText(),/[\u3400-\u9fff]/);await noOverflow('Eir equipment and study at 390px');await page.screenshot({path:h.output+'opening-eir-study.png'});await closeModal();
 await record('Eir equipped and assigned the free guide');
 await visit('返回');await visit('南贤居');await visit('结伴练习');await dialogue();s=await state();assert.equal(s.phase,'battle');
 assert.ok(s.battle.units.some(u=>u.team===1&&u.definitionId==='钟灵'));assert.equal(s.battle.units.filter(u=>u.team===1).length,2);
 await click('[data-action="battle-mode"][data-id="auto"]');await page.locator('[data-action="leave-battle"]').waitFor({state:'visible',timeout:180000});s=await state();
 report.practice={outcome:s.battle.outcome,tick:s.battle.tick,timedOut:s.battle.timedOut,units:s.battle.units};
 await click('[data-action="leave-battle"]');await dialogue();s=await record('Team practice settled');
 assert.equal(report.practice.outcome,'win','A loss must remain a real failure, not a completed practice goal');assert.equal(s.silver,120);
 const trained=s.roster.find(c=>c.definitionId==='钟灵');report.studyAfter=trained.cultivation;
 assert.ok(trained.cultivation.level>studyBefore.level||trained.cultivation.exp>studyBefore.exp);
 report.checkpoint=await checkpoint('opening-eir-trained-save');
 await click('[data-action="loadout"]');await page.locator('#managed-character').selectOption(eir.id);await ready();
 s=await state();assert.equal(s.managedCharacter.cultivation.itemId,'罗汉拳谱');assert.equal(s.managedCharacter.cultivation.level,trained.cultivation.level);assert.equal(s.managedCharacter.cultivation.exp,trained.cultivation.exp);
 assert.equal(s.managedCharacter.equippedInternalSkillId,'基本内功');assert.ok(s.managedCharacter.equipment.some(x=>x.item?.id==='粗布道袍'));
 await noOverflow('Earned Eir build after save/reload');await page.screenshot({path:h.output+'opening-eir-trained.png'});await closeModal();
 pass('A real two-person practice grants study XP and original silver; Eir equipment, mastery and study survive save/reload and export');
}catch(e){failure=e;}
await finish(failure);
