import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const dir=process.env.PLAYTHROUGH_CHECKPOINTS;assert.ok(dir);
const file=dir+'/italy-trained.json',raw=await readFile(file),manifest=JSON.parse(await readFile(dir+'/manifest.json','utf8'));
assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.find(x=>x.name==='italy-trained').sha256);
const h=await createHarness('study-handoff',{viewport:{width:390,height:844}},{trace:false});
const {page,report,click,ready,state,pass,noOverflow,finish}=h;let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 await click('[data-action="loadout"]');
 const book=page.locator('.as-material[data-item-id="武当心法抄本"]');
 assert.match(await book.locator('.as-kicker').textContent(),/In use by a companion/);
 const owner=(await state()).inventory.find(i=>i.id==='武当心法抄本').training.assignedTo[0];
 await click(`.as-material[data-item-id="武当心法抄本"] [data-action="manage-character"][data-id="${owner.id}"]`);
 assert.equal((await state()).managedCharacter.id,owner.id);assert.equal(await page.evaluate(()=>document.activeElement.id),'as-study');
 const skills=(await state()).managedCharacter.internalSkills;
 await click('[data-action="clear-cultivation"]');assert.deepEqual((await state()).managedCharacter.internalSkills,skills);
 await page.locator('#managed-character').selectOption('主角');await ready();
 assert.ok((await state()).inventory.find(i=>i.id==='武当心法抄本').canCultivate);
 assert.match(await book.locator('.as-kicker').textContent(),/Ready to study/);
 const locked=page.locator('.as-material[data-item-id="柔云剑法秘籍"]');
 assert.match(await locked.innerText(),/Requires Swords 60/);assert.doesNotMatch(await locked.innerText(),/[\u3400-\u9fff]/);
 await noOverflow('Study ownership and requirements at 390px');await page.screenshot({path:h.output+'study-handoff-mobile.png'});
 pass('Owned copy links to the actual learner; pausing preserves learned ranks and releases the same copy; unmet stats appear in English');
}catch(e){failure=e;}
await finish(failure);
