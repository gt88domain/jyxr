const $ = id => document.getElementById(id);
const root = $('review');
const labels = {storyScripts:'剧情对白与提示',characters:'人物',externalSkills:'外功与招式',internalSkills:'内功',specialSkills:'特技',legendSkills:'奥义',talents:'天赋',items:'物品与装备',maps:'地图与事件',sects:'门派',shops:'商店',gameTips:'小贴士',buffs:'状态效果',towers:'挑战',browser:'游戏配置',battles:'战斗',growTemplates:'成长模板',worldTriggers:'全局触发'};
const kinds = {dialogue_run:'连续对白',text:'选项／提示文字',journal:'日志',suggest:'提示',command:'命令',jump:'剧情跳转',battle:'战斗',choice:'选择',options:'选项组',option:'选项',branch:'条件分支',map_event:'地图入口',world_trigger:'全局触发',sect_entry:'拜师入口',host_story_reference:'宿主剧情引用',host_condition_reference:'伙伴条件引用'};
function h(tag, props={}, ...children) {
  const el = document.createElement(tag);
  for (const [key,value] of Object.entries(props)) {
    if (key.startsWith('aria-')) el.setAttribute(key,value);
    else if (key === 'dataset') Object.assign(el.dataset,value);
    else el[key] = value;
  }
  for (const child of children.flat(Infinity)) if (child != null) el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return el;
}
const url = new URL(location.href);
const state = {mode:url.searchParams.get('mode')==='flow'?'flow':'copy',q:url.searchParams.get('q')||'',category:url.searchParams.get('category')||'',status:url.searchParams.get('status')||'',segment:url.searchParams.get('segment')||'',limit:40};
const data = {};
let manifest, renderSerial = 0;
const fold = text => String(text).normalize('NFKC').toLocaleLowerCase();
async function load(name) {
  if (!data[name]) data[name] = fetch(new URL('data/'+name+'.json',import.meta.url),{cache:'no-cache'}).then(response=>{
    if (!response.ok) throw new Error('Cannot load '+name+': '+response.status);
    return response.json();
  });
  return data[name];
}
function sync() {
  const next = new URL(location.href);
  for (const key of ['mode','q','category','status','segment']) {
    if (state[key] && !(key==='mode'&&state[key]==='copy')) next.searchParams.set(key,state[key]);
    else next.searchParams.delete(key);
  }
  history.replaceState(null,'',next);
}
function modeLink(segment,mode) {
  const target = new URL(location.href);target.search='';
  target.searchParams.set('mode',mode);target.searchParams.set('segment',segment);
  const link = h('a',{href:target.href},mode==='flow'?'查看这段剧情的流程与条件':'查看这段剧情的文案');
  link.addEventListener('click',event=>{
    if (event.ctrlKey||event.metaKey||event.shiftKey||event.altKey) return;
    event.preventDefault();state.mode=mode;state.segment=segment;state.q='';state.category='';state.status='';state.limit=40;
    updateControls();render();root.scrollIntoView({block:'start'});
  });
  return link;
}
function copyCard(row) {
  const column = (title,text) => h('div',{className:'copy-column'},h('h3',{},title),h('p',{className:text?'':'pending'},text||'待改写，游戏目前沿用原文'));
  const details = h('details',{},h('summary',{},'人物候选、来源与编号'),
    row.proposed_speakers?h('p',{},'候选对应（未审核的身份不会自动接入）：\n'+row.proposed_speakers):null,
    h('p',{},'来源：'+row.source_pointer),h('p',{},'对照编号：'+row.row_id),
    row.source_line_count?h('p',{},'原段落含 '+row.source_line_count+' 句；新版可调整纯对白句数。'):null);
  return h('article',{className:'record',dataset:{rowId:row.row_id,segment:row.segment_id}},
    h('div',{className:'record-head'},h('div',{},h('h2',{},row.segment_id||row.owner_id),
      h('div',{className:'meta'},(labels[row.category]||row.category)+' · '+(kinds[row.kind]||row.kind))),
      h('span',{className:'badge '+(row.status==='implemented'?'done':'')},row.status==='implemented'?'已接入改写':'待改写')),
    h('div',{className:'columns'},column('原版中文',row.source_text),column('新版中文',row.new_zh_CN),column('New English',row.new_en)),
    row.segment_id?modeLink(row.segment_id,'flow'):null,details);
}
function flowCard(row) {
  const conditions = JSON.parse(row.conditions);
  const target = row.target_story_id;
  const targetLink = target?modeLink(target,'flow'):null;
  if (targetLink) targetLink.textContent='前往剧情：'+target;
  return h('article',{className:'record',dataset:{rowId:row.row_id,segment:row.segment_id}},
    h('div',{className:'record-head'},h('div',{},h('h2',{},row.segment_id||row.owner_id),h('div',{className:'meta'},(labels[row.category]||row.category)+' · '+(kinds[row.kind]||row.kind))),h('span',{className:'badge'},'原流程')),
    h('p',{className:'flow-label'},conditions.length?'此节点的局部条件／所处分支':'局部条件：未另设；仍取决于进入这段剧情的条件'),
    conditions.length?h('pre',{},conditions.join('\n')):null,
    row.action?h('pre',{},row.action):null,
    row.battle_id?h('p',{},'战斗：'+row.battle_id):null,
    row.target_map_id?h('p',{},'前往地图：'+row.target_map_id):null,
    row.item_id?h('p',{},'物品命令引用：'+row.item_id+'（数量与增减见原命令）'):null,
    row.join_character_id?h('p',{},'加入队伍：'+row.join_character_id):null,
    targetLink,
    target && manifest.summary.unresolvedStoryReferences.includes(target)?h('p',{className:'warning'},'当前内容包未找到目标剧情；此处仅保留原引用。'):null,
    row.segment_id?modeLink(row.segment_id,'copy'):null,
    h('details',{},h('summary',{},'原始节点与来源'),h('pre',{},JSON.stringify(JSON.parse(row.detail_json),null,2)),h('p',{},row.source_pointer),h('p',{},row.row_id)));
}
function updateControls() {
  for (const key of ['q','category','status','segment']) $(key==='q'?'search':key).value=state[key];
  $('copy-tab').setAttribute('aria-pressed',String(state.mode==='copy'));
  $('flow-tab').setAttribute('aria-pressed',String(state.mode==='flow'));
  $('status-field').hidden=state.mode==='flow';
}
async function render() {
  const serial = ++renderSerial;
  root.setAttribute('aria-busy','true');sync();updateControls();
  try {
    const rows = await load(state.mode);
    if (serial !== renderSerial) return;
    const needle = fold(state.q).trim();
    const selected = rows.filter(row=>(!state.category||row.category===state.category)&&(!state.segment||row.segment_id===state.segment||row.target_story_id===state.segment)
      &&(state.mode==='flow'||!state.status||row.status===state.status)
      &&(!needle||fold(Object.values(row).join(' ')).includes(needle)));
    const s=manifest.summary;
    $('summary').textContent=(state.mode==='copy'?'文案':'流程')+'：匹配 '+selected.length+' 条 · 原包 '+s.segments+' 段剧情、'+s.sourceDialogueLines+' 句对白。已接入 '+s.implementedUnits+' 个文案单元。';
    $('results').replaceChildren(...(selected.length?selected.slice(0,state.limit).map(state.mode==='copy'?copyCard:flowCard):[h('p',{className:'empty'},'没有匹配资料。可以清空搜索，或在“指定剧情”中清空剧情编号。')]));
    $('more').hidden=selected.length<=state.limit;
    root.setAttribute('aria-busy','false');
  } catch(error) {
    if (serial !== renderSerial) return;
    $('summary').textContent='资料读取失败，请刷新重试。';root.setAttribute('aria-busy','false');console.error(error);
  }
}
try {
  manifest=await load('manifest');
  const categories=new Set([...Object.keys(manifest.summary.categories),'worldTriggers']);
  $('category').append(...[...categories].map(key=>h('option',{value:key},labels[key]||key)));
  if (!categories.has(state.category)) state.category='';
  if (!['','implemented','pending'].includes(state.status)) state.status='';
  $('segments').append(...manifest.segments.map(value=>h('option',{value})));
  $('source-info').textContent='原包 SHA-256：'+manifest.summary.sourceSha256+'。静态引用未验证实际可达性。';
  let timer;
  $('search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{state.q=$('search').value;state.limit=40;render();},100);});
  for (const key of ['category','status','segment']) $(key).addEventListener('change',()=>{
    const value=$(key).value;
    if (state[key]===value) return;
    state[key]=value;state.limit=40;render();
  });
  for (const mode of ['copy','flow']) $(mode+'-tab').addEventListener('click',()=>{clearTimeout(timer);state.q=$('search').value;state.mode=mode;state.limit=40;render();});
  $('more').addEventListener('click',()=>{state.limit+=40;render();});
  addEventListener('popstate',()=>location.reload());
  await render();
} catch(error) {
  $('summary').textContent='资料读取失败，请刷新重试。';root.setAttribute('aria-busy','false');console.error(error);
}
