import type {GameState} from './bridge';

/** Project recorded progress; never execute conditions, travel, or random draws. */
export function storyChapterStep(state:GameState){
  const guide=state.pack.chapterGuide?.story,journal=state.chapterJournal;
  if(!guide||!journal)return null;
  const done=new Set(journal.completedStories);
  const stage=guide.stages.find(s=>!s.any||s.any.some(id=>done.has(id)));
  if(!stage)return null;
  const clock=stage.id==='night'?(guide.nightSlots.includes(state.adventure?.timeSlot||'')?guide.nightReady:guide.nightWaiting):'';
  const detail=[stage.detail,clock,journal.trust===null?'':`${guide.trustLabel}: ${journal.trust} / ${guide.trustGoal}`].filter(Boolean).join(' ');
  return {title:stage.title,detail,route:stage.route,panel:stage.panel,complete:!!stage.complete,storyStage:stage.id};
}
