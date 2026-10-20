// Presentation-only navigation. This preview never grants game rewards or writes saves.
export function targets(node){return node.choices?node.choices.map(choice=>choice.next):node.next?[node.next]:[];}
export function validateOpening(chapter){
  if(chapter.schemaVersion!==1||chapter.kind!=='opening-preview'||!chapter.nodes?.[chapter.start])throw new Error('Invalid opening');
  const keys=Object.keys(chapter.ui.en).sort();
  if(JSON.stringify(keys)!==JSON.stringify(Object.keys(chapter.ui['zh-CN']).sort()))throw new Error('Incomplete interface translation');
  const localized=value=>{if(!value||!['en','zh-CN'].every(lang=>typeof value[lang]==='string'&&value[lang].trim()))throw new Error('Incomplete dialogue translation');};
  const reached=new Set();
  function visit(id,ancestors=new Set()){
    if(ancestors.has(id))throw new Error('Opening contains a navigation loop');
    const node=chapter.nodes[id];if(!node)throw new Error('Missing opening node');
    localized(node.text);if(node.action)localized(node.action);
    if(!chapter.speakers[node.speaker]||!['dialogue','choice','page','complete'].includes(node.type))throw new Error('Invalid dialogue node');
    if(node.type==='choice'&&(!node.choices?.length||new Set(node.choices.map(c=>c.id)).size!==node.choices.length))throw new Error('Invalid choices');
    for(const choice of node.choices||[])localized(choice.text);
    if(node.type!=='complete'&&!targets(node).length)throw new Error('Unfinished navigation');
    if(node.type==='complete'&&targets(node).length)throw new Error('Invalid ending');
    reached.add(id);for(const next of targets(node))visit(next,new Set([...ancestors,id]));
  }
  visit(chapter.start);
  if(reached.size!==Object.keys(chapter.nodes).length)throw new Error('Unreachable opening node');
  for(const task of chapter.tasks)if(!reached.has(task.node)||!chapter.ui.en[task.id])throw new Error('Invalid opening task');
  return chapter;
}
export function restoreTrail(chapter,raw){
  const trail=typeof raw==='string'?raw.split(','):[];
  if(!trail.length||trail[0]!==chapter.start||trail.length>Object.keys(chapter.nodes).length)return [chapter.start];
  for(let i=0;i<trail.length;i++)if(!chapter.nodes[trail[i]]||(i&&!targets(chapter.nodes[trail[i-1]]).includes(trail[i])))return [chapter.start];
  return trail;
}
export function advance(chapter,trail,next){
  if(!targets(chapter.nodes[trail.at(-1)]).includes(next))throw new Error('Not a valid next page');
  return [...trail,next];
}
