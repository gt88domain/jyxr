/** A view-only projection. IDs, conditions, commands, saves and rule names
 * stay inside the host; only explicit display fields are translated. */
export interface DisplayEntry {name?:string;description?:string;sourceName?:string;image?:string;}
export interface DisplayCatalog {
  schemaVersion:number;
  byId:Record<string,DisplayEntry>;
  byCategory?:Record<string,Record<string,DisplayEntry>>;
  text:Record<string,string>;
}
const fields=new Set(['name','description','itemName','skillName','speaker','title','label','defaultName','characterName','replacedItemName','runningInternalName','focus']);
const skillCategories=['externalSkills','internalSkills','specialSkills','legendSkills'];
export function categorizedDisplay(catalog:DisplayCatalog|undefined,categories:string[],id:string|undefined):DisplayEntry|undefined {
  if(!id)return undefined;
  return categories.map(category=>catalog?.byCategory?.[category]?.[id]).find(entry=>entry?.name);
}
export function projectPresentation<T>(input:T,catalog?:DisplayCatalog):T {
  if(!catalog)return input;
  if(catalog.schemaVersion!==1)throw new Error('Unsupported display catalog');
  function walk(value:unknown,key=''):unknown {
    if(Array.isArray(value))return value.map(item=>typeof item==='string'&&['masters','skills','traits'].includes(key)?categorizedDisplay(catalog,key==='skills'?skillCategories:key==='masters'?['characters']:['talents'],item)?.name??catalog!.text[item]??item:walk(item,key));
    if(!value||typeof value!=='object')return value;
    const object=value as Record<string,unknown>;
    const id=typeof object.definitionId==='string'?object.definitionId:typeof object.id==='string'?object.id:undefined;
    const category=({inventory:'items',items:'items',item:'items',products:'items',sellable:'items',entries:'items',externalSkills:'externalSkills',internalSkills:'internalSkills',specialSkills:'specialSkills',talents:'talents',buffs:'buffs',sects:'sects',map:'maps',locations:'locations',characters:'characters',party:'characters',roster:'characters',units:'characters',hero:'characters',managedCharacter:'characters'} as Record<string,string>)[key];
    const scopedId=category==='items'&&typeof object.itemId==='string'?object.itemId:id;
    const display=categorizedDisplay(catalog,category?[category]:key==='skills'?skillCategories:[],scopedId)??(id?catalog!.byId[id]:undefined);
    const result:Record<string,unknown>={};
    for(const [field,item] of Object.entries(object)){
      if(field==='displayCatalog'){result[field]=item;continue;}
      if(field==='image'&&display?.image){result[field]=display.image;continue;}
      if(field==='name'&&(id==='主角'||object.isHero===true||key==='creation')){result[field]=item;continue;}
      if(field==='characterName'&&object.characterId==='主角'){result[field]=item;continue;}
      if(field==='name'&&item==null&&id){result[field]=display?.name??catalog!.text[id]??id;continue;}
      if(typeof item==='string'&&fields.has(field)){
        const scalar=field==='itemName'||field==='replacedItemName'?categorizedDisplay(catalog,['items'],typeof object.itemId==='string'&&field==='itemName'?object.itemId:item):
          field==='skillName'?categorizedDisplay(catalog,skillCategories,typeof object.skillId==='string'?object.skillId:item):
          field==='runningInternalName'?categorizedDisplay(catalog,['internalSkills'],item):undefined;
        // A player-entered name is preserved unless it is the canonical label.
        const replacement=(field==='name'||field==='description')?display?.[field]:undefined;
        result[field]=scalar?.name??((replacement&&(item===display?.sourceName||item===id))?replacement:(catalog!.text[item]??item));
        if(field==='description'&&display?.description)result[field]=display.description;
      }else result[field]=walk(item,field);
    }
    return result;
  }
  return walk(input) as T;
}
