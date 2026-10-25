import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {storyChapterStep,storyChapterSteps} from '../src/story-guide.ts';
import {openingChapterStep} from '../src/opening-chapter.ts';
const pack=JSON.parse(readFileSync(new URL('../public/data/packs/worlds/en/content-package.json',import.meta.url))).browser;
function state(completedStories=[],trust=50,timeSlot='午'){
 return {pack,chapterJournal:{completedStories,trust},adventure:{timeSlot}};
}
test('night hint reads actual clock and keeps the chance explicit',()=>{
 const s=state(['白马啸西风_初次见面']);
 assert.equal(storyChapterStep(s).storyStage,'night');
 assert.match(storyChapterStep(s).detail,/Return at night/);
 s.adventure.timeSlot='子';
 assert.match(storyChapterStep(s).detail,/20% chance/);
});
test('low trust follows its own route without implying a failed recruit',()=>{
 const step=storyChapterStep(state(['白马啸西风_初次见面','白马啸西风_前往高昌'],55));
 assert.equal(step.storyStage,'alternate-warrens');assert.match(step.detail,/trust was below 60/);
 assert.equal(step.route.find(r=>r.mapId==='大地图').locationId,'高昌迷宫');
});
test('reward, invitation and declined invitation have distinct next steps',()=>{
 for(const [ids,expected,complete] of [
  [['白马啸西风_高昌秘宝3'],'find-knight',false],
  [['白马啸西风_高昌秘宝3','白马啸西风_陈达海加入2'],'knight-ending',true],
  [['白马啸西风_高昌秘宝3','白马啸西风_陈达海加入3'],'knight-declined',true],
  [['白马啸西风_李文秀加入','白马啸西风_完结2'],'dulcinea-ending',true],
 ]){const step=storyChapterStep(state(ids));assert.equal(step.storyStage,expected);assert.equal(step.complete,complete);}
});
test('reading the guide is deterministic and does not mutate state or random state',()=>{
 const s=state(['白马啸西风_初次见面'],55,'亥'),before=structuredClone(s);
 const random=Math.random;Math.random=()=>{throw new Error('Guide must not draw random numbers');};
 try{for(let n=0;n<50;n++)assert.equal(storyChapterStep(s).storyStage,'night');}finally{Math.random=random;}
 assert.deepEqual(s,before);
});
test('three independent routes preserve story windows and original solo-defeat behavior',()=>{
 const s=state(['白马啸西风_完结2','mainStory_神秘剑客1']);
 const guides=storyChapterSteps(s);assert.equal(guides.length,3);
 assert.equal(guides[1].blocked,true);assert.deepEqual(guides[1].route,[]);
 assert.match(guides[2].detail,/ALONE/);
 s.chapterJournal.completedStories.push('鸳鸯刀正_风陵渡败');
 const defeat=storyChapterSteps(s)[2];assert.equal(defeat.complete,false);assert.equal(defeat.blocked,true);
 assert.deepEqual(defeat.route,[]);assert.match(defeat.detail,/load an intact save/);
});
test('finishing Spain recommends France while exploring Italy keeps the local guide',()=>{
 const s={...state(['白马啸西风_完结2']),map:{id:'大地图'},objectives:pack.objectives.map(o=>({...o,completed:true}))};
 assert.equal(openingChapterStep(s).storyStage,'france-meet');
 s.map.id='风陵渡口';assert.equal(openingChapterStep(s).storyStage,'italy-night');
 s.map.id='大地图';s.chapterJournal.completedStories.push('书剑恩仇录_庖丁解牛胜');
 assert.equal(openingChapterStep(s).storyStage,'italy-night');
 s.chapterJournal.completedStories.push('鸳鸯刀正_风陵渡胜');
 assert.equal(openingChapterStep(s).complete,true);
 assert.match(openingChapterStep(s).detail,/Blue Fairy.*does not join/);
});
