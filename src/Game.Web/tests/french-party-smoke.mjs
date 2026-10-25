import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const directory=resolve(root,process.env.FRENCH_REPORT_DIR||'artifacts/french-party-observed');
const proof=JSON.parse(await readFile(resolve(directory,'report.json'),'utf8'));
const required=['主角','陈家洛','霍青桐'];
const h=await createHarness(process.env.GAME_WEB_REPORT||'french-party',
  {viewport:{width:390,height:844}},{trace:false});
const {page,report,click,ready,state,closeModal,noOverflow,pass,finish}=h;
await page.addInitScript(()=>localStorage.setItem('jyxr-fantasy-worlds.preferences.v1',JSON.stringify({
  battleSpeed:4,musicVolume:0,effectsVolume:0,reducedMotion:true
})));
let failure;

async function load(name){
  await closeModal();
  const path=resolve(directory,name+'.json'),raw=await readFile(path);
  assert.equal(createHash('sha256').update(raw).digest('hex'),proof.checkpoints[name],
    'The browser must use an intact export from the observed ordinary playthrough');
  await page.locator('#import-file').setInputFiles(path);
  await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
  await ready();
}

async function visit(id){
  if(await page.locator('#destination-search').count())await page.locator('#destination-search').fill('');
  await click(`[data-action="interact"][data-id="${id}"]`);
}

try{
  await page.goto(report.baseURL);
  await page.locator('[data-action="new"]').waitFor({timeout:120000});
  await load('france-finale-ready');
  const before=await state();
  assert.equal(before.map.id,'回族部落');
  const oldFront=before.party.slice(0,3).map(c=>c.definitionId);
  assert.ok(!required.every(id=>oldFront.includes(id)),
    'This regression needs a genuine queue whose first three are not the required group');
  assert.ok(before.roster.some(c=>c.definitionId==='霍青桐'));
  assert.ok(!before.roster.some(c=>c.definitionId==='陈家洛'),
    "D'Artagnan must join through the existing prebattle story command");
  await noOverflow('France finale entrance at 390px');

  await visit('张召重');
  const dialogue=[];
  for(let count=0;count<40&&(await state()).phase==='dialogue';count++){
    const line=await page.locator('[data-testid="dialogue-text"]').innerText();
    assert.doesNotMatch(line,/[\u3400-\u9fff]/,'The authored English finale has no Chinese dialogue residue');
    dialogue.push(line);
    await click('[data-action="next"]');
  }
  const battleState=await state();
  assert.equal(battleState.phase,'battle');
  assert.equal(battleState.battle.id,'庖丁解牛_战斗');
  assert.ok(dialogue.length>=3,'The actual map interaction must play the story before deployment');
  const deployed=battleState.battle.units.filter(u=>u.team===1).map(u=>u.definitionId);
  assert.deepEqual([...deployed].sort(),[...required].sort(),
    'Required companions must take the three real battle slots regardless of their queue position');
  assert.ok(battleState.roster.some(c=>c.definitionId==='陈家洛'));
  assert.equal(battleState.battle.outcome,'ongoing');
  pass('Visible map and dialogue controls recruit D’Artagnan and deploy the actual required French team',
    {oldFront,deployed,dialogueLines:dialogue.length});
  await noOverflow('Required French battle at 390px');
  await page.screenshot({path:h.output+'french-required-party-mobile.png'});

  await click('[data-action="party"]');
  for(const character of battleState.party){
    const status=await page.locator(`[data-roster-id="${character.id}"] .pr-position`).textContent();
    assert.equal(status,required.includes(character.definitionId)?'In this battle':'Not in this battle',
      'The party page must identify actual participants rather than infer them from queue order');
  }
  await noOverflow('Actual deployment badges at 390px');
  pass('Party cards distinguish actual battle participants from other traveling companions');
  await closeModal();

  assert.equal(proof.passed,true,'End-state verification requires the completed ordinary native trial');
  await load('france-complete');
  const ending=await state();
  for(const id of ['霍青桐','陈家洛'])assert.ok(ending.roster.some(c=>c.definitionId===id));
  assert.ok(ending.inventory.some(i=>i.id==='柔云剑法秘籍'));
  assert.ok(ending.chapterJournal.completedStories.includes('书剑恩仇录_庖丁解牛胜'));
  await click('[data-action="quests"]');
  await page.locator('[data-journey-story="france-complete"] summary').click();
  const summary=await page.locator('[data-journey-story="france-complete"]').innerText();
  assert.match(summary,/Milady/);
  assert.match(summary,/Artagnan/);
  assert.doesNotMatch(summary,/[\u3400-\u9fff]/);
  await noOverflow('France ending guide at 390px');
  pass('The intact native ending imports with both companions, the original manual reward, and the saved chapter ending',
    {scope:'Native trial played the complete fights; this browser test verifies real entry, deployment, UI, and ending import.'});
}catch(error){failure=error;}
await finish(failure);
