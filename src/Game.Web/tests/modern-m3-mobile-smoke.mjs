import assert from 'node:assert/strict';
import {createHarness} from './ui-harness.mjs';
const h=await createHarness(process.env.GAME_WEB_REPORT||'modern-m3-mobile-smoke',{viewport:{width:375,height:812},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const {page,output,report,pass,ready,state,continueDialogue,closeModal,noOverflow}=h;
await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.resolve();};});
if(process.env.GAME_WEB_INTERFACE==='classic')await page.addInitScript(()=>{const key='jyxr.preferences.v1';localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),interfaceStyle:'classic'}));});
let failure;
async function tap(selector){await page.locator(selector).filter({visible:true}).first().tap();await ready();}
async function cell(point){
  const board=page.locator('#board-viewport');await board.scrollIntoViewIfNeeded();
  // A tap during native inertial scrolling stops that gesture. Wait until the
  // viewport has settled before measuring the next deliberate board tap.
  await page.evaluate(()=>new Promise((resolve,reject)=>{let previous=scrollY,stable=0,frames=0;const check=()=>{stable=scrollY===previous?stable+1:0;previous=scrollY;if(stable>=6)return resolve();if(++frames>240)return reject(new Error('Viewport did not settle'));requestAnimationFrame(check);};requestAnimationFrame(check);}));
  const {cell,left,top}=JSON.parse(await board.getAttribute('data-board-geometry'));
  const box=await page.locator('#board-viewport canvas').boundingBox();
  return {x:box.x+left+(point.x+.5)*cell,y:box.y+top+(point.y+.5)*cell};
}
async function tapCell(point){const p=await cell(point);await page.touchscreen.tap(p.x,p.y);await ready();}
async function dock(){
  const sizes=await page.locator('.battle-mobile-dock button').evaluateAll(nodes=>nodes.map(n=>({action:n.dataset.action,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,bottom:n.getBoundingClientRect().bottom,viewport:innerHeight})));
  assert.equal(sizes.length,5);for(const r of sizes)assert.ok(r.width>=44&&r.height>=44&&r.bottom<=r.viewport,JSON.stringify(r));
  assert.ok(await page.locator('.battle-mobile-dock').isVisible());
  for(const size of await page.locator('.system-nav button').filter({visible:true}).evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}))))assert.ok(size.width>=44&&size.height>=44,JSON.stringify(size));
}
try{
  await page.goto(report.baseURL,{waitUntil:'networkidle'});await page.locator('[data-action="new"]').waitFor({state:'visible',timeout:90_000});
  await page.locator('#import-file').setInputFiles(output+'battle-item-save.json');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='存档已导入。');await ready();
  await tap('[data-action="interact"][data-id="阎基居"]');await continueDialogue();
  let current=await state();assert.equal(current.battle.id,'阎基居.战斗');
  await page.locator('#board-viewport[data-board-geometry]').waitFor();await dock();await noOverflow('375px real touch battle');
  const before=await state();
  await tap('[data-action="battle-skills"]');await page.locator('.battle-skills-modal[open]').waitFor();
  assert.match(await page.locator('.battle-skill-sheet').innerText(),/耗内力.*距离/);
  const unavailable=before.battle.skills.filter(s=>s.available===false);
  assert.equal(await page.locator('[data-skill-reason]').count(),unavailable.length);
  for(const skill of unavailable)assert.ok((await page.locator('.battle-skill-sheet').innerText()).includes(skill.reason||'当前无法施展'));
  assert.deepEqual(await state(),before);await noOverflow('mobile skill sheet');
  await page.screenshot({path:output+'modern-m3-skills-mobile.png'});
  await tap('[data-action="choose-battle-skill"]:not(:disabled)');assert.deepEqual(await state(),before);
  pass('touch skill sheet exposes engine costs, ranges and unavailable reasons; choosing only changes the view');
  await tap('[data-action="mobile-move"]');
  const actor=current.battle.units.find(u=>u.id===current.battle.activeUnitId);
  const destination=current.battle.reachable.find(p=>(p.x!==actor.x||p.y!==actor.y)&&!current.battle.units.some(u=>u.alive&&u.x===p.x&&u.y===p.y));
  assert.ok(destination);const p=await cell(destination);const cdp=await page.context().newCDPSession(page);
  const send=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  await send('touchStart',[p]);await send('touchMove',[{x:p.x+24,y:p.y}]);await send('touchMove',[p]);await send('touchEnd',[]);
  assert.equal(await page.locator('.battle-action-modal[open]').count(),0);assert.deepEqual(await state(),before);
  await send('touchStart',[p]);await page.waitForTimeout(850);await send('touchEnd',[]);
  assert.equal(await page.locator('.battle-action-modal[open]').count(),0);assert.deepEqual(await state(),before);
  await send('touchStart',[p]);await send('touchStart',[p,{x:p.x+20,y:p.y+15}]);await send('touchEnd',[]);
  assert.equal(await page.locator('.battle-action-modal[open]').count(),0);assert.deepEqual(await state(),before);
  pass('real touch drag-return, long press and multi-touch never commit a move or attack');
  const startScroll=await page.evaluate(()=>scrollY);const scrollPoint=await cell(destination);
  const touchLayout=await page.evaluate(p=>{let node=document.elementFromPoint(p.x,p.y);const parents=[];while(node){const s=getComputedStyle(node);parents.push({tag:node.tagName,cls:node.className,touch:s.touchAction,overflow:s.overflow,height:node.clientHeight,scroll:node.scrollHeight,top:node.scrollTop});node=node.parentElement;}return parents;},scrollPoint);
  await send('touchStart',[scrollPoint]);
  for(let i=1;i<=5;i++){await send('touchMove',[{x:scrollPoint.x,y:scrollPoint.y-i*18}]);await page.waitForTimeout(30);}
  await send('touchEnd',[]);await page.waitForTimeout(180);
  const scrollResult=await page.evaluate(()=>({y:scrollY,height:document.documentElement.scrollHeight,touch:getComputedStyle(document.querySelector('canvas')).touchAction,viewport:innerHeight}));
  assert.ok(scrollResult.y>startScroll,`Canvas must allow vertical page scrolling: ${JSON.stringify({startScroll,...scrollResult,scrollPoint,touchLayout})}`);
  assert.deepEqual(await state(),before);assert.equal(await page.locator('.battle-action-modal[open]').count(),0);
  pass('scrolling over the canvas scrolls the page without changing the battle');
  await tapCell(destination);
  await page.locator('.battle-action-modal[open]').waitFor();
  assert.deepEqual(await state(),before);
  await tap('[data-action="close-modal"]');assert.deepEqual(await state(),before);
  await tapCell(destination);await tap('[data-action="confirm-battle-action"]');current=await state();
  const moved=current.battle.units.find(u=>u.id===actor.id);assert.equal(moved.x,destination.x);assert.equal(moved.y,destination.y);
  pass('touch movement waits for explicit confirmation; cancelling preserves the entire native state');
  let attacked=false;
  for(let turn=0;turn<12&&!attacked;turn++){
    current=await state();const usable=current.battle.skills.filter(s=>s.available!==false&&current.battle.targets.some(t=>t.skillId===s.id));const skill=usable.find(s=>s.id==='打鸡血')||usable[0];
    if(skill){
      const target=current.battle.targets.find(t=>t.skillId===skill.id);const sequence=Math.max(0,...current.battle.events.map(e=>e.sequence));
      await tap('[data-action="battle-skills"]');await tap(`[data-action="choose-battle-skill"][data-id="${skill.id}"]`);
      const beforeAttack=await state();await tapCell(target);await page.locator('.battle-action-modal[open]').waitFor();assert.deepEqual(await state(),beforeAttack);
      assert.ok((await page.locator('.battle-action-summary').innerText()).includes(`耗内力 ${skill.mpCost}`));
      await page.screenshot({path:output+'modern-m3-touch-confirm.png'});
      await tap('[data-action="confirm-battle-action"]');current=await state();
      assert.ok(current.battle.events.some(e=>e.sequence>sequence&&e.kind==='SkillCast'&&e.skillId===skill.id));attacked=true;
    }else {await tap('[data-action="mobile-rest"]');}
  }
  assert.ok(attacked,'A touch-confirmed skill must execute in C#');
  pass('touch-confirmed skill produces a real native SkillCast event through the existing rules');
  for(let turn=0;turn<6&&!current.battle.skills.some(s=>s.available===false&&s.remainingCooldown>0);turn++){
    await tap('[data-action="mobile-rest"]');current=await state();
  }
  const cooling=current.battle.skills.find(s=>s.available===false&&s.remainingCooldown>0);assert.ok(cooling,'Actually casting a cooldown skill must expose a real unavailable skill');
  await tap('[data-action="battle-skills"]');
  assert.ok((await page.locator('[data-skill-reason]').allTextContents()).includes(cooling.reason));
  assert.ok(await page.locator(`[data-action="choose-battle-skill"][data-id="${cooling.id}"]`).isDisabled());
  await page.screenshot({path:output+'modern-m3-cooldown-mobile.png'});await closeModal();
  pass('a genuinely cooling-down skill shows its native refusal reason and cannot be selected');
  await tap('[data-action="mobile-pause"]');const paused=await state();
  await tap('[data-action="battle-skills"]');await page.waitForTimeout(1000);assert.deepEqual(await state(),paused);await closeModal();
  assert.equal(await page.locator('[data-action="mobile-pause"]').innerText(),'继续');
  await page.setViewportSize({width:320,height:740});await dock();await noOverflow('320px battle');
  await page.setViewportSize({width:844,height:390});await dock();await noOverflow('touch landscape battle');
  assert.ok((await page.locator('#board-viewport').boundingBox()).height>=220);assert.deepEqual(await state(),paused);
  await page.screenshot({path:output+'modern-m3-battle-landscape.png'});
  pass('320px portrait and 844px landscape retain state, accessible dock and readable canvas');
  await tap('[data-action="mobile-inventory"]');await noOverflow('landscape inventory');
  await page.setViewportSize({width:375,height:812});await noOverflow('portrait inventory');
  const input=page.locator('#inventory-search');assert.equal(await input.evaluate(n=>getComputedStyle(n).fontSize),'16px');
  await closeModal();assert.deepEqual(await state(),paused);
  await page.locator('#board-viewport').scrollIntoViewIfNeeded();await page.screenshot({path:output+'modern-m3-battle-mobile.png'});
  pass('mobile inventory stays scrollable with larger controls and preserves paused battle state');
}catch(error){failure=error;}finally{await h.finish(failure);}
