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
  const data = await response.json() as {stories: {current: number; total: number}; events: {current: number; total: number}; talents: {configured: number; total: number; metadataOnly: number; conditional?: number}; features: {id: string; name: string; estimate: number; evidence: string; gaps: string[]; count: number; total?: number; countLabel: string; structurallyUsable?: number; instructions?: number; normalVerified?: number; startingRewardCandidates?: number}[]};
  if (![data.stories?.current, data.stories?.total, data.events?.current, data.events?.total, data.talents?.configured, data.talents?.total, data.talents?.metadataOnly].every(v => Number.isFinite(v) && v >= 0))
    throw new Error('进度记录格式不受支持。');
  const checklistUrl = new URL(assetUrl('data/restoration-checklist.json'));
  checklistUrl.searchParams.set('v', import.meta.env.VITE_GAME_VERSION);
  const checklistResponse = await fetch(checklistUrl);
  if (!checklistResponse.ok) throw new Error('剩余工作清单暂时无法读取，请稍后重试。');
  const checklist = await checklistResponse.json() as {basis: string; tasks: {id: string; area: string; state: string; title: string; detail: string}[]; groups: {id: string; title: string; entries: {id: string; description: string; remainingSummary: string; sourceReferences: string[]}[]}[]};
  if (!Array.isArray(checklist.tasks) || !Array.isArray(checklist.groups)) throw new Error('剩余工作清单格式不受支持。');
  const list = (title: string, items: string[]) => `<section class="restoration-section"><h3>${title}</h3><ul>${items.map(item => `<li>${e(item)}</li>`).join('')}</ul></section>`;
  return `<div class="restoration-report"><section class="restoration-section" data-modernization-direction><h3>当前方向：原版内容的现代化重制</h3><p>保留人物、剧情、武学、道具、伙伴路线图和地图提示；优先让队伍、装备修炼与战斗操作清楚顺手。队伍现按参战、后备、剧情随行及剧情暂离分组。</p><p>以下百分比是此前原版迁移阶段的历史估算，不代表现代化版本的完成度。旧随机顺序、原Unity粒子与缺资料的小众内容不全部作为发布前提；实际流程、战斗结算和存档仍需验收。</p><a href="https://github.com/gt88domain/jyxr/blob/html5-web/src/Game.Web/MODERNIZATION_PLAN.md" target="_blank" rel="noopener noreferrer">查看现代化重制计划与分批验收</a></section><p class="restoration-total">约 <strong>${estimatedProgress}%</strong><span>历史迁移阶段估算 · 非当前版本完成度</span></p><p>${e(estimate.basis)}</p>
    <section class="restoration-section" data-platform-status><h3>最新界面与平台现状</h3><p>现代地图首屏固定人物、装备、修炼、行囊、队伍与更多；通知、保存直达。低频工具放在更多，最近300条操作与事件随存档保留，可分类查找。旧存档无法补回此前未记录的操作。</p><p>游戏状态已归属独立会话；46种指令共用类型与参数校验。完整响应接口、内容包清单规范、地图与任务状态统一仍未完成。原版风格目前仍是有原图依据的参考复原，原布局需要逐屏验收。</p><a href="https://github.com/gt88domain/jyxr/blob/html5-web/src/Game.Web/CURRENT_STATUS.md" target="_blank" rel="noopener noreferrer">查看五项实际现状、四份参考与后期缺口</a></section>
    <p class="panel-notice">后期1.1.0.6新增打包数据核对：107条奥义存在额外威力版本差异。原场景已提供地图、人物、战斗的只读复原预览，尚未接成完整旧版可玩界面。</p><button class="button outline full-width" data-action="late-reference">查看后期具名差异、天赋奥义与多周目</button>
    <p class="panel-notice">现代化已加入换装属性对比、秘籍门槛与伙伴修炼总览。手机战斗已有底部便捷栏、招式详情及触屏目标确认，滑动查看不会直接消耗行动。手动与自动仍共用原有规则；完整战况解释、半自动策略和真机跨浏览器检查继续保留为后续工作。</p>
    <div class="restoration-counts"><span>剧情结构 <b>${data.stories.current} / ${data.stories.total}</b></span><span>地图事件 <b>${data.events.current} / ${data.events.total}</b></span><span>天赋已有配置 <b>${data.talents.configured} / ${data.talents.total}</b></span></div>
    <p class="panel-notice">天赋仍有 ${data.talents.metadataOnly} 项只有元数据；另有 ${data.talents.conditional||0} 项作为其他效果的联动条件。已有配置也可能仅完成部分效果；剧情结构接入不等于所有路线已通关。</p>
    <section class="restoration-section"><h3>战斗、武学、道具与伙伴分项</h3><p>以下百分比同样是工程估算。定义数量是精确统计，不能换算成行为完成率。</p>
      ${(data.features||[]).map(item=>`<article class="restoration-feature" data-feature-id="${e(item.id)}"><h4>${e(item.name)} <span>约 ${item.estimate}%</span></h4><p class="restoration-feature-count">${e(item.countLabel)}：${item.count}${item.total?` / ${item.total}`:''}${item.structurallyUsable!==undefined?`；引用齐全 ${item.structurallyUsable} 场`:''}${item.instructions!==undefined?`；加入／随行指令 ${item.instructions} 条；普通流程已验证 ${item.normalVerified} 名`:''}${item.startingRewardCandidates!==undefined?`；周目开局奖励候选 ${item.startingRewardCandidates} 个已接入`:''}</p><p>${e(item.evidence)}</p><ul>${item.gaps.map(g=>`<li>${e(g)}</li>`).join('')}</ul></article>`).join('')}
      <button class="button outline full-width" data-action="companions">打开独立伙伴图鉴 · 地点与加入条件</button></section>
    <details class="restoration-weighted"><summary>查看整体${estimatedProgress}%估算的六项权重依据</summary>${estimate.categories.map(item => `<section class="restoration-category"><h3>${e(item.name)} <span>约 ${item.estimate}%</span></h3><progress max="100" value="${item.estimate}" aria-label="${e(item.name)}工程估算"></progress><p>${e(item.evidence)}</p><p class="restoration-remaining">待完成：${e(item.remaining)}</p><small>估算权重 ${item.weight}%</small></section>`).join('')}</details>
    ${list('旧版兼容差异（保留对照）', estimate.completionBlockers)}
    <section class="restoration-section restoration-checklist"><h3>原版对照清单（历史范围）</h3><p>${e(checklist.basis)}</p>
      <details data-remaining-tasks><summary>查看 ${checklist.tasks.length} 项具体工作与处理顺序</summary><ol>${checklist.tasks.map(task=>`<li data-remaining-task="${e(task.id)}"><strong>${e(task.title)}</strong><small>${e(task.area)} · ${e(task.state)}</small><p>${e(task.detail)}</p></li>`).join('')}</ol></details>
      ${checklist.groups.map(group=>`<details data-remaining-group="${e(group.id)}"><summary>${e(group.title)} · ${group.entries.length} 项</summary><ul>${group.entries.map(entry=>`<li><strong>${e(entry.id)}</strong>${entry.description?`<p>${e(entry.description)}</p>`:''}<p>待办：${e(entry.remainingSummary)}</p><small>${entry.sourceReferences.length?`旧 C#同名引用 ${entry.sourceReferences.length} 处；完整依据见下载清单。`:'当前旧 C#未找到同名引用，继续查证；不据此判定原版未使用。'}</small></li>`).join('')}</ul></details>`).join('')}
      <p><a href="${e(assetUrl('data/original-remaining.md'))}" download="原版剩余工作清单.md">下载完整清单（含名称与来源）</a></p></section>
    ${list('原版值得保留的优点', estimate.strengths)}${list('当前问题与流程缺点', estimate.problems)}${list('改善想法与下一阶段建议', estimate.suggestions)}
    <p><a href="https://github.com/gt88domain/jyxr/blob/html5-web/src/Game.Web/NEXT_GAME_NOTES.md" target="_blank" rel="noopener noreferrer">阶段观察与设计建议</a> · 当前优先原版内容的现代化体验，西方试验章保持现状。</p><button class="button outline full-width" data-action="close-modal">关闭进度页</button></div>`;
}
