import assert from 'node:assert/strict';
import {test} from 'node:test';
import {matchesAtlasFilter,orderAtlasPlaces} from '../src/world-atlas-model.ts';

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
test('search accepts accents, straight or curly apostrophes and reordered words',()=>{
 const p={region:'forest',text:'Eir’s Vale · Café Greenwood',available:true};
 for(const query of ["Eir's",'EIRS cafe','greenwood vale',' Café '])assert.equal(matchesAtlasFilter(p,{region:'',query,showUnavailable:false}),true,query);
 assert.equal(matchesAtlasFilter(p,{region:'',query:'cafe frost',showUnavailable:false}),false);
 assert.equal(matchesAtlasFilter({...p,text:'格林居所'},{region:'',query:'格林',showUnavailable:false}),true);
});
test('task destination ranks first while unavailable places stay disabled and input order is retained',()=>{
 const a={id:'castle',action:'map'},b={id:'market',action:'map'},c={id:'locked',action:null};
 const places=[a,c,b],atlas={regions:[{locations:['castle','market','locked']}]};
 const ordered=orderAtlasPlaces(places,atlas,'market');
 assert.deepEqual(ordered,[b,a,c]);assert.deepEqual(places,[a,c,b]);
 assert.equal(ordered[2],c);assert.equal(ordered[2].action,null);
 assert.deepEqual(orderAtlasPlaces(places,atlas,'locked'),[a,b,c]);
});
