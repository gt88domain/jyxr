import {assetUrl} from './content';
import type {GameState} from './bridge';
import './companions.css';

interface Condition {type: string; value: string; label: string; translated: boolean;}
interface Entry {map: string; location: string; storyId: string; conditions: Condition[]; probability: number; repeat: string;
  earlierEvents: {storyId: string; label: string; kind: string; probability: number; repeat: string; conditions: Condition[]}[];}
interface Edge {from: string; to: string; label: string; conditions: Condition[]; shadowed: boolean; moralityWindow?: {minimumInclusive: number | null; maximumExclusive: number | null};
  earlierBranches: {conditions: Condition[]; destination: string}[];}
interface Route {storyId: string; kind: 'JOIN' | 'FOLLOW'; actionIndex: number; runtimeAvailable: boolean; debug: boolean; hasMapEntry: boolean; cycles: string[];
  paths: {entry: Entry; edges: string[]; shadowed: boolean}[]; ancestorIds: string[];}
interface Companion {id: string; name: string; variant: string; portrait?: string; routes: Route[]; departures: {storyId: string; kind: string; label: string}[];
  verification: 'normal' | 'isolated' | 'unverified';}
export interface CompanionCatalog {schemaVersion: number; counts: {characterForms: number; instructions: number; normalVerified: number; isolatedVerified: number};
  characters: Companion[]; edges: Record<string, Edge>; nodes: Record<string, {id: string; label: string; source: string; runtimeAvailable: boolean; actions: {type: string; value: string; index: number}[]}>;}
const e = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
let cached: CompanionCatalog | undefined;
export async function loadCompanionCatalog(): Promise<CompanionCatalog> {
  if (cached) return cached;
  const url=new URL(assetUrl('data/companion-catalog.json'));url.searchParams.set('v',import.meta.env.VITE_GAME_VERSION);
  const r=await fetch(url);if(!r.ok)throw new Error('伙伴图鉴暂时无法读取，请稍后再试。');
  const data=await r.json() as CompanionCatalog;
  if(data.schemaVersion!==1||!Array.isArray(data.characters)||!data.nodes||!data.edges)throw new Error('伙伴图鉴格式不受支持。');
  return cached=data;
}
function current(companion: Companion, state: GameState) {
  return state.roster?.find(c=>(c.definitionId||c.id)===companion.id);
}
function status(companion: Companion, state: GameState) {
  const member=current(companion,state);
  if(member)return {kind:member.placement,label:{member:'参战中',follower:'随行中',reserve:'后备中'}[member.placement]};
  if(state.phase==='title')return {kind:'unknown',label:'未载入旅程'};
  const completed=new Set(state.companionJournal?.completedRecruitmentStories||[]);
  const met=companion.routes.filter(r=>completed.has(r.storyId));
  return met.length?{kind:'met',label:met.some(r=>r.kind==='JOIN')?'曾加入 · 当前离队':'曾随行 · 当前离队'}:{kind:'absent',label:'当前未在队伍'};
}
const verification: Record<Companion['verification'],string>={normal:'普通流程已验证',isolated:'独立加入分支已验证',unverified:'完整招募路线待验证'};
function conditions(items: Condition[]) {
  return items.length?`<ul class="companion-conditions">${items.map(c=>`<li>${e(c.label)}</li>`).join('')}</ul>`:'<p class="companion-note">此处无额外的显式条件。</p>';
}
function actionText(action: {type: string; value: string}) {
  const p=action.value.split('#');
  if(action.type==='SELECT')return `对话选择：${p[1]||action.value}`;
  return ({BATTLE:'进行原战斗：',TOUCH:'完成点穴：',COST_MONEY:'消耗银两：',COST_ITEM:'消耗物品：',COST_DAY:'经过天数：',DAODE:'道德变化：',SET_TIME_KEY:'开始剧情计时：'}[action.type]||'')+action.value.replaceAll('_','·');
}
function nodeActions(data: CompanionCatalog, sid: string, route: Route) {
  const node=data.nodes[sid];
  const actions=node.actions.filter(a=>sid!==route.storyId||a.index<route.actionIndex);
  return actions.length?`<ul class="companion-actions">${actions.map(a=>`<li>${e(actionText(a))}</li>`).join('')}</ul>`:'';
}
function detail(companion: Companion, data: CompanionCatalog, state: GameState) {
  const member=current(companion,state),st=status(companion,state);
  return `<article class="companion-detail" data-companion-detail="${e(companion.id)}"><header class="companion-profile">${companion.portrait?`<img src="${e(assetUrl(companion.portrait))}" alt="${e(companion.name)}">`:''}<div><h3>${e(companion.name)}${member&&member.name!==companion.name?` <small>· ${e(member.name)}</small>`:''}</h3><p>${e(companion.variant&&companion.variant!==companion.name?companion.variant:'原版角色')} · ${e(st.label)}</p><span class="companion-verification">${verification[companion.verification]}</span></div></header>
    <p class="panel-notice">以下为原版条件与分支参考。各路线是不同选择，条件不可混在一起。入队仍须实际交谈、战斗或完成小游戏；图鉴不会发放伙伴。</p>
    ${companion.routes.map((route,index)=>`<section class="companion-route" data-recruit-story="${e(route.storyId)}"><h4>路线 ${index+1} · ${route.kind==='FOLLOW'?'剧情随行':'加入参战队伍'}</h4>
      ${!route.runtimeAvailable?'<p class="companion-warning">该加入段尚未接入。</p>':''}${route.debug?'<p class="companion-warning">测试剧情，不作为普通招募入口。</p>':''}
      ${!route.hasMapEntry?'<p class="companion-warning">未找到静态地图入口；演出或其他触发方式尚待核对，不能视为可直接招募。</p>':''}
      ${route.paths.map((path,pathIndex)=>`<details class="companion-path" ${index===0&&pathIndex===0?'open':''}><summary>${e(path.entry.map)} · ${e(path.entry.location)}${path.shadowed?' · 被更早分支遮挡':''}</summary>
        <ol class="companion-flow"><li><strong>前往 ${e(path.entry.map)}，接触${e(path.entry.location)}</strong>${conditions(path.entry.conditions)}
          ${path.entry.probability<100?`<p>本入口概率 ${path.entry.probability}%，不是必定出现。</p>`:''}
          ${path.entry.repeat==='once'?'<p class="companion-note">原事件为一次性入口，已执行后不能当作新的招募机会。</p>':''}
          ${path.entry.earlierEvents.length?`<details><summary>入口优先级 · 前面还有 ${path.entry.earlierEvents.length} 个原事件</summary><p class="companion-note">须按原优先级跳过更早事件，包括一次性记录和概率判断；不能仅凭本入口条件断定当前可加入。</p>${path.entry.earlierEvents.map(ev=>`<div class="companion-priority"><strong>${e(ev.label)}</strong>${conditions(ev.conditions)}<small>${ev.probability}% · ${ev.repeat==='once'?'一次性事件':'遵循原重复规则'}</small></div>`).join('')}</details>`:''}
          ${nodeActions(data,path.entry.storyId,route)}</li>
          ${path.edges.map(id=>{const edge=data.edges[id],window=edge.moralityWindow;return `<li><strong>${e(edge.label)}</strong>${conditions(edge.conditions)}
            ${window?`<p class="companion-morality">此分支道德要求：${window.minimumInclusive!==null?`${window.minimumInclusive} ≤ `:''}道德${window.maximumExclusive!==null?` < ${window.maximumExclusive}`:''}${window.minimumInclusive!==null&&window.maximumExclusive!==null?`（整数 ${window.minimumInclusive}至${window.maximumExclusive-1}）`:''}</p>`:''}
            ${edge.earlierBranches.length?`<div class="companion-priority"><b>以下更早分支均不能先命中：</b>${edge.earlierBranches.map(b=>b.conditions.length?`<p>不能同时满足：${b.conditions.map(c=>e(c.label)).join('；')} → ${e(b.destination)}</p>`:'<p class="companion-warning">更早分支没有额外条件，这条路径已被遮挡。</p>').join('')}</div>`:''}
            <small>${e(data.nodes[edge.to]?.label||edge.to)}</small>${nodeActions(data,edge.to,route)}</li>`;}).join('')}
          <li class="companion-join"><strong>${route.kind==='FOLLOW'?'成为随行伙伴':'加入队伍'}：${e(companion.name)}</strong></li></ol></details>`).join('')}
      ${route.cycles.length?'<p class="companion-note">上游存在循环；路线仅展开不重复经过剧情段的路径。</p>':''}
      <details class="companion-source"><summary>查看原文依据与全部上游段</summary><p>${e(data.nodes[route.storyId]?.source)} · ${e(route.storyId)}</p>${route.ancestorIds.map(id=>`<div><code>${e(id)}</code>${data.nodes[id]?.runtimeAvailable===false?' · 未接入':''}</div>`).join('')}</details>
      </section>`).join('')}
    ${companion.departures.length?`<details class="companion-departures"><summary>原剧情还包含 ${companion.departures.length} 处离队／结束随行记录</summary><ul>${companion.departures.map(d=>`<li>${e(d.label)} · ${d.kind==='LEAVE_FOLLOW'?'结束随行':'离队'}</li>`).join('')}</ul></details>`:''}
    <button class="button outline full-width" data-action="close-modal">关闭伙伴图鉴</button></article>`;
}
export function mountCompanionCatalog(root: HTMLElement, data: CompanionCatalog, state: GameState) {
  root.removeAttribute('aria-live');
  let selected=data.characters[0]?.id||'';
  root.innerHTML=`<p class="panel-intro">收录原数据中 ${data.counts.characterForms} 个可加入／随行角色形态、${data.counts.instructions} 条指令。包含不同阶段形态和测试参考，不等于同样数量的普通伙伴。已验证与待验证路线分别标注。</p>
    <div class="companion-tools"><label>寻找伙伴<input type="search" data-companion-search placeholder="角色、地点或剧情关键词" autocomplete="off"></label><label>查看范围<select data-companion-filter><option value="all">全部角色形态</option><option value="current">当前队伍与后备</option><option value="absent">当前未在队伍</option><option value="unverified">招募路线待验证</option><option value="follow">有随行阶段</option></select></label></div>
    <p class="companion-result-count" aria-live="polite"></p><div class="companion-browser"><div class="companion-cards" aria-label="伙伴图鉴角色列表"></div><div class="companion-reading"></div></div>`;
  const search=root.querySelector<HTMLInputElement>('[data-companion-search]')!,filter=root.querySelector<HTMLSelectElement>('[data-companion-filter]')!;
  const cards=root.querySelector<HTMLElement>('.companion-cards')!,reading=root.querySelector<HTMLElement>('.companion-reading')!;
  function render() {
    const query=search.value.trim().toLocaleLowerCase();
    const list=data.characters.filter(c=>{
      const st=status(c,state).kind;
      if(filter.value==='current'&&!['member','follower','reserve'].includes(st))return false;
      if(filter.value==='absent'&&['member','follower','reserve'].includes(st))return false;
      if(filter.value==='unverified'&&c.verification!=='unverified')return false;
      if(filter.value==='follow'&&!c.routes.some(r=>r.kind==='FOLLOW'))return false;
      const terms=[c.id,c.name,...c.routes.flatMap(r=>[r.storyId,...r.paths.flatMap(p=>[p.entry.map,p.entry.location])])].join(' ').toLocaleLowerCase();
      return !query||terms.includes(query);
    });
    if(!list.some(c=>c.id===selected))selected=list[0]?.id||'';
    root.querySelector('.companion-result-count')!.textContent=`显示 ${list.length} / ${data.characters.length} 个角色形态`;
    cards.innerHTML=list.map(c=>`<button class="companion-card ${c.id===selected?'selected':''}" data-companion-id="${e(c.id)}" aria-pressed="${c.id===selected}">${c.portrait?`<img loading="lazy" src="${e(assetUrl(c.portrait))}" alt="">`:''}<span><strong>${e(c.name)}</strong><small>${e(c.variant||'原版角色')} · ${e(status(c,state).label)}</small><small>${verification[c.verification]}</small></span></button>`).join('')||'<p>没有匹配的伙伴，可更换关键词或范围。</p>';
    const character=list.find(c=>c.id===selected);reading.innerHTML=character?detail(character,data,state):'<p class="panel-notice">请选择其他伙伴或清空搜索。</p>';
  }
  search.addEventListener('input',render);filter.addEventListener('change',render);
  cards.addEventListener('click',event=>{const b=(event.target as HTMLElement).closest<HTMLElement>('[data-companion-id]');if(b){selected=b.dataset.companionId!;render();}});
  render();
}
