import type {GameState} from './bridge';
import {openingChapterStep} from './opening-chapter';
import {e,icon} from './ui/format';
import {copy} from './ui-language';
import {storyChapterSteps} from './story-guide';
export function nextStepAction(state:GameState){
  const step=openingChapterStep(state);
  if(!step)return '';
  if(step.panel)return `<button class="button primary" data-next-step data-action="${e(step.panel)}">${copy('Open','打开')} ${e(step.panel==='loadout'?copy('adventurer sheet','冒险者手册'):step.title)} ${icon('arrow')}</button>`;
  if(state.phase!=='world')return `<span class="journey-wait">${copy('Finish the current encounter to continue.','结束当前遭遇后继续。')}</span>`;
  const hop=step.route.find(r=>r.mapId===state.map.id&&state.map.locations.some(p=>p.id===r.locationId&&p.action));
  const place=state.map.locations.find(p=>p.id===hop?.locationId&&p.action);
  return place?`<button class="button primary" data-next-step data-action="interact" data-id="${e(place.id)}">${e(place.name)} ${icon('arrow')}</button>`:'';
}
export function journeyPanel(state:GameState){
  const step=openingChapterStep(state),goals=state.objectives||[];
  const stories=storyChapterSteps(state).map(s=>{
    const hop=s.route.find(r=>r.mapId===state.map.id&&state.map.locations.some(p=>p.id===r.locationId&&p.action));
    const place=state.map.locations.find(p=>p.id===hop?.locationId&&p.action);
    return `<details class="journey-story" data-journey-story="${e(s.storyStage)}"><summary>${s.complete?'✓ ':s.blocked?'! ':''}${e(s.storyTitle)}</summary><h3>${e(s.title)}</h3><p>${e(s.detail)}</p>${state.phase==='world'&&place?`<button class="button outline" data-action="interact" data-id="${e(place.id)}">${e(place.name)} →</button>`:''}</details>`;
  }).join('');
  return `<section class="journey-next"><span class="eyebrow">${copy('Next step','下一步')}</span><h3>${e(step?.title||copy('Explore at your own pace','自由探索'))}</h3><p>${e(step?.detail||'')}</p>${nextStepAction(state)}</section><nav class="journey-shortcuts" aria-label="${copy('Adventure shortcuts','冒险快捷操作')}"><button data-action="loadout">${icon('person')}${copy('Gear & study','装备与研习')}</button><button data-action="party">${icon('person')}${copy('Companions','伙伴')}</button><button data-action="inventory">${icon('bag')}${copy('Supplies','补给')}</button><button data-action="save" ${state.phase==='world'?'':'disabled'}>${icon('save')}${copy('Save','保存')}</button></nav><h3 class="panel-heading">${copy('Story routes','故事路线')}</h3>${stories}<h3 class="panel-heading">${copy('Starter checklist','新手清单')} · ${goals.filter(g=>g.completed).length}/${goals.length}</h3><ol class="journey-checklist">${goals.map(g=>`<li class="${g.completed?'done':''}"><span aria-hidden="true">${g.completed?'✓':'○'}</span><strong>${e(g.title)}</strong></li>`).join('')}</ol>`;
}
