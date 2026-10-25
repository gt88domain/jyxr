import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const root=fileURLToPath(new URL('../../../artifacts/',import.meta.url));
const heroine=JSON.parse(await readFile(root+'spanish-heroine-observed/report.json','utf8'));
const knight=JSON.parse(await readFile(root+'spanish-knight-observed/report.json','utf8'));
assert.ok(heroine.passed&&knight.passed);
const h=await createHarness(process.env.GAME_WEB_REPORT||'spanish-windmill',{viewport:{width:390,height:844}},{trace:false});
const {page,report,click,ready,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({battleSpeed:4,musicVolume:0,effectsVolume:0,reducedMotion:true})));
let failure;
async function load(folder,name,proof){
 await closeModal();const path=root+folder+'/'+name+'.json',raw=await readFile(path);
 assert.equal(createHash('sha256').update(raw).digest('hex'),proof.checkpoints[name]);
 await page.locator('#import-file').setInputFiles(path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
}
async function visit(id){
 if(await page.locator('#destination-search').count())await page.locator('#destination-search').fill('');
 await click(`[data-action="interact"][data-id="${id}"]`);
}
async function dialogues(){
 const lines=[];
 for(let n=0;n<40;n++){
  const s=await state();if(s.phase!=='dialogue')return lines;
  const text=await page.locator('[data-testid="dialogue-text"]').innerText();
  assert.doesNotMatch(text,/[\u3400-\u9fff]/);lines.push(text);await click('[data-action="next"]');
 }assert.fail('Dialogue did not settle');
}
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await load('spanish-heroine-observed','start',heroine);
 await visit('哈萨克部落');await visit('李文秀');
 const meeting=await dialogues();assert.ok(meeting.some(t=>t.includes('Aldonza')));assert.ok(meeting.some(t=>t.includes('supplies')));
 assert.doesNotMatch(meeting.join(' '),/my parents|my teacher|Cardenio|Roque/);
 pass('Real map interactions introduce Aldonza/Dulcinea and missing wagons without the old family plot');
 await load('spanish-heroine-observed','spain-ready',heroine);
 let encounter=[];
 for(let n=0;n<30;n++){
  await visit('高昌迷宫');encounter=await dialogues();if((await state()).phase==='battle')break;
  await visit('返回');
 }
 const b=(await state()).battle;assert.ok(b);assert.equal(b.name,'The Windmill Thief');
 assert.ok(b.units.some(u=>u.definitionId==='瓦耳拉齐'&&u.name==='Gines de Pasamonte'));
 assert.ok(encounter.some(t=>t.includes('stealing spellbooks')));
 assert.doesNotMatch(await page.locator('#app').innerText(),/我方|对手|请选择走位格|内容载入/);
 pass('Original chance gate reaches the real warehouse fight; Gines is the thief, not the trainer in disguise');
 await load('spanish-heroine-observed','spain-complete',heroine);
 const d=await state();assert.ok(d.roster.some(c=>c.definitionId==='李文秀'));
 await click('[data-action="quests"]');await page.locator('[data-journey-story="dulcinea-ending"] summary').click();
 const ending=await page.locator('[data-journey-story="dulcinea-ending"]').innerText();assert.match(ending,/supplies are going home/);assert.doesNotMatch(ending,/teacher|parents|died/);
 await noOverflow('New heroine ending at 390px');await closeModal();
 await load('spanish-knight-observed','knight-ending',knight);
 const k=await state();assert.ok(k.roster.some(c=>c.definitionId==='陈达海'));assert.ok(!k.roster.some(c=>c.definitionId==='李文秀'));assert.equal(k.adventure.morality,48);
 const book=k.inventory.find(i=>i.id==='河岳英灵集');assert.ok(book);assert.match(book.name,/Amadis of Gaul/);assert.equal(book.canEquip,false);assert.equal(book.canUse,false);
 await click('[data-action="inventory"]');assert.match(await page.locator('#game-modal').innerText(),/Amadis of Gaul/);await noOverflow('Recovered novel in the real inventory');await closeModal();
 await click('[data-action="quests"]');await page.locator('[data-journey-story="knight-ending"] summary').click();
 assert.match(await page.locator('[data-journey-story="knight-ending"]').innerText(),/slot two/);await noOverflow('Knight study reminder at 390px');await closeModal();
 pass('Real ending saves preserve recruitment, reward types, Morality, and current chapter guidance');
 await page.screenshot({path:h.output+'spanish-windmill-mobile.png'});
}catch(e){failure=e;}
await finish(failure);
