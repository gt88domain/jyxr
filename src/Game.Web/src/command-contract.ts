import {commandDefinitions} from './commands.generated';
import type {GameCommand} from './commands.generated';
export type {GameCommand};
export function assertCommand(value:unknown):asserts value is GameCommand {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('游戏指令必须是对象。');
  const request=value as Record<string,unknown>;
  if(typeof request.type!=='string'||!Object.hasOwn(commandDefinitions,request.type))throw new Error('未知的游戏指令。');
  const fields:Record<string,string>=commandDefinitions[request.type as keyof typeof commandDefinitions].fields;
  for(const [key,v] of Object.entries(request)){
    if(key==='type'||v===undefined)continue;
    const kind=fields[key]||fields[key+'?'];
    const valid=kind==='string'?typeof v==='string':kind==='boolean'?typeof v==='boolean':kind==='strings'?Array.isArray(v)&&v.every(s=>typeof s==='string'):kind==='id'?typeof v==='number'&&Number.isSafeInteger(v)&&v>0:kind==='integer'?typeof v==='number'&&Number.isInteger(v)&&v>=-2147483648&&v<=2147483647:false;
    if(!valid)throw new Error('游戏指令字段无效：'+key);
  }
  for(const key of Object.keys(fields))if(!key.endsWith('?')&&request[key]===undefined)throw new Error('游戏指令缺少字段：'+key);
  if(request.type==='attack'&&!request.targetId&&(request.x===undefined||request.y===undefined))throw new Error('请选择完整的出招目标。');
}
