import './style.css';
import {loadRuntime, dispatch, exportSave, importSave} from './bridge';
import type {GameState, Result} from './bridge';
import {readSlot, writeSlot} from './storage';
import type {SaveSlot} from './storage';
import {Board} from './board';
import {battleShell as battleMarkup, updateBattleView} from './battle-view';
import {panelContent} from './panels';
import type {PanelName, InventoryFilter} from './panels';
import {readSettings, writeSettings, applySettings} from './settings';
import type {Settings} from './settings';

const app = document.querySelector<HTMLDivElement>('#app')!;
let state: GameState, slot: SaveSlot | undefined, busy = false, board: Board | undefined;
let screen = '', selectedSkill = '', enemyTimer: ReturnType<typeof setTimeout> | undefined;
let autoBattle = false, battlePaused = false;
let battleIntent: 'move' | 'attack' = 'move';
const settings = readSettings();
applySettings(settings);
let activePanel: PanelName | null = null, inventoryFilter: InventoryFilter = 'all';
const e = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
const plain = (text: string) => text.replace(/\[\[[a-z]+:([^\]]*)\]\]/gi, '$1').replace(/<\/?color[^>]*>/g, '');
const icon = (name: string) => {
  const paths: Record<string, string> = {
    save: '<path d="M5 3h12l4 4v14H3V3zM7 3v6h10V3M7 21v-9h10v9"/>',
    bag: '<path d="M8 3h8l-2 5c5 3 7 6 6 10-1 4-15 4-16 0-1-4 1-7 6-10zM9 8h6"/>',
    person: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    arrow: '<path d="m9 5 7 7-7 7M3 12h13"/>',
    moon: '<path d="M20 14A8 8 0 0 1 10 4a9 9 0 1 0 10 10z"/>',
    sword: '<path d="m5 20 4-4m-3-3 5 5M9 15 19 3l2 1-1 4-9 9"/>',
    leaf: '<path d="M21 3C8 2 1 9 5 17c7 6 16-3 16-14ZM4 21 16 9"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/>',
    upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-1 .4-1 1-1 2M12 17h.01"/>',
    settings: '<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3z"/><circle cx="12" cy="12" r="3"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.leaf}</svg>`;
};
function toast(message: string) {
  const node = document.querySelector<HTMLDivElement>('#toast')!;
  node.textContent = message; node.classList.add('visible');
  setTimeout(() => node.classList.remove('visible'), 3600);
}
function topbar(inGame = true) {
  return `<header class="topbar"><button class="wordmark" data-action="guide" aria-label="行走指南"><span class="seal small">侠</span><span>金庸群侠传<span class="wordmark-x">X</span><small>山水有相逢</small></span></button>
    <nav aria-label="游戏菜单">${inGame ? `<span class="chapter">初入江湖 <i></i> ${e(state.map?.name)}</span><button class="save-button" data-action="save" ${state.phase === 'battle' || state.phase === 'dialogue' || state.phase === 'choice' ? 'disabled' : ''}>${icon('save')}<span>保存进度</span></button>` : '<span class="edition">经典江湖 · 浏览器新篇</span>'}<button class="icon-button" data-action="settings" aria-label="设置">${icon('settings')}</button><button class="icon-button" data-action="guide" aria-label="帮助">${icon('help')}</button></nav></header>${inGame ? `<nav class="system-nav" aria-label="人物与江湖设置">${([['character', 'person', '人物'], ['equipment', 'sword', '装备'], ['cultivation', 'leaf', '功法修炼'], ['inventory', 'bag', '行囊'], ['settings', 'settings', '设置']] as const).map(([action, symbol, label]) => `<button data-action="${action}">${icon(symbol)}<span>${label}</span></button>`).join('')}</nav>` : ''}`;
}
function title() {
  return `${topbar(false)}<main class="title-screen"><div class="title-overline"><span></span> 第一回 · 初入江湖</div><h1>江湖路远，<br>今朝启程<span class="title-dot">。</span></h1><p class="title-copy">一卷山河，万般际遇。<br>自南贤居起，走自己的侠客路。</p><div class="title-actions"><button class="button primary" data-action="new" data-testid="new-game">初入江湖 ${icon('arrow')}</button><button class="button ghost" data-action="load" ${slot ? '' : 'disabled'}>续写前缘 ${slot ? `<small>${e(slot.name)} · 第 ${slot.level} 级</small>` : '<small>尚无存档</small>'}</button></div><button class="text-button import-link" data-action="import">${icon('upload')}导入存档</button><div class="chapter-note"><span class="chapter-numeral">壹</span><span>清风入竹，故人候君。<small>南贤居 · 晨</small></span></div></main><footer class="title-footer"><span>金庸群侠传 X · HTML5 重制初版</span><span>原创山水画卷 <span class="footer-rule"></span> 单机游玩 · 本地存档</span></footer>`;
}
function heroCard() {
  const hero = state.hero;
  return `<aside class="hero-card paper"><div class="eyebrow">江湖行客</div><div class="hero-heading"><div class="avatar">${e(hero.name.slice(0, 1))}</div><div><h2>${e(hero.name)}</h2><span>初入江湖 · 第 ${hero.level} 级</span></div></div><div class="vital"><label>气血 <span>${hero.hp} <small>/ ${hero.maxHp}</small></span></label><div class="bar hp"><i style="width:${100 * hero.hp / hero.maxHp}%"></i></div></div><div class="vital"><label>内力 <span>${hero.mp} <small>/ ${hero.maxMp}</small></span></label><div class="bar mp"><i style="width:${100 * hero.mp / hero.maxMp}%"></i></div></div><div class="hero-meta"><span>随身银两</span><strong>${state.silver.toLocaleString()} <small>两</small></strong></div><button class="text-button" data-action="character">查看人物 ${icon('arrow')}</button></aside>`;
}
function world() {
  const locations = (state.map?.locations ?? []).filter(location => ['南贤', '武师', '南贤居', '小村'].includes(location.id));
  const inVillage = state.map?.id === '小村';
  return `${topbar()}<main class="world-screen"><section class="location-heading"><div class="eyebrow">第一回 · 山水有相逢</div><h1>${e(state.map.name)}</h1><p>${e(state.map.description)}</p><span class="location-time">${icon('leaf')} 清风徐来 · 万物初醒</span></section>${heroCard()}<div class="map-spots" aria-label="当前地点">${locations.slice(0, 8).map((place, index) => `<button class="map-spot spot-${index}" data-action="interact" data-id="${e(place.id)}" title="${e(place.description)}"><span class="spot-glyph">${e(place.name.slice(0, 1))}</span><span>${e(place.name)}${icon('arrow')}</span></button>`).join('')}</div><section class="travel-panel paper"><div><div class="eyebrow">此间江湖</div><h2>走近一人，听一段往事。</h2><p>点击地点与人物，继续你的旅程。</p></div><div class="travel-actions"><button class="button primary" data-action="talk" data-id="${inVillage ? '武师' : '南贤'}">与${inVillage ? '武师' : '南贤'}交谈 ${icon('arrow')}</button><button class="button outline" data-action="${inVillage ? 'training' : 'interact'}" data-id="小村">${icon(inVillage ? 'sword' : 'arrow')} ${inVillage ? '切磋武艺' : '前往小村'}</button></div></section>${journal()}</main>${dialogueOverlay()}`;
}
function journal() {
  const logs = (state.logs ?? []).slice(-3).reverse();
  return logs.length ? `<aside class="journal"><span>江湖记事</span>${logs.map(line => `<p>${e(plain(line))}</p>`).join('')}</aside>` : '';
}
function dialogueOverlay() {
  if (state.phase !== 'dialogue' && state.phase !== 'choice') return '';
  const choice = state.phase === 'choice';
  return `<div class="dialogue-scrim"><section class="dialogue-panel paper" aria-label="剧情对话" aria-live="polite"><span class="dialogue-decoration">叙</span><div class="dialogue-content"><span class="eyebrow">此间故事</span><h2>${e(state.dialogue?.speaker || '江湖')}</h2><p data-testid="dialogue-text">${e(plain(state.dialogue?.text || ''))}</p>${choice ? `<div class="story-choices">${(state.choices ?? []).map((item, index) => `<button class="button outline" data-action="choice" data-index="${typeof item === 'string' ? index : item.index ?? index}"><span>${String(index + 1).padStart(2, '0')}</span>${e(typeof item === 'string' ? item : item.text ?? item.label ?? item.id)}${icon('arrow')}</button>`).join('')}</div>` : '<button class="text-button dialogue-next" data-action="next">继续 ' + icon('arrow') + '</button>'}</div></section></div>`;
}
function ended() {
  const value = state.battle?.outcome;
  return !!value && !['none', 'ongoing', 'inprogress', 'unknown', 'notended'].includes(String(value).toLowerCase());
}
function battleShell() {return topbar() + battleMarkup(state);}
function updateBattle() {
  selectedSkill = updateBattleView({
    state, busy: busy || modalOpen(), selectedSkill, autoBattle, paused: battlePaused, intent: battleIntent,
    battleSpeed: settings.battleSpeed, showGrid: settings.showGrid,
    showDamage: settings.showDamage, reducedMotion: settings.reducedMotion,
  }, board);
}
function modalOpen() {return !!document.querySelector('#game-modal[open]');}
function scheduleBattle() {
  clearTimeout(enemyTimer);
  if (busy || battlePaused || modalOpen() || state.phase !== 'battle' || !state.battle || ended()) return;
  const active = state.battle.units.find(unit => unit.id === state.battle!.activeUnitId);
  if (!active || active.team !== 1 || autoBattle)
    enemyTimer = setTimeout(() => {
      if (!modalOpen() && !busy && !battlePaused) void command({type: 'autoTurn'});
    }, settings.reducedMotion ? 180 / settings.battleSpeed : 850 / settings.battleSpeed);
}
function render() {
  if (!state) return;
  const nextScreen = state.phase === 'title' ? 'title' : state.phase === 'battle' && state.battle ? 'battle' : 'world';
  if (nextScreen === 'battle' && screen === 'battle') { updateBattle(); return; }
  board?.destroy(); board = undefined;
  if (nextScreen === 'battle') {autoBattle = settings.battleMode === 'auto'; battlePaused = false; battleIntent = 'move'; selectedSkill = '';}
  else autoBattle = false;
  screen = nextScreen;
  app.className = `app ${screen}-app`;
  app.innerHTML = nextScreen === 'title' ? title() : nextScreen === 'battle' ? battleShell() : world();
  app.setAttribute('aria-busy', String(busy));
  if (nextScreen === 'battle') {
    board = new Board(document.querySelector('#board-viewport')!, (x, y) => {
      if (busy || ended() || autoBattle || battlePaused || modalOpen()) return;
      const target = state.battle!.units.find(unit => unit.alive && unit.x === x && unit.y === y);
      const canTarget = state.battle!.targets?.some(point => point.skillId === selectedSkill && point.x === x && point.y === y);
      if (canTarget && (battleIntent === 'attack' || target && target.team !== 1)) {
        void command({type: 'attack', skillId: selectedSkill, targetId: target?.id, x, y});
        battleIntent = 'move';
      }
      else if (battleIntent === 'move' && state.battle!.reachable.some(point => point.x === x && point.y === y)) void command({type: 'move', x, y});
      else toast('请点击高亮格移动，或选择武功后点击橙色目标格出招。');
    });
    updateBattle();
  }
}
function applyResult(result: Result) {
  if (!result.ok) throw new Error(result.error || '此次行动未能完成。');
  state = result.state;
  render();
}
async function command(data: Record<string, unknown>) {
  if (busy) return false;
  clearTimeout(enemyTimer); busy = true; app.setAttribute('aria-busy', 'true');
  let success = false;
  if (screen === 'battle') updateBattle();
  refreshPanel();
  try { applyResult(await dispatch(data)); success = true; }
  catch (error) {console.error(error); toast(error instanceof Error ? error.message : '此次行动未能完成。');}
  finally {busy = false; app.setAttribute('aria-busy', 'false'); if (screen === 'battle') updateBattle(); refreshPanel();}
  scheduleBattle();
  return success;
}
function modal(titleText: string, content: string, wide = false) {
  clearTimeout(enemyTimer);
  if (!wide) activePanel = null;
  document.querySelector('#game-modal')?.remove();
  const node = document.createElement('dialog'); node.id = 'game-modal'; node.className = `paper game-modal${wide ? ' system-modal' : ''}`;
  node.innerHTML = `<button class="icon-button close-modal" data-action="close-modal" aria-label="关闭">${icon('close')}</button><div class="eyebrow">江湖一页</div><h2>${e(titleText)}</h2>${content}`;
  document.body.append(node); node.showModal();
  node.addEventListener('close', () => {activePanel = null; if (screen === 'battle') updateBattle(); scheduleBattle();});
  node.addEventListener('click', event => {if (event.target === node) node.close();});
  if (screen === 'battle') updateBattle();
}
function createCharacter() {
  modal('请留侠名', `<p class="modal-intro">江湖故事，从你的名字开始。</p><form id="character-form"><label class="form-label" for="hero-name">侠客姓名</label><input id="hero-name" name="name" value="小虾米" minlength="1" maxlength="12" autocomplete="off" required autofocus><label class="form-label" for="difficulty">行走难度</label><select id="difficulty" name="difficulty"><option value="normal">简单 · 初识江湖</option><option value="hard">进阶 · 小试锋芒</option><option value="crazy">炼狱 · 千锤百炼</option></select><p class="field-note">难度影响战斗规则与历练所得。</p><button class="button primary full-width" type="submit">踏入江湖 ${icon('arrow')}</button></form>`);
}
async function save() {
  if (busy || state.phase !== 'world') return;
  try {
    const data = await exportSave();
    const parsed = JSON.parse(data);
    if (parsed.error || parsed.ok === false) throw new Error(parsed.error || '无法保存当前进度。');
    slot = {version: 1, savedAt: new Date().toISOString(), name: state.hero.name, level: state.hero.level, map: state.map.name, data};
    await writeSlot(slot); toast('此刻江湖，已记入行囊。');
  } catch (error) {console.error(error); toast('保存未能完成，请导出存档备份后重试。');}
}
async function load() {
  if (!slot || busy) return;
  try { applyResult(await importSave(slot.data)); toast('旧事续上，江湖如故。'); }
  catch (error) {console.error(error); toast('存档未能读取，请检查存档文件。');}
}
function openPanel(name: PanelName) {
  if (state.phase === 'title' && name !== 'settings') return;
  activePanel = name;
  if (name === 'inventory') inventoryFilter = 'all';
  const content = panelContent(name, state, settings, busy, inventoryFilter);
  modal(content.title, content.content, true);
}
function refreshPanel() {
  const node = document.querySelector<HTMLDialogElement>('#game-modal[open]');
  if (!node || !activePanel) return;
  const scroll = node.scrollTop;
  const content = panelContent(activePanel, state, settings, busy, inventoryFilter);
  node.innerHTML = `<button class="icon-button close-modal" data-action="close-modal" aria-label="关闭">${icon('close')}</button><div class="eyebrow">江湖一页</div><h2>${e(content.title)}</h2>${content.content}`;
  node.scrollTop = scroll;
}
async function manage(data: Record<string, unknown>, message: string) {
  if (await command(data)) toast(message);
}
function battleMode(mode: 'manual' | 'auto') {
  clearTimeout(enemyTimer);
  autoBattle = mode === 'auto'; battlePaused = false;
  settings.battleMode = mode;
  if (!writeSettings(settings)) toast('设置已在本次游玩生效，但此浏览器暂不能保存设置。');
  updateBattle(); scheduleBattle();
}
document.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!button || button.matches(':disabled')) return;
  const action = button.dataset.action;
  if (action === 'new') createCharacter();
  else if (action === 'close-modal') document.querySelector<HTMLDialogElement>('#game-modal')?.close();
  else if (action === 'save') void save();
  else if (action === 'load') void load();
  else if (action === 'import') document.querySelector<HTMLInputElement>('#import-file')!.click();
  else if (action === 'training') void command({type: 'startTraining'});
  else if (action === 'talk') void command({type: 'talk', locationId: button.dataset.id});
  else if (action === 'interact') void command({type: 'interact', locationId: button.dataset.id});
  else if (action === 'next') void command({type: 'next'});
  else if (action === 'choice') void command({type: 'choose', index: Number(button.dataset.index)});
  else if (action === 'rest') void command({type: 'rest'});
  else if (action === 'auto') battleMode(autoBattle ? 'manual' : 'auto');
  else if (action === 'battle-mode' && (button.dataset.id === 'manual' || button.dataset.id === 'auto')) battleMode(button.dataset.id);
  else if (action === 'battle-pause') {battlePaused = !battlePaused; clearTimeout(enemyTimer); updateBattle(); scheduleBattle();}
  else if (action === 'battle-speed') {const speed = Number(button.dataset.id); if (speed === 1 || speed === 2 || speed === 4) {settings.battleSpeed = speed; writeSettings(settings); updateBattle(); scheduleBattle();}}
  else if (action === 'leave-battle') void command({type: 'leaveBattle'});
  else if (action === 'skill') {selectedSkill = button.dataset.id!; battleIntent = 'attack'; updateBattle();}
  else if (action === 'battle-intent' && (button.dataset.id === 'move' || button.dataset.id === 'attack')) {battleIntent = button.dataset.id; updateBattle();}
  else if (action === 'character' || action === 'inventory' || action === 'equipment' || action === 'cultivation' || action === 'settings') openPanel(action);
  else if (action === 'inventory-filter') {inventoryFilter = button.dataset.id as InventoryFilter; refreshPanel();}
  else if (action === 'equip-item') void manage({type: 'equipItem', entryNumber: Number(button.dataset.entryNumber)}, '装备已穿戴，人物属性已更新。');
  else if (action === 'unequip-item') void manage({type: 'unequipItem', slot: button.dataset.slot}, '装备已放回行囊。');
  else if (action === 'cultivate') void manage({type: 'setCultivation', entryNumber: Number(button.dataset.entryNumber)}, '已选择修炼秘籍，战斗结算后获得修炼经验。');
  else if (action === 'clear-cultivation') void manage({type: 'clearCultivation'}, '已暂停这部秘籍的修炼，已学武功和经验保留。');
  else if (action === 'equip-internal') void manage({type: 'equipInternalSkill', skillId: button.dataset.id}, '已设为主运内功。');
  else if (action === 'clear-internal') void manage({type: 'clearInternalSkill'}, '已停止主运内功。');
  else if (action === 'toggle-skill') void manage({type: 'setExternalSkillActive', skillId: button.dataset.id, active: button.dataset.active === 'true'}, button.dataset.active === 'true' ? '招式已启用。' : '招式已停用。');
  else if (action === 'use-item') void manage({type: 'useItem', entryNumber: Number(button.dataset.entryNumber)}, '物品已使用。');
  else if (action === 'guide') modal('行走指南', '<p class="guide-text">点击地图人物继续剧情。拿到《内功入门》后，在“功法修炼”选择秘籍；主运内功与秘籍修炼可分别调整。装备与丹药可在行囊使用。<br><br>手动战斗时，青色格表示可移动的位置。选择武学，点击橙色目标格施展；有些招式可对自己使用。也可切换自动战斗、调整倍速，或暂停观察。<br><br>打开人物、设置等面板时战斗暂停。离开战斗后可保存进度；清除网站数据前请在行囊导出备份。</p>');
  else if (action === 'download-save') void (async () => {
    try {const data = await exportSave(); const parsed = JSON.parse(data); if (parsed.error || parsed.ok === false) throw new Error(parsed.error || '无法导出当前进度。'); const href = URL.createObjectURL(new Blob([data], {type: 'application/json'})); const link = document.createElement('a'); link.href = href; link.download = `江湖-${state.hero.name}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);}
    catch (error) {console.error(error); toast('导出未能完成，请先离开战斗。');}
  })();
});
document.addEventListener('change', event => {
  const control = event.target;
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement) || !control.closest('#game-settings')) return;
  const name = control.name as keyof Settings;
  if (name === 'battleMode' && (control.value === 'manual' || control.value === 'auto')) {
    settings.battleMode = control.value;
    if (screen === 'battle') {autoBattle = control.value === 'auto'; battlePaused = false;}
  } else if (name === 'battleSpeed') {
    const speed = Number(control.value);
    if (speed === 1 || speed === 2 || speed === 4) settings.battleSpeed = speed;
  } else if (control instanceof HTMLInputElement && ['showGrid', 'showDamage', 'reducedMotion', 'largeText'].includes(name)) {
    settings[name as 'showGrid' | 'showDamage' | 'reducedMotion' | 'largeText'] = control.checked;
  }
  if (!writeSettings(settings)) toast('设置已在本次游玩生效，但此浏览器暂不能保存设置。');
  if (screen === 'battle') updateBattle();
  scheduleBattle();
});
document.addEventListener('submit', event => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'character-form') return;
  event.preventDefault();
  const form = new FormData(event.target), name = String(form.get('name') || '').trim();
  if (!name) return;
  document.querySelector<HTMLDialogElement>('#game-modal')!.close();
  void command({type: 'createCharacter', name, difficulty: form.get('difficulty')});
});
document.querySelector<HTMLInputElement>('#import-file')!.addEventListener('change', async event => {
  const input = event.target as HTMLInputElement, file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('存档文件过大。');
    const data = await file.text(); applyResult(await importSave(data));
    slot = {version: 1, savedAt: new Date().toISOString(), name: state.hero.name, level: state.hero.level, map: state.map.name, data};
    await writeSlot(slot); toast('存档已导入。');
  } catch (error) {console.error(error); toast('无法导入此存档，请使用本版导出的存档文件。');}
  finally {input.value = '';}
});
async function boot() {
  try {
    slot = await readSlot().catch(() => undefined);
    const result = await loadRuntime(message => {const text = document.querySelector('#loading-message'); if (text) text.textContent = message;});
    applyResult(result);
  } catch (error) {
    console.error(error);
    app.innerHTML = '<main class="loading-screen"><span class="seal">侠</span><h1>画卷暂未展开</h1><p>加载未能完成，请刷新后重试。</p><button class="button primary" onclick="location.reload()">重新载入</button></main>';
  }
}
void boot();
