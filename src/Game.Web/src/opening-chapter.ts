import type {GameState} from './bridge';
import {e} from './ui/format';
export interface ChapterRoute {mapId:string;locationId:string;}
export interface ChapterGuide {
  title:string;completeTitle:string;completeText:string;reviewLocationId:string;reviewLabel:string;
  recommendedSectId:string;schoolNote:string;stepOrder:string[];
  steps:{id:string;detail:string;panel?:'equipment'|'cultivation'|'save';route?:ChapterRoute[]}[];
  taskRoutes:Record<string,ChapterRoute[]>;
}
/** Directions come from content. Completion comes exclusively from the host. */
export function openingChapterStep(state:GameState):{title:string;detail:string;route:ChapterRoute[];panel?:'equipment'|'cultivation'|'save';complete:boolean}|null{
  const guide=state.pack.chapterGuide;if(!guide)return null;
  const goals=state.objectives||[];
  if(state.tutorial)return {title:state.tutorial.description,detail:'',route:guide.taskRoutes[state.tutorial.id]||[],complete:false};
  const pending=guide.stepOrder.map(id=>goals.find(g=>g.id===id)).filter(g=>g&&!g.completed);
  const hasEquipment=(state.inventory||[]).some(item=>item.kind==='equipment');
  const next=pending.find(g=>g!.id!=='equipment'||hasEquipment)||pending[0];
  if(next){const step=guide.steps.find(s=>s.id===next.id);return {title:next.title,detail:step?.detail||'',panel:step?.panel==='equipment'&&!hasEquipment?undefined:step?.panel,route:step?.route||[],complete:false};}
  if(!goals.length||goals.some(g=>!g.completed))return null;
  return {title:guide.completeTitle,detail:guide.completeText,route:guide.steps.find(s=>s.id==='team')?.route||[],complete:true};
}
export function openingChapterView(state:GameState){
  const guide=state.pack.chapterGuide,step=openingChapterStep(state);
  if(!guide||!step||state.phase!=='world')return '';
  const route=step.route.find(r=>r.mapId===state.map.id);
  const locationId=step.complete&&state.map.locations.some(p=>p.id===guide.reviewLocationId&&p.action)?guide.reviewLocationId:route?.locationId;
  const place=state.map.locations.find(p=>p.id===locationId&&p.action);
  const button=step.panel?`<button class="button outline" data-action="${e(step.panel)}">${e(step.title)} →</button>`:
    place?`<button class="button outline" data-action="interact" data-id="${e(place.id)}">${e(place.id===guide.reviewLocationId?guide.reviewLabel:place.name)} →</button>`:'';
  const goals=state.objectives||[],done=goals.filter(g=>g.completed).length;
  return `<section class="opening-guide paper" data-opening-guide="${step.complete?'complete':'active'}" aria-label="${e(guide.title)}"><header><span>${e(guide.title)}</span><strong>${done}/${goals.length}</strong></header><h2>${e(step.title)}</h2>${step.detail?`<p>${e(step.detail)}</p>`:''}${button}${step.complete?'<button class="text-button" data-action="save">保存 →</button>':''}</section>`;
}
