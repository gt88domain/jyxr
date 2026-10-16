import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('touch-smoke');
const {page,output,report,pass,ready,visible,click,state,continueDialogue,noOverflow}=h;
let failure;
async function enterTreatment(){
  await page.locator('#import-file').setInputFiles(output+'touch-start-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  const available=async()=>await page.locator('[data-action="interact"][data-id="田青文"]').count()>0&&await page.locator('[data-action="interact"][data-id="田青文"]').isEnabled();
  for(let i=0;i<30&&!await available();i++){
    await click('[data-action="interact"][data-id="返回"]');await click('[data-action="interact"][data-id="破庙"]');
  }
  await click('[data-action="interact"][data-id="田青文"]');await continueDialogue();
  await click('[data-action="choice"][data-index="1"]');await continueDialogue();
  assert.equal((await state()).battle.id,'破庙战田青文');
  await click('[data-action="battle-speed"][data-id="4"]');await click('[data-action="battle-mode"][data-id="auto"]');
  await visible('[data-action="leave-battle"]');assert.equal((await state()).battle.outcome,'win');
  await click('[data-action="leave-battle"]');await continueDialogue();
  assert.equal((await state()).miniGame.id,'touch');await visible('[data-mini-action="start"]');
}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await enterTreatment();
  await page.waitForFunction(()=>document.querySelector('.touch-backdrop')?.naturalWidth>0);
  assert.equal(await page.locator('.touch-target').count(),8);
  await page.setViewportSize({width:375,height:812});await noOverflow('original story acupoint game at 375px');
  await page.screenshot({path:output+'original-touch-mobile.png',fullPage:true});
  await click('[data-mini-action="start"]');await click('[data-mini-action="pause"]');
  const age=Number(await page.locator('[data-target="1"]').getAttribute('data-age'));
  await page.waitForTimeout(250);
  assert.equal(Number(await page.locator('[data-target="1"]').getAttribute('data-age')),age,'Pausing must stop actual host timing');
  await click('[data-mini-action="pause"]');
  const rounds=new Set();const deadline=Date.now()+65_000;
  while(await page.locator('#training-area').count()&&Date.now()<deadline){
    rounds.add(Number(await page.locator('#training-area').getAttribute('data-round')));
    const targets=await page.locator('.touch-target:not(:disabled)').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.target,generation:n.dataset.generation,age:Number(n.dataset.age),rating:n.dataset.rating})).filter(t=>!t.rating&&t.age>=1.35&&t.age<1.6).sort((a,b)=>b.age-a.age));
    if(targets.length){const t=targets[0];await page.locator(`[data-target="${t.id}"][data-generation="${t.generation}"]`).click();}
    else await page.waitForTimeout(10);
  }
  assert.deepEqual([...rounds].sort(),[1,2,3,4,5]);
  await continueDialogue();let current=await state();
  assert.equal(current.phase,'world');assert.ok(current.party.some(c=>c.id==='田青文'));
  assert.ok(current.logs.some(s=>/点穴成绩 1\d\d \/ 120，救治成功/.test(s)));
  await click('[data-action="save"]');await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='当前世界的进度已保存。');
  await page.reload({waitUntil:'networkidle'});await visible('[data-action="load"]');await click('[data-action="load"]');
  assert.ok((await state()).party.some(c=>c.id==='田青文'));
  pass('original quest fight and five real timed point rounds recruit the source character and persist in browser save');
  await enterTreatment();await click('[data-mini-action="quit"]');await continueDialogue();current=await state();
  assert.equal(current.phase,'world');assert.ok(!current.party.some(c=>c.id==='田青文'));
  assert.ok(current.logs.some(s=>s.includes('此次未能成功')));
  pass('abandoning the actual story point game follows the original failure branch without recruitment');
}catch(e){failure=e;}
await h.finish(failure);
