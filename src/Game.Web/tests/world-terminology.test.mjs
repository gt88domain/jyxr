import assert from 'node:assert/strict';
import {test} from 'node:test';
import {translateUiText,setUiDisplayLabels} from '../src/ui/locale.ts';
test('study rejection explains the required attribute without Chinese residue',()=>{
 assert.equal(translateUiText('需要剑法达到60'),'Requires Swords 60.');
 assert.equal(translateUiText('需要定力达到50'),'Requires Resolve 50.');
});
test('composite battle labels translate while preserving the player name',()=>{
 assert.equal(translateUiText('我方 · 3人'),'Allies · 3');
 assert.equal(translateUiText('对手 · 7人'),'Enemies · 7');
 assert.equal(translateUiText('Wren · 请选择走位格'),'Wren · Choose a destination');
 assert.equal(translateUiText('Storybound内容载入：513 名角色、158 门外功、347 件物品。'),'Storybound is ready.');
});
test('study scrolls stay distinct from manual controls and saves',()=>{
 assert.equal(translateUiText('秘籍'),'Training guides');
 assert.equal(translateUiText('手动战斗'),'Manual combat');
 assert.equal(translateUiText('读取手动存档'),'Load manual save');
 assert.equal(translateUiText('Bloodthorn Bolt · 第 1 重 / 10 重'),'Bloodthorn Bolt · Rank 1/10');
 assert.doesNotMatch(translateUiText('秘籍正由其他队友修炼。'),/[\u3400-\u9fff]/);
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
test('combined level-up and loot toasts translate as separate activity messages',()=>{
 assert.equal(translateUiText("Wren从6级升至7级。；获得「Traveler's Robe」×1"),"Wren levels up: 6 → 7.; Received Traveler's Robe ×1");
 assert.equal(translateUiText('未改写甲；未改写乙。'),'未改写甲；未改写乙。');
});
test('stat rewards stay readable with English player names and combined toasts',()=>{
 assert.equal(translateUiText('Rowan max_hp +100；Rowan max_mp +100'),'Rowan · Maximum Health +100; Rowan · Maximum Energy +100');
 assert.equal(translateUiText("  Max O'Hara max_mp -25 "),"  Max O'Hara · Maximum Energy -25 ");
 assert.equal(translateUiText('Rowan · Maximum Energy -25'),'Rowan · Maximum Energy -25');
});
test('stat reward names use the display catalog without translating unknown commands',()=>{
 setUiDisplayLabels({'钟灵':'Eir'});
 assert.equal(translateUiText('钟灵 max_hp +100'),'Eir · Maximum Health +100');
 assert.equal(translateUiText("set_flag('max_hp')"),"set_flag('max_hp')");
 assert.equal(translateUiText('Rowan unknown_stat +100'),'Rowan unknown_stat +100');
 setUiDisplayLabels();
});
test('world-news requirements remain readable when combined with semicolons',()=>{
 setUiDisplayLabels({'黑暗的阴影':'An Unwelcome Shadow'});
 const source='主角达到 15 级；参战队伍至少 8 人（含主角）；经历「黑暗的阴影」';
 const expected='Reach level 15; Have at least 8 active party members, including yourself; complete An Unwelcome Shadow';
 assert.equal(translateUiText(source),expected);assert.equal(translateUiText(expected),expected);
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
