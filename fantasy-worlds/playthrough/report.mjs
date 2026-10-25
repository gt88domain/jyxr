import {selectRows} from './report-model.mjs';
const data=await fetch('data.json').then(r=>{if(!r.ok)throw new Error('Report unavailable');return r.json();});
const byId=id=>document.getElementById(id);
const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
const locale=()=>byId('language').value;
const label=value=>typeof value==='object'&&value!==null?value[locale()]||value.en||'':String(value??'');
const hours={'子':'11 p.m.–1 a.m.','丑':'1–3 a.m.','寅':'3–5 a.m.','卯':'5–7 a.m.','辰':'7–9 a.m.','巳':'9–11 a.m.','午':'11 a.m.–1 p.m.','未':'1–3 p.m.','申':'3–5 p.m.','酉':'5–7 p.m.','戌':'7–9 p.m.','亥':'9–11 p.m.'};
for(const o of data.outcomes){const a=el('article',undefined,byId('summary'),o.status);el('h2',`${o.country} · ${o.chapter||o.original}`,a);el('strong',o.status==='cleared'?'已走通 / Cleared':o.status==='needs-review'?'结局已到达，参战规则待修 / Needs review':'未走通 / Blocked',a);el('p',o.note,a);el('p',`实际新增队友：${o.companions.join(', ')||'无；匹诺曹尚未入队'}`,a);}
if(data.alternate){byId('alternate-result').textContent='新版骑士分支已普通难度实战通过：支持女主但好感仅55→各自追查→粮仓两战与误会澄清→追回《阿马迪斯》→20%骑士事件→邀请入队（道德−2）→完整存读档。此分支从另一份有校验的真实培养档开始，不是女主结局后继续招第二个人。';}
const perf=data.performance;
if(perf.before&&perf.after){
 const t=el('table',undefined,byId('performance'));const head=el('tr',undefined,el('thead',undefined,t));['同机观测中位数（ms）','改善前','改善后'].forEach(s=>el('th',s,head));
 for(const [title,b,a] of [['队伍面板',perf.before.ui.party,perf.after.ui.party],['研习面板',perf.before.ui.cultivation,perf.after.ui.cultivation],['装备面板',perf.before.ui.equipment,perf.after.ui.equipment],['WASM state 返回',perf.before.dispatchMedianMs,perf.after.dispatchMedianMs],['JSON 解析',perf.before.parseMedianMs,perf.after.parseMedianMs]]){const r=el('tr',undefined,t);[title,b,a].forEach(v=>el('td',String(v),r));}
 el('p',`每面板5次；state 15次。响应约 ${(perf.after.responseBytes/1024).toFixed(0)} KiB。自动化面板耗时含浏览器绘制与测试调度，仅作诊断。`,byId('performance'));
}
byId('source').textContent=`起始存档：${data.sourceSave} · SHA-256 ${data.sourceSha256}`;
function render(){
 const host=byId('events');host.replaceChildren();const query=byId('search').value.toLocaleLowerCase(),stage=byId('stage').value;
 const rows=selectRows(data.rows,{stage,query,view:byId('view').value});
 byId('count').textContent=`显示 ${rows.length} 条 / 原始 ${data.rows.length} 条。故事摘要折叠同段重复对白，默认收起失败后训练与重试；完整日志和原始证据全部保留。`;
 const runs={retest:'女主路线复测 / Dulcinea trial',initial:'意大利原试跑与恢复 / Italy trial',knight:'骑士路线独立复测 / Don Quixote trial'};
 let run;
 for(const r of rows){
  if(r.run!==run){run=r.run;el('h3',runs[run]||run,host,'run-heading');}
  const row=el('article',undefined,host,'event');el('small',`${r.stage} · ${r.run} #${r.sequence} · ${r.kind}`,row);
  if(r.kind==='dialogue'){el('h3',label(r.speaker),row);el('p',label(r.text),row);if(r.repetitions?.length>1){const d=el('details',undefined,row);el('summary',`相同对白 ${r.repetitions.length} 次 · 展开查看记录位置`,d);el('p',r.repetitions.map(x=>`${runs[x.run]||x.run} #${x.sequence}`).join('\n'),d);}}
  else if(r.kind==='visit')el('p',`${label(r.map)} → ${label(r.place)} · Day ${r.time.days} · ${hours[r.time.timeSlot]||r.time.timeSlot}`,row);
  else if(r.kind==='recruit')el('p',`入队 / Joined: ${label(r.character)} · Lv. ${r.level}`,row);
  else if(r.kind==='item')el('p',`${label(r.item)} ${r.delta>0?'+':''}${r.delta}`,row);
  else if(r.kind.startsWith('battle-')){el('h3',`${label(r.battle)} · ${r.outcome||'开始 / Start'}`,row);if(r.actions!==undefined)el('p',`${r.actions} 次操作 · ${r.medicine} 次用药`,row);const d=el('details',undefined,row);el('summary','实际参战人员与剩余生命',d);el('p',r.units.map(u=>`${u.team===1?'己方':'敌方'} ${label(u.name)} ${u.hp}/${u.maxHp}`).join('\n'),d,'unit-list');}
  else if(r.kind==='checkpoint'){el('p',`保存 / Save: ${r.name} · 主角 Lv.${r.heroLevel} · ${r.party.map(label).join(', ')}`,row);const d=el('details',undefined,row);el('summary',`实际背包与银币 / Inventory · ${r.silver}`,d);el('p',r.inventory.map(i=>`${label(i.item)} ×${i.quantity}`).join('\n'),d);}
  else if(r.kind==='companion-build')el('p',`${label(r.character)} · ${label(r.mastery)} · ${r.equipment.map(label).join(', ')} · ${label(r.trainingSkill)}: Lv.${r.cultivation.level}, XP ${r.cultivation.exp}/${r.cultivation.nextExp} · ${locale()==='en'?'Unspent points':'未分配点数'} ${r.points}`,row);
  else if(r.kind==='morality'||r.kind==='silver')el('p',`${r.kind==='morality'?'道德 / Morality':'银币 / Silver'}: ${r.data>0?'+':''}${r.data}`,row);
  else if(r.kind==='reload')el('p',`读回原完整存档 / Reload: ${r.data.checkpoint} · ${r.data.reason}`,row);
  else if(r.kind==='decision')el('p',`选择第 ${r.data.index+1} 项 / Option ${r.data.index+1}`,row);
  else if(r.kind==='choice'){if(r.prompt)el('p',label(r.prompt),row);r.options.forEach((o,i)=>el('p',`${i+1}. ${label(o)}`,row));}
  else el('p',JSON.stringify(r.data),row);
 }
}
for(const id of ['language','stage','search','view'])byId(id).addEventListener(id==='search'?'input':'change',render);
render();
