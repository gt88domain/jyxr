import assert from 'node:assert/strict';
import {test} from 'node:test';
import {matchesAtlasFilter} from '../src/world-atlas-model.ts';

test('region selection and text search intersect without changing availability',()=>{
 const p={region:'forest',text:'Eir’s Vale · The Greenwood',available:true};
 assert.equal(matchesAtlasFilter(p,{region:'',query:'eir',showUnavailable:false}),true);
 assert.equal(matchesAtlasFilter(p,{region:'frost',query:'',showUnavailable:false}),false);
 assert.equal(matchesAtlasFilter(p,{region:'forest',query:' GREENWOOD ',showUnavailable:false}),true);
 assert.equal(matchesAtlasFilter(p,{region:'forest',query:'Castle',showUnavailable:true}),false);
});
test('unavailable events stay excluded unless explicitly requested',()=>{
 const p={region:'frost',text:'Frostbound Reach',available:false};
 assert.equal(matchesAtlasFilter(p,{region:'',query:'',showUnavailable:false}),false);
 assert.equal(matchesAtlasFilter(p,{region:'',query:'',showUnavailable:true}),true);
 assert.equal(matchesAtlasFilter(p,{region:'forest',query:'',showUnavailable:true}),false);
 assert.equal(p.available,false);
});
