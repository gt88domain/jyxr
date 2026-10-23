import assert from 'node:assert/strict';
import {test} from 'node:test';
import {translateUiText,setUiDisplayLabels} from '../src/ui/locale.ts';
test('study scrolls stay distinct from manual controls and saves',()=>{
 assert.equal(translateUiText('秘籍'),'Scrolls');
 assert.equal(translateUiText('手动战斗'),'Manual combat');
 assert.equal(translateUiText('读取手动存档'),'Load manual save');
});
test('random roll text is not mistaken for an equipment modifier',()=>{
 assert.equal(translateUiText('随机 +2'),'Random +2');
 assert.equal(translateUiText('防御力 +8，抗暴击率 +1%'),'Defense +8; Critical resistance +1%');
});
test('skill modifiers use the content name and retain their numeric value',()=>{
 setUiDisplayLabels({'石梁心法':'Stonebridge Mastery'});
 assert.equal(translateUiText('技能「石梁心法」威力 +5%'),'Stonebridge Mastery power +5%');
 setUiDisplayLabels();
});
test('unknown display text converges instead of causing an observer rewrite loop',()=>{
 const first=translateUiText('未命名属性+7%');
 assert.equal(translateUiText(first),first);
 assert.equal(translateUiText('未改写的后期故事。'),'未改写的后期故事。');
});
test('talent notifications translate the companion as well as the talent',()=>{
 setUiDisplayLabels({'乔峰':'Thor','阉人':'Eunuch'});
 assert.equal(translateUiText('乔峰 获得天赋【阉人】'),'Thor gained the talent Eunuch.');
 setUiDisplayLabels();
});
test('gauntlets, spellcasting and passive masteries retain distinct roles',()=>{
 assert.equal(translateUiText('拳掌'),'Gauntlets');
 assert.equal(translateUiText('奇门'),'Spells');
 assert.equal(translateUiText('刀法'),'Heavy Weapons');
 assert.equal(translateUiText('内功'),'Passive masteries');
 assert.equal(translateUiText('拳掌系技能加成 +10%'),'Gauntlets technique bonus +10%');
 assert.equal(translateUiText('奇门系技能加成 +10%'),'Spells technique bonus +10%');
 assert.equal(translateUiText('同时主运一门'),'One equipped mastery at a time');
});
test('American English keeps shared item and skill names distinct in reward and bonus text',()=>{
 setUiDisplayLabels({}, {schemaVersion:1,byId:{},text:{},byCategory:{items:{'易筋经':{name:'Ironbody Mastery Scroll'}},internalSkills:{'易筋经':{name:'Ironbody Mastery'}}}});
 assert.equal(translateUiText('获得「易筋经」×2'),'Received Ironbody Mastery Scroll ×2');
 assert.equal(translateUiText('技能「易筋经」威力 +5%'),'Ironbody Mastery power +5%');
 assert.equal(translateUiText('刀法'),'Heavy Weapons');
 setUiDisplayLabels();
});
