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
 assert.equal(translateUiText('防御力 +8，抗暴击率 +1%'),'Defence +8; Critical resistance +1%');
});
test('skill modifiers use the content name and retain their numeric value',()=>{
 setUiDisplayLabels({'石梁心法':'Stonebridge Breathing'});
 assert.equal(translateUiText('技能「石梁心法」威力 +5%'),'Stonebridge Breathing power +5%');
 setUiDisplayLabels();
});
test('unknown display text converges instead of causing an observer rewrite loop',()=>{
 const first=translateUiText('未命名属性+7%');
 assert.equal(translateUiText(first),first);
 assert.equal(translateUiText('未改写的后期故事。'),'未改写的后期故事。');
});
