import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';
import {checkWorldAtlas} from './world-atlas-checks.mjs';

const h=await createHarness(process.env.GAME_WEB_REPORT||'world-atlas');
const {page,report,click,state,continueDialogue,finish,pass}=h;
let failure;
try {
 await page.goto(report.baseURL);
 await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:120000});
 await click('[data-action="new"]');
 await page.locator('#hero-name').fill('Wren');
 await page.locator('#character-form button[type="submit"]').click();await h.ready();
 for(const [question,answer] of [3,3,0,0,0,0,0].entries())await click(`[data-action="creation-answer"][data-question="${question}"][data-index="${answer}"]`);
 await click('[data-action="creation-portrait"][data-id="头像.主角"]');await click('[data-action="creation-confirm"]');await continueDialogue();
 await click('[data-action="interact"][data-id="南贤"]');await continueDialogue();
 await click('[data-action="interact"][data-id="南贤居"]');
 await click('[data-action="interact"][data-id="南贤"]');await continueDialogue();
 await click('[data-action="choice"][data-index="0"]');await continueDialogue();
 const budget=(await state()).silver;
 await click('[data-action="choice"][data-index="0"]');await continueDialogue();
 assert.equal((await state()).silver,budget+300);
 await checkWorldAtlas(h);
 await click('[data-action="interact"][data-id="洛阳"]');
 assert.equal((await state()).map.id,'洛阳');
 await click('[data-action="interact"][data-id="返回"]');
 assert.equal((await state()).map.id,'大地图');
 assert.equal(await page.locator('.atlas-tab[data-atlas-region=""]').getAttribute('aria-pressed'),'true');
 pass('map reached and left through original tutorial/destination actions; filters reset on return');
} catch(error) {failure=error;}
await finish(failure);
