import type {GameState} from './bridge';
import {assetUrl} from './content';
import './classic-sheet.css';

const e=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** A responsive, live sheet. Commands and state remain shared with the modern view. */
export function classicSheet(panel:'character'|'equipment'|'cultivation',state:GameState,body:string):string {
  const hero=state.hero;
  const tabs=[['character','属性','renwuzhuangtai_shuxing.png'],['equipment','装备','renwuzhuangtai_zhuangbei.png'],['cultivation','修炼','renwuzhuangtai_jineng.png']];
  const bar=(name:string,value:number,max:number,kind:string)=>`<div class="classic-sheet-resource" data-sheet-resource="${kind}"><span>${e(name)}</span><meter min="0" max="${Math.max(1,max)}" value="${Math.max(0,Math.min(value,max))}" aria-label="${e(name)}"></meter><strong>${value} / ${max}</strong></div>`;
  return `<section class="classic-sheet" data-classic-sheet="${panel}"><aside class="classic-sheet-person"><img class="classic-sheet-portrait" src="${e(assetUrl(hero.portrait||hero.sprite))}" alt="${e(hero.name)}"><h3>${e(hero.name)}</h3><p>等级 ${hero.level} · 属性点 ${hero.unspentStatPoints??0}</p>${bar('气血',hero.hp,hero.maxHp,'hp')}${bar(state.pack.terms?.energy||'内力',hero.mp,hero.maxMp,'mp')}<nav aria-label="人物功能">${tabs.map(([id,name,art])=>`<button data-action="${id}" aria-current="${panel===id?'page':'false'}"><img src="${e(assetUrl('art/late-interface/'+art))}" alt=""><span>${name}</span></button>`).join('')}</nav></aside><div class="classic-sheet-content">${body}</div></section>`;
}
