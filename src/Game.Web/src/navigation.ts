import type {GameState} from './bridge';
import {appConfig} from './app-config';
const e=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function moreMenuView(state:GameState):string {
  const items=[['quests',state.pack.terms?.missions||'任务与旅途记录','当前目标和旅途记事'],['history','通知与操作记录','获得物品、升级、对白和操作历史'],['settings','设置','自动战斗、音量和文字'],['save','保存进度','保存当前地图进度'],['load','读取最近进度','读取当前内容包的本地进度'],['guide','游玩指南','操作与存档说明']];
  items.push(...appConfig.features.map(feature=>[feature.id,feature.title,feature.description]));
  return `<div class="more-menu">${items.map(([action,title,description])=>`<button data-action="${action}" ${((action==='save'&&state.phase!=='world')||(['load','worlds'].includes(action)&&!['title','world'].includes(state.phase))||(action==='quests'&&state.phase==='title'))?'disabled':''}><strong>${e(title)}</strong><small>${e(description)}</small><span aria-hidden="true">›</span></button>`).join('')}${(appConfig.externalLinks||[]).map(link=>`<a class="button outline" href="${e(link.url)}">${e(link.label)}</a>`).join('')}</div>`;
}
