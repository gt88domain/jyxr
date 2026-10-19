import {assetUrl} from './content';

interface RuleEntry {id:string;configurationState:string;}
interface RuleAudit {sections:{talents:{entries:RuleEntry[]}};}
let pending:Promise<Map<string,string>>|undefined;

/** Keep original descriptions intact and label unavailable effects separately. */
export async function mountRuleCoverage(root:HTMLElement,packId:string) {
  if(packId!=='jyx'||!root.querySelector('[data-talent-id]'))return;
  try {
    if(!pending){
      const url=new URL(assetUrl('data/original-battle-rule-audit.json'));url.searchParams.set('v',import.meta.env.VITE_GAME_VERSION);
      pending=fetch(url).then(async response=>{
        if(!response.ok)throw new Error('天赋效果清单暂不可用。');
        const audit=await response.json() as RuleAudit;
        return new Map(audit.sections.talents.entries.map(entry=>[entry.id,entry.configurationState]));
      }).catch(error=>{pending=undefined;throw error;});
    }
    const entries=await pending;if(!root.isConnected)return;
    for(const element of root.querySelectorAll<HTMLElement>('[data-talent-id]')){
      if(element.querySelector('[data-rule-coverage]'))continue;
      const status=entries.get(element.dataset.talentId!);
      if(!['metadata-only','partial'].includes(status||''))continue;
      const text=status==='metadata-only'?'原版说明已保留；这项战斗效果尚未接入。':'已有战斗效果，复杂组合仍在完善。';
      const note=document.createElement('p');note.dataset.ruleCoverage=status;note.className='field-note';note.textContent=text;element.append(note);
    }
  }catch{
    if(!root.isConnected)return;
    const note=document.createElement('p');note.className='field-note';note.textContent='天赋效果状态暂时无法读取，原版说明照常显示。';root.querySelector('.talent-list')?.append(note);
  }
}
