import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {clickMenu} from './menu-controls.mjs';

// Only `state` is sent to the runtime. Gameplay changes must use visible controls.
export async function createHarness(name, contextOptions = {}) {
  const output = fileURLToPath(new URL('../test-results/', import.meta.url));
  await mkdir(output, {recursive: true});
  const report = {baseURL: process.env.GAME_WEB_URL || 'http://127.0.0.1:4173', startedAt: new Date().toISOString(),
    passed: false, checks: [], console: [], errors: [], expectedErrors: [], failedRequests: [], failedResponses: []};
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, ...contextOptions});
  await context.tracing.start({screenshots: true, snapshots: true});
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on('console', message => {
    const entry = {type: message.type(), text: message.text(), location: message.location()};
    report.console.push(entry);
    if (message.type() === 'error') report.errors.push(entry);
  });
  page.on('pageerror', error => report.errors.push({type: 'pageerror', message: error.message, stack: error.stack}));
  page.on('requestfailed', request => report.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => {
    if (response.status() >= 400) report.failedResponses.push({url: response.url(), status: response.status()});
  });
  function pass(check, details) {report.checks.push({check, details}); console.log(`PASS ${check}`);}
  async function ready() {await page.waitForFunction(() => document.querySelector('#app')?.getAttribute('aria-busy') === 'false');}
  async function visible(selector) {await page.locator(selector).waitFor({state: 'visible'});}
  async function click(selector) {
    await clickMenu(page,selector);
    await ready();
  }
  async function state() {
    const result = await page.evaluate(async () => {
      const runtime = await window.loadJyxrRuntime();
      const assembly = await runtime.getAssemblyExports('Game.Web.Runtime');
      return JSON.parse(await assembly.Game.Web.Runtime.BrowserBridge.Dispatch('{"type":"state"}'));
    });
    assert.equal(result.ok, true, 'Read-only runtime state must succeed');
    return result.state;
  }
  async function continueDialogue(limit = 80) {
    for (let count = 0; count < limit; count++) {
      const current = await state();
      if (current.phase !== 'dialogue') return current;
      await click('[data-action="next"]');
    }
    assert.fail(`Dialogue did not finish within ${limit} visible continue actions`);
  }
  async function closeModal() {
    if (await page.locator('#game-modal[open]').count()) await click('[data-action="close-modal"]');
  }
  async function rejectImport(path, expectedPattern) {
    const before = report.errors.length;
    await page.locator('#import-file').setInputFiles(path);
    await page.waitForFunction(() => document.querySelector('#import-file')?.value === '');
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent.startsWith('无法导入'));
    const expected = report.errors.slice(before);
    assert.equal(expected.length, 1, 'Rejected import must have one handled validation error');
    assert.equal(expected[0].type, 'error', 'Rejected import must not cause an uncaught page exception');
    assert.match(expected[0].text, expectedPattern, 'Rejected import must identify the actual validation problem');
    report.expectedErrors.push(...report.errors.splice(before));
    await ready();
  }
  async function noOverflow(label) {
    const dimensions = await page.evaluate(() => {
      const modal = document.querySelector('#game-modal[open]');
      return {viewport: innerWidth, document: document.documentElement.scrollWidth,
        modal: modal ? {width: modal.clientWidth, content: modal.scrollWidth} : null};
    });
    assert.ok(dimensions.document <= dimensions.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
    if (dimensions.modal) assert.ok(dimensions.modal.content <= dimensions.modal.width + 1,
      `${label}: modal overflow ${JSON.stringify(dimensions.modal)}`);
    pass(`${label}: no horizontal overflow`, dimensions);
  }
  async function finish(error) {
    if (!error) {
      try {
        assert.deepEqual(report.errors, [], 'Browser console and page errors');
        assert.deepEqual(report.failedRequests, [], 'Failed browser requests');
        assert.deepEqual(report.failedResponses, [], 'HTTP errors');
      } catch (validationError) {error = validationError;}
    }
    if (error) {
      report.failure = {message: error.message, stack: error.stack};
      await page.screenshot({path: `${output}${name}-failure.png`, fullPage: true}).catch(() => {});
      report.failure.body = await page.locator('body').innerText().catch(() => '');
      console.error(error);
      process.exitCode = 1;
    } else {
      report.passed = true;
    }
    report.finishedAt = new Date().toISOString();
    await writeFile(`${output}${name}.json`, JSON.stringify(report, null, 2));
    await context.tracing.stop({path: `${output}${name}-trace.zip`}).catch(() => {});
    await browser.close();
  }
  return {page, report, output, pass, ready, visible, click, state, continueDialogue, closeModal, rejectImport, noOverflow, finish};
}
