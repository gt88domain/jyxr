import {assetUrl} from './content';
import type {CreationState} from './bridge';

const e = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));

export function creationView(c: CreationState): {title: string; content: string} {
  const back = '<button class="button outline full-width" data-action="creation-back">返回上一步</button>';
  if (c.step === 'question') return {title: `入江湖 · ${c.questionIndex + 1} / ${c.total}`, content:
    `<p class="creation-prompt">${e(c.question!.title)}</p><div class="creation-options">${c.question!.options.map((o, index) => `<button class="button outline" data-action="creation-answer" data-index="${index}" data-question="${c.questionIndex}"><span>${index + 1}</span>${e(o.text)}</button>`).join('')}</div>${c.questionIndex ? back : ''}`};
  if (c.step === 'portrait') return {title: '选择你的头像', content:
    `<p class="panel-intro">${e(c.name)}，以怎样的面貌踏入江湖？</p><div class="creation-portraits">${c.portraits.map(p => `<button data-action="creation-portrait" data-id="${e(p.id)}" aria-label="选择头像 ${e(p.name)}"><img src="${e(assetUrl(p.image))}" alt=""><span>${e(p.name)}</span></button>`).join('')}</div>${back}`};
  const p = c.preview!;
  return {title: '确认初入江湖的你', content:
    `<div class="creation-summary"><img class="creation-head" src="${e(assetUrl(p.portrait))}" alt="${e(c.name)}的头像"><div><h3>${e(c.name)}</h3><p>随身银两 <strong data-creation-silver>${p.silver}</strong> 两 · ${c.difficulty === 'normal' ? '普通' : c.difficulty === 'hard' ? '困难' : '炼狱'}</p></div><img class="creation-actor" src="${e(assetUrl(p.sprite))}" alt="战斗形象"></div><div class="creation-stats">${p.attributes.map(s => `<div data-creation-stat="${e(s.id)}"><span>${e(s.label)}</span><strong>${s.value}</strong><small>随机 +${p.randomBonus[s.id] || 0}</small></div>`).join('')}</div><p class="panel-intro">天赋：${p.talents.map(t => e(t.name)).join('、') || '无'}<br>心法：${p.internalSkills.map(s => `${e(s.name)} ${s.level} 级`).join('、')}</p><h3 class="panel-heading">初始行囊</h3><div class="creation-items">${p.items.map(i => `<div data-creation-item="${e(i.id)}">${i.icon ? `<img src="${e(assetUrl(i.icon))}" alt="">` : ''}<span>${e(i.name)}</span><strong>×${i.quantity}</strong></div>`).join('')}</div><p class="field-note">第 ${c.roll} 次生成。重摇重新分配随机属性，保留问答、头像和初始物品。</p><div class="creation-actions"><button class="button outline" data-action="creation-roll">重新摇点</button><button class="button primary" data-action="creation-confirm">就此踏入江湖 →</button></div>${back}`};
}
