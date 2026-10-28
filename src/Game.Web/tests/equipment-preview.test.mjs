import assert from 'node:assert/strict';
import {test} from 'node:test';
import {equipmentPreviewView} from '../src/equipment-preview.ts';
import {translateUiText} from '../src/ui/locale.ts';
test('resistance and accuracy compare as percentages while movement is explicitly a modifier',()=>{
 const html=equipmentPreviewView({characterId:'hero',characterName:'Wren',itemName:'Armor',entryNumber:1,canEquip:true,addedTalents:[],removedTalents:[],attributes:[
  {id:'anti_crit_chance',label:'Critical resistance',before:.01,after:.15},
  {id:'accuracy',label:'Accuracy',before:.08,after:0},
  {id:'movement',label:'Movement',before:0,after:-1}
 ]});
 assert.match(html,/<td>1%<\/td><td>15%<\/td>/);
 assert.match(html,/<td>8%<\/td><td>0%<\/td>/);
 assert.match(html,/移动距离加成/);assert.equal(translateUiText('移动距离加成'),'Movement modifier');
});
