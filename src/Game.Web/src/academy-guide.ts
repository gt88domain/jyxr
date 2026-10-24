import type {GameState} from './bridge';
import type {ChapterRoute} from './opening-chapter';
export interface AcademyGuide {
  id:string;maps:string[];name:string;graduationStory:string;graduationAfterDay:number;
  intro:string;trainingDetail:string;graduateTitle:string;graduateDetail:string;
  training:ChapterRoute[];exit:ChapterRoute[];
  skills:{id:string;name:string}[];
}
/** Inspect saved facts only; never reroll events or unlock an exit. */
export function academyStep(state:GameState){
  const academy=state.pack.chapterGuide?.academies?.find(a=>a.maps.includes(state.map.id));
  if(!academy)return null;
  const completed=state.chapterJournal?.completedStories.includes(academy.graduationStory)===true;
  return {
    title:completed?academy.graduateTitle:academy.name,
    detail:completed?academy.graduateDetail:academy.trainingDetail,
    route:completed?academy.exit:academy.training,
    complete:false,academy,graduated:completed,
  };
}
