import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';

const h=await createHarness('advanced-skills-smoke');
const {page,output,report,pass,ready,visible,click,state,continueDialogue,closeModal,noOverflow}=h;
let failure;
async function cell(point){
  const geometry=await page.locator('#board-viewport').getAttribute('data-board-geometry');assert.ok(geometry);
  const {cell,left,top}=JSON.parse(geometry);assert.ok(cell>0);
  await page.locator('#board-viewport canvas').click({position:{x:left+(point.x+.5)*cell,y:top+(point.y+.5)*cell}});await ready();
}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await visible('[data-action="new"]');
  await click('[data-action="settings"]');await page.locator('select[name="battleMode"]').selectOption('manual');await closeModal();
  await page.locator('#import-file').setInputFiles(output+'advanced-ui-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  await click('[data-action="interact"][data-id="燕小六"]');let current=await continueDialogue();
  if(current.phase==='world'){await click('[data-action="interact"][data-id="燕小六"]');current=await continueDialogue();}
  assert.equal(current.phase,'choice');await click('[data-action="choice"][data-index="0"]');current=await continueDialogue();
  const arena=current.choices.find(c=>c.text==='沙漠4v4');assert.ok(arena);
  await click(`[data-action="choice"][data-index="${arena.index}"]`);await click('[data-action="choice"][data-index="4"]');
  await visible('#combatants-form');
  for(const id of ['主角','郭靖','胡斐','田伯光'])await page.locator(`input[name="character"][value="${id}"]`).check();
  await page.locator('#combatants-form button[type="submit"]').click();await ready();
  current=await state();assert.equal(current.phase,'battle');assert.notEqual(current.battle.id,'browser_结伴练习');
  let healed=false,buffed=false;
  for(let turn=0;turn<100&&(!healed||!buffed);turn++){
    if(turn%10===0)console.log(`TURN ${turn} tick ${current.battle.tick}; HP ${current.battle.units.map(u=>`${u.name}:${u.hp}`).join(', ')}`);
    const actor=current.battle.units.find(u=>u.id===current.battle.activeUnitId);
    assert.equal(current.battle.outcome,'ongoing');
    if(actor.name===current.hero.name){
      const heal=current.battle.skills.find(s=>s.id==='华佗再世'&&s.available!==false);
      const target=current.battle.units.find(u=>u.team===1&&u.hp<u.maxHp&&current.battle.targets.some(t=>t.skillId==='华佗再世'&&t.x===u.x&&t.y===u.y));
      const strategy=current.battle.skills.find(s=>s.id==='武穆兵法'&&s.available!==false);
      let skill,point;
      if(!healed&&heal&&target){skill=heal;point=target;}
      else if(healed&&!buffed&&strategy){skill=strategy;point=actor;}
      else if(healed&&!buffed){skill=current.battle.skills.find(s=>s.id==='打鸡血'&&s.available!==false);point=actor;}
      if(skill){
        const sequence=Math.max(0,...current.battle.events.map(e=>e.sequence));const before=actor.mp;
        await click(`[data-action="skill"][data-id="${skill.id}"]`);await cell(point);current=await state();
        assert.ok(current.battle.events.some(e=>e.sequence>sequence&&e.kind==='SkillCast'&&e.skillId===skill.id));
        assert.ok(current.battle.units.find(u=>u.id===actor.id).mp<before);
        if(skill.id==='华佗再世'){assert.ok(current.battle.events.some(e=>e.sequence>sequence&&e.kind==='Healed'&&e.unitId===point.id&&e.amount>0));healed=true;pass('visible original 华佗 heals an enemy-inflicted wound through C# and consumes MP');}
        if(skill.id==='武穆兵法'){assert.ok(current.battle.units.filter(u=>u.team===1&&u.alive).every(u=>['攻击强化','防御强化','神速攻击'].every(id=>u.buffs.some(b=>b.id===id&&b.level===5))));buffed=true;pass('visible original 武穆 applies real team battle buffs after earned rage');}
        continue;
      }
    }
    await click('[data-action="rest"]');current=await state();
  }
  assert.ok(healed&&buffed,'Both original support effects must execute through visible controls');
  await page.setViewportSize({width:375,height:812});await noOverflow('original support skill battle at 375px');
  await page.screenshot({path:output+'advanced-support-mobile.png',fullPage:true});
}catch(error){failure=error;}
await h.finish(failure);
