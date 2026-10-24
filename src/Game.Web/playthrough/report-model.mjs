/** Summarize an observed report without changing or discarding its evidence. */
export function selectRows(rows,{stage='all',query='',view='story'}={}){
 const needle=query.toLocaleLowerCase();
 const selected=rows.filter(r=>
  (stage==='all'||(stage==='italy'?r.stage.startsWith('italy'):r.stage===stage))&&
  JSON.stringify(r).toLocaleLowerCase().includes(needle)&&
  (view==='full'||(
   (stage!=='all'||!['recovery','italy-retry'].includes(r.stage))&&
   !['visit','battle-start','checkpoint'].includes(r.kind)&&
   !(r.kind==='battle-end'&&r.battleId==='browser_结伴练习')
  )));
 if(view==='full')return selected;
 const groups=new Map(),result=[];
 for(const row of selected){
  if(row.kind!=='dialogue'){result.push(row);continue;}
  // Identical words in a different trial or branch are separate experiences.
  const key=JSON.stringify([row.run,row.stage,row.speaker,row.text.en]);
  const previous=groups.get(key);
  if(previous){previous.repetitions.push({run:row.run,stage:row.stage,sequence:row.sequence});continue;}
  const summarized={...row,repetitions:[{run:row.run,stage:row.stage,sequence:row.sequence}]};
  groups.set(key,summarized);result.push(summarized);
 }
 return result;
}
