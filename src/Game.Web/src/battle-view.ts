import './battle.css';
import type {GameState, Skill, Unit} from './bridge';
import type {Board} from './board';
import {assetUrl} from './content';

export interface BattleViewOptions {
  state: GameState; busy: boolean; selectedSkill: string; autoBattle: boolean; battleSpeed: number;
  showGrid?: boolean; showDamage?: boolean; reducedMotion?: boolean; paused?: boolean; intent?: 'move' | 'attack';
}
type DescribedSkill = Skill & {description?: string; castSize?: number; impactSize?: number};
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]!));
const plain = (text: string) => text.replace(/\[\[[a-z]+:([^\]]*)\]\]/gi, '$1').replace(/<\/?color[^>]*>/g, '');
const complete = (state: GameState) => !!state.battle?.outcome && !['none', 'ongoing', 'inprogress', 'unknown', 'notended'].includes(state.battle.outcome.toLowerCase());

export function battleShell(state: GameState): string {
  return `<main class="duel-screen"><header class="duel-heading"><div><span class="duel-eyebrow">遭遇 · 行动与战技</span><h1 id="battle-name">战斗</h1></div><div class="duel-heading-controls"><div class="duel-mode" aria-label="战斗操控方式"><button data-action="battle-mode" data-id="manual">手动出招</button><button data-action="battle-mode" data-id="auto">自动交手</button></div><button class="duel-pause" data-action="battle-pause" aria-pressed="false">Ⅱ 暂停</button></div></header>
    <section class="duel-arena"><div class="duel-matchup" id="battle-matchup"></div><div id="board-viewport" class="board-viewport duel-board" role="application" aria-label="战场：走位模式点击青色格移动，出招模式点击对手或橙色目标格施展武学"></div><div class="duel-arena-foot"><div class="duel-intent" aria-label="本次棋盘操作"><button data-action="battle-intent" data-id="move">走位</button><button data-action="battle-intent" data-id="attack">出招</button></div><span><i class="legend-move"></i>可移动 <i class="legend-target"></i>招式范围 <i class="legend-turn"></i>当前行动</span><span>${escape(state.map?.name || '野外')} · 战场</span></div></section>
    <aside class="duel-sidebar"><section id="active-unit" class="duel-turn"></section><section class="duel-arts"><div class="duel-panel-title"><h2>所学武艺</h2><span>择一招，见真章</span></div><div id="skill-list"></div><div id="skill-description" class="duel-skill-description"></div><button class="duel-rest" data-action="rest">◐ 休息调息 <small>恢复气血与${escape(state.pack.terms?.energy || '内力')}</small></button></section><section class="duel-chronicle"><div class="duel-panel-title"><h2>交手实录</h2><span>战况</span></div><div id="battle-log" role="log" aria-live="polite"></div></section></aside>
    <footer class="duel-footer"><div id="battle-tip" class="duel-tip" aria-live="polite"></div><div class="duel-speed" aria-label="战斗速度"><span>交手节奏</span>${[1, 2, 4].map(speed => `<button data-action="battle-speed" data-id="${speed}">${speed}×</button>`).join('')}</div></footer><div id="battle-result"></div></main>`;
}

function combatant(unit: Unit | undefined, friendly: boolean, energy: string, count: number): string {
  if (!unit) return '';
  const ratio = Math.max(0, Math.min(100, unit.hp / unit.maxHp * 100));
  return `<article class="duel-combatant ${friendly ? 'friendly' : 'opponent'}"><img src="${assetUrl(unit.portrait || unit.sprite)}" alt=""/><div class="duel-combatant-info"><div><span>${friendly ? '我方' : '对手'}${count > 1 ? ` · ${count}人` : ''}</span><strong>${escape(unit.name)}</strong></div><div class="duel-hp-track"><i style="width:${ratio}%"></i></div><p>气血 <b>${unit.hp}</b><span> / ${unit.maxHp}</span><small>${escape(energy)} ${unit.mp} / ${unit.maxMp}</small></p></div></article>`;
}

export function updateBattleView(options: BattleViewOptions, board?: Board): string {
  const {state, busy, autoBattle, battleSpeed, paused} = options;
  const intent = options.intent ?? 'move';
  const battle = state.battle;
  if (!battle) return options.selectedSkill;
  const query = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
  const ended = complete(state), active = battle.units.find(unit => unit.id === battle.activeUnitId);
  const playerTurn = active?.team === 1;
  const skills = (battle.skills ?? []) as DescribedSkill[];
  const selectedSkill = skills.some(skill => skill.id === options.selectedSkill) ? options.selectedSkill : (skills.find(skill => skill.available !== false)?.id ?? skills[0]?.id ?? '');
  const chosen = skills.find(skill => skill.id === selectedSkill);
  const friendly = active?.team === 1 ? active : battle.units.find(unit => unit.team === 1), opponent = battle.units.find(unit => unit.team !== 1 && unit.alive) ?? battle.units.find(unit => unit.team !== 1);
  query('#battle-name').textContent = battle.name.replace(/_战斗$/, '').replace(/_/g, ' · ');
  query('#battle-matchup').innerHTML = `${combatant(friendly, true, state.pack.terms?.energy || '内力', battle.units.filter(u => u.team === 1 && u.alive).length)}<span class="duel-versus">交<br>锋</span>${combatant(opponent, false, state.pack.terms?.energy || '内力', battle.units.filter(u => u.team !== 1 && u.alive).length)}`;
  query('#active-unit').innerHTML = `<span class="duel-eyebrow">${ended ? '战斗结束' : paused ? '战斗已暂停' : busy ? '招式流转' : playerTurn ? '我方行动' : '对手行动'}</span><h2>${escape(ended ? '收势，调息。' : active?.name || '静候时机')}</h2><p>${ended ? '每一场交手，都是下一程的起点。' : paused ? '片刻凝神。点击继续，恢复交手。' : autoBattle ? '自动交手中，可随时切换手动接管。' : playerTurn ? '先走位，再择招。落子之前，自有分寸。' : '凝神观察，等待行动时机。'}</p>`;
  query('#skill-list').innerHTML = skills.map((skill, index) => `<button class="duel-skill ${selectedSkill === skill.id ? 'selected' : ''}" data-action="skill" data-id="${escape(skill.id)}" aria-pressed="${selectedSkill === skill.id}" ${skill.available === false || !playerTurn || ended || busy || autoBattle || paused ? 'disabled' : ''} title="${escape(skill.reason || skill.description || '')}"><span class="duel-skill-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${escape(skill.name)}</strong><small>第 ${skill.level} 重 · 耗${escape(state.pack.terms?.energy || '内力')} ${skill.mpCost}</small></span><span class="duel-skill-check">${selectedSkill === skill.id ? '✓' : '○'}</span></button>`).join('') || '<p class="duel-muted">静候行动时机</p>';
  query('#skill-description').innerHTML = chosen ? `<strong>${escape(chosen.name)}</strong><p>${escape(plain(chosen.description || '选择招式，查看战场中标出的可用目标。'))}</p>${chosen.castSize === undefined ? '' : `<small>施展距离 ${chosen.castSize} 格${chosen.impactSize === undefined ? '' : ` · 作用范围 ${chosen.impactSize}`}</small>`}${chosen.available === false && chosen.reason ? `<p class="duel-unavailable">${escape(chosen.reason)}</p>` : ''}` : '';
  query<HTMLButtonElement>('[data-action="rest"]').disabled = !playerTurn || ended || busy || autoBattle || !!paused;
  const pause = query<HTMLButtonElement>('[data-action="battle-pause"]');
  pause.textContent = paused ? '▶ 继续' : 'Ⅱ 暂停'; pause.setAttribute('aria-pressed', String(!!paused)); pause.disabled = ended;
  document.querySelectorAll<HTMLButtonElement>('[data-action="battle-intent"]').forEach(button => {
    const selected = button.dataset.id === intent;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected));
    button.disabled = ended || busy || !!paused || autoBattle || !playerTurn;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-action="battle-mode"]').forEach(button => {
    const selected = (button.dataset.id === 'auto') === autoBattle;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); button.disabled = ended;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-action="battle-speed"]').forEach(button => {
    const selected = Number(button.dataset.id) === battleSpeed;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected));
  });
  query('#battle-log').innerHTML = (battle.logs ?? []).slice(-12).reverse().map((line, index) => `<p ${index === 0 ? 'class="latest"' : ''}>${escape(plain(line))}</p>`).join('') || '<p>双方就位，等待行动。</p>';
  query('#battle-tip').innerHTML = `<span class="duel-live-dot ${autoBattle && !ended && !paused ? 'running' : ''}"></span><strong>${ended ? '战斗结束' : paused ? '交手已暂停' : autoBattle ? `自动交手 · ${battleSpeed}×` : intent === 'move' ? '手动 · 走位' : '手动 · 出招'}</strong><span>${ended ? '查看此次历练所得。' : paused ? '点击继续，恢复当前战斗。' : autoBattle ? '正在自动选择走位与招式。' : !playerTurn ? '对手行动中，请稍候。' : intent === 'move' ? '点击青色格移动；选一门武学，即可切换出招。' : '点击橙色目标格施展所选武学；也可直接点击对手。'}</span>`;
  const defeated = battle.units.filter(unit => unit.team === 1).every(unit => !unit.alive);
  query('#battle-result').innerHTML = ended ? `<div class="duel-result-scrim"><section class="duel-result" aria-label="战斗结算"><span class="duel-result-seal">${defeated ? '悟' : '胜'}</span><span class="duel-eyebrow">战斗结算</span><h2>${defeated ? '胜败皆为历练' : '一招一式，渐入佳境'}</h2><p>${defeated ? '收拾心绪，待调息后再来讨教。' : '整备行囊，继续下一程。'}</p><div class="duel-result-summary">${(state.logs ?? []).slice(-3).map(line => `<p>${escape(plain(line))}</p>`).join('')}</div><button class="duel-return" data-action="leave-battle">结束战斗 <span>→</span></button></section></div>` : '';
  board?.update(battle, {selectedSkillId: selectedSkill, speed: battleSpeed, manual: !autoBattle && !ended && !paused, busy: busy || paused, showGrid: options.showGrid, showDamage: options.showDamage, reducedMotion: options.reducedMotion, intent});
  return selectedSkill;
}
