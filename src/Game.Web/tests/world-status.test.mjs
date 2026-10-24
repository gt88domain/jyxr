import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {worldStatus} from '../src/world-status.ts';
const packages=Object.fromEntries(['en','zh-CN'].map(l=>[l,JSON.parse(readFileSync(new URL(`../public/data/packs/worlds/${l}/content-package.json`,import.meta.url))).browser]));
const state=(locale='en',sect='大轮寺',timeSlot='亥')=>({pack:packages[locale],adventure:{days:5,sect,timeSlot}});
test('clock shows the original twelve time slots and actual night-window boundaries',()=>{
 const branches=[...'子丑寅卯辰巳午未申酉戌亥'];
 for(const branch of branches){
  const s=state('en','大轮寺',branch),view=worldStatus(s,'en');
  assert.equal(view.day,6);assert.match(view.time,/a\.m\.|p\.m\./);
  assert.equal(view.night,packages.en.chapterGuide.story.nightSlots.includes(branch));
 }
 assert.equal(worldStatus(state(),'en').time,'9–11 p.m.');
 assert.equal(worldStatus(state('zh-CN'),'zh-CN').time,'21:00–23:00');
});
test('all original affiliation aliases use the localized organization catalog',()=>{
 for(const locale of ['en','zh-CN'])for(const organization of packages[locale].chapterGuide.organizations){
  for(const id of organization.affiliationIds){
   const view=worldStatus(state(locale,id),locale);assert.equal(view.organizationName,organization.shortName);assert.equal(view.affiliationId,id);
  }
 }
 assert.equal(worldStatus(state('en',''),'en').organizationName,'Independent');
 assert.equal(worldStatus(state('en','古墓'),'en').organizationName,'House of Mists');
});
test('unknown affiliations do not leak internal identifiers or reset membership',()=>{
 const s=state('en','测试组织');const view=worldStatus(s,'en');
 assert.equal(view.organizationName,'Other organization');assert.equal(view.affiliationId,'测试组织');
 assert.equal(s.adventure.sect,'测试组织');
});
test('reading clock and affiliation never changes saved facts or draws randomness',()=>{
 const s=state(),before=structuredClone(s),random=Math.random;
 Math.random=()=>{throw new Error('Display must not roll an event');};
 try{for(let n=0;n<50;n++)worldStatus(s,'en');}finally{Math.random=random;}
 assert.deepEqual(s,before);
});
