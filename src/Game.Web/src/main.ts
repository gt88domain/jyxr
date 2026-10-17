import './style.css';
import {loadRuntime, initializePack, dispatch, exportSave, importSave} from './bridge';
import type {GameState, Result} from './bridge';
import {readSlot, writeSlot} from './storage';
import type {SaveSlot} from './storage';
import {Board} from './board';
import {packIndex, assetUrl} from './content';
import type {PackListing} from './content';
import {titleView, worldView, shopView, sectView, currency} from './world';
import {battleShell as battleMarkup, updateBattleView} from './battle-view';
import {panelContent} from './panels';
import {creationView} from './creation';
import {interactionView} from './interactions';
import {miniGameView, MiniGameController} from './minigame';
import type {PanelName, InventoryFilter} from './panels';
import {readSettings, writeSettings, applySettings} from './settings';
import type {Settings} from './settings';
import {estimatedProgress, restorationProgressView} from './restoration-progress';
import {loadCompanionCatalog, mountCompanionCatalog} from './companions';
import {loadOriginalLibrary, mountOriginalLibrary} from './library';

const app = document.querySelector<HTMLDivElement>('#app')!;
let state: GameState, slot: SaveSlot | undefined, busy = false, board: Board | undefined;
let training: MiniGameController | undefined;
let screen = '', selectedSkill = '', enemyTimer: ReturnType<typeof setTimeout> | undefined;
let autoBattle = false, battlePaused = false;
let battleIntent: 'move' | 'attack' = 'move';
let packs: PackListing[] = [];
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
  const pack = state.pack;
  const menus = [['character', 'person', '人物'], ['equipment', 'sword', '装备'], ['cultivation', 'leaf', pack.terms?.cultivation || '功法修炼'], ['inventory', 'bag', '行囊'], ['party', 'person', '队伍'], ['quests', 'leaf', '目标'], ['settings', 'settings', '设置']];
  if(pack.id==='jyx')menus.splice(5,0,['library','person','资料']);
  return `<header class="topbar"><button class="wordmark" data-action="guide" aria-label="游玩指南"><span class="seal small">${e(pack.title.slice(0,1))}</span><span>${e(pack.title)}<small>${e(pack.subtitle)}</small></span></button>
    <nav aria-label="游戏菜单">${inGame ? `<span class="chapter">${e(state.map?.name)}</span><button class="save-button" data-action="save" ${state.phase !== 'world' ? 'disabled' : ''}>${icon('save')}<span>保存进度</span></button>` : ''}<button class="icon-button" data-action="worlds" aria-label="切换世界">${icon('leaf')}</button><button class="icon-button" data-action="settings" aria-label="设置">${icon('settings')}</button><button class="icon-button" data-action="guide" aria-label="帮助">${icon('help')}</button></nav></header>${inGame ? `<nav class="system-nav" aria-label="角色与世界设置">${menus.map(([action,symbol,label]) => `<button data-action="${action}">${icon(symbol)}<span>${e(label)}</span></button>`).join('')}</nav>` : ''}`;
}
function title() {
  const progress = state.pack.id === 'jyx' ? `<div class="restoration-callout"><button class="restoration-entry" data-action="library">原版资料馆 · 全量资料与版本对照<small>人物、武学、道具、初始配置、剧情和关联引用 →</small></button><button class="restoration-entry" data-action="companions">伙伴图鉴 · 剧情加入条件<small>剧情基线65个形态；后期另有43个开局候选，见资料馆 →</small></button><button class="restoration-entry" data-action="progress">原版复原 · 约 ${estimatedProgress}%<small>工程估算 · 查看分项进度、已知问题与改善建议 →</small></button></div>` : '';
  return topbar(false) + progress + titleView(state, slot, packs);
}
function heroCard() {
  const hero = state.hero;
  return `<aside class="hero-card paper"><div class="eyebrow">旅途行者</div><div class="hero-heading"><div class="avatar">${hero.portrait ? `<img src="${e(assetUrl(hero.portrait))}" alt="">` : e(hero.name.slice(0, 1))}</div><div><h2>${e(hero.name)}</h2><span>旅程初始 · 第 ${hero.level} 级</span></div></div><div class="vital"><label>气血 <span>${hero.hp} <small>/ ${hero.maxHp}</small></span></label><div class="bar hp"><i style="width:${100 * hero.hp / hero.maxHp}%"></i></div></div><div class="vital"><label>${e(state.pack.terms?.energy || '内力')} <span>${hero.mp} <small>/ ${hero.maxMp}</small></span></label><div class="bar mp"><i style="width:${100 * hero.mp / hero.maxMp}%"></i></div></div><div class="hero-meta"><span>随身${e(state.pack.currencyName || '钱币')}</span><strong>${state.silver.toLocaleString()} <small>${e(currency(state))}</small></strong></div><button class="text-button" data-action="manage-character" data-id="${e(hero.id)}">查看人物 ${icon('arrow')}</button></aside>`;
}
function world() {return topbar() + worldView(state, heroCard()) + dialogueOverlay() + shopView(state) + sectView(state) + interactionView(state) + (state.phase === 'minigame' && state.miniGame ? miniGameView(state.miniGame) : '');}
function dialogueOverlay() {
  if (state.phase !== 'dialogue' && state.phase !== 'choice') return '';
  const choice = state.phase === 'choice';
  return `<div class="dialogue-scrim"><section class="dialogue-panel paper" aria-label="剧情对话" aria-live="polite">${state.dialogue?.portrait ? `<img class="dialogue-portrait" src="${e(assetUrl(state.dialogue.portrait))}" alt="">` : '<span class="dialogue-decoration">叙</span>'}<div class="dialogue-content"><span class="eyebrow">此间故事</span><h2>${e(state.dialogue?.speaker || '江湖')}</h2><p data-testid="dialogue-text">${e(plain(state.dialogue?.text || ''))}</p>${choice ? `<div class="story-choices">${(state.choices ?? []).map((item, index) => `<button class="button outline" data-action="choice" data-index="${typeof item === 'string' ? index : item.index ?? index}"><span>${String(index + 1).padStart(2, '0')}</span>${e(typeof item === 'string' ? item : item.text ?? item.label ?? item.id)}${icon('arrow')}</button>`).join('')}</div>` : '<button class="text-button dialogue-next" data-action="next">继续 ' + icon('arrow') + '</button>'}</div></section></div>`;
}
function ended() {
  const value = state.battle?.outcome;
  return !!value && !['none', 'ongoing', 'inprogress', 'unknown', 'notended'].includes(String(value).toLowerCase());
}
function battleShell() {return topbar() + battleMarkup(state);}
function updateBattle() {
  selectedSkill = updateBattleView({
    state, busy: busy || modalOpen(), selectedSkill, autoBattle, paused: battlePaused || modalOpen(), intent: battleIntent,
    battleSpeed: settings.battleSpeed, showGrid: settings.showGrid,
    showDamage: settings.showDamage, battleLighting: settings.battleLighting, reducedMotion: settings.reducedMotion,
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
  training?.destroy(); training=undefined;
  const nextScreen = state.phase === 'title' ? 'title' : state.phase === 'battle' && state.battle ? 'battle' : 'world';
  if (nextScreen === 'battle' && screen === 'battle') { updateBattle(); return; }
  board?.destroy(); board = undefined;
  if (nextScreen === 'battle') {autoBattle = settings.battleMode === 'auto'; battlePaused = false; battleIntent = 'move'; selectedSkill = '';}
  else autoBattle = false;
  screen = nextScreen;
  app.className = `app ${screen}-app`;
  document.documentElement.dataset.pack = state.pack.id;
  const sceneArt = screen === 'title' ? state.pack.media?.titleBackground : state.sceneBackground || state.map?.background || state.pack.media?.worldBackground;
  app.style.backgroundImage = sceneArt ? `url("${assetUrl(sceneArt)}")` : '';
  document.title = `${state.pack.title} · ${state.pack.subtitle || '浏览器冒险'}`;
  app.innerHTML = nextScreen === 'title' ? title() : nextScreen === 'battle' ? battleShell() : world();
  app.setAttribute('aria-busy', String(busy));
  if(state.phase==='minigame' && state.miniGame) training=new MiniGameController(app,state.miniGame,()=>command({type:'finishMiniGame'}),error=>{console.error(error);toast(error instanceof Error?error.message:'修炼未能完成。');});
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
    }, state.battle!);
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
  training?.pause();
  if (!wide) activePanel = null;
  document.querySelector('#game-modal')?.remove();
  const node = document.createElement('dialog'); node.id = 'game-modal'; node.className = `paper game-modal${wide ? ' system-modal' : ''}`;
  node.innerHTML = `<button class="icon-button close-modal" data-action="close-modal" aria-label="关闭">${icon('close')}</button><div class="eyebrow">旅途一页</div><h2>${e(titleText)}</h2>${content}`;
  document.body.append(node); node.showModal();
  node.addEventListener('close', () => {activePanel = null; if (node.classList.contains('creation-modal') && state.creation && !busy) void command({type: 'cancelCreation'}); if (screen === 'battle') updateBattle(); scheduleBattle();});
  node.addEventListener('click', event => {if (event.target === node) node.close();});
  if (screen === 'battle') updateBattle();
}
async function showRestorationProgress() {
  modal('原版复原进度', '<div data-restoration-report aria-live="polite">正在读取进度记录…</div>', true);
  const target = document.querySelector<HTMLElement>('[data-restoration-report]')!;
  try {
    const content = await restorationProgressView();
    if (target.isConnected && modalOpen()) target.innerHTML = content;
  } catch (error) {
    if (target.isConnected && modalOpen()) target.textContent = error instanceof Error ? error.message : '进度记录暂时无法读取。';
  }
}
async function showCompanions() {
  if(state.pack.id!=='jyx')return;
  modal('伙伴图鉴 · 加入条件', '<div data-companion-catalog aria-live="polite">正在整理伙伴线索…</div>', true);
  const target=document.querySelector<HTMLElement>('[data-companion-catalog]')!;
  try {
    const data=await loadCompanionCatalog();
    if(target.isConnected&&modalOpen())mountCompanionCatalog(target,data,state);
  } catch(error) {
    if(target.isConnected&&modalOpen())target.textContent=error instanceof Error?error.message:'伙伴图鉴暂时无法读取。';
  }
}
async function showOriginalLibrary(initial?: {category?: string; id?: string}) {
  if(state.pack.id!=='jyx')return;
  modal('原版资料馆', '<div data-original-library aria-live="polite">正在整理原版资料…</div>', true);
  const target=document.querySelector<HTMLElement>('[data-original-library]')!;
  try {
    const data=await loadOriginalLibrary();
    if(target.isConnected&&modalOpen())mountOriginalLibrary(target,data,initial);
  } catch(error) {
    if(target.isConnected&&modalOpen())target.textContent=error instanceof Error?error.message:'资料暂时无法读取。';
  }
}
function createCharacter() {
  modal('为旅人命名', `<p class="modal-intro">${e(state.pack.title)}的故事，从你的名字开始。</p><form id="character-form"><label class="form-label" for="hero-name">角色姓名</label><input id="hero-name" name="name" value="${e(state.pack.defaultName || '旅人')}" minlength="1" maxlength="12" autocomplete="off" required autofocus><label class="form-label" for="difficulty">行走难度</label><select id="difficulty" name="difficulty"><option value="normal">普通 · 初次冒险</option><option value="hard">困难 · 迎接挑战</option><option value="crazy">炼狱 · 千锤百炼</option></select><p class="field-note">难度影响战斗规则与历练所得。</p><button class="button primary full-width" type="submit">开始旅程 ${icon('arrow')}</button></form>`);
}
async function creationCommand(data: Record<string, unknown>) {
  if (!await command(data)) return;
  if (state.creation) {
    const view = creationView(state.creation);
    modal(view.title, view.content, true);
    document.querySelector('#game-modal')!.classList.add('creation-modal');
  } else document.querySelector<HTMLDialogElement>('#game-modal')?.close();
}
async function save() {
  if (busy || !(state.phase === 'world' || state.phase === 'ending' && state.ending && ['restart','next','complete'].includes(state.ending.kind))) return;
  busy = true; app.setAttribute('aria-busy', 'true');
  try {
    const data = await exportSave(), parsed = JSON.parse(data);
    if (parsed.error || parsed.ok === false) throw new Error(parsed.error || '无法保存当前进度。');
    slot = {version: 1, packId: state.pack.id, savedAt: new Date().toISOString(), name: state.hero.name, level: state.hero.level, map: state.map.name, data};
    await writeSlot(slot);
    applyResult(await dispatch({type: 'state'}));
    toast('当前世界的进度已保存。');
  } catch (error) {console.error(error); toast('保存未能完成，请导出存档备份后重试。');}
  finally {busy = false; app.setAttribute('aria-busy', 'false'); refreshPanel();}
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
  node.innerHTML = `<button class="icon-button close-modal" data-action="close-modal" aria-label="关闭">${icon('close')}</button><div class="eyebrow">旅途一页</div><h2>${e(content.title)}</h2>${content.content}`;
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
function chooseWorld() {
  activePanel = null;
  modal('选择冒险世界', `<p class="panel-intro">两个世界分别保存进度。地图上的当前进度会在切换前保存；对话、商店和战斗中无法保存，请先结束当前流程再切换，以免丢失未保存进度。</p><section class="pack-picker">${packs.map(p => `<button class="pack-choice ${p.id === state.pack.id ? 'selected' : ''}" data-action="select-pack" data-id="${e(p.id)}"><strong>${e(p.title)}</strong><small>${e(p.description)}</small></button>`).join('')}</section>`, true);
}
async function selectPack(id: string) {
  if (busy || !packs.some(p => p.id === id)) return;
  clearTimeout(enemyTimer);
  busy = true; app.setAttribute('aria-busy','true');
  try {
    if (state.phase === 'world') {
      const data = await exportSave(), parsed = JSON.parse(data);
      if (parsed.error) throw new Error(parsed.error);
      await writeSlot({version:1,packId:state.pack.id,savedAt:new Date().toISOString(),name:state.hero.name,level:state.hero.level,map:state.map.name,data});
    }
    const saved = await readSlot(id).catch(() => undefined);
    const next = await initializePack(id);
    if (!next.ok) throw new Error(next.error || '世界未能打开。');
    document.querySelector('#game-modal')?.remove(); activePanel = null;
    slot = saved;
    applyResult(next);
    const url = new URL(location.href); url.searchParams.set('pack',id); history.replaceState(null,'',url);
  } catch (error) {console.error(error); toast(error instanceof Error ? error.message : '世界未能打开。');}
  finally {busy=false; app.setAttribute('aria-busy','false'); scheduleBattle();}
}
function shopQuantity() {
  const value = Number(document.querySelector<HTMLInputElement>('#shop-quantity')?.value || 1);
  if (!Number.isInteger(value) || value < 1 || value > 99) {toast('每次交易数量请填写 1 至 99 的整数。'); return null;}
  return value;
}
document.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!button || button.matches(':disabled')) return;
  const action = button.dataset.action;
  if (action === 'new') createCharacter();
  else if (action === 'creation-answer') void creationCommand({type: 'answerCreation', index: Number(button.dataset.index), questionIndex: Number(button.dataset.question)});
  else if (action === 'creation-portrait') void creationCommand({type: 'selectCreationPortrait', portraitId: button.dataset.id});
  else if (action === 'creation-back') void creationCommand({type: 'backCreation'});
  else if (action === 'creation-roll') void creationCommand({type: 'rollCreation'});
  else if (action === 'creation-confirm') void creationCommand({type: 'confirmCreation'});
  else if (action === 'begin-round-creation') void creationCommand({type:'beginRoundCreation'});
  else if (action === 'save-ending') void save();
  else if (action === 'manage-character') void (async()=>{if(await command({type:'selectCharacter',characterId:button.dataset.id})) openPanel('character');})();
  else if (action === 'allocate-stat') void manage({type:'allocateStat',stat:button.dataset.stat},'属性点已分配。');
  else if (action === 'party-placement') void manage({type:'setPartyPlacement',characterId:button.dataset.id,placement:button.dataset.placement},'队伍已调整。');
  else if (action === 'party-order') void manage({type:'reorderParty',characterId:button.dataset.id,index:Number(button.dataset.index)},'队伍顺序已调整。');
  else if (action === 'chest') openPanel('chest');
  else if (action === 'return-title') void selectPack(state.pack.id);
  else if (action === 'close-chest') void command({type:'closeChest'});
  else if (action === 'chest-deposit' || action === 'chest-withdraw') void manage({type:action === 'chest-deposit'?'chestDeposit':'chestWithdraw',entryNumber:Number(button.dataset.entryNumber)},'储物箱已更新。');
  else if (action === 'worlds') chooseWorld();
  else if (action === 'select-pack') void selectPack(button.dataset.id!);
  else if (action === 'close-shop') void command({type:'closeShop'});
  else if (action === 'select-sect') void command({type:'selectSect',sectId:button.dataset.id});
  else if (action === 'buy-item') {const quantity = shopQuantity(); if (quantity) void command({type:'buy',productId:button.dataset.id,quantity});}
  else if (action === 'sell-item') {const quantity = shopQuantity(); if (quantity) void command({type:'sell',entryNumber:Number(button.dataset.entryNumber),quantity});}
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
  else if (action === 'character' || action === 'inventory' || action === 'equipment' || action === 'cultivation' || action === 'settings' || action === 'party' || action === 'quests') openPanel(action);
  else if (action === 'inventory-filter') {inventoryFilter = button.dataset.id as InventoryFilter; refreshPanel();}
  else if (action === 'equip-item') void manage({type: 'equipItem', entryNumber: Number(button.dataset.entryNumber)}, '装备已穿戴，人物属性已更新。');
  else if (action === 'unequip-item') void manage({type: 'unequipItem', slot: button.dataset.slot}, '装备已放回行囊。');
  else if (action === 'cultivate') void manage({type: 'setCultivation', entryNumber: Number(button.dataset.entryNumber)}, '已选择修炼秘籍，战斗结算后获得修炼经验。');
  else if (action === 'clear-cultivation') void manage({type: 'clearCultivation'}, '已暂停这部秘籍的修炼，已学武功和经验保留。');
  else if (action === 'equip-internal') void manage({type: 'equipInternalSkill', skillId: button.dataset.id}, '已设为主运内功。');
  else if (action === 'clear-internal') void manage({type: 'clearInternalSkill'}, '已停止主运内功。');
  else if (action === 'toggle-skill') void manage({type: 'setExternalSkillActive', skillId: button.dataset.id, active: button.dataset.active === 'true'}, button.dataset.active === 'true' ? '招式已启用。' : '招式已停用。');
  else if (action === 'use-item') {
    const target=document.querySelector<HTMLSelectElement>(`.battle-item-target[data-entry-number="${button.dataset.entryNumber}"]`);
    void manage({type:'useItem',entryNumber:Number(button.dataset.entryNumber),...(target?{targetId:target.value}:{})},'物品已使用。');
  }
  else if (action === 'companions') void showCompanions();
  else if (action === 'library') void showOriginalLibrary();
  else if (action === 'progress') void showRestorationProgress();
  else if (action === 'guide') modal('行走指南', '<p class="guide-text">点击地图上的人物或地点继续剧情，在“目标”查看当前章节。获得修炼书后，在修炼面板选择；运行的心法与正在研习的书可分别调整。装备和补给可在行囊使用，伙伴可在队伍查看。<br><br>手动战斗时，青色格表示可移动的位置。选择战技，点击橙色目标格施展；有些招式可对自己使用。也可切换自动战斗、调整倍速，或暂停观察。<br><br>打开人物、设置等面板时战斗暂停。离开战斗、对话和商店后可保存进度。两套世界分别存档；清除网站数据前请在行囊导出备份。</p>' + (state.pack.id === 'jyx' ? '<button class="button outline full-width" data-action="progress">查看复原进度、问题与改善建议</button>' : ''));
  else if (action === 'download-save') void (async () => {
    try {const data = await exportSave(); const parsed = JSON.parse(data); if (parsed.error || parsed.ok === false) throw new Error(parsed.error || '无法导出当前进度。'); const href = URL.createObjectURL(new Blob([data], {type: 'application/json'})); const link = document.createElement('a'); link.href = href; link.download = `${state.pack.title}-${state.hero.name}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);}
    catch (error) {console.error(error); toast('导出未能完成，请先离开战斗。');}
  })();
});
document.addEventListener('change', event => {
  const control = event.target;
  if (control instanceof HTMLSelectElement && control.id === 'managed-character') {void command({type:'selectCharacter',characterId:control.value}); return;}
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement) || !control.closest('#game-settings')) return;
  const name = control.name as keyof Settings;
  if (name === 'battleMode' && (control.value === 'manual' || control.value === 'auto')) {
    settings.battleMode = control.value;
    if (screen === 'battle') {autoBattle = control.value === 'auto'; battlePaused = false;}
  } else if (name === 'battleSpeed') {
    const speed = Number(control.value);
    if (speed === 1 || speed === 2 || speed === 4) settings.battleSpeed = speed;
  } else if (control instanceof HTMLInputElement && ['showGrid', 'showDamage', 'battleLighting', 'reducedMotion', 'largeText'].includes(name)) {
    settings[name as 'showGrid' | 'showDamage' | 'battleLighting' | 'reducedMotion' | 'largeText'] = control.checked;
  }
  if (!writeSettings(settings)) toast('设置已在本次游玩生效，但此浏览器暂不能保存设置。');
  if (screen === 'battle') updateBattle();
  scheduleBattle();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state?.phase === 'shop' && !modalOpen()) {
    event.preventDefault(); void command({type: 'closeShop'});
  }
});
document.addEventListener('input', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.id !== 'destination-search') return;
  const text = input.value.trim().toLocaleLowerCase();
  document.querySelectorAll<HTMLElement>('.chapter-locations .map-spot').forEach(button => {
    button.hidden = !button.textContent?.toLocaleLowerCase().includes(text);
  });
});
document.addEventListener('submit', event => {
  if(event.target instanceof HTMLFormElement && event.target.id === 'combatants-form'){
    event.preventDefault();
    void command({type:'selectCombatants',characterIds:new FormData(event.target).getAll('character')});return;
  }
  if(event.target instanceof HTMLFormElement && event.target.id === 'heroine-name-form'){
    event.preventDefault();
    void command({type:'renameHeroine',name:new FormData(event.target).get('name')});return;
  }
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'character-form') return;
  event.preventDefault();
  const form = new FormData(event.target), name = String(form.get('name') || '').trim();
  if (!name) return;
  document.querySelector<HTMLDialogElement>('#game-modal')!.close();
  if ('creation' in state.pack) void creationCommand({type: 'beginCreation', name, difficulty: form.get('difficulty')});
  else void command({type: 'createCharacter', name, difficulty: form.get('difficulty')});
});
document.querySelector<HTMLInputElement>('#import-file')!.addEventListener('change', async event => {
  const input = event.target as HTMLInputElement, file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('存档文件过大。');
    const data = await file.text(); applyResult(await importSave(data));
    slot = {version: 1, packId: state.pack.id, savedAt: new Date().toISOString(), name: state.hero.name, level: state.hero.level, map: state.map.name, data};
    await writeSlot(slot); toast('存档已导入。');
  } catch (error) {console.error(error); toast('无法导入此存档，请使用本版导出的存档文件。');}
  finally {input.value = '';}
});
async function boot() {
  try {
    const catalog = await packIndex(); packs = catalog.packs;
    const requested = new URL(location.href).searchParams.get('pack') || catalog.defaultPackId;
    const id = packs.some(p => p.id === requested) ? requested : catalog.defaultPackId;
    slot = await readSlot(id).catch(() => undefined);
    const result = await loadRuntime(message => {const text = document.querySelector('#loading-message'); if (text) text.textContent = message;}, id);
    applyResult(result);
    const view=new URL(location.href).searchParams.get('view');
    if(state.pack.id==='jyx'&&view==='companions')void showCompanions();
    if(state.pack.id==='jyx'&&view==='library')void showOriginalLibrary({category:new URLSearchParams(location.search).get('category')||undefined,id:new URLSearchParams(location.search).get('entry')||undefined});
    else if(state.pack.id==='jyx'&&view==='progress')void showRestorationProgress();
  } catch (error) {
    console.error(error);
    app.innerHTML = '<main class="loading-screen"><span class="seal">旅</span><h1>世界暂未展开</h1><p>加载未能完成，请刷新后重试。</p><button class="button primary" onclick="location.reload()">重新载入</button></main>';
  }
}
void boot();
