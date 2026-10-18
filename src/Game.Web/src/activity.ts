import type {GameState} from './bridge';
export interface ActivityEntry {id:number;kind:string;message:string;notice:boolean;time:string;mapId:string|null;}
export interface UiMessage {message:string;time:string;}
const e=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const plain=(v:string)=>v.replace(/\[\[[a-z]+:([^\]]*)\]\]/gi,'$1').replace(/<\/?color[^>]*>/g,'');
const kinds:Record<string,string>={operation:'操作',item:'获得物品',growth:'成长',party:'队伍',notice:'提示',story:'流程',battle:'战斗',dialogue:'对话'};
export function activityView(state:GameState,messages:UiMessage[]):string {
  const entries=(state.activity||[]).slice().reverse();
  return `<p class="panel-intro">当前旅程最近 ${entries.length} 条记录，最多保留300条，随手动／自动存档保存。旧存档从本版开始记录，不能补回此前未记录的操作。</p><div class="activity-tools"><label>查找记录<input type="search" data-activity-search placeholder="人物、物品、操作或对白" autocomplete="off"></label><label>分类<select data-activity-filter><option value="all">全部记录</option>${Object.entries(kinds).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label></div><div class="activity-list" role="log">${entries.map(entry=>`<article data-activity-kind="${entry.kind}"><header><strong>${kinds[entry.kind]||'记录'}</strong><time>${e(new Date(entry.time).toLocaleString())}</time></header><p>${e(plain(entry.message))}</p>${entry.mapId?`<small>${e(entry.mapId)}</small>`:''}</article>`).join('')||'<p class="empty-state">当前旅程暂无记录。</p>'}</div><p class="empty-state" data-activity-empty hidden>没有匹配的记录。</p>${messages.length?`<details class="activity-ui-messages"><summary>本次浏览器提示 · ${messages.length} 条</summary><p class="panel-intro">包含操作反馈和错误；这部分仅保留在本次页面中。</p>${messages.slice().reverse().map(m=>`<article><time>${e(new Date(m.time).toLocaleTimeString())}</time><p>${e(m.message)}</p></article>`).join('')}</details>`:''}`;
}
export function filterActivity(){
  const query=document.querySelector<HTMLInputElement>('[data-activity-search]')?.value.trim().toLocaleLowerCase()||'';
  const kind=document.querySelector<HTMLSelectElement>('[data-activity-filter]')?.value||'all';let count=0;
  document.querySelectorAll<HTMLElement>('[data-activity-kind]').forEach(row=>{row.hidden=!(kind==='all'||row.dataset.activityKind===kind)||!row.textContent?.toLocaleLowerCase().includes(query);if(!row.hidden)count++;});
  const empty=document.querySelector<HTMLElement>('[data-activity-empty]');if(empty)empty.hidden=count>0;
}
