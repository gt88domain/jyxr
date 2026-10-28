import type {GameState, Skill} from './bridge';
import {copy} from './ui-language.ts';

const e = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const plain = (value: string) => value.replace(/\[\[[a-z]+:([^\]]*)\]\]/gi, '$1').replace(/<\/?color[^>]*>/g, '');

export function skillFacts(skill: Skill, energy: string): string {
  return copy(`${energy} ${skill.mpCost}${skill.rageCost ? ` · Base Rage ${skill.rageCost}` : ''}${skill.castSize === undefined ? '' : ` · Range ${skill.castSize} tiles`}${skill.impactSize === undefined ? '' : ` · Area ${skill.impactSize}`}${skill.cooldown ? ` · Cooldown ${skill.cooldown} turns` : ''}${skill.remainingCooldown ? ` (${skill.remainingCooldown} remaining)` : ''}`,
    `耗${energy} ${skill.mpCost}${skill.rageCost ? ` · 基础怒气 ${skill.rageCost}` : ''}${skill.castSize === undefined ? '' : ` · 距离 ${skill.castSize} 格`}${skill.impactSize === undefined ? '' : ` · 范围 ${skill.impactSize}`}${skill.cooldown ? ` · 冷却 ${skill.cooldown} 回合` : ''}${skill.remainingCooldown ? `（剩余 ${skill.remainingCooldown}）` : ''}`);
}

export function battleSkillsView(state: GameState, selected: string, canSelect: boolean): string {
  const active = state.battle?.units.find(u => u.id === state.battle?.activeUnitId);
  const energy = state.pack.terms?.energy || '内力';
  return `<p class="panel-intro">${e(active?.name || '当前角色')} · ${e(energy)} ${active?.mp ?? 0} / ${active?.maxMp ?? 0} · 怒气 ${active?.rage ?? 0}。${canSelect ? copy('Choose a technique, then select a target on the field.','选招后返回战场，点目标格确认施展。') : copy('Inspect techniques now. Select one on an ally’s manual turn.','当前可查看招式；手动操控且轮到我方时可选招。')}</p><p class="panel-intro" data-skill-preparation-note>${copy("Rank, weapon focus and effects all matter. Lower Energy cost conserves resources; damage also depends on the technique and your build.","等级、武器媒介和效果都会影响选择。较低能量消耗有助于续航，伤害还取决于招式本身与角色搭配。")}</p><div class="battle-skill-sheet">${(state.battle?.skills || []).map(skill => `<article class="battle-skill-card ${selected === skill.id ? 'selected' : ''}"><h3>${e(skill.name)} <small>第 ${skill.level} 重</small></h3><p>${e(plain(skill.description || '查看战场高亮范围选择目标。'))}</p><p class="battle-skill-facts">${e(skillFacts(skill, energy))}</p>${skill.available === false ? `<p class="duel-unavailable" data-skill-reason>${e(skill.reason || '当前无法施展')}</p>` : ''}<button class="item-action" data-action="choose-battle-skill" data-id="${e(skill.id)}" ${!canSelect || skill.available === false ? 'disabled' : ''}>${selected === skill.id ? '使用此招' : '选择此招'}</button></article>`).join('') || '<p>当前没有可用招式。</p>'}</div>`;
}

export function battleActionView(state: GameState, command: Record<string, unknown>): string {
  const active = state.battle?.units.find(u => u.id === state.battle?.activeUnitId);
  const skill = state.battle?.skills.find(s => s.id === command.skillId);
  const target = state.battle?.units.find(u => u.alive && u.x === command.x && u.y === command.y);
  return `<div class="battle-action-summary"><p>${e(active?.name)}${command.type === 'move' ? '走位至' : `施展「${skill?.name || '招式'}」`}</p><strong>${target ? e(target.name) + ' · ' : ''}第 ${Number(command.x) + 1} 列 · 第 ${Number(command.y) + 1} 行</strong>${skill ? `<p>${e(skillFacts(skill, state.pack.terms?.energy || '内力'))}</p>` : '<p>确认后移动。取消可重新选择位置。</p>'}</div><div class="battle-confirm-actions"><button class="button outline" data-action="close-modal">重新选择</button><button class="button" data-action="confirm-battle-action">${command.type === 'move' ? '确认走位' : '确认出招'}</button></div>`;
}
