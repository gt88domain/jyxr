import type {GameState, InventoryItem, Skill} from './bridge';
import type {Settings} from './settings';
import './panels.css';
import {assetUrl} from './content';
import {appConfig} from './app-config';
import {journeyFocusView} from './journey';
import './journey.css';

export type PanelName = 'character' | 'equipment' | 'cultivation' | 'inventory' | 'settings' | 'party' | 'quests' | 'chest';
export type InventoryFilter = 'all' | 'equipment' | 'skillBook' | 'consumable' | 'other';
export type InventorySort = 'original' | 'name' | 'count';
export interface InventoryViewOptions {query: string; sort: InventorySort;}
const e = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
const plain = (text: string) => text.replace(/\[\[[a-z]+:([^\]]*)\]\]/gi, '$1').replace(/<\/?color[^>]*>/g, '');
const kindName: Record<string, string> = {equipment: '装备', skillBook: '秘籍', consumable: '丹药', other: '杂物'};
const slotSymbols: Record<string, string> = {Weapon: '剑', Armor: '衣', Accessory: '佩'};
function disabled(value: boolean) {return value ? 'disabled' : '';}
function tabs(active: PanelName, state: GameState) {
  return `<nav class="panel-tabs" aria-label="人物面板">${(['character', 'equipment', 'cultivation'] as const).map(id => `<button role="tab" aria-selected="${active === id}" data-action="${id}">${{character: '人物', equipment: '装备', cultivation: state.pack.terms?.cultivation || '功法修炼'}[id]}</button>`).join('')}</nav>`;
}
function notice(state: GameState) {
  const status=state.roster?.find(c=>c.id===state.hero.id)?.formationStatus;
  const worldNotice=status==='story-away'?'此人物由剧情安排离队，当前只可查看；后续能否归队由剧情决定。':status==='following'?'此人物当前为剧情随行，只可查看；参战与培养需等待后续剧情安排。':status==='reserve'?'此人物正在后备休整；可在队伍编排中归队参战，再进行培养。':'当前只可查看，请结束当前交互后再调整。';
  return state.hero.canManage === false ? `<p class="panel-notice">${state.phase === 'battle' ? '战斗中可查看人物与行囊、使用可用丹药；换装与调整修炼请先返回地图。' : state.phase === 'world' ? worldNotice : '当前可查看人物与行囊。请结束剧情交互或离开商店后再调整。'}</p>` : '';
}
function progress(exp: number, next: number) {
  const percent = next > 0 ? Math.max(0, Math.min(100, exp / next * 100)) : 100;
  return `<div class="study-progress" role="progressbar" aria-label="修炼经验" aria-valuemin="0" aria-valuemax="${Math.max(1, next)}" aria-valuenow="${Math.max(0, Math.min(exp, Math.max(1, next)))}"><i style="width:${percent}%"></i></div><div class="study-progress-label"><span>修炼经验</span><span>${next > 0 ? `${exp} / ${next}` : '已达当前上限'}</span></div>`;
}
function character(state: GameState, busy: boolean) {
  const h = {...state.hero,attributes:state.hero.attributes?.map(a=>({...a,label:state.pack.statLabels?.[a.id]||a.label}))};
  return `${tabs('character', state)}<div class="profile-layout"><div class="profile-portrait"><img src="${e(assetUrl(h.portrait || h.sprite))}" alt="${e(h.name)}"><span>${e(h.name)}</span></div><div><div class="eyebrow">第 ${h.level} 级 · ${e(state.pack.terms?.character||'冒险者')}</div><p class="profile-vitals">气血 ${h.hp} / ${h.maxHp}<br>${e(state.pack.terms?.energy || '内力')} ${h.mp} / ${h.maxMp}<br>可分配属性点 <strong data-unspent-points>${h.unspentStatPoints ?? 0}</strong><br>人物经验 ${h.experience ?? 0}${h.nextLevelExperience ? ` / ${h.nextLevelExperience}` : ''}</p><div class="profile-stats">${(h.attributes ?? []).map(a => `<div class="profile-stat"><span>${e(a.label)}</span><strong>${e(a.value)}</strong>${a.canAllocate ? `<button class="stat-allocate" data-action="allocate-stat" data-stat="${e(a.id)}" aria-label="增加${e(a.label)}" ${disabled(busy || h.canManage === false)}>＋</button>` : ''}</div>`).join('')}</div></div></div><h3 class="panel-heading">天赋</h3><div class="talent-list">${(h.talents ?? []).map(t => `<details class="talent-tag talent-description" data-talent-id="${e(t.id)}"><summary>${e(t.name)}</summary><p>${e(plain(t.description))}</p></details>`).join('') || '<p class="muted">当前没有天赋。</p>'}</div><h3 class="panel-heading">已学招式 <small>招式随实战成长</small></h3><div class="sheet-skills">${h.skills.map(s => `<div><span>${e(s.name)}</span><small>第 ${s.level} 重</small></div>`).join('') || '<p class="muted">尚未习得武艺。</p>'}</div>`;
}
function itemActions(item: InventoryItem, state: GameState, busy: boolean) {
  const locked = busy || state.hero.canManage === false;
  const current = state.hero.cultivation?.itemId === item.id;
  if (item.kind === 'equipment') return `<div class="item-actions"><button class="item-action" data-action="preview-equipment" data-entry-number="${item.entryNumber}" ${disabled(locked)}>换装对比</button><button class="item-action primary-action" data-action="equip-item" data-entry-number="${item.entryNumber}" ${disabled(locked || !item.canEquip)} title="${e(item.reason)}">装备到人物</button>${item.reason&&!item.canEquip?`<span class="field-note item-unavailable">${e(item.reason)}</span>`:''}</div>`;
  if (item.kind === 'skillBook') return `<div class="item-actions"><button class="item-action primary-action" data-action="cultivate" data-entry-number="${item.entryNumber}" ${disabled(locked || !item.canCultivate || current)} title="${e(item.reason)}">${current ? '正在修炼' : '选择修炼'}</button>${item.reason && !item.canCultivate ? `<span class="field-note">${e(item.reason)}</span>` : ''}</div>`;
  if (item.canUse || item.kind === 'consumable') {
    const first=item.battleTargets?.find(t=>t.canUse&&t.id===state.battle?.activeUnitId)?.id??item.battleTargets?.find(t=>t.canUse)?.id;
    const selector=item.battleTargets?.length?`<label class="battle-item-target-label">使用目标<select class="battle-item-target" data-entry-number="${item.entryNumber}" ${disabled(busy||!item.canUse)}>${item.battleTargets.map(t=>`<option value="${e(t.id)}" ${disabled(!t.canUse)} ${t.id===first?'selected':''}>${e(t.name)} · ${t.hp}/${t.maxHp}${t.canUse?'':` · ${e(t.reason)}`}</option>`).join('')}</select></label>`:'';
    return `<div class="item-actions">${selector}<button class="item-action primary-action" data-action="use-item" data-entry-number="${item.entryNumber}" ${disabled(busy || !item.canUse)} title="${e(item.reason)}">使用</button>${item.reason && !item.canUse ? `<span class="field-note">${e(item.reason)}</span>` : ''}</div>`;
  }
  return '';
}
function itemList(items: InventoryItem[], state: GameState, busy: boolean, empty: string) {
  return `<div class="inventory-list">${items.map(item => `<article data-item-id="${e(item.id)}"><span class="item-glyph" aria-hidden="true">${item.icon ? `<img src="${e(assetUrl(item.icon))}" alt="">` : item.kind === 'skillBook' ? '书' : item.kind === 'equipment' ? slotSymbols[item.slot ?? ''] || '装' : item.kind === 'consumable' ? '丹' : '物'}</span><div><strong>${e(item.name)}</strong> <span class="item-kind">${e(kindName[item.kind] || item.itemType)}</span><p>${e(plain(item.description))}</p>${(item.affixes || []).map(line=>`<p class="gear-affix">${e(line)}</p>`).join('')}${itemRequirements(item)}${itemActions(item, state, busy)}</div><span>× ${item.count}</span></article>`).join('') || `<p class="empty-state">${empty}</p>`}</div>`;
}
function itemRequirements(item: InventoryItem) {
  if (!['equipment','skillBook'].includes(item.kind)) return '';
  const requirements=item.requirements||[];
  const allocation=item.training?`<p class="field-note" data-manual-allocation>秘籍共 ${item.training.copies} 本 · 空闲 ${Math.max(0,item.training.copies-item.training.assignedTo.length)} 本${item.training.assignedTo.length?`<br>正在分配给：${item.training.assignedTo.map(c=>e(c.name)).join('、')}`:''}</p>`:'';
  return `${requirements.length?`<details class="item-requirements" ${requirements.some(r=>!r.met)?'open':''}><summary>${item.kind==='skillBook'?'修炼':'穿戴'}门槛 · ${requirements.filter(r=>r.met).length}/${requirements.length} 已满足</summary><ul>${requirements.map(r=>`<li data-requirement-met="${r.met}"><span>${r.met?'✓':'○'} ${e(r.label)}</span><span>当前 ${e(r.current)} / 需要 ${e(r.required)}</span></li>`).join('')}</ul></details>`:'<p class="field-note">无额外属性或身份门槛。</p>'}${allocation}`;
}
function equipment(state: GameState, busy: boolean) {
  const slots = state.hero.equipment ?? [];
  return `${tabs('equipment', state)}${notice(state)}<p class="panel-intro">随身兵刃、衣甲与饰物。点击行囊中的装备即可穿戴，属性会同步更新。</p><div class="equipment-grid">${slots.map(s => `<article class="equipment-slot" data-slot="${e(s.slot)}"><span class="slot-symbol" aria-hidden="true">${s.item?.icon ? `<img src="${e(assetUrl(s.item.icon))}" alt="">` : e(slotSymbols[s.slot] || '装')}</span><small>${e(s.slotName)}</small><h3>${e(s.item?.name || '尚未装备')}</h3><p>${e(s.item ? plain(s.item.description) : '此栏为空，得到装备后可在这里穿戴。')}</p>${(s.item?.affixes || []).map(line=>`<p class="gear-affix">${e(line)}</p>`).join('')}${s.item ? `<button class="text-button" data-action="unequip-item" data-slot="${e(s.slot)}" ${disabled(busy || state.hero.canManage === false)}>卸下装备</button>` : ''}</article>`).join('')}</div><h3 class="panel-heading">行囊中的装备</h3>${itemList((state.inventory ?? []).filter(i => i.kind === 'equipment'), state, busy, '行囊中暂无可穿戴装备。可以在商店购入装备，研习手册请到修炼页选择。')}<button class="button outline full-width" data-action="inventory">打开完整行囊</button>`;
}
function skillRecord(skill: Skill, state: GameState, busy: boolean, internal: boolean) {
  const locked = busy || state.hero.canManage === false;
  return `<article class="skill-record" data-skill-id="${e(skill.id)}"><div><h4>${e(skill.name)}${internal && skill.equipped ? `<span class="running-mark">${e(state.pack.terms?.internalSkills || '内功')} · 主运</span>` : ''}</h4><p>第 ${skill.level} 重${skill.maxLevel ? ` / ${skill.maxLevel} 重` : ''}${skill.description ? ` · ${e(plain(skill.description))}` : ''}</p><p class="skill-parameters" data-skill-parameters><span>基础内力消耗 ${skill.mpCost}</span>${skill.castSize!==undefined?`<span>基础距离 ${skill.castSize}</span>`:''}${skill.impactSize!==undefined?`<span>基础范围 ${skill.impactSize}</span>`:''}</p><p class="field-note">战斗中的消耗与范围会随天赋、装备和状态变化，以出招面板为准。</p>${progress(skill.exp ?? 0, skill.maxLevel && skill.level >= skill.maxLevel ? 0 : skill.nextExp ?? 0)}</div>${internal ? `<button class="item-action ${skill.equipped ? '' : 'primary-action'}" data-action="${skill.equipped ? 'clear-internal' : 'equip-internal'}" data-id="${e(skill.id)}" ${disabled(locked)}>${skill.equipped ? '停止主运' : '设为主运'}</button>` : `<button class="item-action" data-action="toggle-skill" data-id="${e(skill.id)}" data-active="${skill.active === false}" ${disabled(locked)}>${skill.active === false ? '启用招式' : '停用招式'}</button>`}</article>`;
}
function cultivation(state: GameState, busy: boolean) {
  const c = state.hero.cultivation;
  const books = (state.inventory ?? []).filter(i => i.kind === 'skillBook');
  return `${tabs('cultivation', state)}${notice(state)}<p class="panel-intro">选择一本秘籍修炼，战斗结束后获得修炼经验。主运流派单独选择，会影响实战效果。</p>${trainingOverview(state,busy)}<section class="cultivation-focus" data-testid="cultivation-focus"><div class="eyebrow">${c ? '当前修炼秘籍' : '修炼尚未开始'}</div><h3>${e(c?.itemName || '先选一部功法')}</h3>${c ? `<p>${e(c.skillName)} · 第 ${c.level} 重 / ${c.maxLevel} 重</p>${progress(c.exp, c.level>=c.maxLevel?0:c.nextExp)}<button class="text-button" data-action="clear-cultivation" ${disabled(busy || state.hero.canManage === false)}>暂停这部秘籍的修炼</button>` : '<p>在下方选择一本已有的研习手册，战斗结算后积累经验。</p>'}</section><h3 class="panel-heading">可修炼秘籍 <small>选择秘籍不会消耗物品</small></h3>${itemList(books, state, busy, '行囊中尚无秘籍。')}<h3 class="panel-heading">${e(state.pack.terms?.internalSkills || '内功')} <small>同时主运一门</small></h3><div class="skill-records">${(state.hero.internalSkills ?? []).map(s => skillRecord(s, state, busy, true)).join('') || '<p class="muted">尚未学会内功，先选择上方秘籍修炼。</p>'}</div><h3 class="panel-heading">${e(state.pack.terms?.externalSkills || '外功招式')} <small>启用后可在战斗中使用</small></h3><div class="skill-records">${(state.hero.externalSkills ?? []).map(s => skillRecord(s, state, busy, false)).join('') || '<p class="muted">尚未习得外功。</p>'}</div>`;
}
function trainingOverview(state: GameState, busy: boolean) {
  const labels={active:'参战',reserve:'后备休整',following:'剧情随行','story-away':'剧情安排'};
  return `<details class="training-overview"><summary>伙伴修炼总览 · ${(state.roster||[]).filter(c=>c.cultivation).length} 人已选秘籍</summary><p class="panel-intro">仅实际参战人物在结算时获得本场秘籍经验；后备保留修炼选择。主运功法与秘籍修炼分别设置。</p><div class="skill-records">${(state.roster||[]).map(c=>`<article class="skill-record" data-training-character="${e(c.id)}"><div><h4>${e(c.name)} <small>${labels[c.formationStatus]}</small></h4><p>主运：${e(c.runningInternalName||'未设置')}</p><p>秘籍：${e(c.cultivation?.itemName||'未选择')}${c.cultivation?` · 第 ${c.cultivation.level}/${c.cultivation.maxLevel} 重`:''}</p>${c.cultivation?progress(c.cultivation.exp,c.cultivation.level>=c.cultivation.maxLevel?0:c.cultivation.nextExp):''}</div><button class="item-action" data-action="manage-character" data-panel="cultivation" data-id="${e(c.id)}" ${disabled(busy)}>查看修炼</button></article>`).join('')}</div></details>`;
}
function inventory(state: GameState, busy: boolean, filter: InventoryFilter, options: InventoryViewOptions) {
  const query=options.query.trim().toLocaleLowerCase();
  const items = (state.inventory ?? []).filter(i => (filter === 'all' || i.kind === filter) && i.name.toLocaleLowerCase().includes(query));
  if(options.sort==='name')items.sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')||a.entryNumber-b.entryNumber);
  if(options.sort==='count')items.sort((a,b)=>b.count-a.count||a.entryNumber-b.entryNumber);
  return `${notice(state)}<div class="inventory-silver">${e(state.pack.currencyName || '钱币')} <strong>${state.silver.toLocaleString()} ${e(state.pack.currencyUnit || state.pack.currencyName || '')}</strong>${state.yuanbao ? `<span>元宝 ${state.yuanbao || 0}</span>` : ''}</div><nav class="inventory-filters" aria-label="行囊分类">${(['all', 'equipment', 'skillBook', 'consumable', 'other'] as const).map(id => `<button class="${filter === id ? 'active' : ''}" data-action="inventory-filter" data-id="${id}">${id === 'all' ? '全部' : kindName[id]}</button>`).join('')}</nav>${itemList(items, state, busy, '这个分类里暂时没有物品。')}${'chestMapId' in state.pack?`<button class="button outline full-width" data-action="chest" ${disabled(state.map.id!==state.pack.chestMapId)}>打开储物箱</button>`:''}<button class="button outline full-width" data-action="download-save" ${disabled(state.phase !== 'world' || busy)}>导出存档备份</button>`;
}
function inventoryTools(options: InventoryViewOptions) {
  return `<div class="inventory-tools"><label>查找物品<input id="inventory-search" type="text" value="${e(options.query)}" placeholder="输入物品名称" autocomplete="off"></label><label>排列方式<select id="inventory-sort"><option value="original" ${options.sort==='original'?'selected':''}>原始顺序</option><option value="name" ${options.sort==='name'?'selected':''}>按名称</option><option value="count" ${options.sort==='count'?'selected':''}>按数量从多到少</option></select></label></div>`;
}
function settingsPanel(settings: Settings) {
  const check = (id: keyof Settings, title: string, description: string) => `<label class="setting-row"><span>${title}<small>${description}</small></span><input type="checkbox" name="${id}" ${settings[id] ? 'checked' : ''}></label>`;
  return `<p class="panel-intro">调整战斗方式与阅读习惯，修改后自动保存到当前浏览器。打开面板时战斗暂停，关闭后继续。</p><form id="game-settings" class="settings-list"><label class="setting-row"><span>战斗方式<small>手动选格与出招，或由电脑代你行动；战斗中可随时切换。</small></span><select name="battleMode"><option value="manual" ${settings.battleMode === 'manual' ? 'selected' : ''}>手动战斗</option><option value="auto" ${settings.battleMode === 'auto' ? 'selected' : ''}>自动战斗</option></select></label><label class="setting-row"><span>自动战斗速度<small>影响行动间隔与演出速度，不改变战斗规则和伤害。</small></span><select name="battleSpeed">${([1, 2, 4] as const).map(n => `<option value="${n}" ${settings.battleSpeed === n ? 'selected' : ''}>${n} 倍速</option>`).join('')}</select></label>${check('autoSave', '自动保存旅程', '回到地图、装备或修炼调整后保存自动进度；手动存档单独保留。')}${check('showGrid', '显示棋盘格', '隐藏格线后，仍会显示可移动与可出招的位置。')}${check('showDamage', '伤害与回复数字', '在角色上方显示实际伤害、治疗与内力变化。')}${check('battleLighting', '战场光照', '环境明暗、当前行动聚光与受击、治疗柔光；关闭可简化画面。')}${check('reducedMotion', '减少动态效果', '缩短移动演出，关闭动态柔光与受击动画，保留静态环境光。')}${check('largeText', '放大文字', '放大剧情、物品说明、战况和操作文字。')}</form><p class="settings-saved">自动进度和手动存档按世界分别保留，标题页可读取最近进度或手动存档。对话、商店和战斗进行中需先完成当前流程再保存；也可在行囊导出完整备份。</p>`;
}
function partyPanel(state: GameState) {
  return `<p class="panel-intro">同伴会实际加入队伍，并在允许组队的战斗中出场。手动模式可操作当前行动的每名队员。</p><div class="party-list">${(state.party || []).map(member => `<article class="party-member" data-member-id="${e(member.id)}">${member.sprite ? `<img src="${e(assetUrl(member.portrait || member.sprite))}" alt="${e(member.name)}">` : ''}<div><small>${member.isHero ? '主角' : '同行伙伴'} · 第 ${member.level} 级</small><h3>${e(member.name)}</h3><p>气血 ${member.hp} / ${member.maxHp}<br>${e(state.pack.terms?.energy || '内力')} ${member.mp} / ${member.maxMp}</p><div class="party-skills">${member.skills.map(skill => `<span>${e(skill.name)} · ${skill.level}重</span>`).join('')}</div><p>装备：${member.equipment.filter(s => s.item).map(s => e(s.item!.name)).join('、') || '未穿戴装备'}</p></div></article>`).join('')}</div>`;
}
function rosterControls(state: GameState, busy: boolean) {
  const roster = state.roster || [];
  const groups: {id: NonNullable<GameState['roster']>[number]['formationStatus']; title: string; description: string}[] = [
    {id:'active', title:'参战队伍', description:'可换装、修炼与调整顺序；每场实际出场人数仍由遭遇决定。主角固定在首位。'},
    {id:'reserve', title:'后备伙伴', description:'由你安排休整，保留装备与成长；回到地图后可随时归队，培养需先归队。'},
    {id:'following', title:'剧情随行', description:'随剧情同行，当前可查看人物；能否参战由后续剧情决定。'},
    {id:'story-away', title:'剧情暂离／待剧情安排', description:'归队由剧情决定，不能通过队伍编排直接召回。已有人物资料仍可查看。'},
  ];
  return `<h3 class="panel-heading">队伍编排</h3>${state.hero.canManage === false ? '<p class="panel-notice">当前可查看名册；请返回地图并结束交互后调整队伍。</p>' : ''}<div class="roster-summary" aria-label="队伍状态人数">${groups.map(g=>`<span>${g.title.split('／')[0]} <b>${roster.filter(c=>c.formationStatus===g.id).length}</b></span>`).join('')}</div>${groups.map(group=>{
    const members=roster.filter(c=>c.formationStatus===group.id);
    if (!members.length) return '';
    return `<section class="roster-group" data-roster-group="${group.id}"><h4>${group.title} <small>${members.length} 人</small></h4><p class="panel-intro">${group.description}</p><div class="roster-controls">${members.map(c=>{
      const index=state.party.findIndex(p=>p.id===c.id);
      const placement=c.formationStatus==='active'&&!c.isHero?'reserve':c.formationStatus==='reserve'?'member':null;
      return `<article data-roster-id="${e(c.id)}" data-formation-status="${c.formationStatus}"><strong>${e(c.name)}</strong><span>第 ${c.level} 级${c.isHero?' · 主角':''}</span><div><button class="item-action" data-action="manage-character" data-id="${e(c.id)}" ${disabled(busy)}>${c.formationStatus==='active'?'查看／培养':'查看人物'}</button>${placement?`<button class="item-action" data-action="party-placement" data-id="${e(c.id)}" data-placement="${placement}" ${disabled(busy||(placement==='member'?!c.canRejoin:!c.canBench))}>${placement==='member'?'归队参战':'转为后备'}</button>`:''}${c.formationStatus==='active'&&!c.isHero?`<button class="item-action" data-action="party-order" data-id="${e(c.id)}" data-index="${index-1}" ${disabled(busy||state.hero.canManage===false||index<=1)}>上移</button><button class="item-action" data-action="party-order" data-id="${e(c.id)}" data-index="${index+1}" ${disabled(busy||state.hero.canManage===false||index>=state.party.length-1)}>下移</button>`:''}</div></article>`;
    }).join('')}</div></section>`;
  }).join('')}`;
}
function characterSelector(state: GameState, busy: boolean) {
  return `<label class="managed-character-label">当前人物<select id="managed-character" ${disabled(busy)}>${(state.roster || state.party).map(c => `<option value="${e(c.id)}" ${c.id === state.hero.id ? 'selected' : ''}>${e(c.name)} · 第 ${c.level} 级</option>`).join('')}</select></label>`;
}
export function chestPanel(state: GameState, busy: boolean) {
  const chest=state.chest;
  if(!chest) return '<p>当前没有储物箱。</p>';
  const list=(items: typeof chest.entries, deposit: boolean)=>items.map(i=>`<article data-chest-item="${e(i.id)}"><span>${i.icon?`<img src="${e(assetUrl(i.icon))}" alt="">`:''}${e(i.name)} ×${i.quantity}</span><button class="item-action" data-action="${deposit?'chest-deposit':'chest-withdraw'}" data-entry-number="${i.entryNumber}" ${disabled(busy||!chest.canManage||(deposit&&!i.canDeposit))}>${deposit?'存入一件':'取出一件'}</button></article>`).join('') || '<p class="muted">暂无物品。</p>';
  return `${chest.canManage ? '' : notice(state)}<p class="panel-intro">储物箱 ${chest.stored} / ${chest.capacity}。任务物品不能存入；独立装备保留原来的词条。</p><h3 class="panel-heading">行囊</h3><div class="chest-items">${list(chest.inventory,true)}</div><h3 class="panel-heading">储物箱</h3><div class="chest-items">${list(chest.entries,false)}</div>`;
}
function questPanel(state: GameState) {
  const goals = state.objectives || [], done = goals.filter(q => q.completed).length;
  const milestones=state.milestones?.length?`<h3 class="panel-heading">江湖消息</h3><p class="panel-intro">消息随成长出现；与相关人物交谈，可继续经历后续故事。</p><ol class="objective-list">${state.milestones.map(m=>`<li class="${m.completed?'done':''}" data-milestone-id="${e(m.id)}"><span class="objective-tick">${m.completed?'✓':'·'}</span><div><strong>${e(m.title)} · ${m.completed?'已发生':'尚未发生'}</strong><p>${m.requirements.map(e).join('；')}</p></div></li>`).join('')}</ol>`:'';
  const journal=state.journal?.length?`<details class="journey-journal"><summary>旅途记事 · 最近 ${state.journal.length} 条</summary><div class="skill-records">${state.journal.map(entry=>`<article data-journal-id="${entry.id}"><small>${e(entry.date)}</small><p>${e(plain(entry.text))}</p></article>`).join('')}</div></details>`:'';
  return `${journeyFocusView(state)}<p class="panel-intro">${e(state.pack.chapterTitle || state.pack.subtitle)} · 完成 ${done} / ${goals.length} 项。本章以完整游玩流程为目标，阅读与手动战斗时间因人而异。</p><ol class="objective-list">${goals.map((goal,index) => `<li class="${goal.completed ? 'done' : ''}" data-objective-id="${e(goal.id)}"><span class="objective-tick">${goal.completed ? '✓' : index + 1}</span><div><strong>${e(goal.title)}</strong>${goal.description ? `<p>${e(goal.description)}</p>` : ''}</div></li>`).join('')}</ol>${done === goals.length && goals.length ? `<p class="panel-notice">${state.tutorial?'入门体验目标已完成，教学任务仍在进行。请按上方任务继续；两者分别记录。':state.milestones?.length ? '入门体验目标已完成，可以继续结识伙伴、修炼武学与探索江湖。' : '本章目标已全部达成，可保存此次旅程。'}</p>` : ''}${milestones}${journal}<button class="button outline full-width" data-action="save" ${state.phase !== 'world' ? 'disabled' : ''}>保存当前世界进度</button>`;
}
export function panelContent(name: PanelName, state: GameState, settings: Settings, busy = false, filter: InventoryFilter = 'all', inventoryOptions: InventoryViewOptions = {query:'',sort:'original'}): {title: string; content: string} {
  if (name === 'party') return {title: '同行队伍', content: (state.pack.chapterGuide&&state.adventure?`<section class="companion-morality"><p><span>道德值</span> <strong data-morality>${e(state.adventure.morality)}</strong></p><p class="panel-intro">有些伙伴会在意你的行事方式；数值高低并非对所有条件都更有利。</p><a class="button outline" data-companion-roster href="../${document.documentElement.lang==='zh-CN'?'zh':'en'}/?kind=companions" target="_blank" rel="noopener"><span>伙伴名册</span> ↗</a></section>`:'')+rosterControls(state,busy) + `<details class="roster-details"><summary>参战队员详情 · 装备与武功</summary>${partyPanel(state)}</details>`};
  if (name === 'chest') return {title: '储物箱', content: chestPanel(state,busy)};
  if (name === 'quests') return {title: state.pack.terms?.missions||'章节目标与旅途记录', content: '<button class="button outline full-width" data-action="history">通知与操作记录</button>'+(appConfig.features.some(feature=>feature.id==='companions')&&state.phase!=='title'?'<button class="button outline full-width" data-action="companion-clues">当前地图的伙伴招募线索</button>':'')+questPanel(state)+(state.achievements?.length?`<h3 class="panel-heading">已获称号</h3><div class="skill-records">${state.achievements.map(a=>`<article data-achievement-id="${e(a.id)}"><strong>${e(a.name)}</strong>${a.description?`<p>${e(a.description)}</p>`:''}</article>`).join('')}</div>`:'')};
  if (name === 'settings') return {title: '游玩设置', content: settingsPanel(settings) + `<form id="audio-settings" class="settings-list"><label class="setting-row"><span>音乐音量<small>场景与战斗音乐；调到0关闭。</small></span><input aria-label="音乐音量" type="range" name="musicVolume" min="0" max="100" value="${Math.round(settings.musicVolume*100)}"></label><label class="setting-row"><span>音效音量<small>出招、用药和升级音效；调到0关闭。</small></span><input aria-label="音效音量" type="range" name="effectsVolume" min="0" max="100" value="${Math.round(settings.effectsVolume*100)}"></label></form>`};
  state = {...state, hero: state.managedCharacter || state.hero};
  const selector=characterSelector(state,busy);
  if (name === 'character' || name === 'equipment' || name === 'cultivation') {
    const body=name==='character'?character(state,busy):name==='equipment'?equipment(state,busy):cultivation(state,busy);
    return {title:name==='character'?state.hero.name:name==='equipment'?'随身装备':state.pack.terms?.cultivation||'功法修炼',content:selector+body};
  }
  return {title: '随身行囊', content: selector+inventoryTools(inventoryOptions)+inventory(state, busy, filter, inventoryOptions)};
}
