import assert from 'node:assert/strict';
import {test} from 'node:test';
import {projectPresentation} from '../src/presentation.ts';
const catalog={schemaVersion:1,byId:{'野球拳':{name:"Scrapper's Fist",sourceName:'野球拳'},'南贤':{name:'Grimm',sourceName:'南贤'},'草帽':{name:'Straw Hat',description:'A hat.',sourceName:'草帽'}},text:{'南贤':'Grimm','野球拳':"Scrapper's Fist",'草帽':'Straw Hat'}};
test('immutable content reuses its view while live party state and languages remain separate',()=>{
 const pack={title:'南贤',displayCatalog:catalog};
 const first=projectPresentation({pack,hero:{id:'主角',name:'Wren',hp:40}},catalog);
 const second=projectPresentation({pack,hero:{id:'主角',name:'Wren',hp:12}},catalog);
 assert.equal(first.pack,second.pack);assert.equal(second.hero.hp,12);assert.notEqual(first.hero,second.hero);
 const chinese={...catalog,text:{...catalog.text,'南贤':'格林'}};
 const switched=projectPresentation({pack},chinese);
 assert.equal(switched.pack.title,'格林');assert.notEqual(switched.pack,first.pack);
 assert.equal(pack.title,'南贤');assert.equal(first.pack.displayCatalog,catalog);
});
test('presentation translates labels without modifying rule references or input',()=>{
 const source={hero:{id:'主角',name:'南贤'},characters:[{id:'南贤',name:'南贤'}],skill:{id:'野球拳',name:'野球拳',skillName:'野球拳',skillId:'野球拳'},equipment:{definitionId:'草帽',name:'草帽',description:'旧描述'},dialogue:{speaker:'南贤',text:'Pending source dialogue.'},command:{type:'equip',itemId:'草帽',target:'南贤',call:"skill('野球拳')"}};
 const before=structuredClone(source),view=projectPresentation(source,catalog);
 assert.deepEqual(source,before);assert.equal(view.hero.name,'南贤');assert.equal(view.characters[0].name,'Grimm');assert.equal(view.skill.name,"Scrapper's Fist");assert.equal(view.skill.skillId,'野球拳');assert.equal(view.equipment.description,'A hat.');assert.deepEqual(view.command,source.command);assert.equal(view.dialogue.speaker,'Grimm');assert.equal(view.dialogue.text,source.dialogue.text);
});
test('unmapped and ambiguous identities remain distinct',()=>{
 const ambiguous={schemaVersion:1,byId:{one:{name:'First',sourceName:'神秘人'},two:{name:'Second',sourceName:'神秘人'}},text:{}};
 assert.deepEqual(projectPresentation([{id:'one',name:'神秘人'},{id:'two',name:'神秘人'},{speaker:'神秘人'}],ambiguous),[{id:'one',name:'First'},{id:'two',name:'Second'},{speaker:'神秘人'}]);
});
test('unnamed map locations acquire a display label through their stable ID',()=>{
 const source={id:'南贤',name:null,image:null};
 const artCatalog={...catalog,byId:{...catalog.byId,'南贤':{...catalog.byId['南贤'],image:'art/grimm.png'}}};
 assert.deepEqual(projectPresentation(source,artCatalog),{id:'南贤',name:'Grimm',image:'art/grimm.png'});
 assert.equal(source.name,null);
});
test('equipment previews preserve the player name even when it matches a source label',()=>{
 const preview={characterId:'主角',characterName:'南贤',itemId:'草帽',itemName:'草帽'};
 assert.deepEqual(projectPresentation(preview,catalog),{...preview,itemName:'Straw Hat'});
});
test('a pending location keeps its canonical label instead of exposing a null name',()=>{
 assert.deepEqual(projectPresentation({id:'未改写地点',name:null,image:null},catalog),{id:'未改写地点',name:'未改写地点',image:null});
});
test('original apps bypass the projection and unknown schemas fail explicitly',()=>{
 const value={name:'南贤'};assert.equal(projectPresentation(value),value);assert.throws(()=>projectPresentation(value,{...catalog,schemaVersion:9}),/Unsupported/);
});
test('a shared legacy ID keeps skill, scroll and shop labels distinct without changing references',()=>{
 const shared={schemaVersion:1,byId:{},text:{},byCategory:{
  internalSkills:{shared:{name:'Ironbody Mastery',sourceName:'shared',description:'A mastery.'}},
  items:{shared:{name:'Ironbody Mastery Scroll',sourceName:'shared',description:'A training scroll.'}}
 }};
 const raw={hero:{id:'主角',name:'shared',internalSkills:[{id:'shared',name:'shared'}],cultivation:{itemId:'shared',itemName:'shared',skillId:'shared',skillName:'shared'}},
  inventory:[{id:'shared',name:'shared',count:2}],shop:{products:[{id:'product-7',itemId:'shared',name:'shared',price:123}]}};
 const saved=structuredClone(raw),view=projectPresentation(raw,shared);
 assert.deepEqual(raw,saved);
 assert.equal(view.hero.name,'shared');
 assert.equal(view.hero.internalSkills[0].name,'Ironbody Mastery');
 assert.equal(view.inventory[0].name,'Ironbody Mastery Scroll');
 assert.equal(view.shop.products[0].name,'Ironbody Mastery Scroll');
 assert.deepEqual(view.hero.cultivation,{itemId:'shared',itemName:'Ironbody Mastery Scroll',skillId:'shared',skillName:'Ironbody Mastery'});
 assert.equal(view.shop.products[0].price,123);assert.equal(view.inventory[0].count,2);
});
