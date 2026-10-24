import assert from 'node:assert/strict';
import {test} from 'node:test';
import {selectRows} from '../playthrough/report-model.mjs';
const line=(sequence,stage='spain',run='retest')=>({kind:'dialogue',sequence,stage,run,speaker:{en:'Dulcinea'},text:{en:'A familiar reply.', 'zh-CN':'熟悉的回答。'}});
test('story view folds repeats within a trial and keeps every original position',()=>{
 const rows=[line(1),line(4),line(8)],original=structuredClone(rows),out=selectRows(rows);
 assert.equal(out.length,1);assert.deepEqual(out[0].repetitions.map(r=>r.sequence),[1,4,8]);
 assert.deepEqual(rows,original);assert.deepEqual(selectRows(rows,{view:'full'}),rows);
});
test('a replayed branch or separate trial is never merged into the first journey',()=>{
 const rows=[line(1),line(2,'knight','knight'),line(3,'italy'),line(4,'italy-retry')];
 assert.equal(selectRows(rows).length,3);assert.equal(selectRows(rows,{view:'full'}).length,4);
 assert.equal(selectRows(rows,{stage:'italy'}).length,2);
});
test('training has an explicit view and a search remains possible in full evidence',()=>{
 const rows=[line(1,'recovery'),{kind:'battle-end',stage:'spain',run:'retest',battleId:'browser_结伴练习'},{kind:'checkpoint',stage:'spain',run:'retest',name:'saved'}];
 assert.equal(selectRows(rows).length,0);assert.equal(selectRows(rows,{stage:'recovery'}).length,1);
 assert.equal(selectRows(rows,{view:'full',query:'SAVED'}).length,1);
});
