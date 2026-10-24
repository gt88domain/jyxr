import type {GameState} from './bridge';
import {e} from './ui/format.ts';
import {storyChapterSteps} from './story-guide.ts';
import {academyStep,type AcademyGuide} from './academy-guide.ts';
import type {Organization} from './world-status';
export interface ChapterRoute {mapId:string;locationId:string;}
export interface StoryGuide {
  title:string; trustTarget?:string;trustLabel?:string;trustGoal?:number; trackedStories:string[];
  nightSlots?:string[];nightReady?:string;nightWaiting?:string;prepareLabel:string;
  stages:{id:string;any?:string[];title:string;detail:string;route:ChapterRoute[];complete?:boolean;night?:boolean;blockedBy?:string[];blockedDetail?:string;panel?:'cultivation'}[];
}
export interface ChapterGuide {
  organizations?:Organization[];
  academies?:AcademyGuide[];
  story?:StoryGuide;
  stories?:StoryGuide[];
  title:string;completeTitle:string;completeText:string;reviewLocationId:string;reviewLabel:string;
  recommendedSectId:string;schoolNote:string;stepOrder:string[];
  steps:{id:string;detail:string;panel?:'loadout'|'equipment'|'cultivation'|'save';route?:ChapterRoute[]}[];
  taskRoutes:Record<string,ChapterRoute[]>;
}
/** Directions come from content. Completion comes exclusively from the host. */
export function openingChapterStep(state:GameState):{title:string;detail:string;route:ChapterRoute[];panel?:'loadout'|'equipment'|'cultivation'|'save';complete:boolean;storyStage?:string;storyTitle?:string;prepareLabel?:string}|null{
  const guide=state.pack.chapterGuide;if(!guide)return null;
  const academy=academyStep(state);if(academy)return academy;
  const goals=state.objectives||[];
  if(state.tutorial)return {title:state.tutorial.description,detail:'',route:guide.taskRoutes[state.tutorial.id]||[],complete:false};
  const pending=guide.stepOrder.map(id=>goals.find(g=>g.id===id)).filter(g=>g&&!g.completed);
  const hasEquipment=(state.inventory||[]).some(item=>item.kind==='equipment');
  const next=pending.find(g=>g!.id!=='equipment'||hasEquipment)||pending[0];
  if(next){const step=guide.steps.find(s=>s.id===next.id);return {title:next.title,detail:step?.detail||'',panel:step?.panel==='equipment'&&!hasEquipment?undefined:step?.panel,route:step?.route||[],complete:false};}
  if(!goals.length||goals.some(g=>!g.completed))return null;
  const stories=storyChapterSteps(state);
  const story=stories.find(s=>!s.complete&&!s.blocked&&state.map.id!=='大地图'&&s.route.some(r=>r.mapId===state.map.id))||stories.find(s=>!s.complete&&!s.blocked)||stories.at(-1);
  if(story)return story;
  return {title:guide.completeTitle,detail:guide.completeText,route:guide.steps.find(s=>s.id==='team')?.route||[],complete:true};
}
export function openingChapterView(state:GameState){
  const guide=state.pack.chapterGuide,step=openingChapterStep(state);
  if(!guide||!step||state.phase!=='world')return '';
  const route=step.route.find(r=>r.mapId===state.map.id);
  const locationId=!step.storyStage&&step.complete&&state.map.locations.some(p=>p.id===guide.reviewLocationId&&p.action)?guide.reviewLocationId:route?.locationId;
  const place=state.map.locations.find(p=>p.id===locationId&&p.action);
  const button=step.panel?`<button class="button outline" data-action="${e(step.panel)}">${e(step.title)} →</button>`:
    place?`<button class="button outline" data-action="interact" data-id="${e(place.id)}">${e(place.id===guide.reviewLocationId?guide.reviewLabel:place.name)} →</button>`:'';
  const goals=state.objectives||[],done=goals.filter(g=>g.completed).length;
  const label=step.storyTitle||guide.title;
  const otherStories=step.storyStage?storyChapterSteps(state).filter(s=>s.storyTitle!==step.storyTitle).map(s=>`<details class="story-route"><summary>${e(s.storyTitle)} · ${e(s.title)}</summary><p>${e(s.detail)}</p>${s.route.filter(r=>r.mapId===state.map.id).map(r=>state.map.locations.find(p=>p.id===r.locationId&&p.action)).filter(p=>p).map(p=>`<button class="button outline" data-action="interact" data-id="${e(p!.id)}">${e(p!.name)} →</button>`).join('')}</details>`).join(''):'';
  return `<section class="opening-guide paper" data-opening-guide="${step.complete?'complete':'active'}" ${step.storyStage?`data-story-stage="${e(step.storyStage)}"`:''} aria-label="${e(label)}"><header><span>${e(label)}</span>${step.storyStage?'':`<strong>${done}/${goals.length}</strong>`}</header><h2>${e(step.title)}</h2>${step.detail?`<p>${e(step.detail)}</p>`:''}${button}${step.storyStage?`<button class="text-button" data-action="cultivation">${e(step.prepareLabel||'')} →</button>`:''}${step.complete?'<button class="text-button" data-action="save">保存 →</button>':''}${otherStories}</section>`;
}
