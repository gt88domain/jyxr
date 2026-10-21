/** A view-only projection. IDs, conditions, commands, saves and rule names
 * stay inside the host; only explicit display fields are translated. */
export interface DisplayCatalog {
  schemaVersion:number;
  byId:Record<string,{name?:string;description?:string;sourceName?:string;image?:string}>;
  text:Record<string,string>;
}
const fields=new Set(['name','description','itemName','skillName','speaker','title','label','defaultName','characterName','replacedItemName','runningInternalName','focus']);
export function projectPresentation<T>(input:T,catalog?:DisplayCatalog):T {
  if(!catalog)return input;
  if(catalog.schemaVersion!==1)throw new Error('Unsupported display catalog');
  function walk(value:unknown,key=''):unknown {
    if(Array.isArray(value))return value.map(item=>typeof item==='string'&&['masters','skills','traits'].includes(key)?catalog!.text[item]??item:walk(item,key));
    if(!value||typeof value!=='object')return value;
    const object=value as Record<string,unknown>;
    const id=typeof object.definitionId==='string'?object.definitionId:typeof object.id==='string'?object.id:undefined;
    const display=id?catalog!.byId[id]:undefined;
    const result:Record<string,unknown>={};
    for(const [field,item] of Object.entries(object)){
      if(field==='displayCatalog'){result[field]=item;continue;}
      if(field==='image'&&display?.image){result[field]=display.image;continue;}
      if(field==='name'&&(id==='主角'||object.isHero===true||key==='creation')){result[field]=item;continue;}
      if(field==='characterName'&&object.characterId==='主角'){result[field]=item;continue;}
      if(field==='name'&&item==null&&id){result[field]=display?.name??catalog!.text[id]??id;continue;}
      if(typeof item==='string'&&fields.has(field)){
        // A player-entered name is preserved unless it is the canonical label.
        const replacement=(field==='name'||field==='description')?display?.[field]:undefined;
        result[field]=(replacement&&(item===display?.sourceName||item===id))?replacement:(catalog!.text[item]??item);
        if(field==='description'&&display?.description)result[field]=display.description;
      }else result[field]=walk(item,field);
    }
    return result;
  }
  return walk(input) as T;
}
