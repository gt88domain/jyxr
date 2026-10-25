import type {GameState} from './bridge';
import {copy as t} from './ui-language';
import './party-roster.css';

const e = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
type Member = NonNullable<GameState['roster']>[number];

/** Displays host state only; formation and training remain host commands. */
export function partyRoster(state: GameState, busy: boolean): string {
  const roster = state.roster || [];
  const active = state.party.map(p=>roster.find(c=>c.id===p.id)).filter((c): c is Member=>!!c&&c.formationStatus==='active');
  const locked = busy || state.phase !== 'world' || state.hero.canManage === false;
  const disabled = (value: boolean) => value ? 'disabled' : '';
  function card(c: Member) {
    const index = active.findIndex(p=>p.id===c.id), inParty = c.formationStatus === 'active';
    const deployed = state.battle?.units.some(u=>u.team===1&&(u.id===c.id||u.definitionId===c.definitionId));
    const status = state.phase==='battle'&&inParty
      ? deployed?t('In this battle','本场已出战'):t('Not in this battle','本场未出战')
      : inParty?`${t('Party order','队伍顺序')} ${index+1}`:({active:'',reserve:t('Reserve','后备休整'),following:t('Story companion','剧情随行'),'story-away':t('Away on story business','剧情暂离')}[c.formationStatus]||'');
    const shortcut = (panel:string, section:string, label:string) => `<button class="item-action" data-action="manage-character" data-id="${e(c.id)}" data-panel="${panel}" data-section="${section}" ${disabled(busy)}>${label}</button>`;
    return `<article class="pr-card" data-roster-id="${e(c.id)}" data-formation-status="${c.formationStatus}">
      <header><div><span class="pr-position">${e(status)}</span><h3>${e(c.name)}</h3></div><span>${t('Lv.','等级')} ${c.level}<br>${c.hp}/${c.maxHp} HP</span></header>
      <p class="pr-preparation" data-companion-preparation><span>${t('Gear','装备')} <b>${c.equipment.filter(s=>s.item).length}/${c.equipment.length}</b></span><span>${t('Unspent points','未分配属性点')} <b>${c.unspentStatPoints}</b></span></p>
      <dl><div><dt>${t('Mastery','主专精')}</dt><dd>${e(c.runningInternalName||t('None equipped','尚未装备'))}</dd></div><div><dt>${t('Study','研习')}</dt><dd>${e(c.cultivation?.itemName||t('No guide selected','未选教材'))}</dd></div></dl>
      ${inParty?`<nav class="pr-shortcuts" aria-label="${e(c.name)} · ${t('Preparation','出发准备')}">${shortcut('equipment','as-gear',t('Gear','装备'))}${shortcut('loadout','as-mastery',t('Mastery','专精'))}${shortcut('cultivation','as-study',t('Study','研习'))}</nav>`:''}
      <div class="pr-actions"><button class="item-action" data-action="manage-character" data-id="${e(c.id)}" ${disabled(busy)}>${t('Character','人物')}</button>${inParty&&!c.isHero?`<button class="item-action" data-action="party-order" data-id="${e(c.id)}" data-index="${index-1}" aria-label="${e(t(`Move ${c.name} up`,`将${c.name}上移`))}" ${disabled(locked||index<=1)}>↑ ${t('Up','上移')}</button><button class="item-action" data-action="party-order" data-id="${e(c.id)}" data-index="${index+1}" aria-label="${e(t(`Move ${c.name} down`,`将${c.name}下移`))}" ${disabled(locked||index>=active.length-1)}>↓ ${t('Down','下移')}</button>`:''}</div>
      ${inParty&&!c.isHero?`<details class="pr-placement"><summary>${t('Rest this companion','安排伙伴休整')}</summary><p>${t('Reserve companions keep their gear and training. Bring them back to the party before training or fighting.','后备伙伴保留装备与成长；归队后才能继续培养和出战。')}</p><button class="item-action" data-action="party-placement" data-placement="reserve" data-id="${e(c.id)}" ${disabled(locked||!c.canBench)}>${t('Move to reserve','转为后备')}</button></details>`:c.formationStatus==='reserve'?`<button class="item-action" data-action="party-placement" data-placement="member" data-id="${e(c.id)}" ${disabled(locked||!c.canRejoin)}>${t('Return to party','归队')}</button>`:''}
    </article>`;
  }
  const groups: {status:Member['formationStatus'];title:string;hint:string}[] = [
    {status:'reserve',title:t('Reserve','后备伙伴'),hint:t('Resting companions keep their progress. Return them to the party to train or fight.','休整伙伴保留成长，归队后可以培养或出战。')},
    {status:'following',title:t('Story companions','剧情随行'),hint:t('Traveling with you as part of a story. Joining the fighting party depends on later events.','随剧情同行，能否加入出战队伍由后续事件决定。')},
    {status:'story-away',title:t('Away','剧情暂离'),hint:t('These companions return through story events. They cannot be recalled here.','这些伙伴通过剧情归队，不能在这里直接召回。')},
  ];
  return `<section class="party-roster"><header class="pr-heading"><strong>${t('Traveling party','同行队伍')} · ${active.length}</strong><button class="item-action" data-action="quests">${t('Goals','目标')} →</button></header><p class="pr-hint">${t('Order sets your usual lineup. Each encounter decides how many fight; story battles may require specific companions. Only fighters earn study XP.','队伍顺序决定通常的出场顺序；每场人数由遭遇决定，剧情战也可能指定伙伴。只有实际出场者获得研习经验。')}</p>${state.phase!=='world'?`<p class="pr-hint">${t('You can inspect companions now. Finish the current encounter before changing gear or formation.','当前可以查看伙伴；结束交互后再调整装备或编队。')}</p>`:''}<div class="pr-cards" data-roster-group="active">${active.map(card).join('')}</div>${groups.map(g=>{const members=roster.filter(c=>c.formationStatus===g.status);return members.length?`<details class="pr-group" data-roster-group="${g.status}"><summary>${g.title} · ${members.length}</summary><p class="pr-hint">${g.hint}</p><div class="pr-cards">${members.map(card).join('')}</div></details>`:''}).join('')}${state.adventure?`<details class="pr-group"><summary>${t('Morality & recruitment','道德值与招募')} · <span data-morality>${state.adventure.morality}</span></summary><p class="pr-hint">${t('Some companions care about your choices. A higher score does not satisfy every recruitment condition.','有些伙伴在意你的行事方式；数值更高并不代表更容易满足所有招募条件。')}</p><a class="item-action" data-companion-roster href="../${document.documentElement.lang==='zh-CN'?'zh':'en'}/?kind=companions" target="_blank" rel="noopener">${t('Companion catalog','伙伴名册')} ↗</a></details>`:''}</section>`;
}
