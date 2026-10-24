import type {GameState} from './bridge';
import {e,icon} from './ui/format';
import {copy,modernWorlds} from './ui-language';
const traitNames:Record<string,[string,string]>={
  '高爆发':['Burst damage','高爆发'],'多重攻击':['Extra attacks','多重攻击'],
  '高防御':['Defense','高防御'],'群伤':['Area damage','群体伤害'],'吸血':['Life steal','吸血'],
  '高攻':['Offense','高攻击'],'抵抗负面':['Debuff resistance','负面抗性'],
  '抗暴击':['Critical resistance','暴击抗性'],'控场':['Crowd control','控场'],'毒':['Poison','毒'],
  '高伤':['High damage','高伤害'],'回复':['Recovery','恢复'],'高奥义控场':['Combo control','组合技控场'],
};
const traitLabel=(value:string)=>traitNames[value]?copy(...traitNames[value]):value;
/** The picker only dispatches the original selectSect operation. */
export function academyView(state:GameState){
  if(!modernWorlds(state))return '';
  const guide=state.pack.chapterGuide!;
  const choices=[...(state.sects||[])].sort((a,b)=>Number(b.id===guide.recommendedSectId)-Number(a.id===guide.recommendedSectId));
  return `<div class="shop-scrim academy-scrim"><section class="shop-window paper academy-picker" role="dialog" aria-modal="true" aria-label="${copy('Choose an organization','选择组织')}"><header><div><span class="eyebrow">${copy('Your next chapter','下一段旅程')}</span><h2>${copy('Find your people','选择同行之道')}</h2></div><span class="academy-count">${choices.length} ${copy('paths','条道路')}</span></header><p class="academy-intro">${e(guide.schoolNote)}</p><div class="academy-cards">${choices.map(s=>{
    const a=guide.academies?.find(a=>a.id===s.id),recommended=s.id===guide.recommendedSectId;
    return `<article data-academy-id="${e(s.id)}" ${recommended?'data-opening-recommended':''}><div class="academy-card-top"><span class="academy-emblem">${icon(s.id==='无门派'?'leaf':'sword')}</span><div><small>${e(s.focus==='?'?copy('Free exploration','自由探索'):s.focus)}</small><h3>${e(s.name)}</h3></div>${recommended?`<span class="academy-badge">${copy('Guided route','有完整指引')}</span>`:''}</div><div class="academy-tags">${s.traits.map(t=>`<span>${e(traitLabel(t))}</span>`).join('')}</div><p>${e(a?.intro||s.description)}</p><details><summary>${copy('Teachers & signature techniques','导师与特色技艺')}</summary><p>${copy('Teachers:','导师：')} ${e(s.masters.join(', '))}</p><p>${copy('Techniques:','特色技艺：')} ${e(s.skills.join(', '))}</p><small>${copy('These are highlights, not an immediate reward list. Training and later quests unlock them.','这是组织特色，不代表入会立即获得。仍须完成原有训练和后续任务。')}</small></details><button class="button ${recommended?'primary':'outline'}" data-action="select-sect" data-id="${e(s.id)}" ${s.available?'':'disabled'}>${s.available?s.id==='无门派'?copy('Travel independently','独自旅行'):copy('Join this organization','加入此组织'):copy('Unavailable','暂不可用')} ${icon('arrow')}</button></article>`;
  }).join('')}</div></section></div>`;
}
