import {assetUrl} from './content';
import './library.css';

interface Link {category: string; id: string; name: string;}
interface Entry extends Link {description: string; state: string; source: string; effect?: string; recruitment?: string; initialBonusRounds: string[];}
interface Source {id: string; name: string; version: string; repository: string; commit?: string; role: string;}
interface Index {schemaVersion: number; categories: {id: string; title: string; count: number}[]; entries: Entry[]; sources: Source[];
  counts: {baselineCompanionForms: number; baselineCompanionNames: number; referenceCompanionForms: number; referenceCompanionNames: number;
    supplementStories: number; ludingStories: number; ludingShared: number; runtimeLegendEntries: number; missingCharacterDefinitions: string[];
    lateBonusForms: number; lateBonusAdditionalForms: number; startingCompanionRewardsImplemented: boolean; correctedCharacterAliases: {[key: string]: string}}; referenceManifest: string;}
interface Node {[key: string]: string | Node[]; tag: string; children: Node[];}
interface Record extends Entry {node: Node; runtime?: unknown; variants: {source: string; node: Node; equalRecord: boolean}[];
  recruitmentStories: string[]; related: Link[]; usedBy: Link[];}
interface Manifest {differences: {[key: string]: {[category: string]: {addedIds: string[]; absentIds: string[]; spellingVariants: {baseline: string; reference: string}[]}}};
  remakeRoles: {rows: number; uniqueIds: number; addedIds: string[]; duplicateIds: string[]};
  lateBonusCompanions: {pools: {index: number; roundLabel: string; characterIds: string[]}[]; status: string; missingCharacterIds: string[]};
  legacyCodeComparison: {file: string; identical: boolean}[];
  lateLua: {source: string; examples: {id: string; line: number; declaredTalent: boolean; status: string}[]}; notes: string[];}
const e=(value: unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const fields: {[key: string]: string}={key:'稳定标识',name:'名称',level:'等级',maxlevel:'等级上限',head:'头像引用',animation:'动作引用',talent:'天赋',
  bili:'臂力',dingli:'定力',fuyuan:'福缘',gengu:'根骨',jianfa:'剑法',daofa:'刀法',quanzhang:'拳掌',qimen:'奇门',shenfa:'身法',wuxing:'悟性',wuxue:'武学常识',
  maxhp:'生命上限',maxmp:'内力上限',hp:'生命',mp:'内力',hard:'难度',info:'说明',desc:'描述',description:'描述',female:'女性标志',grow_template:'成长模板',
  price:'价格',cd:'冷却',type:'原类型',value:'原参数',ret:'结果匹配',requirelv:'解锁等级',castsize:'施法距离',coversize:'覆盖范围',covertype:'范围类型',
  probability:'概率',buff:'状态效果',basepower:'基础威力',step:'威力成长',costball:'怒气消耗',costmp:'内力消耗',poweradd:'附加威力',addPower:'附加威力',
  yin:'阴',yang:'阳',attack:'攻击系数',critical:'暴击系数',defence:'防御系数',start:'起手武功',lv:'触发等级',argvs:'原效果参数',equipped:'已装备',
  pic:'图片引用',icon:'图标引用',audio:'音效引用',music:'音乐引用',repeat:'重复规则',limit:'数量限制',yuanbao:'元宝价格',drop:'允许掉落',
  minlevel:'最低物品等级',maxlevel2:'最高物品等级',w:'权重',weight:'抽取权重',pool:'候选池',min:'下限',max:'上限',text:'原文'};
const tags: {[key: string]: string}={role:'人物',skill:'外功',internal_skill:'内功',special_skill:'特技',story:'剧情段',action:'剧情指令',condition:'条件',
  result:'结果分支',trigger:'效果／成长触发',require:'使用／装备要求',unique:'招式',level:'等级覆盖',skills:'初始外功',internal_skills:'初始内功',
  special_skills:'初始特技',items:'初始装备',item:'物品',map:'地图',location:'地点',event:'事件',battle:'战斗',rolepos:'战斗站位',sale:'商品',
  aoyi:'奥义组合',resource:'资源条目',task:'新手任务',finish:'任务完成条件',shop:'商店',grow_template:'成长模板',tower:'天关',zone:'点穴区域',
  missing_character:'缺定义的加入／奖励引用',bonus_pool:'后期周目奖励池',candidate:'候选伙伴',reference:'关联依据',alias_correction:'角色引用修正',
  creation:'开局配置',configuration:'配置内容',entry:'选项／条目',title:'问题',options:'可选答案',text:'答案',stats:'属性增减',silver:'增加银两',silverSet:'设置银两',
  talents:'授予天赋',model:'模型',internalSkill:'授予内功',baseSilver:'基础银两',baseItems:'基础物品',normalItems:'普通难度奖励',
  randomStats:'重摇属性池',portraits:'头像选项',roundItems:'周目奖励',trialItems:'试炼奖励',minimum:'最低要求',id:'引用标识'};
const actions: {[key: string]: string}={DIALOG:'对白',JOIN:'加入队伍',FOLLOW:'剧情随行',LEAVE:'离队',LEAVE_FOLLOW:'结束随行',SELECT:'对话选择',
  ITEM:'获得物品',BATTLE:'战斗',SHOP:'打开商店',COST_ITEM:'消耗物品',COST_MONEY:'消耗银两',GET_MONEY:'获得银两',DAODE:'道德变化',
  'LEARN.SKILL':'习得外功','LEARN.INTERNALSKILL':'习得内功','LEARN.SPECIALSKILL':'习得特技','LEARN.TALENT':'获得天赋',BACKGROUND:'切换背景',
  MUSIC:'切换音乐',SET_TIME_KEY:'开始剧情计时',COST_DAY:'经过天数',NEWBIE:'新手任务',MAXLEVEL:'提升武学上限'};
const effects: {[key: string]: string}={'configured':'效果已有配置 · 完整行为待核对','partial':'效果部分接入','metadata-only':'仅收录资料 · 效果待补',
  'referenced-behavior':'作为其他效果的联动条件','identity-only':'身份标记'};
let indexCache: Index | undefined;
const groups=new Map<string,Record[]>();
async function fetchData<T>(path: string): Promise<T>{
  const url=new URL(assetUrl('data/library/'+path));url.searchParams.set('v',import.meta.env.VITE_GAME_VERSION);
  const response=await fetch(url);if(!response.ok)throw new Error('资料暂时无法读取，请稍后再试。');return response.json() as Promise<T>;
}
export async function loadOriginalLibrary(){
  if(!indexCache){const data=await fetchData<Index>('index.json');if(data.schemaVersion!==1||!Array.isArray(data.entries))throw new Error('资料格式不受支持。');indexCache=data;}
  return indexCache;
}
function link(item: Link){return `<button class="library-link" data-library-category="${e(item.category)}" data-library-id="${e(item.id)}">${e(item.name)}</button>`;}
function rawNode(node: Node, index: Index, depth=0): string{
  const attributeEntries=Object.entries(node).filter(([key])=>!['tag','children'].includes(key));
  const title=node.tag==='action'?(actions[String(node.type)]||String(node.type)):tags[node.tag]||node.tag;
  const titleTarget=index.entries.find(r=>r.id===node.tag);
  const attributes=attributeEntries.map(([key,value])=>{
    const target=typeof value==='string'&&!['desc','description','info','text'].includes(key)?index.entries.find(r=>r.id===value):undefined;
    return `<div><dt>${e(fields[key]||key)}</dt><dd>${target?link({...target,name:String(value)}):e(value)}</dd></div>`;
  }).join('');
  const children=(node.children||[]).map(child=>rawNode(child,index,depth+1)).join('');
  return `<div class="library-node"><strong>${titleTarget?link({...titleTarget,name:title}):e(title)}</strong>${attributes?`<dl class="library-fields">${attributes}</dl>`:''}${children?`<details ${depth<2?'open':''}><summary>${node.children.length} 条子记录 · 按原顺序</summary><div class="library-children">${children}</div></details>`:''}</div>`;
}
function renderRecord(record: Record,index: Index){
  const profile=['characters','missingCharacters'].includes(record.category)?`<p>${record.id==='主角'?'主角基础模板，开局问答和重摇会在此基础上调整属性与奖励。':record.recruitment==='baseline'?'原基线含加入／随行指令，可到伙伴图鉴查看条件。':record.category==='missingCharacters'?'加入或奖励引用缺少匹配的人物定义，不能视为已经可招募的伙伴。':record.recruitment==='late-bonus'?'已接入对应周目的开局随机奖励池；不额外添加剧情招募路线。':record.recruitment==='upload'?'上传包补充了该角色的加入记录，运行入口尚未接线。':'此为人物定义；未在当前资料中找到加入／随行指令，可能是敌人、NPC或阶段形态。'}</p>
    ${record.initialBonusRounds.length?`<p>开局随机奖励候选：${record.initialBonusRounds.map(e).join('、')}。确认人物后，从对应周目候选池随机抽取一名；预览和重新摇点不会发放。</p>`:''}
    ${record.recruitment==='baseline'?'<button class="button outline" data-action="companions">查看伙伴加入条件</button>':''}
    ${record.recruitmentStories.map(id=>`<p>补充加入段：${link({category:'supplementStories',id,name:id})}</p>`).join('')}`:'';
  const variants=record.variants.map(v=>`<details class="library-version"><summary>上传 X 1.0.0.1 · ${e(v.source)} · ${v.equalRecord?'记录相同':'保留版本记录'}</summary><p>仅供对照，未覆盖当前运行内容。字段顺序、写法不同也会产生记录差异，不能据此认定玩法改变。</p>${rawNode(v.node,index)}</details>`).join('');
  const related=(label: string,items: Link[])=>items.length?`<details class="library-relations" ${items.length<30?'open':''}><summary>${label} · ${items.length}</summary><div>${items.map(link).join('')}</div></details>`:'';
  const url=new URL(location.href);url.searchParams.set('view','library');url.searchParams.set('category',record.category);url.searchParams.set('entry',record.id);
  return `<article data-library-detail="${e(record.id)}"><h3>${e(record.name)}</h3><p class="library-state">${e(record.state)}${record.effect?` · ${e(effects[record.effect]||record.effect)}`:''}</p>
    ${profile}<p class="library-note">来源：${record.source.endsWith('.lua.lua')?'后期 Lua 参考':record.source.endsWith('.txt')?'用户上传包':record.category==='creation'?'jyx-legacy-dll（固定 C# 开局配置）':'jyx-legacy-data / data-origin'} / ${e(record.source)}<br>稳定标识：${e(record.id)}</p>
    ${record.description?`<p>${e(record.description)}</p>`:''}
    <details class="library-source" open><summary>原始配置 · 含条件、效果和指令顺序</summary>${rawNode(record.node,index)}</details>
    ${related('引用的资料',record.related)}${related('使用此资料的原记录',record.usedBy)}
    <p class="library-note">关联引用按原字段中的完整标识提取，用于查资料；出现引用不代表满足获得、装备或招募条件。</p>
    ${variants}${record.runtime?`<details class="library-version"><summary>现代内容定义</summary><pre>${e(JSON.stringify(record.runtime,null,2))}</pre></details>`:''}
    <a class="library-share" href="${e(url.href)}">此条目的独立链接</a></article>`;
}
async function referencesView(index: Index){
  const manifest=await fetchData<Manifest>(index.referenceManifest);
  return `<article class="library-references"><h3>四份仓库参考与上传原版</h3><p>先收齐资料，再补运行接线和规则，最后验证流程。这里保留版本依据，不把重制新增内容和脚本示例当作原版扩展。</p>
    <p class="panel-notice">后期新增打包XML与原场景核对：107条奥义额外威力与现基线不同。下列旧差异表仅为MOD模板范围，完整后期对照另列。</p><button class="button outline full-width" data-action="late-reference">打开1.1.0.6旧版界面、天赋奥义与多周目对照</button>
    ${index.sources.map(s=>`<section><h4><a href="${e(s.repository+(s.commit?'/tree/'+s.commit:''))}" target="_blank" rel="noopener noreferrer">${e(s.name)}</a></h4><p>${e(s.version)} · ${e(s.role)}</p>${s.commit?`<small>固定版本 ${e(s.commit.slice(0,12))}</small>`:''}</section>`).join('')}
    <h4>已补入的缺失资料</h4><p>上传包《鹿鼎记》${index.counts.ludingStories} 段：${index.counts.ludingShared} 段与基线同名，${index.counts.supplementStories} 段为缺失的补充资料，包含双儿加入。双儿尚缺人物定义，入口也待接线；同名剧情保留对照，没有直接覆盖。</p>
    <button class="button outline" data-library-category="supplementStories" data-library-id="鹿鼎剧情4.4">查看双儿加入原记录</button>
    <h4>已接入后期周目开局伙伴奖励</h4><p>43个候选中，40个未计入原剧情加入图鉴；它们是按周目随机抽取的开局奖励，不能当成43条新招募剧情。确认人物后只加入一名，读档不会再次发放。</p>
    ${manifest.lateBonusCompanions.pools.map(p=>`<p>${link({category:'bonusCompanions',id:'后期开局伙伴池'+p.index,name:p.roundLabel})}：${p.characterIds.length?p.characterIds.map(e).join('、'):'无奖励伙伴'}</p>`).join('')}
    <p>源池使用“白眉鹰王”称号，现已根据原版鹰爪功说明对应到“殷天正”的人物定义，保留原属性。${link({category:'referenceAliases',id:'白眉鹰王',name:'查看引用修正依据'})}</p>
    <h4>后期代码与已有参考重叠</h4><p>逐文件摘要对照：${manifest.legacyCodeComparison.filter(x=>x.identical).map(x=>e(x.file)).join('、')}相同；${manifest.legacyCodeComparison.filter(x=>!x.identical).map(x=>e(x.file)).join('、')}不同。后续优先核对差异和Lua覆盖，不重复迁移相同代码。</p>
    <h4>后期版本的异名</h4><p>下列是资料名称对照，不作为新道具或新武功计数，也不修改旧存档标识。</p>
    <ul>${Object.values(manifest.differences.late).flatMap(d=>d.spellingVariants).map(v=>`<li>${e(v.baseline)} ↔ ${e(v.reference)}</li>`).join('')}</ul>
    <h4>重制版新增角色待筛选</h4><p>Excel 有 ${manifest.remakeRoles.rows} 行角色、${manifest.remakeRoles.uniqueIds} 个不同ID，比基线多 ${manifest.remakeRoles.addedIds.length} 个ID。重复标识：${manifest.remakeRoles.duplicateIds.map(e).join('、')}。新增记录包含重制原创人物和NPC，尚未判定为原版伙伴。</p><details><summary>查看新增角色ID</summary><p>${manifest.remakeRoles.addedIds.map(e).join('、')}</p></details>
    <h4>后期 Lua 示例单独保留</h4><ul>${manifest.lateLua.examples.map(x=>`<li>${e(x.id)} · 第 ${x.line} 行 · ${e(x.status)}</li>`).join('')}</ul>
    <p class="library-note">${e(manifest.lateLua.source)}</p>
    <h4>完整参考快照</h4><p class="library-note">快照保留原字段、行号与文件 SHA-256，可独立下载；不会作为游戏脚本执行。</p>
    ${[['manifest.json','版本与差异清单'],['original-upload.json','上传原版 XML 资料'],['silverlight.json','官方早期 XML 资料'],['late-template.json','后期 MOD 模板 XML'],['late-lua.json','后期 Lua 源文与摘要'],['remake-workbooks.json','Lua 重制 Excel 数据']].map(([file,title])=>`<p><a href="${e(assetUrl('data/library/references/'+file))}" target="_blank" rel="noopener noreferrer">${title}</a></p>`).join('')}
    <p>${manifest.notes.map(e).join(' ')}</p></article>`;
}
export function mountOriginalLibrary(root: HTMLElement,index: Index,initial?: {category?: string; id?: string}){
  root.removeAttribute('aria-live');
  let selection=initial?.id||'',category=initial?.category||'characters',limit=80,request=0;
  root.innerHTML=`<p class="panel-intro">原基线剧情加入资料有 ${index.counts.baselineCompanionNames} 个显示名、${index.counts.baselineCompanionForms} 个角色形态；后期 ${index.counts.lateBonusForms} 个多周目开局奖励候选已接入，其中 ${index.counts.lateBonusAdditionalForms} 个未计入剧情图鉴。双儿仍缺人物定义；白眉鹰王的称号引用已对应到殷天正。人物总表还包含敌人和NPC。资料收录与游戏完成度分别计算。</p>
    <div class="library-tools"><label>资料分类<select data-library-filter>${index.categories.map(c=>`<option value="${c.id}">${e(c.title)} · ${c.count}</option>`).join('')}<option value="companions">伙伴资料 · 含补充加入记录</option><option value="all">全部分类搜索</option><option value="references">版本与差异</option></select></label><label>寻找资料<input type="search" data-library-search placeholder="人物、武功、道具或剧情名" autocomplete="off"></label></div>
    <p class="library-count" aria-live="polite"></p><div class="library-browser"><div class="library-list" aria-label="原版资料列表"></div><div class="library-reading"></div></div>`;
  const filter=root.querySelector<HTMLSelectElement>('[data-library-filter]')!,search=root.querySelector<HTMLInputElement>('[data-library-search]')!;
  const list=root.querySelector<HTMLElement>('.library-list')!,reading=root.querySelector<HTMLElement>('.library-reading')!,count=root.querySelector<HTMLElement>('.library-count')!;
  filter.value=index.categories.some(c=>c.id===category)?category:'characters';
  async function detail(item: Entry){
    const ticket=++request;reading.textContent='正在读取原版资料…';
    try{
      if(!groups.has(item.category))groups.set(item.category,await fetchData<Record[]>(item.category+'.json'));
      if(ticket!==request||!root.isConnected)return;
      const record=groups.get(item.category)!.find(r=>r.id===item.id);
      if(!record)throw new Error('未找到此条目。');reading.innerHTML=renderRecord(record,index);
    }catch(error){if(ticket===request&&root.isConnected)reading.textContent=error instanceof Error?error.message:'读取失败。';}
  }
  function render(){
    category=filter.value;const query=search.value.trim().toLocaleLowerCase();
    if(category==='references'){
      const ticket=++request;list.innerHTML='';count.textContent='来源、版本、差异与完整快照';reading.textContent='正在整理版本记录…';
      void referencesView(index).then(html=>{if(ticket===request&&root.isConnected)reading.innerHTML=html;}).catch(error=>{if(ticket===request&&root.isConnected)reading.textContent=String(error);});return;
    }
    const matches=index.entries.filter(r=>(category==='all'||(category==='companions'?['characters','missingCharacters'].includes(r.category)&&r.recruitment:r.category===category))&&
      (!query||[r.name,r.id,r.description,r.source].join(' ').toLocaleLowerCase().includes(query)));
    let selected=matches.find(r=>r.id===selection);if(!selected)selected=matches[0];selection=selected?.id||'';
    // Include a directly linked selection even when beyond the first page.
    const shown=matches.slice(0,limit);if(selected&&!shown.includes(selected))shown.unshift(selected);
    count.textContent=`找到 ${matches.length} 条 · 当前显示 ${shown.length} 条`;
    list.innerHTML=shown.map(r=>`<button class="library-card ${r===selected?'selected':''}" data-library-category="${e(r.category)}" data-library-id="${e(r.id)}" aria-pressed="${r===selected}"><strong>${e(r.name)}</strong><small>${e(index.categories.find(c=>c.id===r.category)?.title)} · ${e(r.state)}</small>${r.recruitment?`<small>${r.recruitment==='baseline'?'原基线剧情加入资料':r.recruitment==='late-bonus'?'后期开局奖励候选':'上传包补充加入资料'}</small>`:''}</button>`).join('')+
      (shown.length<matches.length?'<button class="button outline" data-library-more>继续显示</button>':'');
    if(selected)void detail(selected);else{++request;reading.innerHTML='<p class="panel-notice">未找到匹配的资料，可清空关键词或选择全部分类搜索。</p>';}
  }
  search.addEventListener('input',()=>{limit=80;render();});filter.addEventListener('change',()=>{limit=80;selection='';render();});
  root.addEventListener('click',event=>{
    const target=(event.target as HTMLElement).closest<HTMLElement>('[data-library-id], [data-library-more]');if(!target)return;
    if(target.hasAttribute('data-library-more')){limit+=80;render();return;}
    selection=target.dataset.libraryId!;filter.value=target.dataset.libraryCategory!;search.value='';limit=80;render();
  });
  render();
}
