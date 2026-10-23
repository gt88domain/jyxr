import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createHarness} from './ui-harness.mjs';

const folder=fileURLToPath(new URL('../../../artifacts/windrider-native/',import.meta.url));
const proof=JSON.parse(await readFile(folder+'report.json','utf8'));
assert.equal(proof.passed,true);
const h=await createHarness(process.env.GAME_WEB_REPORT||'white-horse-endings',{}, {trace:false});
const {page,report,output,state,click,ready,pass,closeModal,noOverflow,finish}=h;
report.scope='Load intact, normally played chapter endings; public UI/save contract, not a second full chapter playthrough.';
async function load(name){
 const path=folder+name+'.json';assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),proof.saves[name]);
 await page.locator('#import-file').setInputFiles(path);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 assert.equal((await state()).phase,'world');
}
async function party(name){
 await click('[data-action="party"]');
 const text=await page.locator('#game-modal').innerText();assert.ok(text.includes(name));assert.doesNotMatch(text,/[\u3400-\u9fff]/);
 await noOverflow('chapter ending party at 375px');await closeModal();
}
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.setViewportSize({width:375,height:812});await load('dulcinea-ending');
 let s=await state();assert.ok(s.party.some(c=>c.definitionId==='李文秀'&&c.name==='Dulcinea'));
 assert.ok(s.inventory.some(i=>i.id==='黑血神针秘籍'&&i.name==='Bloodthorn Bolt Scroll'));
 await party('Dulcinea');await click('[data-action="save"]');await page.reload();await page.locator('[data-action="load"]').waitFor({timeout:120000});await click('[data-action="load"]');
 s=await state();assert.ok(s.party.some(c=>c.definitionId==='李文秀'&&c.name==='Dulcinea'));assert.ok(s.inventory.some(i=>i.id==='黑血神针秘籍'));
 pass('normally played Dulcinea ending loads on the deployed game and survives browser save/reload');
 await load('knight-ending');s=await state();
 assert.ok(s.party.some(c=>c.definitionId==='陈达海'&&c.name==='Don Quixote'));
 assert.ok(!s.party.some(c=>c.definitionId==='李文秀'));
 assert.equal(s.adventure.morality,48);assert.ok(s.inventory.some(i=>i.id==='河岳英灵集'&&i.name==="Heroes' Almanac"));
 await party('Don Quixote');
 pass('alternate ending keeps the knight, original morality cost, almanac and different recruitment result');
 await page.screenshot({path:output+'white-horse-public-mobile.png',fullPage:true});
}catch(error){failure=error;}
await finish(failure);
