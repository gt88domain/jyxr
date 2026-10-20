import {validateOpening,restoreTrail,advance} from './opening-state.mjs';
const root=document.querySelector('#opening');
const params=new URL(location.href).searchParams;
const locale=params.get('lang')==='zh-CN'?'zh-CN':'en';
const base=new URL('../',import.meta.url);
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
  const response=await fetch(new URL('data/opening.json',base),{cache:'no-cache'});
  if(!response.ok)throw new Error('Opening content unavailable: '+response.status);
  const chapter=validateOpening(await response.json());
  const t=key=>chapter.ui[locale][key];
  let trail=restoreTrail(chapter,params.get('flow'));
  document.documentElement.lang=locale;
  document.title=chapter.title[locale]+' · '+t('brand');
  const dialogue=h('section',{className:'dialogue','aria-label':chapter.title[locale]});
  const body=h('div',{id:'dialogue-body',className:'dialogue-body','aria-live':'polite','aria-atomic':'true'});
  const actions=h('div',{className:'actions',id:'actions'});
  const objective=h('div',{className:'objective',id:'objective'});
  const tasks=h('ol',{className:'task-list',id:'tasks','aria-label':t('progress')});
  const language=h('a',{id:'opening-language',className:'utility'},t('language'));
  const history=h('button',{type:'button',id:'show-history',className:'utility'},t('history'));
  const original=h('a',{id:'original-game',href:'https://gt88domain.github.io/jyxr/',className:'utility'},t('original'));
  const menu=h('details',{className:'menu'},h('summary',{},t('more')),h('nav',{'aria-label':t('menu')},language,original,h('a',{href:new URL(locale==='en'?'en/':'zh/',base).href,className:'utility'},t('cast')),h('p',{className:'review-note'},t('review'))));
  const scene=h('section',{className:'scene','aria-label':chapter.location[locale]},
    h('img',{id:'scene-art',className:'scene-art',src:new URL(chapter.art,base).href,alt:chapter.artAlt[locale],fetchPriority:'high'}),
    h('div',{className:'scene-shade'}),
    h('header',{className:'topbar'},h('a',{className:'brand',href:new URL(locale==='en'?'en/':'zh/',base).href},h('span',{className:'seal','aria-hidden':'true'},'XIII'),t('brand')),h('span',{className:'preview-badge'},t('preview')),menu),
    h('div',{className:'scene-caption'},h('p',{className:'eyebrow'},t('chapter')),h('h1',{},chapter.title[locale]),h('p',{className:'location'},chapter.location[locale])),
    h('aside',{className:'quest'},h('span',{className:'quest-mark','aria-hidden':'true'},'✦'),h('div',{},h('strong',{},t('journal')),objective),tasks));
  dialogue.append(h('div',{className:'dialogue-top'},h('div',{className:'speaker',id:'speaker'}),history),body,actions);
  root.replaceChildren(scene,dialogue);
  const modal=document.querySelector('#history');
  document.querySelector('#history-title').textContent=t('history');
  const close=document.querySelector('#close-history');close.setAttribute('aria-label',t('close'));
  close.addEventListener('click',()=>modal.close());modal.addEventListener('close',()=>history.focus());
  history.addEventListener('click',()=>{
    const rows=[];
    trail.forEach((id,i)=>{
      const node=chapter.nodes[id];rows.push(h('article',{},h('h3',{},chapter.speakers[node.speaker][locale]),h('p',{},node.text[locale])));
      const chosen=node.choices?.find(choice=>choice.next===trail[i+1]);
      if(chosen)rows.push(h('article',{className:'player-answer'},h('h3',{},chapter.speakers.player[locale]),h('p',{},chosen.text[locale])));
      if(node.action&&trail[i+1]&&node.type==='dialogue')rows.push(h('p',{className:'chosen-action'},node.action[locale]));
    });
    document.querySelector('#transcript').replaceChildren(...rows);modal.showModal();
  });
  function button(text,handler,props={}){
    const el=h('button',{type:'button',...props},text);el.addEventListener('click',handler);return el;
  }
  function render(focus=false){
    const id=trail.at(-1),node=chapter.nodes[id];
    root.dataset.node=id;root.dataset.guide=chapter.guideActorId;root.dataset.kind=chapter.kind;
    const url=new URL(location.href);url.searchParams.set('flow',trail.join(','));historyReplace(url);
    const other=new URL(url);other.searchParams.set('lang',locale==='en'?'zh-CN':'en');language.href=other.href;
    document.querySelector('#speaker').replaceChildren(h('span',{className:'speaker-monogram','aria-hidden':'true'},node.speaker==='guide'?'G':node.speaker==='player'?'◇':'I'),h('div',{},h('strong',{},chapter.speakers[node.speaker][locale]),h('small',{},node.speaker==='guide'?chapter.location[locale]:chapter.title[locale])));
    const page=node.type==='page';dialogue.classList.toggle('reading-page',page);
    body.replaceChildren(...[page?h('div',{className:'book-page'},h('p',{className:'eyebrow'},t('book')),h('h2',{},chapter.speakers.narrator[locale]),h('p',{},node.text[locale])):h('p',{},node.text[locale]),node.type==='complete'?h('p',{className:'pending'},t('pending')):null].filter(Boolean));
    objective.textContent=node.type==='complete'?t('complete'):t('objective');
    tasks.replaceChildren(...chapter.tasks.map(task=>h('li',{className:trail.includes(task.node)?'done':'',dataset:{task:task.id,done:String(trail.includes(task.node))}},h('span',{'aria-hidden':'true'},trail.includes(task.node)?'✓':'○'),t(task.id))));
    const choices=(node.choices||[]).map(choice=>button(choice.text[locale],()=>{trail=advance(chapter,trail,choice.next);render(true);},{className:'primary choice',dataset:{choice:choice.id}}));
    const next=node.next?button(node.action?.[locale]||t('continue'),()=>{trail=advance(chapter,trail,node.next);render(true);},{id:'continue',className:'primary'}):null;
    const back=trail.length>1?button(t('back'),()=>{trail=trail.slice(0,-1);render(true);},{className:'secondary',id:'back'}):null;
    const replay=node.type==='complete'?button(t('restart'),()=>{trail=[chapter.start];render(true);},{className:'primary',id:'restart'}):null;
    actions.replaceChildren(...[...choices,next,back,replay].filter(Boolean));
    if(focus)actions.querySelector('button')?.focus({preventScroll:true});
    root.setAttribute('aria-busy','false');
  }
  function historyReplace(url){window.history.replaceState(null,'',url);}
  render();
}catch(error){
  const message=locale==='en'?'The opening could not be loaded. Please reload and try again.':'开场读取失败，请重新加载后再试。';
  const retry=h('button',{type:'button'},locale==='en'?'Reload':'重新加载');retry.addEventListener('click',()=>location.reload());
  root.replaceChildren(h('section',{className:'load-error',role:'alert'},h('h1',{},message),retry));root.setAttribute('aria-busy','false');console.error(error);
}
