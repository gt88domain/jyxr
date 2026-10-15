import type {GameState, InventoryItem, Skill} from './bridge';
import type {Settings} from './settings';
import './panels.css';

export type PanelName = 'character' | 'equipment' | 'cultivation' | 'inventory' | 'settings';
export type InventoryFilter = 'all' | 'equipment' | 'skillBook' | 'consumable' | 'other';
const e = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
const plain = (text: string) => text.replace(/\[\[[a-z]+:([^\]]*)\]\]/gi, '$1').replace(/<\/?color[^>]*>/g, '');
const kindName: Record<string, string> = {equipment: '装备', skillBook: '秘籍', consumable: '丹药', other: '杂物'};
const slotSymbols: Record<string, string> = {Weapon: '剑', Armor: '衣', Accessory: '佩'};
function disabled(value: boolean) {return value ? 'disabled' : '';}
function tabs(active: PanelName) {
  return `<nav class="panel-tabs" aria-label="人物面板">${(['character', 'equipment', 'cultivation'] as const).map(id => `<button role="tab" aria-selected="${active === id}" data-action="${id}">${{character: '人物', equipment: '装备', cultivation: '功法修炼'}[id]}</button>`).join('')}</nav>`;
}
function notice(state: GameState) {
  return state.hero.canManage === false ? `<p class="panel-notice">${state.phase === 'battle' ? '战斗中可查看人物与行囊、使用可用丹药；换装与调整修炼请先返回地图。' : '当前可查看人物与行囊。请结束对话后再换装、服药与调整修炼。'}</p>` : '';
}
function progress(exp: number, next: number) {
  const percent = next > 0 ? Math.max(0, Math.min(100, exp / next * 100)) : 100;
  return `<div class="study-progress" role="progressbar" aria-label="修炼经验" aria-valuemin="0" aria-valuemax="${Math.max(1, next)}" aria-valuenow="${Math.max(0, Math.min(exp, Math.max(1, next)))}"><i style="width:${percent}%"></i></div><div class="study-progress-label"><span>修炼经验</span><span>${next > 0 ? `${exp} / ${next}` : '已达当前上限'}</span></div>`;
}
function character(state: GameState) {
  const h = state.hero;
  return `${tabs('character')}<div class="profile-layout"><div class="profile-portrait"><img src="${import.meta.env.BASE_URL}art/hero-swordsman.png" alt="青衣侠客"><span>${e(h.name)}</span></div><div><div class="eyebrow">第 ${h.level} 级 · 江湖行客</div><p class="profile-vitals">气血 ${h.hp} / ${h.maxHp}<br>内力 ${h.mp} / ${h.maxMp}<br>人物经验 ${h.experience ?? 0}${h.nextLevelExperience ? ` / ${h.nextLevelExperience}` : ''}</p><div class="profile-stats">${(h.attributes ?? []).map(a => `<div class="profile-stat"><span>${e(a.label)}</span><strong>${e(a.value)}</strong></div>`).join('')}</div></div></div><h3 class="panel-heading">天赋</h3><div class="talent-list">${(h.talents ?? []).map(t => `<span class="talent-tag" title="${e(plain(t.description))}">${e(t.name)}</span>`).join('') || '<p class="muted">当前没有天赋。</p>'}</div><h3 class="panel-heading">已学武功 <small>招式随实战成长</small></h3><div class="sheet-skills">${h.skills.map(s => `<div><span>${e(s.name)}</span><small>第 ${s.level} 重</small></div>`).join('') || '<p class="muted">尚未习得武艺。</p>'}</div>`;
}
function itemActions(item: InventoryItem, state: GameState, busy: boolean) {
  const locked = busy || state.hero.canManage === false;
  const current = state.hero.cultivation?.itemId === item.id;
  if (item.kind === 'equipment') return `<div class="item-actions"><button class="item-action primary-action" data-action="equip-item" data-entry-number="${item.entryNumber}" ${disabled(locked || !item.canEquip)} title="${e(item.reason)}">装备到人物</button></div>`;
  if (item.kind === 'skillBook') return `<div class="item-actions"><button class="item-action primary-action" data-action="cultivate" data-entry-number="${item.entryNumber}" ${disabled(locked || !item.canCultivate || current)} title="${e(item.reason)}">${current ? '正在修炼' : '选择修炼'}</button>${item.reason && !item.canCultivate ? `<span class="field-note">${e(item.reason)}</span>` : ''}</div>`;
  if (item.canUse || item.kind === 'consumable') return `<div class="item-actions"><button class="item-action primary-action" data-action="use-item" data-entry-number="${item.entryNumber}" ${disabled(busy || !item.canUse)} title="${e(item.reason)}">使用</button>${item.reason && !item.canUse ? `<span class="field-note">${e(item.reason)}</span>` : ''}</div>`;
  return '';
}
function itemList(items: InventoryItem[], state: GameState, busy: boolean, empty: string) {
  return `<div class="inventory-list">${items.map(item => `<article data-item-id="${e(item.id)}"><span class="item-glyph" aria-hidden="true">${item.kind === 'skillBook' ? '书' : item.kind === 'equipment' ? slotSymbols[item.slot ?? ''] || '装' : item.kind === 'consumable' ? '丹' : '物'}</span><div><strong>${e(item.name)}</strong> <span class="item-kind">${e(kindName[item.kind] || item.itemType)}</span><p>${e(plain(item.description))}</p>${itemActions(item, state, busy)}</div><span>× ${item.count}</span></article>`).join('') || `<p class="empty-state">${empty}</p>`}</div>`;
}
function equipment(state: GameState, busy: boolean) {
  const slots = state.hero.equipment ?? [];
  return `${tabs('equipment')}${notice(state)}<p class="panel-intro">随身兵刃、衣甲与饰物。点击行囊中的装备即可穿戴，属性会同步更新。</p><div class="equipment-grid">${slots.map(s => `<article class="equipment-slot" data-slot="${e(s.slot)}"><span class="slot-symbol" aria-hidden="true">${e(slotSymbols[s.slot] || '装')}</span><small>${e(s.slotName)}</small><h3>${e(s.item?.name || '尚未装备')}</h3><p>${e(s.item ? plain(s.item.description) : '此栏为空，得到装备后可在这里穿戴。')}</p>${s.item ? `<button class="text-button" data-action="unequip-item" data-slot="${e(s.slot)}" ${disabled(busy || state.hero.canManage === false)}>卸下装备</button>` : ''}</article>`).join('')}</div><h3 class="panel-heading">行囊中的装备</h3>${itemList((state.inventory ?? []).filter(i => i.kind === 'equipment'), state, busy, '行囊中暂无可穿戴装备。开局赠送的《内功入门》请到功法页选择修炼。')}<button class="button outline full-width" data-action="inventory">打开完整行囊</button>`;
}
function skillRecord(skill: Skill, state: GameState, busy: boolean, internal: boolean) {
  const locked = busy || state.hero.canManage === false;
  return `<article class="skill-record" data-skill-id="${e(skill.id)}"><div><h4>${e(skill.name)}${internal && skill.equipped ? '<span class="running-mark">主运内功</span>' : ''}</h4><p>第 ${skill.level} 重${skill.maxLevel ? ` / ${skill.maxLevel} 重` : ''}${skill.description ? ` · ${e(plain(skill.description))}` : ''}</p>${progress(skill.exp ?? 0, skill.maxLevel && skill.level >= skill.maxLevel ? 0 : skill.nextExp ?? 0)}</div>${internal ? `<button class="item-action ${skill.equipped ? '' : 'primary-action'}" data-action="${skill.equipped ? 'clear-internal' : 'equip-internal'}" data-id="${e(skill.id)}" ${disabled(locked)}>${skill.equipped ? '停止主运' : '设为主内功'}</button>` : `<button class="item-action" data-action="toggle-skill" data-id="${e(skill.id)}" data-active="${skill.active === false}" ${disabled(locked)}>${skill.active === false ? '启用招式' : '停用招式'}</button>`}</article>`;
}
function cultivation(state: GameState, busy: boolean) {
  const c = state.hero.cultivation;
  const books = (state.inventory ?? []).filter(i => i.kind === 'skillBook');
  return `${tabs('cultivation')}${notice(state)}<p class="panel-intro">选择一本秘籍修炼，战斗结束后获得修炼经验。主运内功单独选择，会影响实战中的内功效果。</p><section class="cultivation-focus" data-testid="cultivation-focus"><div class="eyebrow">${c ? '当前修炼秘籍' : '修炼尚未开始'}</div><h3>${e(c?.itemName || '先选一部功法')}</h3>${c ? `<p>${e(c.skillName)} · 第 ${c.level} 重 / ${c.maxLevel} 重</p>${progress(c.exp, c.nextExp)}<button class="text-button" data-action="clear-cultivation" ${disabled(busy || state.hero.canManage === false)}>暂停这部秘籍的修炼</button>` : '<p>南贤赠予的《内功入门》可以作为你的第一部修炼秘籍。</p>'}</section><h3 class="panel-heading">可修炼秘籍 <small>选择秘籍不会消耗物品</small></h3>${itemList(books, state, busy, '行囊中尚无秘籍。')}<h3 class="panel-heading">内功 <small>同时主运一门</small></h3><div class="skill-records">${(state.hero.internalSkills ?? []).map(s => skillRecord(s, state, busy, true)).join('') || '<p class="muted">尚未学会内功，先选择上方秘籍修炼。</p>'}</div><h3 class="panel-heading">外功招式 <small>启用后可在战斗中使用</small></h3><div class="skill-records">${(state.hero.externalSkills ?? []).map(s => skillRecord(s, state, busy, false)).join('') || '<p class="muted">尚未习得外功。</p>'}</div>`;
}
function inventory(state: GameState, busy: boolean, filter: InventoryFilter) {
  const items = (state.inventory ?? []).filter(i => filter === 'all' || i.kind === filter);
  return `${notice(state)}<div class="inventory-silver">银两 <strong>${state.silver.toLocaleString()} 两</strong></div><nav class="inventory-filters" aria-label="行囊分类">${(['all', 'equipment', 'skillBook', 'consumable', 'other'] as const).map(id => `<button class="${filter === id ? 'active' : ''}" data-action="inventory-filter" data-id="${id}">${id === 'all' ? '全部' : kindName[id]}</button>`).join('')}</nav>${itemList(items, state, busy, '这个分类里暂时没有物品。')}<button class="button outline full-width" data-action="download-save" ${disabled(state.phase !== 'world' || busy)}>导出存档备份</button>`;
}
function settingsPanel(settings: Settings) {
  const check = (id: keyof Settings, title: string, description: string) => `<label class="setting-row"><span>${title}<small>${description}</small></span><input type="checkbox" name="${id}" ${settings[id] ? 'checked' : ''}></label>`;
  return `<p class="panel-intro">调整战斗方式与阅读习惯，修改后自动保存到当前浏览器。打开面板时战斗暂停，关闭后继续。</p><form id="game-settings" class="settings-list"><label class="setting-row"><span>战斗方式<small>手动选格与出招，或由电脑代你行动；战斗中可随时切换。</small></span><select name="battleMode"><option value="manual" ${settings.battleMode === 'manual' ? 'selected' : ''}>手动战斗</option><option value="auto" ${settings.battleMode === 'auto' ? 'selected' : ''}>自动战斗</option></select></label><label class="setting-row"><span>自动战斗速度<small>影响行动间隔与演出速度，不改变战斗规则和伤害。</small></span><select name="battleSpeed">${([1, 2, 4] as const).map(n => `<option value="${n}" ${settings.battleSpeed === n ? 'selected' : ''}>${n} 倍速</option>`).join('')}</select></label>${check('showGrid', '显示棋盘格', '隐藏格线后，仍会显示可移动与可出招的位置。')}${check('showDamage', '伤害与回复数字', '在角色上方显示实际伤害、治疗与内力变化。')}${check('reducedMotion', '减少动态效果', '缩短移动与受击演出，减少镜头和界面动态。')}${check('largeText', '放大文字', '放大剧情、物品说明、战况和操作文字。')}</form><p class="settings-saved">设置保存在设备中；游戏进度请另用“保存进度”，也可在行囊导出备份。</p>`;
}
export function panelContent(name: PanelName, state: GameState, settings: Settings, busy = false, filter: InventoryFilter = 'all'): {title: string; content: string} {
  if (name === 'settings') return {title: '江湖设置', content: settingsPanel(settings)};
  if (name === 'character') return {title: state.hero.name, content: character(state)};
  if (name === 'equipment') return {title: '随身装备', content: equipment(state, busy)};
  if (name === 'cultivation') return {title: '功法修炼', content: cultivation(state, busy)};
  return {title: '随身行囊', content: inventory(state, busy, filter)};
}
