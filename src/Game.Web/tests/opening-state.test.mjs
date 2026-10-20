import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateOpening,restoreTrail,advance} from '../opening/opening-state.mjs';
const source=JSON.parse(await readFile(new URL('../content/worlds/opening.json',import.meta.url),'utf8'));
test('both questions lead to the same accepted request and first page',()=>{
 const chapter=validateOpening(source);
 for(const branch of chapter.nodes.question.choices){
  let trail=[chapter.start];
  while(chapter.nodes[trail.at(-1)].type!=='complete'){
   const node=chapter.nodes[trail.at(-1)];trail=advance(chapter,trail,node.type==='choice'?branch.next:node.next);
  }
  assert.ok(trail.includes('accepted')&&trail.includes('page'));
  assert.deepEqual(restoreTrail(chapter,trail.join(',')),trail);
 }
});
test('a URL cannot skip the request or inject a missing dialogue',()=>{
 for(const value of ['end','welcome,end','welcome,missing','welcome,collection,question,accepted','<script>'])assert.deepEqual(restoreTrail(source,value),['welcome']);
 assert.throws(()=>advance(source,['welcome'],'end'),/valid next/);
});
test('broken references, loops and incomplete localization fail before presentation',()=>{
 const missing=structuredClone(source);missing.nodes.welcome.next='missing';assert.throws(()=>validateOpening(missing),/Missing/);
 const loop=structuredClone(source);loop.nodes.accepted.next='welcome';assert.throws(()=>validateOpening(loop),/loop/);
 const untranslated=structuredClone(source);delete untranslated.nodes.request.text.en;assert.throws(()=>validateOpening(untranslated),/translation/);
});
