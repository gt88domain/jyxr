import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const proof=JSON.parse(await readFile('src/Game.Web/test-results/petalstorm-manual-unlock.json','utf8'));assert.ok(proof.passed);
const file=proof.checkpoint.path,raw=await readFile(file);assert.equal(createHash('sha256').update(raw).digest('hex'),proof.checkpoint.sha256);
const h=await createHarness('player-guide',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,closeModal,noOverflow,pass,finish}=h;let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await click('[data-action="guide"]');await page.locator('[data-player-guide]').waitFor();assert.equal(await page.locator('.pg-shortcuts').count(),0);await closeModal();
 await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 const before=await state();await click('[data-action="guide"]');
 for(const button of await page.locator('.pg-shortcuts button').all()){
  const box=await button.boundingBox();assert.ok(box.height>=44&&box.y>=0&&box.y+box.height<=844,'Common guide shortcuts must be usable on the first viewport');
 }
 await page.screenshot({path:h.output+'player-guide-first-screen.png'});
 for(const id of ['resources','focus','combat','routes','saves'])await page.locator(`[data-guide-section="${id}"] summary`).click();
 const guide=await page.locator('[data-player-guide]').innerText();assert.doesNotMatch(guide,/[\u3400-\u9fff]/);
 for(const text of ['2 Rage','above Normal difficulty','Gauntlets','Swordsmanship','Heavy Weapons','Spells','Load manual save'])assert.ok(guide.includes(text));
 const after=await state();assert.deepEqual(after.adventure,before.adventure);assert.deepEqual(after.chapterJournal,before.chapterJournal);assert.deepEqual(after.hero,before.hero);
 await noOverflow('English guide at 390px');await page.screenshot({path:h.output+'player-guide-mobile.png'});
 await click('[data-player-guide] [data-action="quests"]');assert.ok(await page.locator('[data-journey-story]').count());await closeModal();
 await click('[data-action="guide"]');await click('[data-player-guide] [data-action="loadout"]');assert.ok(await page.locator('[data-adventurer-sheet]').count());await closeModal();
 pass('More → Player guide is reachable from title and map; English explanations and real Goals / Gear shortcuts preserve progression');
 await click('[data-action="interact"][data-id="结伴练习"]');for(let n=0;n<20&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');
 const battle=(await state()).battle;assert.ok(battle);await click('[data-action="guide"]');
 assert.ok(await page.locator('[data-player-guide] [data-action="battle-skills"]').count());await click('[data-player-guide] [data-action="battle-skills"]');
 assert.ok(await page.locator('.battle-skill-sheet').count());assert.doesNotMatch(await page.locator('#game-modal').innerText(),/[\u3400-\u9fff]/);await closeModal();
 assert.deepEqual((await state()).battle,battle);await noOverflow('Guide → live techniques at 390px');
 pass('Guide opens the real combat skill sheet without spending Energy, Rage or battle time');
}catch(e){failure=e;}
await finish(failure);
