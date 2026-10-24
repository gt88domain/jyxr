const locale=document.documentElement.lang==='zh-CN'?'zh-CN':'en';
const other=locale==='en'?'zh-CN':'en';
const root=document.querySelector('#catalog');
function h(tag,props={},...children){
  const el=document.createElement(tag);
  for(const [key,value] of Object.entries(props)){
    if(key==='dataset')Object.assign(el.dataset,value);
    else if(key.startsWith('aria-')||key==='role')el.setAttribute(key,value);
    else el[key]=value;
  }
  for(const child of children.flat(Infinity))if(child!==null&&child!==undefined)el.append(child instanceof Node?child:document.createTextNode(String(child)));
  return el;
}
try{
  const [catalog,translations]=await Promise.all(['catalog','translations'].map(async name=>{
    const response=await fetch(new URL('../data/'+name+'.json',import.meta.url),{cache:'no-cache'});
    if(!response.ok)throw new Error('Cannot load '+name+': '+response.status);
    return response.json();
  }));
  const t=(key,values={})=>String(translations[locale][key]??key).replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??''));
  const countries=new Map(catalog.origins.map(c=>[c.id,c]));
  const figures=new Map(catalog.figures.map(f=>[f.id,f]));
  const params=new URL(location.href).searchParams;
  const options={q:params.get('q')||'',country:countries.has(params.get('country'))?params.get('country'):'',kind:['named','companions','archetype','system','player','all'].includes(params.get('kind'))?params.get('kind'):'named',status:['locked','proposed','classified'].includes(params.get('status'))?params.get('status'):'',limit:36};
  const countryLabel=id=>id?countries.get(id).flag+' '+countries.get(id).name[locale]:t('unassigned');
  const statusLabel=a=>t(a.status==='locked'?'fixed':a.status==='proposed'?'candidate':'classified');
  const badge=(text,extra='')=>h('span',{className:'badge '+extra},text);
  const field=(key,control)=>h('label',{className:'field'},t(key),control);
  const select=(id,entries)=>h('select',{id},entries.map(([value,text])=>h('option',{value},text)));
  const search=h('input',{id:'search',type:'search',placeholder:t('searchPlaceholder'),autocomplete:'off'});
  const country=select('country',[['',t('allCountries')]]);
  for(const scope of ['story','external'])country.append(h('optgroup',{label:locale==='en'?(scope==='story'?'Story countries':'Other origins'):(scope==='story'?'国家主线':'其他来源国家')},catalog.origins.filter(c=>c.scope===scope).map(c=>h('option',{value:c.id},countryLabel(c.id)))));
  const kind=select('kind',['named','companions','archetype','system','player','all'].map(key=>[key,t(key)]));
  const status=select('status',[['',t('allStatuses')],...['locked','proposed','classified'].map(key=>[key,t(key==='locked'?'fixed':key==='proposed'?'candidate':key)])]);
  const resultCount=h('h2',{id:'result-count',role:'status','aria-live':'polite'});
  const cards=h('div',{className:'cards',id:'cards'});
  const more=h('button',{type:'button',className:'more-button',id:'more'},t('more'));
  const s=catalog.summary;
  document.querySelector('#brand-title').textContent=t('brand');
  const opening=document.querySelector('#opening-link');
  opening.textContent=locale==='en'?"Play Grimm's in-game opening":'进入游戏，查看格林原位开场';
  if(locale==='zh-CN')opening.href+='?lang=zh-CN';
  document.querySelector('#close-detail').setAttribute('aria-label',t('close'));
  root.replaceChildren(
    h('section',{},h('div',{className:'eyebrow'},t('eyebrow')),h('h1',{},t('title')),h('p',{className:'intro'},t('intro')),h('p',{className:'phase',dataset:{phase:'cast-preview'}},t('phase')),
      h('div',{className:'stats'},[[catalog.countries.length,'countries'],[s.kinds.named,'storyRoles'],[s.locked,'locked'],[s.proposed,'proposed']].map(([n,key])=>h('div',{className:'stat'},h('strong',{},n),h('span',{},t(key)))))),
    h('section',{'aria-label':t('search')},h('div',{className:'filters'},field('search',search),field('country',country),field('kind',kind)),
      h('details',{className:'more-filters'},h('summary',{},t('moreFilters')),h('div',{className:'more-filter-body'},field('status',status),
        h('a',{className:'download',href:new URL('../data/cast.csv',import.meta.url).href,download:'storybound-cast.csv'},t('csv')),
        h('a',{className:'download',href:new URL('../data/companions.csv',import.meta.url).href,download:'storybound-companions.csv'},t('companionsCsv')),
        h('a',{className:'download',href:new URL('../data/catalog.json',import.meta.url).href,download:'storybound-cast.json'},t('json'))),
        h('div',{className:'notes'},h('p',{},t('scope',{definitions:s.sourceDefinitions,names:s.sourceDisplayNames,recruitmentForms:s.recruitmentForms,recruitmentIdentities:s.recruitmentIdentities})),h('p',{},t('identityNote'))))),
    h('section',{},h('div',{className:'results-heading'},resultCount),cards,more),
    h('section',{className:'notes'},['policy','countryNote','recognitionNote','sourceOnly'].map(key=>h('p',{},t(key))))
  );
  const controls={q:search,country,kind,status};
  for(const [key,control] of Object.entries(controls))control.value=options[key];
  const language=document.querySelector('#language-link');
  const languageTarget=new URL(language.getAttribute('href'),location.href);
  function syncUrl(){
    const url=new URL(location.href);
    for(const key of ['q','country','kind','status']){
      if(options[key]&&(key!=='kind'||options[key]!=='named'))url.searchParams.set(key,options[key]);
      else url.searchParams.delete(key);
    }
    history.replaceState(null,'',url);languageTarget.search=url.search;language.href=languageTarget.href;
  }
  const fold=value=>value.normalize('NFKC').toLocaleLowerCase();
  function matches(a){
    if(options.country&&a.primaryCountry!==options.country)return false;
    if(options.kind==='companions'&&!a.recruitmentDefinitionIds.length)return false;
    if(!['all','companions'].includes(options.kind)&&a.kind!==options.kind)return false;
    if(options.status&&a.status!==options.status)return false;
    if(options.q){
      const f=figures.get(a.figureId);
      const text=[a.name.en,a.name['zh-CN'],a.legacyIdentity,...a.legacyNames,...a.forms.map(f=>f.legacyId),f?.sourceLabel.en||'',f?.sourceLabel['zh-CN']||''].join(' ');
      if(!fold(text).includes(fold(options.q)))return false;
    }
    return true;
  }
  const dialog=document.querySelector('#detail');
  let previousFocus;
  function detail(a,button){
    previousFocus=button;
    const f=figures.get(a.figureId);
    const section=(title,...body)=>h('section',{className:'detail-section'},h('h3',{},title),body);
    document.querySelector('#detail-content').replaceChildren(
      h('div',{className:'country-label'},countryLabel(a.primaryCountry)),h('h2',{},a.name[locale]),h('p',{className:'alternate'},a.name[other]),
      badge(statusLabel(a),a.status==='locked'?'fixed':'proposed'),h('p',{className:'notes'},t('identityNote')),
      f?section(t('origin'),h('p',{},f.sourceLabel[locale]),badge(t(f.recognition))):null,
      section(t('related'),h('p',{},a.relatedCountries.map(countryLabel).join(' · ')||t('unassigned'))),
      section(t('legacyDefinitions')+' · '+a.forms.length,a.forms.map(form=>h('span',{className:'source-id'},form.legacyId))),
      a.reviewFlags.length?section(t('review'),h('ul',{},a.reviewFlags.map(flag=>h('li',{},t(flag))))):null,
      section(t('storyEvidence'),a.referenceEvidence.length?a.referenceEvidence.map(ref=>h('details',{},h('summary',{},countryLabel(ref.country)+' · '+t('references',{count:ref.storyIds.length})),ref.storyIds.map(id=>h('span',{className:'source-id'},id)))):h('p',{},t('noEvidence')))
    );
    dialog.showModal();
  }
  function card(a){
    const f=figures.get(a.figureId);
    const initials=a.name.en.split(/\s+/).filter(s=>!['The','King','Sir'].includes(s)).slice(0,2).map(s=>s[0]).join('');
    const button=h('button',{type:'button',dataset:{detail:a.actorId}},t('details'));
    button.addEventListener('click',()=>detail(a,button));
    return h('article',{className:'cast-card',dataset:{actorId:a.actorId,legacy:a.legacyIdentity}},
      h('div',{className:'card-top'},h('span',{className:'monogram','aria-hidden':'true'},initials),
        h('div',{className:'card-title'},h('div',{className:'country-label'},countryLabel(a.primaryCountry)),h('h3',{},a.name[locale]),h('div',{className:'alternate'},a.name[other]))),
      h('div',{className:'badges'},badge(statusLabel(a),a.status==='locked'?'fixed':a.status==='proposed'?'proposed':''),a.recruitmentDefinitionIds.length?badge(t(a.runtimeDisplayApplied?'displayApplied':'displayPending')):null,a.traveler?badge('🧭 '+t('traveler')):null,f?badge(t(f.recognition)):null),
      h('div',{className:'legacy'},t('legacy')+': '+a.legacyIdentity),
      h('p',{className:'source'},f?.sourceLabel[locale]||t(a.kind==='system'?'systemRole':a.kind==='player'?'playerRole':'commonRole')),
      h('div',{className:'card-actions'},h('span',{className:'forms'},t('forms')+' · '+a.forms.length),button)
    );
  }
  function render(){
    syncUrl();
    const selected=catalog.actors.filter(matches).sort((a,b)=>Number(b.status==='locked')-Number(a.status==='locked')||a.name[locale].localeCompare(b.name[locale],locale));
    resultCount.textContent=t('resultCount',{count:selected.length});
    cards.replaceChildren(...(selected.length?selected.slice(0,options.limit).map(card):[h('p',{className:'empty'},t('empty'))]));
    more.hidden=selected.length<=options.limit;
  }
  for(const [key,control] of Object.entries(controls))control.addEventListener(key==='q'?'input':'change',()=>{options[key]=control.value;options.limit=36;render();});
  more.addEventListener('click',()=>{options.limit+=36;render();});
  document.querySelector('#close-detail').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>previousFocus?.focus());
  render();root.setAttribute('aria-busy','false');
}catch(error){
  root.replaceChildren(h('p',{className:'error'},locale==='en'?'The cast could not be loaded. Please refresh or try again later.':'角色资料读取失败，请刷新或稍后再试。'));
  root.setAttribute('aria-busy','false');console.error(error);
}
