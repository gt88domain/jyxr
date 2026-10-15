import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const baseURL = process.env.GAME_WEB_URL || 'http://127.0.0.1:4173';
const output = fileURLToPath(new URL('../test-results/', import.meta.url));
await mkdir(output, {recursive: true});
// This is an isolated test save, never a production reward or a direct runtime mutation.
const fixture = JSON.parse(await readFile(`${output}exported-save.json`, 'utf8'));
const inventory = fixture.game.inventory;
assert.ok(!inventory.entries.some(entry => entry.itemDefinitionId === '木刀'), 'Baseline smoke save must retain its authentic equipment-free rewards');
const entryNumber = inventory.nextEntryNumber;
inventory.entries.push({kind: 'stack', entryNumber, itemDefinitionId: '木刀', quantity: 1});
inventory.nextEntryNumber = entryNumber + 1;
const fixturePath = `${output}equipment-fixture.json`;
await writeFile(fixturePath, JSON.stringify(fixture));
const report = {baseURL, fixture: 'Original 木刀 definition added only to a copied test save', startedAt: new Date().toISOString(), passed: false, checks: [], console: [], errors: [], failedRequests: [], failedResponses: []};
let browser, context, page;
function pass(check, details) {report.checks.push({check, details}); console.log(`PASS ${check}`);}
async function visible(selector) {await page.locator(selector).waitFor({state: 'visible'});}
async function ready() {await page.waitForFunction(() => document.querySelector('#app')?.getAttribute('aria-busy') === 'false');}
async function click(selector) {
  const local = page.locator('#game-modal[open]').locator(selector);
  await (await local.count() ? local.first() : page.locator(selector).filter({visible: true}).first()).click();
  await ready();
}
async function state() {
  const result = await page.evaluate(async () => {
    const runtime = await window.loadJyxrRuntime();
    const assembly = await runtime.getAssemblyExports('Game.Web.Runtime');
    return JSON.parse(await assembly.Game.Web.Runtime.BrowserBridge.Dispatch(JSON.stringify({type: 'state'})));
  });
  assert.equal(result.ok, true);
  return result.state;
}
function weapon(snapshot) {return snapshot.hero.equipment.find(slot => slot.slot === 'Weapon').item;}
async function importFile(path) {
  const chooser = page.waitForEvent('filechooser');
  await page.locator('[data-action="import"]').click();
  await (await chooser).setFiles(path);
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === '存档已导入。');
  await visible('.world-screen');
}
async function noOverflow(label) {
  const dimensions = await page.evaluate(() => {
    const dialog = document.querySelector('#game-modal[open]');
    return {viewport: innerWidth, document: document.documentElement.scrollWidth,
      dialog: dialog ? {width: dialog.clientWidth, content: dialog.scrollWidth} : null};
  });
  assert.ok(dimensions.document <= dimensions.viewport + 1, `${label}: document overflow ${JSON.stringify(dimensions)}`);
  if (dimensions.dialog) assert.ok(dimensions.dialog.content <= dimensions.dialog.width + 1, `${label}: dialog overflow`);
  pass(label, dimensions);
}

try {
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  context = await browser.newContext({viewport: {width: 1440, height: 900}});
  await context.tracing.start({screenshots: true, snapshots: true});
  page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on('console', message => {
    const entry = {type: message.type(), text: message.text(), location: message.location()};
    report.console.push(entry);
    if (message.type() === 'error' && !(entry.location.url && new URL(entry.location.url).pathname === '/favicon.ico'))
      report.errors.push(entry);
  });
  page.on('pageerror', error => report.errors.push({type: 'pageerror', message: error.message, stack: error.stack}));
  page.on('requestfailed', request => {if (new URL(request.url()).pathname !== '/favicon.ico') report.failedRequests.push({url: request.url(), error: request.failure()?.errorText});});
  page.on('response', response => {if (response.status() >= 400 && new URL(response.url()).pathname !== '/favicon.ico') report.failedResponses.push({url: response.url(), status: response.status()});});
  await page.goto(baseURL, {waitUntil: 'networkidle'});
  await visible('[data-action="import"]');
  await importFile(fixturePath);
  const imported = await state();
  assert.equal(weapon(imported), null);
  assert.equal(imported.inventory.find(item => item.id === '木刀').count, 1);
  await click('[data-action="inventory"]');
  const item = page.locator('.inventory-list [data-item-id="木刀"]');
  assert.match(await item.innerText(), /木刀/);
  assert.equal(await item.locator('[data-action="equip-item"]').isEnabled(), true);
  await item.locator('[data-action="equip-item"]').click();
  await ready();
  const equipped = await state();
  assert.equal(weapon(equipped).id, '木刀');
  const instanceId = weapon(equipped).instanceId;
  assert.ok(typeof instanceId === 'string' && instanceId.length > 0);
  assert.equal(equipped.inventory.some(item => item.id === '木刀'), false, 'Equipping must move the real item out of inventory');
  await click('[data-action="close-modal"]');
  await click('[data-action="equipment"]');
  assert.match(await page.locator('.equipment-slot[data-slot="Weapon"]').innerText(), /木刀/);
  assert.equal(await page.locator('[data-action="unequip-item"][data-slot="Weapon"]').isEnabled(), true);
  await noOverflow('equipped weapon panel at 1440px');
  await page.screenshot({path: `${output}equipment-equipped-desktop.png`, fullPage: true});
  pass('real inventory button equips the original wooden blade', {instanceId});
  await click('[data-action="close-modal"]');
  await click('[data-action="save"]');
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === '此刻江湖，已记入行囊。');
  await page.reload({waitUntil: 'networkidle'});
  await visible('[data-action="load"]');
  await click('[data-action="load"]');
  assert.equal(weapon(await state()).instanceId, instanceId, 'Local save/reload must preserve equipment identity');
  await click('[data-action="inventory"]');
  const pendingDownload = page.waitForEvent('download');
  await page.locator('[data-action="download-save"]').click();
  const download = await pendingDownload;
  const exportedPath = `${output}equipment-equipped-save.json`;
  await download.saveAs(exportedPath);
  const exported = JSON.parse(await readFile(exportedPath, 'utf8'));
  assert.equal(exported.browserSaveVersion, 1);
  assert.ok(JSON.stringify(exported.game.characters).includes(JSON.stringify(instanceId)), 'Exported game must serialize the original equipment instance ID');
  await click('[data-action="close-modal"]');
  await page.reload({waitUntil: 'networkidle'});
  await visible('[data-action="import"]');
  await importFile(exportedPath);
  assert.equal(weapon(await state()).instanceId, instanceId, 'Downloaded file import must preserve equipment identity');
  pass('equipment instance persists through local save/reload and downloaded JSON import', {instanceId});
  await page.setViewportSize({width: 375, height: 812});
  await click('[data-action="equipment"]');
  await noOverflow('equipped weapon panel at 375px');
  await page.screenshot({path: `${output}equipment-equipped-mobile.png`, fullPage: true});
  await click('[data-action="unequip-item"][data-slot="Weapon"]');
  const unequipped = await state();
  assert.equal(weapon(unequipped), null);
  const returned = unequipped.inventory.find(item => item.id === '木刀');
  assert.equal(returned.count, 1, 'Unequipping must return exactly the original item');
  assert.match(await page.locator('.equipment-slot[data-slot="Weapon"]').innerText(), /尚未装备/);
  await click('[data-action="close-modal"]');
  await click('[data-action="inventory"]');
  assert.match(await page.locator('.inventory-list [data-item-id="木刀"]').innerText(), /木刀/);
  assert.equal(await page.locator('.inventory-list [data-item-id="木刀"] [data-action="equip-item"]').isEnabled(), true);
  await noOverflow('returned wooden blade inventory at 375px');
  await page.screenshot({path: `${output}equipment-returned-mobile.png`, fullPage: true});
  assert.equal(unequipped.silver, imported.silver, 'Equipment test must preserve the authentic currency balance');
  assert.equal(unequipped.inventory.find(item => item.id === '内功入门').count, 1);
  pass('real unequip button returns the wooden blade and restores empty weapon slot');
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(report.failedResponses, []);
  report.passed = true;
} catch (error) {
  report.failure = {message: error.message, stack: error.stack};
  if (page) {
    await page.screenshot({path: `${output}equipment-failure.png`, fullPage: true}).catch(() => {});
    report.failure.body = await page.locator('body').innerText().catch(() => '');
  }
  console.error(error);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(`${output}equipment-smoke.json`, JSON.stringify(report, null, 2));
  if (context) await context.tracing.stop({path: `${output}equipment-smoke-trace.zip`}).catch(() => {});
  if (browser) await browser.close();
}
