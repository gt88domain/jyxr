import {e,plain,icon} from './ui/format';
import {topbar,heroCard,dialogueOverlay} from './ui/shell';
import './style.css';
import {loadRuntime, initializePack, dispatch, exportSave, importSave} from './bridge';
import type {GameState, Result} from './bridge';
import {readSlot, readManualSlot, writeSlot, writeAutoSlot} from './storage';
import type {SaveSlot} from './storage';
import {Board} from './board';
import {packIndex, assetUrl} from './content';
import type {PackListing} from './content';
import {titleView, worldView, shopView, sectView, currency} from './world';
import {battleShell as battleMarkup, updateBattleView} from './battle-view';
import {battleSkillsView, battleActionView} from './battle-controls';
import {panelContent} from './panels';
import {creationView} from './creation';
import {interactionView} from './interactions';
import {miniGameView, MiniGameController} from './minigame';
import type {PanelName, InventoryFilter} from './panels';
import {readSettings, writeSettings, applySettings} from './settings';
import type {Settings} from './settings';
import {GameAudio} from './audio';
import {inspectEquipment} from './bridge';
import {equipmentPreviewView} from './equipment-preview';
import type {InventorySort} from './panels';
import {activityView,filterActivity} from './activity';
import type {UiMessage} from './activity';
import {moreMenuView} from './navigation';
import './modern-ui.css';
import type {GameCommand} from './command-contract';
import {appConfig} from './app-config';
import {filterWorldAtlas} from './world-atlas';
import {startUiLocale,setUiDisplayLabels} from './ui/locale';

startUiLocale(appConfig.id);

const app = document.querySelector<HTMLDivElement>('#app')!;
let state: GameState, slot: SaveSlot | undefined, busy = false, board: Board | undefined;
let manualSlot: SaveSlot | undefined;
let commandWarning: string | undefined;
let training: MiniGameController | undefined;
let screen = '', selectedSkill = '', enemyTimer: ReturnType<typeof setTimeout> | undefined;
let autoBattle = false, battlePaused = false;
let battleIntent: 'move' | 'attack' = 'move';
let packs: PackListing[] = [];
const settings = readSettings();
const audio = new GameAudio(settings);
applySettings(settings);
let activePanel: PanelName | null = null, inventoryFilter: InventoryFilter = 'all';
let inventoryQuery = '', inventorySort: InventorySort = 'original';
let equipmentPreviewContext: {state: GameState; entryNumber: number} | undefined;
let battleActionContext: {state: GameState; command: GameCommand} | undefined;
let battleSkillsContext: GameState | undefined;
const uiMessages:UiMessage[]=[];
let activitySeen=0;
function toast(message: string,record=true) {
  if(record){uiMessages.push({message,time:new Date().toISOString()});if(uiMessages.length>50)uiMessages.shift();}
  const node = document.querySelector<HTMLDivElement>('#toast')!;
  node.textContent = message; node.classList.add('visible');
  setTimeout(() => node.classList.remove('visible'), 3600);
}
function title() {return topbar(state,false)+titleView(state,slot,packs,manualSlot);}
function world() {return topbar(state) + worldView(state, heroCard(state)) + dialogueOverlay(state) + shopView(state) + sectView(state) + interactionView(state) + (state.phase === 'minigame' && state.miniGame ? miniGameView(state.miniGame) : '');}
function ended() {
  const value = state.battle?.outcome;
  return !!value && !['none', 'ongoing', 'inprogress', 'unknown', 'notended'].includes(String(value).toLowerCase());
}
function battleShell() {return topbar(state) + battleMarkup(state);}
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
  audio.sync(state);
  training?.destroy(); training=undefined;
  const nextScreen = state.phase === 'title' ? 'title' : state.phase === 'battle' && state.battle ? 'battle' : 'world';
  if (nextScreen === 'battle' && screen === 'battle') { updateBattle(); return; }
  board?.destroy(); board = undefined;
  if (nextScreen === 'battle') {autoBattle = settings.battleMode === 'auto'; battlePaused = false; battleIntent = 'move'; selectedSkill = '';}
  else autoBattle = false;
  screen = nextScreen;
  app.className = `app ${screen}-app`;
  document.documentElement.dataset.pack = state.pack.id;
  const atlasArt = nextScreen === 'world' && state.map?.kind === 'large' && state.pack.worldAtlas?.mapId === state.map.id ? state.pack.worldAtlas.image : undefined;
  const sceneArt = screen === 'title' ? state.pack.media?.titleBackground : atlasArt || state.sceneBackground || state.map?.background || state.pack.media?.worldBackground;
  app.style.backgroundImage = sceneArt ? `url("${assetUrl(sceneArt)}")` : '';
  document.title = `${state.pack.title} · ${state.pack.subtitle || '浏览器冒险'}`;
  app.innerHTML = nextScreen === 'title' ? title() : nextScreen === 'battle' ? battleShell() : world();
  app.setAttribute('aria-busy', String(busy));
  if(state.phase==='minigame' && state.miniGame) training=new MiniGameController(app,state.miniGame,()=>command({type:'finishMiniGame'}),error=>{console.error(error);toast(error instanceof Error?error.message:'修炼未能完成。');});
  if (nextScreen === 'battle') {
    board = new Board(document.querySelector('#board-viewport')!, (x, y, touch) => {
      if (busy || ended() || autoBattle || battlePaused || modalOpen()) return;
      const target = state.battle!.units.find(unit => unit.alive && unit.x === x && unit.y === y);
      const canTarget = state.battle!.targets?.some(point => point.skillId === selectedSkill && point.x === x && point.y === y);
      if (canTarget && (battleIntent === 'attack' || target && target.team !== 1)) {
        boardAction({type: 'attack', skillId: selectedSkill, targetId: target?.id, x, y}, touch);
      }
      else if (battleIntent === 'move' && state.battle!.reachable.some(point => point.x === x && point.y === y)) boardAction({type: 'move', x, y}, touch);
      else toast('请点击高亮格移动，或选择武功后点击橙色目标格出招。');
    }, state.battle!);
    updateBattle();
  }
}
function boardAction(data: GameCommand, touch: boolean) {
  if (touch) {
    modal(data.type === 'move' ? '确认走位' : '确认出招', battleActionView(state, data));
    battleActionContext = {state, command: data};
    document.querySelector('#game-modal')?.classList.add('battle-action-modal');
  } else {
    if (data.type === 'attack') battleIntent = 'move';
    void command(data);
  }
}
function showBattleSkills() {
  if (!state.battle || ended()) return;
  const canSelect = !autoBattle && state.battle.units.find(u => u.id === state.battle!.activeUnitId)?.team === 1;
  modal('选择招式', battleSkillsView(state, selectedSkill, canSelect), true);
  battleSkillsContext = state;
  document.querySelector('#game-modal')?.classList.add('battle-skills-modal');
}
function applyResult(result: Result,restored=false) {
  if (!result.ok) throw new Error(result.error || '此次行动未能完成。');
  const previous=state;
  state = result.state;
  setUiDisplayLabels(state.pack.displayCatalog?.text,state.pack.displayCatalog);
  if(previous&&previous.journeyId!==state.journeyId)uiMessages.length=0;
  if(restored||!previous)activitySeen=Math.max(0,...(state.activity||[]).map(a=>a.id));
  else if(previous.journeyId!==state.journeyId)activitySeen=0;
  render();
  if (state.pack.worldAtlas && screen==='world' && previous?.map?.id!==state.map?.id) {
    window.scrollTo({top:0,left:0,behavior:'instant'});
  }
  const lastId=previous?.journeyId===state.journeyId?Math.max(0,...(previous.activity||[]).map(a=>a.id)):0;
  const notices=(state.activity||[]).filter(a=>a.notice&&a.id>lastId);
  if(!restored&&previous&&notices.length)toast(notices.slice(-2).map(a=>plain(a.message)).join('；')+(notices.length>2?`，另有${notices.length-2}条，见通知。`:''),false);
  refreshActivityBadge();
  if (result.warning) toast(result.warning);
}
function refreshActivityBadge(){
  const count=(state?.activity||[]).filter(a=>a.notice&&a.id>activitySeen).length;
  document.querySelectorAll<HTMLElement>('[data-notice-count]').forEach(node=>{node.textContent=count>99?'99+':String(count);node.hidden=count===0;});
}
async function command(data: GameCommand) {
  if (busy) return false;
  clearTimeout(enemyTimer); busy = true; app.setAttribute('aria-busy', 'true');
  commandWarning=undefined;
  let success = false;
  if (screen === 'battle') updateBattle();
  refreshPanel();
  try {
    const result=await dispatch(data);commandWarning=result.warning;
    applyResult(result); success = true;
    if(settings.autoSave&&data.type!=='state'&&data.type!=='selectCharacter')await autoSave();
  }
  catch (error) {console.error(error); toast(error instanceof Error ? error.message : '此次行动未能完成。');}
  finally {busy = false; app.setAttribute('aria-busy', 'false'); if (screen === 'battle') updateBattle(); refreshPanel();}
  scheduleBattle();
  return success;
}
function modal(titleText: string, content: string, wide = false) {
  battleActionContext = undefined; battleSkillsContext = undefined;
  clearTimeout(enemyTimer);
  training?.pause();
  if (!wide) activePanel = null;
  document.querySelector('#game-modal')?.remove();
  const node = document.createElement('dialog'); node.id = 'game-modal'; node.className = `paper game-modal${wide ? ' system-modal' : ''}`;
  node.innerHTML = `<button class="icon-button close-modal" data-action="close-modal" aria-label="关闭">${icon('close')}</button><div class="eyebrow">旅途一页</div><h2>${e(titleText)}</h2>${content}`;
  document.body.append(node); node.showModal();
  node.addEventListener('close', () => {if(document.querySelector('#game-modal')!==node)return;node.remove();activePanel = null; if (node.classList.contains('creation-modal') && state.creation && !busy) void command({type: 'cancelCreation'}); if (screen === 'battle') updateBattle(); scheduleBattle();});
  node.addEventListener('click', event => {if (event.target === node) node.close();});
  if (screen === 'battle') updateBattle();
}
async function showEquipmentPreview(entryNumber: number) {
  const inspected = state;
  const characterId = (state.managedCharacter || state.hero).id;
  equipmentPreviewContext = undefined; activePanel = null;
  modal('换装属性对比', '<div data-equipment-preview aria-live="polite">正在比较装备…</div>', true);
  const target = document.querySelector<HTMLElement>('[data-equipment-preview]')!;
  try {
    const preview = await inspectEquipment(characterId, entryNumber,inspected.pack.displayCatalog);
    if (!target.isConnected || !modalOpen()) return;
    if (state !== inspected) {target.textContent = '人物状态已变化，请重新打开装备对比。';return;}
    equipmentPreviewContext = {state: inspected, entryNumber};
    target.innerHTML = equipmentPreviewView(preview,state.pack.statLabels);
  } catch (error) {if (target.isConnected) target.textContent = error instanceof Error ? error.message : '装备对比暂不可用。';}
}
function createCharacter() {
  modal('为旅人命名', `<p class="modal-intro">${e(state.pack.title)}的故事，从你的名字开始。</p><form id="character-form"><label class="form-label" for="hero-name">角色姓名</label><input id="hero-name" name="name" value="${e(state.pack.defaultName || '旅人')}" minlength="1" maxlength="12" autocomplete="off" required autofocus><label class="form-label" for="difficulty">行走难度</label><select id="difficulty" name="difficulty"><option value="normal">普通 · 初次冒险</option><option value="hard">困难 · 迎接挑战</option><option value="crazy">炼狱 · 千锤百炼</option></select><p class="field-note">难度影响战斗规则与历练所得。</p><button class="button primary full-width" type="submit">开始旅程 ${icon('arrow')}</button></form>`);
}
async function showModulePanel(action:string,options:{here?:boolean}={}) {
  const feature=appConfig.features.find(item=>item.id===action);
  if(!feature)return;
  activePanel=null;
  modal(feature.title,'<div data-module-panel aria-live="polite">正在整理资料…</div>',true);
  const target=document.querySelector<HTMLElement>('[data-module-panel]')!;
  const snapshot=state;
  try{
    const module=await import('./modules/jyx-panels');
    if(target.isConnected&&state===snapshot)await module.mountJyxPanel(action,target,snapshot,options);
  }catch(error){if(target.isConnected)target.textContent=error instanceof Error?error.message:'资料暂时无法读取。';}
}
async function creationCommand(data: GameCommand) {
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
    manualSlot=slot;
    applyResult(await dispatch({type: 'state'}));
    toast('当前世界的进度已保存。');
  } catch (error) {console.error(error); toast('保存未能完成，请导出存档备份后重试。');}
  finally {busy = false; app.setAttribute('aria-busy', 'false'); refreshPanel();}
}
async function autoSave() {
  if(state.phase!=='world'||state.creation)return;
  try {
    const data=await exportSave();
    if(JSON.parse(data).error)return; // A pending interaction has no stable checkpoint yet.
    const next: SaveSlot={version:1,packId:state.pack.id,savedAt:new Date().toISOString(),name:state.hero.name,level:state.hero.level,map:state.map.name,data};
    await writeAutoSlot(next);slot=next;
    app.dataset.autoSavedAt=next.savedAt;
    const saved=await dispatch({type:'state'});
    commandWarning ||= saved.warning;applyResult(saved);
  } catch {commandWarning='行动已完成，但自动保存未能写入。请保存或导出备份。';toast(commandWarning);}
}
async function load(selected=slot) {
  if (!selected || busy) return;
  try { applyResult(await importSave(selected.data, true),true); toast('旧事续上，江湖如故。'); }
  catch (error) {console.error(error); toast('存档未能读取，请检查存档文件。');}
}
function openPanel(name: PanelName) {
  if (state.phase === 'title' && name !== 'settings') return;
  activePanel = name;
  if (name === 'inventory') {inventoryFilter = 'all'; inventoryQuery = ''; inventorySort = 'original';}
  const content = panelContent(name, state, settings, busy, inventoryFilter, {query: inventoryQuery, sort: inventorySort});
  modal(content.title, content.content, true);
}
function refreshPanel() {
  const node = document.querySelector<HTMLDialogElement>('#game-modal[open]');
  if (!node || !activePanel) return;
  const scroll = node.scrollTop;
  const content = panelContent(activePanel, state, settings, busy, inventoryFilter, {query: inventoryQuery, sort: inventorySort});
  node.innerHTML = `<button class="icon-button close-modal" data-action="close-modal" aria-label="关闭">${icon('close')}</button><div class="eyebrow">旅途一页</div><h2>${e(content.title)}</h2>${content.content}`;
  node.scrollTop = scroll;
}
function refreshInventoryResults() {
  if (activePanel !== 'inventory') return;
  const current=document.querySelector('#game-modal[open] .inventory-list');
  if (!current) return;
  const template=document.createElement('template');
  template.innerHTML=panelContent('inventory',state,settings,busy,inventoryFilter,{query:inventoryQuery,sort:inventorySort}).content;
  const replacement=template.content.querySelector('.inventory-list');
  if(replacement)current.replaceWith(replacement);
}
async function manage(data: GameCommand, message: string) {
  if (await command(data)) toast(commandWarning||message);
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
  modal('选择冒险世界', `<p class="panel-intro">各内容包分别保存进度。地图上的当前进度会在切换前保存；对话、商店和战斗中无法保存，请先结束当前流程再切换，以免丢失未保存进度。</p><section class="pack-picker">${packs.map(p => `<button class="pack-choice ${p.id === state.pack.id ? 'selected' : ''}" data-action="select-pack" data-id="${e(p.id)}"><strong>${e(p.title)}</strong><small>${e(p.description)}</small></button>`).join('')}</section>`, true);
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
    const manual = await readManualSlot(id).catch(() => undefined);
    const next = await initializePack(id);
    if (!next.ok) throw new Error(next.error || '世界未能打开。');
    document.querySelector('#game-modal')?.remove(); activePanel = null;
    slot = saved;
    manualSlot=manual;
    applyResult(next,true);
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
  const browse = (event.target as HTMLElement).closest<HTMLElement>('[data-atlas-browse]');
  if (browse) {
    const root=browse.closest<HTMLElement>('[data-world-atlas]');
    const panel=root?.querySelector<HTMLDetailsElement>('.atlas-map-panel');
    if (panel) panel.open=false;
    const results=root?.querySelector<HTMLElement>('[data-atlas-results]');
    results?.focus({preventScroll:true});results?.scrollIntoView({block:'start'});
    return;
  }
  const region = (event.target as HTMLElement).closest<HTMLElement>('[data-atlas-region]');
  if (region) {
    const root = region.closest<HTMLElement>('[data-world-atlas]');
    if (root) {root.dataset.region = region.dataset.atlasRegion || ''; filterWorldAtlas(root);}
    return;
  }
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!button || button.matches(':disabled')) return;
  const action = button.dataset.action;
  if(button.closest('.more-menu')){document.querySelector('#game-modal')?.remove();activePanel=null;}
  if (action === 'new') createCharacter();
  else if (action === 'creation-answer') void creationCommand({type: 'answerCreation', index: Number(button.dataset.index), questionIndex: Number(button.dataset.question)});
  else if (action === 'creation-portrait') void creationCommand({type: 'selectCreationPortrait', portraitId: button.dataset.id!});
  else if (action === 'creation-back') void creationCommand({type: 'backCreation'});
  else if (action === 'creation-roll') void creationCommand({type: 'rollCreation'});
  else if (action === 'creation-confirm') void creationCommand({type: 'confirmCreation'});
  else if (action === 'begin-round-creation') void creationCommand({type:'beginRoundCreation'});
  else if (action === 'save-ending') void save();
  else if (action === 'manage-character') void (async()=>{if(await command({type:'selectCharacter',characterId:button.dataset.id!})) openPanel(button.dataset.panel==='cultivation'?'cultivation':button.dataset.panel==='equipment'?'equipment':'character');})();
  else if (action === 'allocate-stat') void manage({type:'allocateStat',stat:button.dataset.stat!},'属性点已分配。');
  else if (action === 'party-placement') void manage({type:'setPartyPlacement',characterId:button.dataset.id!,placement:button.dataset.placement!},'队伍已调整。');
  else if (action === 'party-order') void manage({type:'reorderParty',characterId:button.dataset.id!,index:Number(button.dataset.index)},'队伍顺序已调整。');
  else if (action === 'chest') openPanel('chest');
  else if (action === 'return-title') void selectPack(state.pack.id);
  else if (action === 'close-chest') void command({type:'closeChest'});
  else if (action === 'chest-deposit' || action === 'chest-withdraw') void manage({type:action === 'chest-deposit'?'chestDeposit':'chestWithdraw',entryNumber:Number(button.dataset.entryNumber)},'储物箱已更新。');
  else if (action === 'worlds') chooseWorld();
  else if (action === 'select-pack') void selectPack(button.dataset.id!);
  else if (action === 'close-shop') void command({type:'closeShop'});
  else if (action === 'select-sect') void command({type:'selectSect',sectId:button.dataset.id!});
  else if (action === 'buy-item') {const quantity = shopQuantity(); if (quantity) void command({type:'buy',productId:button.dataset.id!,quantity});}
  else if (action === 'sell-item') {const quantity = shopQuantity(); if (quantity) void command({type:'sell',entryNumber:Number(button.dataset.entryNumber),quantity});}
  else if (action === 'close-modal') document.querySelector<HTMLDialogElement>('#game-modal')?.close();
  else if (action === 'more') modal('更多功能',moreMenuView(state),true);
  else if (action === 'history') {activitySeen=Math.max(0,...(state.activity||[]).map(a=>a.id));refreshActivityBadge();modal('通知与操作记录',activityView(state,uiMessages),true);}
  else if (action === 'save') void save();
  else if (action === 'load') void load();
  else if (action === 'load-manual') void load(manualSlot);
  else if (action === 'import') document.querySelector<HTMLInputElement>('#import-file')!.click();
  else if (action === 'training') void command({type: 'startTraining'});
  else if (action === 'talk') void command({type: 'talk', locationId: button.dataset.id!});
  else if (action === 'interact') void command({type: 'interact', locationId: button.dataset.id!});
  else if (action === 'next') void command({type: 'next'});
  else if (action === 'choice') void command({type: 'choose', index: Number(button.dataset.index)});
  else if (action === 'rest' || action === 'mobile-rest') void command({type: 'rest'});
  else if (action === 'battle-skills') showBattleSkills();
  else if (action === 'mobile-inventory') openPanel('inventory');
  else if (action === 'mobile-move') {battleIntent = 'move'; updateBattle();}
  else if (action === 'choose-battle-skill') {
    if (battleSkillsContext !== state || autoBattle || ended() || !state.battle?.skills.some(s => s.id === button.dataset.id && s.available !== false)) return;
    selectedSkill = button.dataset.id!; battleIntent = 'attack';
    document.querySelector<HTMLDialogElement>('#game-modal')?.close(); updateBattle();
  }
  else if (action === 'confirm-battle-action') {
    const pending = battleActionContext;
    if (!pending || pending.state !== state || autoBattle || battlePaused || ended()) return;
    battleActionContext = undefined;
    document.querySelector<HTMLDialogElement>('#game-modal')?.close();
    if (pending.command.type === 'attack') battleIntent = 'move';
    void command(pending.command);
  }
  else if (action === 'auto') battleMode(autoBattle ? 'manual' : 'auto');
  else if (action === 'battle-mode' && (button.dataset.id === 'manual' || button.dataset.id === 'auto')) battleMode(button.dataset.id);
  else if (action === 'battle-pause' || action === 'mobile-pause') {battlePaused = !battlePaused; clearTimeout(enemyTimer); updateBattle(); scheduleBattle();}
  else if (action === 'battle-speed') {const speed = Number(button.dataset.id); if (speed === 1 || speed === 2 || speed === 4) {settings.battleSpeed = speed; writeSettings(settings); updateBattle(); scheduleBattle();}}
  else if (action === 'leave-battle') void command({type: 'leaveBattle'});
  else if (action === 'skill') {selectedSkill = button.dataset.id!; battleIntent = 'attack'; updateBattle();}
  else if (action === 'battle-intent' && (button.dataset.id === 'move' || button.dataset.id === 'attack')) {battleIntent = button.dataset.id; updateBattle();}
  else if (action === 'character' || action === 'inventory' || action === 'equipment' || action === 'cultivation' || action === 'settings' || action === 'party' || action === 'quests') openPanel(action);
  else if (action === 'inventory-filter') {inventoryFilter = button.dataset.id as InventoryFilter; refreshPanel();}
  else if (action === 'preview-equipment') void showEquipmentPreview(Number(button.dataset.entryNumber));
  else if (action === 'confirm-equipment-preview') void (async()=>{
    const preview=equipmentPreviewContext;
    if (!preview || preview.state !== state || preview.entryNumber !== Number(button.dataset.entryNumber)) {toast('人物或物品状态已变化，请重新对比。');return;}
    equipmentPreviewContext=undefined;
    if(await command({type:'equipItem',entryNumber:preview.entryNumber})) {openPanel('equipment');toast(commandWarning||'装备已穿戴，人物属性已更新。');}
  })();
  else if (action === 'equip-item') void manage({type: 'equipItem', entryNumber: Number(button.dataset.entryNumber)}, '装备已穿戴，人物属性已更新。');
  else if (action === 'unequip-item') void manage({type: 'unequipItem', slot: button.dataset.slot!}, '装备已放回行囊。');
  else if (action === 'cultivate') void manage({type: 'setCultivation', entryNumber: Number(button.dataset.entryNumber)}, '已选择修炼秘籍，战斗结算后获得修炼经验。');
  else if (action === 'clear-cultivation') void manage({type: 'clearCultivation'}, '已暂停这部秘籍的修炼，已学武功和经验保留。');
  else if (action === 'equip-internal') void manage({type: 'equipInternalSkill', skillId: button.dataset.id!}, `已切换${state.pack.terms?.internalSkills||'当前运行心法'}。`);
  else if (action === 'clear-internal') void manage({type: 'clearInternalSkill'}, `已停止${state.pack.terms?.internalSkills||'当前运行心法'}。`);
  else if (action === 'toggle-skill') void manage({type: 'setExternalSkillActive', skillId: button.dataset.id!, active: button.dataset.active === 'true'}, button.dataset.active === 'true' ? '招式已启用。' : '招式已停用。');
  else if (action === 'use-item') {
    const target=document.querySelector<HTMLSelectElement>(`.battle-item-target[data-entry-number="${button.dataset.entryNumber}"]`);
    void manage({type:'useItem',entryNumber:Number(button.dataset.entryNumber),...(target?{targetId:target.value}:{})},'物品已使用。');
  }
  else if (action==='companion-clues'&&state.phase!=='title') void showModulePanel('companions',{here:true});
  else if (action && appConfig.features.some(feature=>feature.id===action)) void showModulePanel(action);
  else if (action === 'guide') modal('行走指南', `<p class="guide-text">点击地图上的人物或地点继续剧情，在“目标”查看当前章节。获得修炼书后，在修炼面板选择；正在运行的${e(state.pack.terms?.internalSkills||'心法')}与正在研习的书可分别调整。装备和补给可在行囊使用，伙伴可在队伍查看。<br><br>手动战斗时，青色格表示可移动的位置。选择招式，点击橙色目标格施展；有些招式可对自己使用。也可切换自动战斗、调整倍速，或暂停观察。<br><br>打开人物、设置等面板时战斗暂停。离开战斗、对话和商店后可保存进度。不同应用及内容包分别存档；清除网站数据前请在行囊导出备份。</p>`);
  else if (action === 'download-save') void (async () => {
    try {const data = await exportSave(); const parsed = JSON.parse(data); if (parsed.error || parsed.ok === false) throw new Error(parsed.error || '无法导出当前进度。'); const href = URL.createObjectURL(new Blob([data], {type: 'application/json'})); const link = document.createElement('a'); link.href = href; link.download = `${state.pack.title}-${state.hero.name}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);}
    catch (error) {console.error(error); toast('导出未能完成，请先离开战斗。');}
  })();
});
document.addEventListener('change', event => {
  const control = event.target;
  if (control instanceof HTMLInputElement && control.matches('[data-atlas-unavailable]')) {
    const root = control.closest<HTMLElement>('[data-world-atlas]');
    if (root) filterWorldAtlas(root);
    return;
  }
  if(control instanceof HTMLSelectElement&&control.matches('[data-activity-filter]')){filterActivity();return;}
  if (control instanceof HTMLSelectElement && control.id === 'managed-character') {void command({type:'selectCharacter',characterId:control.value}); return;}
  if (control instanceof HTMLSelectElement && control.id === 'inventory-sort') {
    if (['original','name','count'].includes(control.value)) inventorySort=control.value as InventorySort;
    refreshInventoryResults();return;
  }
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement) || !control.closest('#game-settings, #audio-settings')) return;
  const name = control.name as keyof Settings;
  if (name === 'battleMode' && (control.value === 'manual' || control.value === 'auto')) {
    settings.battleMode = control.value;
    if (screen === 'battle') {autoBattle = control.value === 'auto'; battlePaused = false;}
  } else if (name === 'battleSpeed') {
    const speed = Number(control.value);
    if (speed === 1 || speed === 2 || speed === 4) settings.battleSpeed = speed;
  } else if (name === 'musicVolume' || name === 'effectsVolume') {
    settings[name] = Math.max(0, Math.min(1, Number(control.value) / 100));
  } else if (control instanceof HTMLInputElement && ['autoSave','showGrid', 'showDamage', 'battleLighting', 'reducedMotion', 'largeText'].includes(name)) {
    settings[name as 'autoSave' | 'showGrid' | 'showDamage' | 'battleLighting' | 'reducedMotion' | 'largeText'] = control.checked;
  }
  if (!writeSettings(settings)) toast('设置已在本次游玩生效，但此浏览器暂不能保存设置。');
  audio.sync(state);
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
  if (input instanceof HTMLInputElement && input.id === 'inventory-search') {
    inventoryQuery=input.value;refreshInventoryResults();return;
  }
  if (!(input instanceof HTMLInputElement) || input.id !== 'destination-search') return;
  const atlasRoot = input.closest<HTMLElement>('[data-world-atlas]');
  if (atlasRoot) {
    // Search every island; selecting a region afterward narrows the results.
    atlasRoot.dataset.region = ''; filterWorldAtlas(atlasRoot); return;
  }
  const text = input.value.trim().toLocaleLowerCase();
  document.querySelectorAll<HTMLElement>('.chapter-locations .map-spot').forEach(button => {
    button.hidden = !button.textContent?.toLocaleLowerCase().includes(text);
  });
});
document.addEventListener('submit', event => {
  if(event.target instanceof HTMLFormElement && event.target.id === 'combatants-form'){
    event.preventDefault();
    void command({type:'selectCombatants',characterIds:new FormData(event.target).getAll('character').filter((value):value is string=>typeof value==='string')});return;
  }
  if(event.target instanceof HTMLFormElement && event.target.id === 'heroine-name-form'){
    event.preventDefault();
    void command({type:'renameHeroine',name:String(new FormData(event.target).get('name')||'')});return;
  }
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'character-form') return;
  event.preventDefault();
  const form = new FormData(event.target), name = String(form.get('name') || '').trim();
  if (!name) return;
  document.querySelector<HTMLDialogElement>('#game-modal')!.close();
  if ('creation' in state.pack) void creationCommand({type: 'beginCreation', name, difficulty: String(form.get('difficulty')||'normal')});
  else void command({type: 'createCharacter', name, difficulty: String(form.get('difficulty')||'normal')});
});
document.addEventListener('input',event=>{if(event.target instanceof HTMLInputElement&&event.target.matches('[data-activity-search]'))filterActivity();});
document.querySelector<HTMLInputElement>('#import-file')!.addEventListener('change', async event => {
  const input = event.target as HTMLInputElement, file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('存档文件过大。');
    const data = await file.text(); applyResult(await importSave(data),true);
    slot = {version: 1, packId: state.pack.id, savedAt: new Date().toISOString(), name: state.hero.name, level: state.hero.level, map: state.map.name, data};
    await writeSlot(slot); toast('存档已导入。');
    manualSlot=slot;
  } catch (error) {console.error(error); toast('无法导入此存档，请使用本版导出的存档文件。');}
  finally {input.value = '';}
});
async function boot() {
  try {
    const catalog = await packIndex(); packs = catalog.packs;
    const requested = new URL(location.href).searchParams.get('pack') || catalog.defaultPackId;
    const id = packs.some(p => p.id === requested) ? requested : catalog.defaultPackId;
    slot = await readSlot(id).catch(() => undefined);
    manualSlot = await readManualSlot(id).catch(() => undefined);
    const result = await loadRuntime(message => {const text = document.querySelector('#loading-message'); if (text) text.textContent = message;}, id);
    applyResult(result,true);
  } catch (error) {
    console.error(error);
    app.innerHTML = '<main class="loading-screen"><span class="seal">旅</span><h1>世界暂未展开</h1><p>加载未能完成，请刷新后重试。</p><button class="button primary" onclick="location.reload()">重新载入</button></main>';
  }
}
void boot();
