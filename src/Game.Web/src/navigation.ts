import type {GameState} from './bridge';
const e=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function moreMenuView(state:GameState):string {
  const items=[['quests','任务与江湖消息','当前目标、限时线索和剧情记事'],['history','通知与操作记录','获得物品、升级、对白和操作历史'],['settings','设置','界面、自动战斗、音量和文字'],...(state.pack.id==='jyx'?[['companions','伙伴图鉴','加入条件和招募路线'],['library','原版资料馆','人物、武学、道具和版本对照']]:[]),['save','保存进度','保存当前地图进度'],['load','读取最近进度','读取当前世界的本地进度'],['worlds','选择世界','各世界的存档分别保留'],['guide','游玩指南','操作与存档说明'],...(state.pack.id==='jyx'?[['progress','版本与开发记录','已完成、已知缺口和后续计划']]:[])];
  return `<div class="more-menu">${items.map(([action,title,description])=>`<button data-action="${action}" ${((action==='save'&&state.phase!=='world')||(['load','worlds'].includes(action)&&!['title','world'].includes(state.phase))||(action==='quests'&&state.phase==='title'))?'disabled':''}><strong>${e(title)}</strong><small>${e(description)}</small><span aria-hidden="true">›</span></button>`).join('')}</div>`;
}
