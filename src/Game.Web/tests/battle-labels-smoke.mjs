import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const directory=process.env.PLAYTHROUGH_CHECKPOINTS;
assert.ok(directory,'Set PLAYTHROUGH_CHECKPOINTS to the published genuine checkpoint directory');
const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));
const path=directory+'/france-finale-ready.json';
assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),manifest.find(x=>x.name==='france-finale-ready').sha256);
const h=await createHarness('battle-labels',{viewport:{width:390,height:844}},{trace:false});
const {page,report,ready,click,state,pass,noOverflow,finish}=h;
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 await click('[data-action="interact"][data-id="张召重"]');
 for(let n=0;n<30&&(await state()).phase==='dialogue';n++)await click('[data-action="next"]');
 const before=(await state()).battle;assert.equal(before.id,'庖丁解牛_战斗');assert.equal(before.units.length,16);
 assert.match(await page.locator('#battle-clock').innerText(),/Battle time.*3000/);
 await click('[data-action="battle-skills"]');
 assert.match(await page.locator('[data-skill-preparation-note]').innerText(),/Lower Energy cost conserves resources/);
 assert.match(await page.locator('.battle-skill-sheet').innerText(),/major power increase at rank 10/);
 await h.closeModal();
 await click('[data-action="inventory"]');
 assert.match(await page.locator('[data-potion-turn-cost]').innerText(),/Using a potion ends this character’s action/);
 await h.closeModal();
 assert.equal(await page.locator('.battle-roster[open]').count(),0);
 await page.locator('.battle-roster summary').click();
 for(const [i,u] of before.units.entries()){
  const row=page.locator(`[data-combatant-id="${u.id}"]`);
  assert.equal(await row.locator('b').textContent(),`#${i+1}`);
  assert.ok((await row.textContent()).includes(u.name));
 }
 for(const [width,height] of [[320,720],[390,844],[1440,900]]){
  await page.setViewportSize({width,height});await noOverflow(`Battle roster at ${width}px`);
 }
 const after=(await state()).battle;
 assert.deepEqual(after,before,'Reading the roster or resizing must not advance combat');
 await page.setViewportSize({width:390,height:844});await page.locator('.battle-roster summary').click();
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:h.output+'battle-labels-mobile.png'});
 pass('Real French battle: all 16 numbered names match the roster; inspecting and resizing preserve battle state');
}catch(e){failure=e;}
await finish(failure);
