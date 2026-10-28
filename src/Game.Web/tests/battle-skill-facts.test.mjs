import assert from 'node:assert/strict';
import {test} from 'node:test';
import {skillFacts} from '../src/battle-controls.ts';
import {translateUiText} from '../src/ui/locale.ts';
test('an unlocked technique keeps Energy, Rage, range, area and cooldown readable in English',()=>{
 globalThis.document={documentElement:{lang:'en'}};
 const text=skillFacts({mpCost:128,rageCost:4,castSize:3,impactSize:2,cooldown:5,remainingCooldown:2},'Energy');
 assert.equal(text,'Energy 128 · Base Rage 4 · Range 3 tiles · Area 2 · Cooldown 5 turns (2 remaining)');
 assert.equal(translateUiText('怒气不足。'),'Not enough Rage.');assert.equal(translateUiText('内力不足。'),'Not enough Energy.');
 assert.equal(translateUiText('招式冷却中，还需 2 回合。'),'Technique cooling down: 2 turns remaining.');
 document.documentElement.lang='zh-CN';assert.match(skillFacts({mpCost:128,rageCost:4},'能量'),/基础怒气 4/);
 delete globalThis.document;
});
