import type {GameState} from './bridge';
import type {StoryGuide} from './opening-chapter';

/** Project recorded progress; never execute conditions, travel, or random draws. */
export function storyChapterStep(state:GameState,guide:StoryGuide|undefined=state.pack.chapterGuide?.story){
  const journal=state.chapterJournal;
  if(!guide||!journal)return null;
  const done=new Set(journal.completedStories);
  const stage=guide.stages.find(s=>!s.any||s.any.some(id=>done.has(id)));
  if(!stage)return null;
  const blocked=!!stage.blockedBy?.some(id=>done.has(id));
  const clock=stage.night||stage.id==='night'?(guide.nightSlots?.includes(state.adventure?.timeSlot||'')?guide.nightReady:guide.nightWaiting):'';
  const detail=[stage.detail,blocked?stage.blockedDetail:clock,guide.trustTarget&&journal.trust!==null?`${guide.trustLabel}: ${journal.trust} / ${guide.trustGoal}`:''].filter(Boolean).join(' ');
  return {title:stage.title,detail,route:blocked?[]:stage.route,panel:stage.panel,complete:!!stage.complete,storyStage:stage.id,storyTitle:guide.title,prepareLabel:guide.prepareLabel,blocked};
}
export function storyChapterSteps(state:GameState){
  const g=state.pack.chapterGuide;
  return [g?.story,...g?.stories||[]].filter((s):s is StoryGuide=>!!s).map(s=>storyChapterStep(state,s)).filter((s):s is NonNullable<typeof s>=>!!s);
}
