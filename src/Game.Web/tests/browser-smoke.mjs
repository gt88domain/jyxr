import assert from 'node:assert/strict';
import {completeCreation} from './creation-controls.mjs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const baseURL = process.env.GAME_WEB_URL || 'http://127.0.0.1:4173';
const output = fileURLToPath(new URL('../test-results/', import.meta.url));
await mkdir(output, {recursive: true});
const content = JSON.parse(await readFile(new URL('../public/data/content-package.json', import.meta.url), 'utf8'));
const segments = new Map(Object.values(content.storyScripts).flatMap(script => script.segments).map(segment => [segment.name, segment]));
const plain = text => text.replace(/\[\[[a-z]+:([^\]]*)\]\]/gi, '$1').replace(/<\/?color[^>]*>/g, '');
const report = {baseURL, startedAt: new Date().toISOString(), passed: false, checks: [], dialogues: [], console: [], errors: [], expectedErrors: [], failedRequests: [], failedResponses: []};
let browser, context, page;

function pass(check, details) {
  report.checks.push({check, details});
  console.log(`PASS ${check}`);
}
async function ready() {
  await page.waitForFunction(() => document.querySelector('#app')?.getAttribute('aria-busy') === 'false');
}
async function click(selector) {
  const inDialog = page.locator('#game-modal[open]').locator(selector);
  await (await inDialog.count() ? inDialog.first() : page.locator(selector).filter({visible: true}).first()).click();
  await ready();
}
async function visible(selector) {
  await page.locator(selector).waitFor({state: 'visible'});
}
async function noOverflow(label) {
  const dimensions = await page.evaluate(() => {
    const modal = document.querySelector('#game-modal[open]');
    return {viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
      modal: modal ? {visible: modal.clientWidth, content: modal.scrollWidth} : null};
  });
  assert.ok(dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1,
    `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
  if (dimensions.modal) assert.ok(dimensions.modal.content <= dimensions.modal.visible + 1,
    `${label}: modal horizontal overflow ${JSON.stringify(dimensions.modal)}`);
  pass(`${label}: no horizontal overflow`, dimensions);
}
async function desktopBattleFits() {
  const layout = await page.evaluate(() => {
    const canvas = document.querySelector('#board-viewport canvas').getBoundingClientRect();
    const footer = document.querySelector('.duel-footer').getBoundingClientRect();
    return {viewport: innerHeight, document: document.documentElement.scrollHeight,
      canvas: {width: canvas.width, height: canvas.height, top: canvas.top, bottom: canvas.bottom}, footerBottom: footer.bottom};
  });
  assert.ok(layout.document <= layout.viewport + 2, `Desktop battle must fit a 900px viewport without canvas height feedback: ${JSON.stringify(layout)}`);
  assert.ok(layout.canvas.width > 300 && layout.canvas.height > 100, 'Desktop arena canvas must remain usable');
  assert.ok(layout.canvas.bottom <= layout.viewport + 1 && layout.footerBottom <= layout.viewport + 1,
    `Battle canvas and controls must remain visible: ${JSON.stringify(layout)}`);
  pass('desktop battle fits 1440×900 including canvas and controls', layout);
}
async function dialogues(segmentName) {
  const segment = segments.get(segmentName);
  assert.ok(segment, `Missing expected story segment: ${segmentName}`);
  let count = 0;
  const expected = segment.steps.flatMap(step => {
    if (step.kind === 'dialogue') return [step];
    const suggest = step.kind === 'command' && /^suggest\((['"])([\s\S]*)\1\)$/.exec(step.call);
    return suggest ? [{speaker: '提示', text: suggest[2]}] : [];
  });
  for (const step of expected) {
    await visible('[data-testid="dialogue-text"]');
    const actual = await page.locator('[data-testid="dialogue-text"]').innerText();
    assert.equal(actual, plain(step.text), `${segmentName}: dialogue ${count + 1} skipped or changed`);
    const speaker = await page.locator('.dialogue-content h2').innerText();
    assert.equal(speaker, step.speaker === '主角' ? '云游测试侠' : step.speaker, `${segmentName}: wrong speaker`);
    report.dialogues.push({segment: segmentName, speaker, text: actual});
    await click('[data-action="next"]');
    count++;
  }
  pass(`${segmentName}: ${count} original dialogue lines`);
}
async function uiSnapshot() {
  await visible('.world-screen');
  const snapshot = {
    name: await page.locator('.hero-heading h2').innerText(),
    silver: await page.locator('.hero-meta strong').innerText(),
    map: await page.locator('.location-heading h1').innerText(),
  };
  await click('[data-action="inventory"]');
  await visible('#game-modal[open]');
  snapshot.inventory = await page.locator('.inventory-list').innerText();
  await click('[data-action="close-modal"]');
  return snapshot;
}
async function readSettingsForm() {
  return page.locator('#game-settings').evaluate(form => Object.fromEntries(
    Array.from(form.elements).filter(element => element.name).map(element => [element.name,
      element.type === 'checkbox' ? element.checked : element.value])));
}
async function settingsPersistence() {
  await click('[data-action="settings"]');
  await visible('#game-settings');
  await page.locator('[name="battleMode"]').selectOption('manual');
  await page.locator('[name="battleSpeed"]').selectOption('2');
  await page.locator('[name="showGrid"]').uncheck();
  await page.locator('[name="showDamage"]').uncheck();
  await page.locator('[name="battleLighting"]').uncheck();
  await page.locator('[name="reducedMotion"]').check();
  await page.locator('[name="largeText"]').check();
  const expected = {battleMode: 'manual', battleSpeed: '2', showGrid: false, showDamage: false, battleLighting: false, reducedMotion: true, largeText: true};
  assert.deepEqual(await readSettingsForm(), expected);
  await noOverflow('desktop settings');
  await click('[data-action="close-modal"]');
  await page.reload({waitUntil: 'networkidle'});
  await visible('[data-action="new"]');
  await click('[data-action="settings"]');
  assert.deepEqual(await readSettingsForm(), expected, 'All seven settings must survive a real browser reload');
  assert.equal(await page.locator('html').evaluate(element => element.classList.contains('large-text')), true);
  await page.setViewportSize({width: 375, height: 812});
  await noOverflow('mobile large-text settings');
  await page.screenshot({path: `${output}settings-mobile.png`, fullPage: true});
  // Restore the full visual presentation before checking the first battle.
  await page.locator('[name="showGrid"]').check();
  await page.locator('[name="showDamage"]').check();
  await page.locator('[name="battleLighting"]').check();
  await page.locator('[name="reducedMotion"]').uncheck();
  await page.locator('[name="largeText"]').uncheck();
  await click('[data-action="close-modal"]');
  pass('seven settings persist across reload and remain usable at 375px', expected);
}
function managementState(state) {
  const hero = state.hero;
  return {
    equipment: hero.equipment,
    equippedInternalSkillId: hero.equippedInternalSkillId,
    cultivation: hero.cultivation ? {
      itemId: hero.cultivation.itemId, skillId: hero.cultivation.skillId,
      level: hero.cultivation.level, exp: hero.cultivation.exp, maxLevel: hero.cultivation.maxLevel,
    } : null,
    internalSkills: hero.internalSkills.map(skill => ({id: skill.id, level: skill.level, exp: skill.exp, equipped: skill.equipped})),
  };
}
async function equipmentAndCultivation() {
  const original = await readRuntimeState();
  assert.equal(original.silver, 0, 'Original opening must not invent money rewards');
  const book = original.inventory.find(item => item.id === '内功入门');
  assert.ok(book && book.count === 1 && book.kind === 'skillBook' && book.canCultivate, 'Original 内功入门 must be a real available skill book');
  assert.ok(original.hero.internalSkills.find(skill => skill.id === '基本内功')?.equipped, 'Preserve the source protagonist\'s initially running 基本内功');
  assert.equal(original.hero.cultivation, null, 'A book is not selected for cultivation implicitly');
  assert.deepEqual(original.hero.equipment.map(slot => slot.slot).sort(), ['Accessory', 'Armor', 'Weapon']);
  assert.ok(original.hero.equipment.every(slot => slot.item === null), 'Original protagonist must retain empty physical equipment slots');

  await click('[data-action="character"]');
  assert.equal(await page.locator('.profile-stat').count(), original.hero.attributes.length, 'Character panel must show the real runtime attributes');
  assert.ok(original.hero.attributes.length > 0);
  await page.locator('.profile-portrait img').waitFor({state: 'visible'});
  await page.waitForFunction(() => document.querySelector('.profile-portrait img')?.naturalWidth > 0);
  await noOverflow('mobile real character attributes');
  await page.screenshot({path: `${output}character-mobile.png`, fullPage: true});
  await page.setViewportSize({width: 1440, height: 900});
  await noOverflow('desktop real character attributes');
  await page.screenshot({path: `${output}character-desktop.png`, fullPage: true});
  await page.setViewportSize({width: 375, height: 812});
  await click('[data-action="equipment"]');
  for (const slot of ['Weapon', 'Armor', 'Accessory'])
    assert.match(await page.locator(`.equipment-slot[data-slot="${slot}"]`).innerText(), /尚未装备/);
  assert.equal(await page.locator('[data-action="equip-item"]').count(), 1, 'The original vagrant answer grants exactly one unequipped 草帽');
  assert.equal(original.inventory.find(i => i.id === '草帽')?.count, 1);
  assert.equal(original.inventory.find(i => i.id === '小还丹')?.count, 3);
  assert.equal(original.inventory.find(i => i.id === '新手礼包-大蟠桃')?.count, 5);
  await noOverflow('mobile real equipment');
  await page.screenshot({path: `${output}equipment-mobile.png`, fullPage: true});
  await page.setViewportSize({width: 1440, height: 900});
  await noOverflow('desktop real equipment');
  await page.screenshot({path: `${output}equipment-desktop.png`, fullPage: true});
  await click('[data-action="cultivation"]');
  await page.locator(`[data-action="cultivate"][data-entry-number="${book.entryNumber}"]`).click();
  await ready();
  await page.waitForFunction(() => document.querySelector('[data-testid="cultivation-focus"]')?.textContent.includes('内功入门'));
  const selected = await readRuntimeState();
  assert.equal(selected.hero.cultivation.itemId, '内功入门');
  assert.equal(selected.hero.cultivation.skillId, '基本内功');
  assert.equal(selected.inventory.find(item => item.id === '内功入门').count, 1, 'Selecting cultivation must preserve the book in inventory');
  assert.equal(selected.hero.equippedInternalSkillId, '基本内功');
  await click('[data-action="clear-cultivation"]');
  const unselected = await readRuntimeState();
  assert.equal(unselected.hero.cultivation, null, 'Pausing book cultivation must clear the selected book');
  assert.equal(unselected.hero.equippedInternalSkillId, '基本内功', 'Pausing cultivation must preserve the running internal art');
  assert.equal(unselected.inventory.find(item => item.id === '内功入门').count, 1);
  await click(`[data-action="cultivate"][data-entry-number="${book.entryNumber}"]`);
  assert.equal((await readRuntimeState()).hero.cultivation.itemId, '内功入门');
  await click('[data-action="clear-internal"][data-id="基本内功"]');
  const stopped = await readRuntimeState();
  assert.equal(stopped.hero.equippedInternalSkillId, null, 'Stopping the running internal art must actually update the runtime');
  assert.equal(stopped.hero.cultivation.itemId, '内功入门', 'Cultivation and running internal art are independent');
  await click('[data-action="equip-internal"][data-id="基本内功"]');
  const restored = await readRuntimeState();
  assert.equal(restored.hero.equippedInternalSkillId, '基本内功');
  assert.ok(restored.hero.internalSkills.find(skill => skill.id === '基本内功').equipped);
  await noOverflow('desktop cultivation');
  await page.screenshot({path: `${output}cultivation-desktop.png`, fullPage: true});
  await page.setViewportSize({width: 375, height: 812});
  await noOverflow('mobile cultivation');
  await page.screenshot({path: `${output}cultivation-mobile.png`, fullPage: true});
  await click('[data-action="close-modal"]');
  pass('original book cultivation and running internal art are real independent systems', managementState(restored));
  return managementState(restored);
}
async function readRuntimeState() {
  // Read the existing cached runtime only. All gameplay mutations use visible UI.
  const result = await page.evaluate(async () => {
    const runtime = await window.loadJyxrRuntime();
    const assembly = await runtime.getAssemblyExports('Game.Web.Runtime');
    return JSON.parse(await assembly.Game.Web.Runtime.BrowserBridge.Dispatch(JSON.stringify({type: 'state'})));
  });
  assert.equal(result.ok, true, 'Read-only runtime snapshot must succeed');
  return result.state;
}
async function readBattleState() {
  const state = await readRuntimeState();
  assert.equal(state.phase, 'battle', 'Pointer movement test requires a live battle');
  return state.battle;
}
async function clickCell(target) {
  const geometry = await page.locator('#board-viewport').getAttribute('data-board-geometry');
  assert.ok(geometry, 'Rendered board must expose its actual cell geometry');
  const {cell, left, top} = JSON.parse(geometry);
  assert.ok(cell > 0, 'Board must have a positive cell size');
  await page.locator('#board-viewport canvas').click({position: {
    x: left + (target.x + .5) * cell,
    y: top + (target.y + .5) * cell,
  }});
  await ready();
}
async function pointerMove() {
  await click('[data-action="battle-intent"][data-id="move"]');
  assert.equal(await page.locator('[data-action="battle-intent"][data-id="move"]').getAttribute('aria-pressed'), 'true');
  const before = await readBattleState();
  const actor = before.units.find(unit => unit.id === before.activeUnitId);
  assert.ok(actor?.alive && actor.team === 1, 'Training must begin with an active living player unit');
  const target = before.reachable.find(point =>
    (point.x !== actor.x || point.y !== actor.y) &&
    !before.units.some(unit => unit.alive && unit.x === point.x && unit.y === point.y));
  assert.ok(target, 'Battle must offer a reachable unoccupied non-origin cell');
  await clickCell(target);
  const after = await readBattleState();
  const moved = after.units.find(unit => unit.id === actor.id);
  assert.ok(moved, 'Moved player unit must remain in battle');
  assert.deepEqual({x: moved.x, y: moved.y}, target, 'Real canvas pointer must move the player to the selected legal cell');
  assert.notDeepEqual({x: moved.x, y: moved.y}, {x: actor.x, y: actor.y}, 'Player position must change');
  pass('canvas pointer moves real C# battle unit', {unitId: actor.id, from: {x: actor.x, y: actor.y}, to: target});
}
function battleSignature(battle) {
  return {
    activeUnitId: battle.activeUnitId, outcome: battle.outcome,
    units: battle.units.map(unit => ({id: unit.id, x: unit.x, y: unit.y, hp: unit.hp, mp: unit.mp, alive: unit.alive})),
    events: battle.events.map(event => event.sequence),
  };
}
async function manualSkill() {
  const before = await readBattleState();
  const actor = before.units.find(unit => unit.id === before.activeUnitId);
  assert.ok(actor?.team === 1, 'Manual casting requires the player turn');
  const skill = before.skills.find(skill => skill.available !== false && before.targets.some(target =>
    target.skillId === skill.id && target.x === actor.x && target.y === actor.y));
  assert.ok(skill, 'The original protagonist must have a legal self-target skill for a real manual cast');
  await click(`[data-action="skill"][data-id="${skill.id}"]`);
  assert.equal(await page.locator('[data-action="battle-intent"][data-id="attack"]').getAttribute('aria-pressed'), 'true');
  const latestSequence = Math.max(0, ...before.events.map(event => event.sequence));
  await clickCell(actor);
  const after = await readBattleState();
  const event = after.events.find(event => event.sequence > latestSequence && event.kind === 'SkillCast' && event.skillId === skill.id);
  assert.ok(event, 'Clicking the real canvas must produce a new C# SkillCast fact');
  assert.ok(after.units.find(unit => unit.id === actor.id).mp < actor.mp, 'Manual skill must spend the original MP cost');
  pass('manual skill uses a legal original target and real skill event', {skill: skill.name, event});
  await page.screenshot({path: `${output}battle-manual-skill.png`, fullPage: true});
}
async function battleControls() {
  assert.equal(await page.locator('[data-action="battle-mode"][data-id="manual"]').getAttribute('aria-pressed'), 'true');
  for (const speed of ['1', '2', '4']) {
    await click(`[data-action="battle-speed"][data-id="${speed}"]`);
    assert.equal(await page.locator(`[data-action="battle-speed"][data-id="${speed}"]`).getAttribute('aria-pressed'), 'true');
  }
  await click('[data-action="battle-mode"][data-id="auto"]');
  assert.equal(await page.locator('[data-action="battle-mode"][data-id="auto"]').getAttribute('aria-pressed'), 'true');
  await click('[data-action="battle-pause"]');
  assert.equal(await page.locator('[data-action="battle-pause"]').getAttribute('aria-pressed'), 'true');
  assert.match(await page.locator('#battle-tip').innerText(), /暂停/);
  assert.equal(await page.locator('[data-action="rest"]').isDisabled(), true);
  const paused = battleSignature(await readBattleState());
  await page.waitForTimeout(1100);
  assert.deepEqual(battleSignature(await readBattleState()), paused, 'Explicit pause must stop real battle advancement');
  await page.setViewportSize({width: 375, height: 812});
  await noOverflow('mobile paused battle controls');
  await page.screenshot({path: `${output}battle-paused-mobile.png`, fullPage: true});

  await click('[data-action="battle-pause"]');
  assert.equal(await page.locator('[data-action="battle-pause"]').getAttribute('aria-pressed'), 'false');
  // Opening an actual system panel must also suspend automatic commands.
  await click('[data-action="equipment"]');
  await visible('#game-modal[open]');
  assert.match(await page.locator('.panel-notice').innerText(), /返回地图|结束.*战斗|离开战斗/);
  const inPanel = battleSignature(await readBattleState());
  await page.waitForTimeout(1100);
  assert.deepEqual(battleSignature(await readBattleState()), inPanel, 'Opening a system panel must pause the real automatic battle');
  await noOverflow('mobile battle equipment panel');
  await click('[data-action="cultivation"]');
  assert.equal((await readRuntimeState()).hero.canManage, false, 'Equipment and cultivation management must be locked during battle');
  assert.equal(await page.locator('[data-action="clear-internal"][data-id="基本内功"]').isDisabled(), true);
  assert.equal(await page.locator('[data-action="clear-cultivation"]').isDisabled(), true);
  await noOverflow('mobile battle cultivation panel');
  await click('[data-action="close-modal"]');
  await click('[data-action="battle-mode"][data-id="manual"]');
  // A command already dispatched before manual takeover may finish once.
  await ready();
  await page.waitForTimeout(250);
  const manual = battleSignature(await readBattleState());
  await page.waitForTimeout(1100);
  assert.deepEqual(battleSignature(await readBattleState()), manual, 'Manual takeover must stop subsequent automatic actions');
  assert.equal(await page.locator('[data-action="battle-mode"][data-id="manual"]').getAttribute('aria-pressed'), 'true');
  pass('manual/automatic modes, 1x/2x/4x speed and both pause paths work on the real battle');
}
async function importThroughChooser(path) {
  const chooser = page.waitForEvent('filechooser');
  await page.locator('[data-action="import"]').click();
  await (await chooser).setFiles(path);
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === '存档已导入。');
}

try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  context = await browser.newContext({viewport: {width: 1440, height: 900}});
  await context.tracing.start({screenshots: true, snapshots: true});
  page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on('console', message => {
    const entry = {type: message.type(), text: message.text(), location: message.location()};
    report.console.push(entry);
    const favicon = entry.location.url && new URL(entry.location.url).pathname === '/favicon.ico';
    if (message.type() === 'error' && !favicon) report.errors.push({source: 'console', ...entry});
  });
  page.on('pageerror', error => report.errors.push({source: 'pageerror', message: error.message, stack: error.stack}));
  page.on('requestfailed', request => {
    if (new URL(request.url()).pathname === '/favicon.ico') return;
    report.failedRequests.push({url: request.url(), error: request.failure()?.errorText});
  });
  page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).pathname !== '/favicon.ico')
      report.failedResponses.push({url: response.url(), status: response.status()});
  });

  await page.goto(baseURL, {waitUntil: 'networkidle'});
  await visible('[data-action="new"]');
  assert.equal(await page.locator('[data-action="load"]').isDisabled(), true, 'Fresh browser must have no save');
  await noOverflow('desktop title');
  await page.screenshot({path: `${output}title-desktop.png`, fullPage: true});
  await settingsPersistence();
  await page.setViewportSize({width: 375, height: 812});
  await noOverflow('mobile title');
  await page.screenshot({path: `${output}title-mobile.png`, fullPage: true});

  await click('[data-action="new"]');
  await page.locator('#hero-name').fill('云游测试侠');
  await noOverflow('mobile naming');
  await page.locator('#character-form button[type="submit"]').click();
  await ready();
  await completeCreation(page, click);
  await dialogues('新手村_出生');
  assert.equal(await page.locator('.hero-heading h2').innerText(), '云游测试侠');
  assert.equal(await page.locator('.location-heading h1').innerText(), '南贤屋内');
  await noOverflow('mobile world');
  await click('[data-action="interact"][data-id="南贤"]');
  await noOverflow('mobile dialogue');
  await dialogues('新手村_南贤开场');
  await dialogues('新手村_小村介绍');
  assert.equal(await page.locator('.location-heading h1').innerText(), '小村');
  const opening = await uiSnapshot();
  assert.match(opening.inventory, /内功入门/, 'Original opening must grant 内功入门');
  pass('opening grants original item and enters village', opening);
  const initialCultivation = await equipmentAndCultivation();
  await page.screenshot({path: `${output}world-mobile.png`, fullPage: true});

  await click('[data-action="interact"][data-id="武师"]');
  await dialogues('新手村_武师');
  await visible('[data-action="choice"][data-index="0"]');
  assert.match(await page.locator('[data-action="choice"][data-index="0"]').innerText(), /实战练习/);
  await click('[data-action="choice"][data-index="0"]');
  await dialogues('新手村_武师7');
  await visible('.duel-screen');
  await visible('#board-viewport canvas');
  assert.match(await page.locator('#battle-name').innerText(), /木头人/);
  await noOverflow('mobile battle');
  await page.screenshot({path: `${output}battle-mobile.png`, fullPage: true});
  await page.setViewportSize({width: 1440, height: 900});
  await noOverflow('desktop battle');
  await desktopBattleFits();
  await page.screenshot({path: `${output}battle-desktop.png`, fullPage: true});
  await pointerMove();
  await page.screenshot({path: `${output}battle-pointer-moved.png`, fullPage: true});
  await manualSkill();
  await battleControls();
  const battleStarted = Date.now();
  await click('[data-action="battle-mode"][data-id="auto"]');
  await page.locator('[data-action="leave-battle"]').waitFor({state: 'visible', timeout: 180_000});
  assert.match(await page.locator('[aria-label="战斗结算"]').innerText(), /战斗结算/);
  const finishedBattle = await readBattleState();
  assert.equal(finishedBattle.outcome, 'win', 'The original training battle must end in an actual victory');
  const damageFacts = finishedBattle.events.filter(event => event.kind === 'Damaged' && event.amount > 0);
  assert.ok(damageFacts.length > 0, 'The battle must contain real positive damage facts');
  const shownDamage = JSON.parse(await page.locator('#board-viewport').getAttribute('data-last-damage'));
  assert.ok(damageFacts.some(event => event.sequence === shownDamage.sequence && event.amount === shownDamage.amount), 'Shown damage must come from an actual C# damage fact');
  await page.screenshot({path: `${output}battle-result.png`, fullPage: true});
  pass('real C# battle AI reaches settlement', {elapsedMs: Date.now() - battleStarted});
  await click('[data-action="leave-battle"]');
  await visible('[data-action="choice"][data-index="1"]');
  assert.match(await page.locator('[data-action="choice"][data-index="1"]').innerText(), /离开/);
  await click('[data-action="choice"][data-index="1"]');
  await visible('.world-screen');
  assert.equal(await page.locator('[data-action="save"]').isEnabled(), true, 'Save must become available after trainer exit');
  const before = await uiSnapshot();
  assert.equal(before.name, '云游测试侠');
  assert.equal(before.map, '小村');
  assert.equal(before.silver, '10 两', 'Original wooden dummy battle must reward exactly 10 silver');
  assert.match(before.inventory, /内功入门/);
  const trainedState = managementState(await readRuntimeState());
  assert.equal(trainedState.cultivation.itemId, '内功入门');
  assert.equal(trainedState.equippedInternalSkillId, '基本内功');
  assert.ok(trainedState.cultivation.level > initialCultivation.cultivation.level ||
    trainedState.cultivation.exp > initialCultivation.cultivation.exp, 'Real battle experience must advance the selected book\'s cultivation');
  assert.ok(trainedState.equipment.every(slot => slot.item === null), 'Training must not invent physical equipment rewards');
  pass('original battle reward and real book cultivation progress', trainedState);
  await click('[data-action="save"]');
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === '当前世界的进度已保存。');
  await page.reload({waitUntil: 'networkidle'});
  await visible('[data-action="load"]');
  assert.equal(await page.locator('[data-action="load"]').isEnabled(), true, 'Saved game must be offered after reload');
  assert.match(await page.locator('[data-action="load"]').innerText(), /云游测试侠/);
  await click('[data-action="load"]');
  const after = await uiSnapshot();
  assert.deepEqual(after, before, 'Name, silver, inventory and location must survive save/reload/resume');
  assert.deepEqual(managementState(await readRuntimeState()), trainedState, 'Equipment, internal art and cultivation must survive browser save/load');
  pass('save → reload → resume preserves UI state', after);
  await page.setViewportSize({width: 375, height: 812});
  await noOverflow('mobile resumed world');
  await page.screenshot({path: `${output}resume-mobile.png`, fullPage: true});

  await click('[data-action="inventory"]');
  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-action="download-save"]').click();
  const download = await downloadEvent;
  assert.match(download.suggestedFilename(), /云游测试侠.*\.json$/, 'Export should download a named JSON save');
  const savePath = `${output}exported-save.json`;
  await download.saveAs(savePath);
  const exported = JSON.parse(await readFile(savePath, 'utf8'));
  assert.equal(exported.browserSaveVersion, 2, 'Export must contain the pack-aware browser save version');
  assert.equal(exported.packId, 'jyx', 'The original campaign save must retain its content pack');
  assert.ok(exported.game && exported.profile, 'Export must contain game and player profile');
  assert.equal(exported.cultivationItemId, '内功入门', 'Downloaded save must include the selected cultivation book');
  assert.equal(exported.error, undefined, 'An export error must never be downloaded as a save');
  await click('[data-action="close-modal"]');
  await page.reload({waitUntil: 'networkidle'});
  await visible('[data-action="import"]');
  await importThroughChooser(savePath);
  assert.deepEqual(await uiSnapshot(), before, 'Downloaded save must restore name, silver, inventory and location through real file import');
  assert.deepEqual(managementState(await readRuntimeState()), trainedState, 'Downloaded save must restore actual equipment, running internal art and cultivation progress');
  pass('downloaded JSON save imports through browser file chooser', {file: download.suggestedFilename()});

  const errorsBeforeInvalidImport = report.errors.length;
  await page.locator('#import-file').setInputFiles({name: 'invalid-save.json', mimeType: 'application/json', buffer: Buffer.from('{invalid JSON')});
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === '无法导入此存档，请使用本版导出的存档文件。');
  const rejectedErrors = report.errors.slice(errorsBeforeInvalidImport);
  assert.equal(rejectedErrors.length, 1, 'Malformed import should log exactly its expected validation error');
  assert.equal(rejectedErrors[0].source, 'console', 'Malformed import must be handled without an uncaught page exception');
  assert.match(rejectedErrors[0].text, /JSON|invalid|Expected|LineNumber|BytePositionInLine/i, 'Import error must identify invalid JSON');
  report.expectedErrors.push(...report.errors.splice(errorsBeforeInvalidImport));
  assert.deepEqual(await uiSnapshot(), before, 'Malformed JSON must not replace or corrupt the active game session');
  assert.deepEqual(managementState(await readRuntimeState()), trainedState, 'Malformed JSON must preserve equipment and cultivation too');
  pass('malformed JSON is rejected while preserving active session');
  assert.deepEqual(report.errors, [], 'Browser console or page exceptions occurred');
  assert.deepEqual(report.failedRequests, [], 'Browser requests failed');
  assert.deepEqual(report.failedResponses, [], 'Browser received HTTP errors');
  pass('no browser errors or failed requests');
  assert.equal(report.dialogues.length, 37, 'The exact 37 original dialogue and tutorial lines must remain covered');
  report.passed = true;
} catch (error) {
  report.failure = {message: error.message, stack: error.stack};
  if (page) {
    await page.screenshot({path: `${output}failure.png`, fullPage: true}).catch(() => {});
    report.failure.body = await page.locator('body').innerText().catch(() => '');
  }
  console.error(error);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(`${output}browser-smoke.json`, JSON.stringify(report, null, 2));
  if (context) await context.tracing.stop({path: `${output}browser-smoke-trace.zip`}).catch(() => {});
  if (browser) await browser.close();
}
