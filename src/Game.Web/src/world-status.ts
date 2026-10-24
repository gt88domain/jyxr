import type {GameState} from './bridge';
export interface Organization {
  id:string;affiliationIds:string[];name:string;shortName:string;
  storyCountry:string|null;sourceWork:string;
  reviewStatus:'reviewed'|'candidate'|'needs-review'|'independent';
}
// These are the original two-hour time slots, not a new clock or event rule.
const slots:Record<string,{en:string;zh:string;night:boolean}>={
 '子':{en:'11 p.m.–1 a.m.',zh:'23:00–01:00',night:true},
 '丑':{en:'1–3 a.m.',zh:'01:00–03:00',night:true},
 '寅':{en:'3–5 a.m.',zh:'03:00–05:00',night:true},
 '卯':{en:'5–7 a.m.',zh:'05:00–07:00',night:true},
 '辰':{en:'7–9 a.m.',zh:'07:00–09:00',night:false},
 '巳':{en:'9–11 a.m.',zh:'09:00–11:00',night:false},
 '午':{en:'11 a.m.–1 p.m.',zh:'11:00–13:00',night:false},
 '未':{en:'1–3 p.m.',zh:'13:00–15:00',night:false},
 '申':{en:'3–5 p.m.',zh:'15:00–17:00',night:false},
 '酉':{en:'5–7 p.m.',zh:'17:00–19:00',night:false},
 '戌':{en:'7–9 p.m.',zh:'19:00–21:00',night:false},
 '亥':{en:'9–11 p.m.',zh:'21:00–23:00',night:true},
};
/** Pure display of saved facts. No commands, time changes or event rolls. */
export function worldStatus(state:GameState,locale:string){
 const zh=locale==='zh-CN',slot=slots[state.adventure?.timeSlot||''];
 const affiliation=state.adventure?.sect;
 const organizations=state.pack.chapterGuide?.organizations||[];
 const organization=organizations.find(o=>affiliation?o.affiliationIds.includes(affiliation):o.id==='无门派');
 const fallback=affiliation?state.pack.displayCatalog?.byCategory?.sects?.[affiliation]?.name||state.pack.displayCatalog?.text?.[affiliation]:undefined;
 return {
  day:(state.adventure?.days||0)+1,
  time:slot?(zh?slot.zh:slot.en):(zh?'时段未知':'Time unavailable'),
  night:slot?.night??false,
  affiliationId:affiliation||'',
  organizationName:organization?.shortName||fallback||(zh?'其他组织':'Other organization'),
  organizationFullName:organization?.name||fallback||(zh?'其他组织':'Other organization'),
 };
}
