import type {GameState} from '../bridge';
import {inspectCompanionConditions} from '../bridge';
import {loadCompanionCatalog,mountCompanionCatalog} from '../companions';
import {loadOriginalLibrary,mountOriginalLibrary} from '../library';

/** Optional, read-only Jin Yong views. They never create a gameplay session. */
export async function mountJyxPanel(action:string,target:HTMLElement,state:GameState) {
  if(state.pack.id!=='jyx')throw new Error('当前内容包不支持此资料面板。');
  if(action==='companions'){
    const [data,conditions]=await Promise.all([loadCompanionCatalog(),inspectCompanionConditions()]);
    if(target.isConnected)mountCompanionCatalog(target,data,{...state,companionJournal:{
      completedRecruitmentStories:state.companionJournal?.completedRecruitmentStories||[],conditions,
    }});
  }else if(action==='library'){
    const data=await loadOriginalLibrary();
    if(target.isConnected)mountOriginalLibrary(target,data);
  }else throw new Error('未知资料面板。');
}
