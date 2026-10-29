import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/denmark-remedy.json','utf8'));
assert.ok(proof.passed&&proof.progressVerified);assert.ok(proof.battles.some(b=>b.id==='苗人凤居.苗人凤被毒.战斗'&&b.outcome==='win'));
const find=n=>{const p=proof.checkpoints.find(p=>p.path.endsWith(n+'.json'));assert.ok(p,n);return p;};
const maps=[proof.source,proof.beforeRescue,find('denmark-remedy-after-battle-1-save'),...[5,6,7,8,9].map(n=>find('denmark-remedy-before-guide-'+n+'-save'))];
for(const p of [...maps,proof.checkpoint])assert.equal(createHash('sha256').update(await readFile(p.path)).digest('hex'),p.sha256);
const h=await createHarness('denmark-remedy-review',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
report.sources=[...maps,proof.checkpoint];report.method='Read-only final copy review of genuine journey exports: pre-letter, real rescue outcome, four forest junctions, the garden and Gerda recruitment. No repeat battle, travel, chance rolls, training, medicine or kill/spare choice. Save/load in an isolated profile preserves the real nine-person outcome.';
const build=({hp,mp,...c})=>c,items=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));
async function load(p){await closeModal();await page.locator('#import-file').setInputFiles(p.path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();}
async function unchanged(before){const after=await state();assert.deepEqual(after.party,before.party);assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.deepEqual(items(after),items(before));assert.equal(after.silver,before.silver);}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});report.mapChecks=[];
 for(const p of maps){
  await load(p);const before=await state(),text=await page.locator('#app').innerText();assert.doesNotMatch(text,/[\u3400-\u9fff]/,before.map.id);
  const action=page.locator('[data-guidance] [data-next-step]');assert.equal(await action.count(),1);const box=await action.boundingBox(),nav=await page.locator('.system-nav').boundingBox();assert.ok(box.height>=44&&box.y+box.height<=nav.y,before.map.id+' first-screen action');
  report.mapChecks.push({source:p,map:before.map.id,nextId:await action.getAttribute('data-id')});await noOverflow('Final '+before.map.name+' map and next step');await unchanged(before);
 }
 pass('Actual pre-letter, rescue, forest and garden checkpoints show final English hints and actionable first-screen guide buttons without moving or rerolling encounters');
 await load(proof.checkpoint);const before=await state();assert.equal(before.party.length,9);assert.equal(before.silver,296);assert.equal(before.adventure.morality,56);
 assert.ok(!before.inventory.some(i=>i.id==='七星海棠'));await click('[data-action="quests"]');await page.locator('[data-journey-story="denmark-gerda-joined"] > summary').click();
 report.helpCopy=await page.locator('[data-journey-story="denmark-gerda-joined"]').innerText();for(const t of ['Nightshade Blossom','joining the party does not cure him','not the whole Denmark story'])assert.ok(report.helpCopy.includes(t),t);
 await page.locator('.journey-full > summary').click();await page.locator('.journey-journal > summary').click();report.journal=await page.locator('.journey-full').innerText();assert.ok(report.journal.includes('Gerda joined'));assert.ok(report.journal.includes('Nightshade Blossom'));assert.doesNotMatch(report.journal,/[\u3400-\u9fff]/);await closeModal();await unchanged(before);
 pass('Real Gerda recruitment keeps the champion uncured, the ingredient unowned and the journal clear about the next Nightshade lead');
 await click('[data-action="party"]');await click('[data-roster-id="程灵素"] [data-panel="cultivation"]');const s=await state(),g=s.managedCharacter;
 assert.equal(g.level,4);assert.equal(g.hp,250);assert.equal(g.mp,400);assert.equal(g.cultivation,null);assert.ok(g.equipment.every(e=>!e.item));assert.equal(g.externalSkills.find(k=>k.id==='黑血神针').level,1);assert.ok(g.skills.find(k=>k.id==='解毒').description.includes('In battle'));
 await noOverflow('Actual untrained Gerda build after copy correction');await page.screenshot({path:h.output+'denmark-remedy-gerda-reviewed.png'});
 await click('[data-action="character"]');report.traits=[];
 for(const [id,name,parts] of [['毒圣','Poison Lore',['5 levels','4 extra turns']],['妙手仁心','Remedy Expert',['item cooldowns','still ends']],['灵心慧质','Careful Aim',['friendly-fire damage']]]){
  const card=page.locator(`[data-talent-id="${id}"]`);await card.locator('summary').click();assert.equal(await card.locator('summary').innerText(),name);const text=await card.innerText();for(const t of parts)assert.ok(text.includes(t),t);assert.ok(!text.includes('Talent notes'));report.traits.push({id,text});
 }
 assert.equal(s.pack.displayCatalog.byCategory.items['妙手仁心'].name,"Healer's Handbook");assert.equal(s.pack.displayCatalog.byCategory.items['灵心慧质'].name,"Quick Learner's Notes");
 assert.doesNotMatch(await page.locator('#game-modal').innerText(),/[\u3400-\u9fff]/);await noOverflow('Gerda talents retain their own names and actual descriptions');await page.screenshot({path:h.output+'denmark-remedy-gerda-talents-reviewed.png'});await closeModal();await unchanged(before);
 pass('Gerda’s three actual talents have distinct English descriptions and do not fall back to same-ID guide books; no training or combat effect is triggered by inspection');
 const saveBefore=await state();await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');const after=await state();
 assert.deepEqual(after.party.map(build),saveBefore.party.map(build));assert.deepEqual(after.adventure,saveBefore.adventure);assert.deepEqual(after.chapterJournal,saveBefore.chapterJournal);assert.deepEqual(items(after),items(saveBefore));assert.equal(after.silver,296);
 await click('[data-action="inventory"]');const waiting=page.waitForEvent('download');await click('[data-action="download-save"]');const file=h.output+'denmark-remedy-complete-save.json';await (await waiting).saveAs(file);await closeModal();
 report.checkpoint={path:'src/Game.Web/test-results/denmark-remedy-complete-save.json',sha256:createHash('sha256').update(await readFile(file)).digest('hex')};const raw=JSON.parse(await readFile(file)),base=JSON.parse(await readFile(proof.source.path));
 const mainIds=save=>save.game.storyState.completedStoryIds.filter(id=>id.startsWith('mainStory_')).sort();
 assert.deepEqual(mainIds(raw),mainIds(base));report.originalMainStoryIds=mainIds(raw);
 assert.deepEqual(raw.game.worldTriggerState,base.game.worldTriggerState);assert.equal(raw.browserSaveVersion,base.browserSaveVersion);assert.equal(raw.game.version,base.game.version);assert.ok(!raw.game.storyState.completedStoryIds.some(id=>id.startsWith('雪山飞狐_阎基居.七星海棠')));report.worldTriggerState=raw.game.worldTriggerState;report.progressVerified=true;
 pass('Final manual save/load and export keep nine builds, real income, original save versions and world triggers, with no ingredient encounter or kill/spare flag; current-resource recovery remains unchanged');
}catch(e){failure=e;}
await finish(failure);
