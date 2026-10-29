import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

// Review genuine gameplay exports without replaying combat or granting progress.
const proof=JSON.parse(await readFile('src/Game.Web/test-results/italy-energy-allocation.json','utf8'));
assert.ok(proof.passed&&proof.progressVerified);
assert.equal(proof.soloOutcome.outcome,'win');
for(const p of [proof.ready,proof.checkpoint])
 assert.equal(createHash('sha256').update(await readFile(p.path)).digest('hex'),p.sha256);
const h=await createHarness('italy-allocation-review',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;
report.sources=[proof.ready,proof.checkpoint];
report.method='Read-only UI review of the genuine prepared and completed Normal Italy exports. No combat, training, gear change, reward injection or story advance. Save/load uses the isolated browser profile.';
const build=({hp,mp,...c})=>c;
const inventory=s=>s.inventory.map(i=>({id:i.id,entryNumber:i.entryNumber,count:i.count}));
async function unchanged(before){
 const after=await state();
 assert.deepEqual(after.adventure,before.adventure);
 assert.deepEqual(after.chapterJournal,before.chapterJournal);
 assert.deepEqual(after.party,before.party);
 assert.deepEqual(inventory(after),inventory(before));
 assert.equal(after.silver,before.silver);
}
async function load(p){
 await closeModal();await page.locator('#import-file').setInputFiles(p.path);
 await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await load(proof.ready);let before=await state();assert.equal(before.silver,23);
 await click('[data-action="guide"]');await page.locator('[data-guide-section="resources"] summary').click();
 const resources=await page.locator('[data-guide-section="resources"]').innerText();
 for(const text of ['grants 2 Rage','spends Energy too','enough remains for your next attack','enemies may act next','potion also ends the acting character'])assert.ok(resources.includes(text),text);
 assert.doesNotMatch(resources,/[\u3400-\u9fff]/);
 await noOverflow('Actual Italy preparation help at 390px');await page.screenshot({path:h.output+'italy-allocation-resource-help.png'});
 await click('[data-player-guide] [data-action="quests"]');await closeModal();await unchanged(before);
 pass('The real prepared party can read Energy/Rage and potion-turn costs and follow Goals without spending resources or advancing time');

 await load(proof.checkpoint);before=await state();
 assert.equal(before.silver,256);assert.equal(before.adventure.morality,56);assert.equal(before.party.length,7);
 assert.ok(before.roster.some(c=>c.definitionId==='袁冠南'&&c.name==='Pinocchio'&&c.level===15));
 assert.ok(!before.roster.some(c=>c.definitionId==='萧中慧'));
 await click('[data-action="quests"]');
 const completed=page.locator('[data-journey-story="italy-complete"]');await completed.locator('summary').click();
 report.completionCopy=await completed.innerText();
 for(const text of ['recruited Pinocchio','Refusing the seals added 3 Morality','winning the final fight added 3 more','she does not join','Select Pinocchio in Party'])assert.ok(report.completionCopy.includes(text),text);
 assert.doesNotMatch(report.completionCopy,/[\u3400-\u9fff]/);
 await noOverflow('Actual completed Italy goals at 390px');await completed.scrollIntoViewIfNeeded();
 await page.screenshot({path:h.output+'italy-allocation-complete-goals.png'});
 await page.locator('.journey-full > summary').click();
 const title=page.locator('[data-achievement-id="仁者无敌"]');
 assert.equal(await title.locator('strong').innerText(),'Kindness Prevails');
 assert.ok((await title.innerText()).includes('Pinocchio joined your party.'));
 report.ownedTitleCards=await page.locator('[data-achievement-id]').allInnerTexts();
 for(const text of report.ownedTitleCards)assert.doesNotMatch(text,/[\u3400-\u9fff]/);
 await closeModal();await click('[data-action="history"]');
 report.history=await page.locator('.activity-list p').allInnerTexts();
 assert.ok(report.history.includes('Title unlocked: Kindness Prevails'));
 await noOverflow('Actual victory title history at 390px');await closeModal();await unchanged(before);
 pass('Actual victory shows the two distinct Morality gains, Pinocchio recruitment, non-recruitable Blue Fairy and the earned title in English');

 await click('[data-action="party"]');
 const companion=page.locator('[data-roster-id="袁冠南"]');
 assert.ok((await companion.innerText()).includes('Pinocchio'));
 await companion.locator('.pr-shortcuts [data-panel="cultivation"]').click();await ready();
 await page.locator('[data-adventurer-sheet]').waitFor();
 const managed=(await state()).managedCharacter;assert.equal(managed.definitionId,'袁冠南');assert.equal(managed.level,15);
 report.newCompanion={id:managed.definitionId,name:managed.name,level:managed.level,skills:managed.skills};
 assert.doesNotMatch(await page.locator('[data-adventurer-sheet]').innerText(),/[\u3400-\u9fff]/);
 await noOverflow('Real Pinocchio study shortcut at 390px');await page.screenshot({path:h.output+'italy-allocation-pinocchio-study.png'});
 await closeModal();await unchanged(before);
 pass('Party → Pinocchio → Study opens his actual character sheet without assigning guides or changing his build');

 await click('[data-action="save"]');await page.reload();
 await page.locator('[data-action="load"]').waitFor({timeout:120000});
 // When the latest slot IS the manual slot, the title offers Continue only.
 // A separate manual button appears only when a different newer slot exists.
 report.restoreButton=await page.locator('[data-action="load-manual"]').count()?'load-manual':'load';
 await click(`[data-action="${report.restoreButton}"]`);
 const restored=await state();assert.equal(restored.silver,before.silver);
 assert.deepEqual(restored.adventure,before.adventure);assert.deepEqual(restored.chapterJournal,before.chapterJournal);
 assert.deepEqual(restored.party.map(build),before.party.map(build));assert.deepEqual(inventory(restored),inventory(before));
 report.restored={silver:restored.silver,morality:restored.adventure.morality,party:restored.party.map(c=>({name:c.name,level:c.level})),resourceBoundary:'Current Health/Energy are excluded from exact recovery; existing map/load restoration is unchanged.'};
 pass('Actual manual save/load retains the completed route, seven party builds, inventory, Morality and money; current-resource restoration remains a separate known boundary');
}catch(e){failure=e;}
await finish(failure);
