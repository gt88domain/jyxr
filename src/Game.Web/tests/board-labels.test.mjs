import assert from 'node:assert/strict';
import {test} from 'node:test';
import {boardLabel} from '../src/board-labels.ts';
const measure=text=>Array.from(text).length*6;
test('phone cells use distinguishable numbers instead of overlapping repeated names',()=>{
  for(let n=1;n<=16;n++)assert.equal(boardLabel("Cardinal's Guard",n,30,measure),`#${n}`);
});
test('desktop names fit the cell and preserve their unit number',()=>{
  for(const name of ["Cardinal's Guard",'D’Artagnan','雷霆之神索尔','A','😀😀😀😀😀😀😀😀']){
    const label=boardLabel(name,12,92,measure);
    assert.ok(label.startsWith('#12'));assert.ok(measure(label)<=84);
    assert.ok(!label.includes('\ufffd'));
  }
  assert.equal(boardLabel('Eir',2,92,measure),'#2 Eir');
});
