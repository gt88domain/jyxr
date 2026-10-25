import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const root=fileURLToPath(new URL('../../../artifacts/spanish-heroine-observed/',import.meta.url));
const proof=JSON.parse(await readFile(root+'report.json','utf8'));
const save=await readFile(root+'spain-complete.json');
assert.ok(proof.passed);
assert.equal(createHash('sha256').update(save).digest('hex'),proof.checkpoints['spain-complete']);
const h=await createHarness(process.env.GAME_WEB_REPORT||'party-mobile',{viewport:{width:390,height:844}},{trace:false});
const {page,report,click,ready,state,closeModal,noOverflow,pass,finish}=h;
let failure;
try {
  await page.goto(report.baseURL);await ready();
  await page.locator('#import-file').setInputFiles(root+'spain-complete.json');
  await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
  const original=await state(),companion=original.roster.find(c=>c.definitionId==='李文秀');
  assert.ok(companion);
  await click('[data-action="party"]');
  for(const [width,height] of [[320,720],[390,844],[768,1024],[1440,900]]) {
    await page.setViewportSize({width,height});
    await noOverflow(`Party at ${width}px`);
    const controls=page.locator('.pr-card').first().locator('.pr-shortcuts button');
    for(let i=0;i<3;i++) {
      const box=await controls.nth(i).boundingBox();
      assert.ok(box.height>=44,`Preparation button height: ${JSON.stringify(box)}`);
      assert.ok(box.y>=0&&box.y+box.height<height,`Preparation action must be on first screen: ${JSON.stringify(box)}`);
    }
  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.pr-group[open]').count(),0,'Secondary groups start collapsed');
  assert.match(await page.locator('.pr-hint').first().innerText(),/story battles may require specific companions/);
  pass('Phone first screen has three usable preparation actions; secondary information is folded');
  for(const section of ['as-gear','as-mastery','as-study']) {
    await click(`[data-roster-id="${companion.id}"] [data-section="${section}"]`);
    assert.equal((await state()).managedCharacter.id,companion.id);
    assert.equal(await page.locator('#managed-character').inputValue(),companion.id);
    assert.equal(await page.evaluate(()=>document.activeElement?.id),section);
    const box=await page.locator('#'+section).boundingBox();
    assert.ok(box.y>=0&&box.y<500,`${section} should be in view: ${JSON.stringify(box)}`);
    await noOverflow(`${section} shortcut at 390px`);
    await closeModal();await click('[data-action="party"]');
  }
  pass('Gear, mastery and study select the requested companion and focus the matching modern sheet section');
  const before=(await state()).party.map(c=>c.id),index=before.indexOf(companion.id);
  const target=index>1?index-1:index+1;
  await click(`[data-roster-id="${companion.id}"] [data-action="party-order"][data-index="${target}"]`);
  assert.equal((await state()).party[target].id,companion.id);
  assert.match(await page.locator(`[data-roster-id="${companion.id}"] .pr-position`).innerText(),new RegExp(`Party order ${target+1}`,'i'));
  await click(`[data-roster-id="${companion.id}"] [data-action="party-order"][data-index="${index}"]`);
  assert.deepEqual((await state()).party.map(c=>c.id),before);
  pass('Visible order controls change the real host party and preserve the hero first');
  await page.locator('#game-modal').evaluate(node=>node.scrollTop=0);
  await page.screenshot({path:h.output+'party-mobile.png'});
} catch(error) {failure=error;}
await finish(failure);
