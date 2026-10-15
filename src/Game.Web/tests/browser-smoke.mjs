import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const baseURL = process.env.GAME_WEB_URL || 'http://127.0.0.1:4173';
const output = fileURLToPath(new URL('../test-results/', import.meta.url));
await mkdir(output, {recursive: true});
const content = JSON.parse(await readFile(new URL('../public/data/content-package.json', import.meta.url), 'utf8'));
const segments = new Map(content.storyScripts.starter.segments.map(segment => [segment.name, segment]));
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
  await page.locator(selector).first().click();
  await ready();
}
async function visible(selector) {
  await page.locator(selector).waitFor({state: 'visible'});
}
async function noOverflow(label) {
  const dimensions = await page.evaluate(() => ({viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth}));
  assert.ok(dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1,
    `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
  pass(`${label}: no horizontal overflow`, dimensions);
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
async function readBattleState() {
  // Read the existing cached runtime only. All gameplay mutations use visible UI.
  const result = await page.evaluate(async () => {
    const runtime = await window.loadJyxrRuntime();
    const assembly = await runtime.getAssemblyExports('Game.Web.Runtime');
    return JSON.parse(await assembly.Game.Web.Runtime.BrowserBridge.Dispatch(JSON.stringify({type: 'state'})));
  });
  assert.equal(result.ok, true, 'Read-only runtime snapshot must succeed');
  assert.equal(result.state.phase, 'battle', 'Pointer movement test requires a live battle');
  return result.state.battle;
}
async function pointerMove() {
  const before = await readBattleState();
  const actor = before.units.find(unit => unit.id === before.activeUnitId);
  assert.ok(actor?.alive && actor.team === 1, 'Training must begin with an active living player unit');
  const target = before.reachable.find(point =>
    (point.x !== actor.x || point.y !== actor.y) &&
    !before.units.some(unit => unit.alive && unit.x === point.x && unit.y === point.y));
  assert.ok(target, 'Battle must offer a reachable unoccupied non-origin cell');
  const position = await page.locator('#board-viewport canvas').evaluate((canvas, {battle, target}) => {
    // Mirror board.ts geometry in Phaser logical pixels, then map to CSS pixels.
    const width = canvas.clientWidth, height = canvas.clientHeight;
    const cell = Math.min((width - 36) / battle.width, (height - 46) / battle.height, 76);
    const left = (width - cell * battle.width) / 2;
    const top = (height - cell * battle.height) / 2;
    return {x: left + (target.x + .5) * cell, y: top + (target.y + .5) * cell};
  }, {battle: before, target});
  await page.locator('#board-viewport canvas').click({position});
  await ready();
  const after = await readBattleState();
  const moved = after.units.find(unit => unit.id === actor.id);
  assert.ok(moved, 'Moved player unit must remain in battle');
  assert.deepEqual({x: moved.x, y: moved.y}, target, 'Real canvas pointer must move the player to the selected legal cell');
  assert.notDeepEqual({x: moved.x, y: moved.y}, {x: actor.x, y: actor.y}, 'Player position must change');
  pass('canvas pointer moves real C# battle unit', {unitId: actor.id, from: {x: actor.x, y: actor.y}, to: target});
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
  context = await browser.newContext({viewport: {width: 1440, height: 1000}});
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
  await page.setViewportSize({width: 375, height: 812});
  await noOverflow('mobile title');
  await page.screenshot({path: `${output}title-mobile.png`, fullPage: true});

  await click('[data-action="new"]');
  await page.locator('#hero-name').fill('云游测试侠');
  await noOverflow('mobile naming');
  await page.locator('#character-form button[type="submit"]').click();
  await ready();
  await dialogues('新手村_出生');
  assert.equal(await page.locator('.hero-heading h2').innerText(), '云游测试侠');
  assert.equal(await page.locator('.location-heading h1').innerText(), '南贤屋内');
  await noOverflow('mobile world');
  await click('[data-action="talk"][data-id="南贤"]');
  await noOverflow('mobile dialogue');
  await dialogues('新手村_南贤开场');
  await dialogues('新手村_小村介绍');
  assert.equal(await page.locator('.location-heading h1').innerText(), '小村');
  const opening = await uiSnapshot();
  assert.match(opening.inventory, /内功入门/, 'Original opening must grant 内功入门');
  pass('opening grants original item and enters village', opening);
  await page.screenshot({path: `${output}world-mobile.png`, fullPage: true});

  await click('[data-action="talk"][data-id="武师"]');
  await dialogues('新手村_武师');
  await visible('[data-action="choice"][data-index="0"]');
  assert.match(await page.locator('[data-action="choice"][data-index="0"]').innerText(), /实战练习/);
  await click('[data-action="choice"][data-index="0"]');
  await dialogues('新手村_武师7');
  await visible('.battle-screen');
  await visible('#board-viewport canvas');
  assert.match(await page.locator('#battle-name').innerText(), /木头人/);
  await noOverflow('mobile battle');
  await page.screenshot({path: `${output}battle-mobile.png`, fullPage: true});
  await page.setViewportSize({width: 1440, height: 1000});
  await noOverflow('desktop battle');
  await page.screenshot({path: `${output}battle-desktop.png`, fullPage: true});
  await pointerMove();
  await page.screenshot({path: `${output}battle-pointer-moved.png`, fullPage: true});
  const battleStarted = Date.now();
  await click('[data-action="auto"]');
  await page.locator('[data-action="leave-battle"]').waitFor({state: 'visible', timeout: 180_000});
  assert.match(await page.locator('.result-panel').innerText(), /切磋落幕/);
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
  assert.match(before.inventory, /内功入门/);
  await click('[data-action="save"]');
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === '此刻江湖，已记入行囊。');
  await page.reload({waitUntil: 'networkidle'});
  await visible('[data-action="load"]');
  assert.equal(await page.locator('[data-action="load"]').isEnabled(), true, 'Saved game must be offered after reload');
  assert.match(await page.locator('[data-action="load"]').innerText(), /云游测试侠/);
  await click('[data-action="load"]');
  const after = await uiSnapshot();
  assert.deepEqual(after, before, 'Name, silver, inventory and location must survive save/reload/resume');
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
  assert.equal(exported.browserSaveVersion, 1, 'Export must contain a browser save version');
  assert.ok(exported.game && exported.profile, 'Export must contain game and player profile');
  assert.equal(exported.error, undefined, 'An export error must never be downloaded as a save');
  await click('[data-action="close-modal"]');
  await page.reload({waitUntil: 'networkidle'});
  await visible('[data-action="import"]');
  await importThroughChooser(savePath);
  assert.deepEqual(await uiSnapshot(), before, 'Downloaded save must restore name, silver, inventory and location through real file import');
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
  pass('malformed JSON is rejected while preserving active session');
  assert.deepEqual(report.errors, [], 'Browser console or page exceptions occurred');
  assert.deepEqual(report.failedRequests, [], 'Browser requests failed');
  assert.deepEqual(report.failedResponses, [], 'Browser received HTTP errors');
  pass('no browser errors or failed requests');
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
