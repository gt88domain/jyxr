import type {GameState} from './bridge';
import {e} from './ui/format';
import {openingChapterStep} from './opening-chapter';

/** Display existing runtime facts; never finish a story or test a probability. */
export function journeyFocus(state:GameState) {
  const opening=openingChapterStep(state);
  if(opening)return {kind:opening.complete?'chapter-complete':'chapter',label:opening.storyStage?state.pack.chapterGuide!.story!.title:state.pack.chapterGuide!.title,title:opening.title,detail:opening.detail};
  if(state.tutorial)return {
    kind:'tutorial',label:'当前教学任务',title:state.tutorial.description||state.tutorial.id,
    detail:`${state.tutorial.id} · 前往：${state.tutorial.locations.join(' → ')}`,
  };
  const goals=state.objectives||[],done=goals.filter(goal=>goal.completed).length;
  const next=goals.find(goal=>!goal.completed);
  const milestones=state.milestones||[],pending=milestones.find(m=>!m.completed);
  const followsMainline=milestones.length>0&&(done===goals.length||milestones.some(m=>m.completed));
  if(followsMainline&&pending)return {kind:'mainline',label:`后续主线消息 · ${milestones.filter(m=>m.completed).length} / ${milestones.length}`,
    title:pending.title,detail:`当前：主角 ${state.hero.level} 级，参战队伍 ${state.party.length} 人（含主角）。下一条消息条件：${pending.requirements.join('；')}。已收到消息的后续行动请查旅途记事，并与相关人物交谈。`};
  if(next&&!followsMainline)return {kind:'chapter',label:`当前章节 · ${done} / ${goals.length}`,title:next.title,detail:next.description||''};
  return {kind:'exploration',label:goals.length?'入门体验目标已达成':'继续旅程',
    title:'回顾此次旅程，或继续探索与培养伙伴。',detail:'当前已列目标完成，不代表整个世界的剧情全部结束。'};
}

export function journeyFocusView(state:GameState) {
  const focus=journeyFocus(state);
  return `<section class="journey-focus" data-journey-focus="${focus.kind}"><span>${e(focus.label)}</span><h3>${e(focus.title)}</h3>${focus.detail?`<p>${e(focus.detail)}</p>`:''}</section>`;
}
