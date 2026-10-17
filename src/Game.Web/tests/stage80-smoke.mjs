import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHarness} from './ui-harness.mjs';
import {completeCreation} from './creation-controls.mjs';

const h = await createHarness('stage80-smoke');
const {page, report, output, pass, click, ready, state, closeModal, continueDialogue, noOverflow} = h;
let failure, catalogRequests = 0;
await page.addInitScript(() => {
  window.mediaCalls = [];
  HTMLMediaElement.prototype.play = function () {
    window.mediaCalls.push({src: this.src, volume: this.volume, loop: this.loop});
    return Promise.resolve();
  };
});
await page.route('**/data/packs/index.json?*', async route => {
  catalogRequests++;
  if (catalogRequests === 1) await route.fulfill({status: 503, body: 'temporary test outage'});
  else await route.continue();
});
try {
  await page.goto(report.baseURL, {waitUntil: 'networkidle'});
  await page.locator('[data-action="new"]').waitFor({timeout: 60_000});
  assert.equal(catalogRequests, 2);
  const expectedHttp = report.failedResponses.filter(x => x.status === 503 && x.url.includes('/data/packs/index.json'));
  assert.equal(expectedHttp.length, 1);
  report.failedResponses = report.failedResponses.filter(x => !expectedHttp.includes(x));
  const expectedConsole = report.errors.filter(x => x.location?.url?.includes('/data/packs/index.json') && x.text?.includes('503'));
  assert.equal(expectedConsole.length, 1);
  report.expectedErrors.push(...expectedConsole); report.errors = report.errors.filter(x => !expectedConsole.includes(x));
  pass('one temporary content-catalog 503 is retried; HTTP errors remain observable and the real runtime boots');
  assert.equal(await page.evaluate(() => window.mediaCalls.length), 0, 'no audio before a user gesture');
  await click('[data-action="settings"]');
  await page.waitForFunction(() => window.mediaCalls.some(c => c.loop && c.volume === .35));
  await page.locator('[name="musicVolume"]').evaluate(el => {el.value = '0'; el.dispatchEvent(new Event('change', {bubbles: true}));});
  await page.locator('[name="effectsVolume"]').evaluate(el => {el.value = '60'; el.dispatchEvent(new Event('change', {bubbles: true}));});
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('jyxr.preferences.v1')).musicVolume), 0);
  await page.setViewportSize({width: 375, height: 812}); await noOverflow('music and effects controls on mobile');
  await closeModal();
  const audio = JSON.parse(await readFile(new URL('../public/art/legacy/audio-manifest.json', import.meta.url)));
  const music = new URL(audio.resources['音乐.武侠回忆'], report.baseURL).href;
  const decoded = await page.evaluate(async url => {
    const response = await fetch(url); if (!response.ok) throw new Error('audio HTTP failure');
    const context = new AudioContext();
    try {const clip = await context.decodeAudioData(await response.arrayBuffer()); return {duration: clip.duration, channels: clip.numberOfChannels};}
    finally {await context.close();}
  }, music);
  assert.ok(decoded.duration > 1 && decoded.channels > 0);
  pass('original MP3 decodes in Chromium; gesture gating and separately persisted volume controls work', decoded);

  await click('[data-action="new"]'); await page.locator('#hero-name').fill('未确认草稿');
  await page.locator('#character-form button[type="submit"]').click(); await ready();
  await closeModal();
  const emptyProfile = await page.evaluate(async () => {
    const db = await new Promise(resolve => {const r = indexedDB.open('jyxr-web', 1); r.onsuccess = () => resolve(r.result);});
    try {return await new Promise(resolve => {const r = db.transaction('saves', 'readonly').objectStore('saves').get('profile:jyx'); r.onsuccess = () => resolve(r.result);});}
    finally {db.close();}
  });
  assert.equal(emptyProfile, undefined);
  pass('opening and cancelling a questionnaire does not persist an empty profile before old-save migration');

  const profile = await readFile(output + 'device-profile.json', 'utf8');
  const saved = await readFile(output + 'achievement-save.json', 'utf8');
  await page.evaluate(async saved => {
    const db = await new Promise(resolve => {const r = indexedDB.open('jyxr-web', 1); r.onsuccess = () => resolve(r.result);});
    await new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put({version: 1, packId: 'jyx', savedAt: new Date().toISOString(), name: '旧旅程', level: 1, map: '同福客栈', data: saved}, 'slot:jyx');
      tx.oncomplete = resolve; tx.onabort = () => reject(tx.error);
    }); db.close();
  }, saved);
  await page.reload({waitUntil: 'networkidle'});
  await page.locator('[data-action="new"]').waitFor({timeout: 60_000});
  const migrated = await page.evaluate(async () => {
    const db = await new Promise(resolve => {const r = indexedDB.open('jyxr-web', 1); r.onsuccess = () => resolve(r.result);});
    try {return await new Promise(resolve => {const r = db.transaction('saves', 'readonly').objectStore('saves').get('profile:jyx'); r.onsuccess = () => resolve(r.result);});}
    finally {db.close();}
  });
  assert.deepEqual(JSON.parse(migrated).profile, JSON.parse(saved).profile);
  pass('legacy embedded profile migrates before New Game is available, without needing Continue first');
  // Isolated storage fixture: a newer device profile and an older valid journey.
  await page.evaluate(async ({profile, saved}) => {
    const db = await new Promise((resolve, reject) => {const r = indexedDB.open('jyxr-web', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);});
    await new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite'); const store = tx.objectStore('saves');
      store.put(profile, 'profile:jyx');
      store.put({version: 1, packId: 'jyx', savedAt: new Date().toISOString(), name: '旧旅程', level: 1, map: '同福客栈', data: saved}, 'slot:jyx');
      tx.oncomplete = resolve; tx.onabort = () => reject(tx.error);
    }); db.close();
  }, {profile, saved});
  await page.reload({waitUntil: 'networkidle'});
  await page.locator('[data-action="load"]').waitFor({timeout: 60_000}); await click('[data-action="load"]');
  let current = await state();
  assert.equal(current.profile.deathCount, 4); assert.equal(current.yuanbao, 17);
  assert.deepEqual(current.achievements.map(x => x.id), ['全真高手']);
  assert.equal(current.hero.externalSkills.find(s => s.id === '野球拳').maxLevel, 12);
  for (let i = 0; i < 2; i++) await click('[data-action="save"]');
  current = await state(); assert.equal(current.yuanbao, 17); assert.equal(current.hero.externalSkills.find(s => s.id === '野球拳').maxLevel, 12);
  pass('continuing an older journey preserves independent titles, currency, counters and actual skill cap without duplicate rewards');
  await click('[data-action="worlds"]'); await click('[data-action="select-pack"][data-id="jyx"]');
  await click('[data-action="new"]'); await page.locator('#hero-name').fill('新旅程档案');
  await page.locator('#character-form button[type="submit"]').click(); await ready();
  await completeCreation(page, click); await continueDialogue();
  current = await state(); assert.equal(current.hero.name, '新旅程档案');
  assert.equal(current.profile.deathCount, 4); assert.equal(current.yuanbao, 17);
  assert.ok(current.achievements.some(x => x.id === '全真高手'));
  pass('a fresh character through the original seven questions retains the device profile');
  await click('[data-action="worlds"]'); await click('[data-action="select-pack"][data-id="frontier"]');
  await click('[data-action="new"]'); await page.locator('#hero-name').fill('独立档案');
  await page.locator('#character-form button[type="submit"]').click(); await ready(); await continueDialogue();
  current = await state(); assert.equal(current.profile.deathCount, 0); assert.equal(current.yuanbao, 0);
  pass('profiles are isolated by content pack');
  await click('[data-action="worlds"]'); await click('[data-action="select-pack"][data-id="jyx"]');
  await page.locator('#import-file').setInputFiles(output + 'battle-item-save.json');
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === '存档已导入。'); await ready();
  await click('[data-action="settings"]');
  assert.equal(await page.locator('[name="musicVolume"]').inputValue(), '0');
  await closeModal();
  await click('[data-action="interact"][data-id="阎基居"]'); await continueDialogue();
  await click('[data-action="battle-mode"][data-id="auto"]');
  await page.waitForFunction(() => window.mediaCalls.some(c => !c.loop), {timeout: 20_000});
  await click('[data-action="battle-mode"][data-id="manual"]');
  assert.ok((await state()).battle.events.some(e => e.kind === 'SkillCast' && e.audioId));
  pass('actual original battle SkillCast events dispatch resource-based sound effects, with music remaining muted');
} catch (error) {failure = error;}
await h.finish(failure);
