import estimate from './restoration-estimate.json';
import {assetUrl} from './content';
import './restoration-progress.css';

const e = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
export const estimatedProgress = Math.round(estimate.categories.reduce((sum, item) => sum + item.weight * item.estimate, 0) / 100 / 5) * 5;
export async function restorationProgressView() {
  const url = new URL(assetUrl('data/restoration-progress.json'));
  url.searchParams.set('v', import.meta.env.VITE_GAME_VERSION);
  const response = await fetch(url);
  if (!response.ok) throw new Error('进度记录暂时无法读取，请稍后重试。');
  const data = await response.json() as {stories: {current: number; total: number}; events: {current: number; total: number}; talents: {configured: number; total: number; metadataOnly: number}; features: {id: string; name: string; estimate: number; evidence: string; gaps: string[]; count: number; total?: number; countLabel: string; structurallyUsable?: number; instructions?: number; normalVerified?: number}[]};
  if (![data.stories?.current, data.stories?.total, data.events?.current, data.events?.total, data.talents?.configured, data.talents?.total, data.talents?.metadataOnly].every(v => Number.isFinite(v) && v >= 0))
    throw new Error('进度记录格式不受支持。');
  const list = (title: string, items: string[]) => `<section class="restoration-section"><h3>${title}</h3><ul>${items.map(item => `<li>${e(item)}</li>`).join('')}</ul></section>`;
  return `<div class="restoration-report"><p class="restoration-total">约 <strong>${estimatedProgress}%</strong><span>工程估算 · 尚未完整复原</span></p><p>${e(estimate.basis)}</p>
    <div class="restoration-counts"><span>剧情结构 <b>${data.stories.current} / ${data.stories.total}</b></span><span>地图事件 <b>${data.events.current} / ${data.events.total}</b></span><span>天赋已有配置 <b>${data.talents.configured} / ${data.talents.total}</b></span></div>
    <p class="panel-notice">天赋仍有 ${data.talents.metadataOnly} 项只有元数据。已有配置也可能仅完成部分效果；剧情结构接入不等于所有路线已通关。</p>
    <section class="restoration-section"><h3>战斗、武学、道具与伙伴分项</h3><p>以下百分比同样是工程估算。定义数量是精确统计，不能换算成行为完成率。</p>
      ${(data.features||[]).map(item=>`<article class="restoration-feature" data-feature-id="${e(item.id)}"><h4>${e(item.name)} <span>约 ${item.estimate}%</span></h4><p class="restoration-feature-count">${e(item.countLabel)}：${item.count}${item.total?` / ${item.total}`:''}${item.structurallyUsable!==undefined?`；引用齐全 ${item.structurallyUsable} 场`:''}${item.instructions!==undefined?`；加入／随行指令 ${item.instructions} 条；普通流程已验证 ${item.normalVerified} 名`:''}</p><p>${e(item.evidence)}</p><ul>${item.gaps.map(g=>`<li>${e(g)}</li>`).join('')}</ul></article>`).join('')}
      <button class="button outline full-width" data-action="companions">打开独立伙伴图鉴 · 地点与加入条件</button></section>
    <details class="restoration-weighted"><summary>查看整体65%估算的六项权重依据</summary>${estimate.categories.map(item => `<section class="restoration-category"><h3>${e(item.name)} <span>约 ${item.estimate}%</span></h3><progress max="100" value="${item.estimate}" aria-label="${e(item.name)}工程估算"></progress><p>${e(item.evidence)}</p><p class="restoration-remaining">待完成：${e(item.remaining)}</p><small>估算权重 ${item.weight}%</small></section>`).join('')}</details>
    ${list('原版值得保留的优点', estimate.strengths)}${list('当前问题与流程缺点', estimate.problems)}${list('改善想法与下一阶段建议', estimate.suggestions)}<button class="button outline full-width" data-action="close-modal">关闭进度页</button></div>`;
}
