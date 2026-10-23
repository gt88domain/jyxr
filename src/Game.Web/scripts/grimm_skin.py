"""Replace presentation fields in the real JYX package, preserving its flow."""
import copy,hashlib,json,re
from pathlib import Path

COPY_CATEGORIES={'items','externalSkills','internalSkills','shops','talents','buffs','specialSkills','battles','sects','legendSkills'}

def load_skin(web=None):
    web=Path(web) if web else Path(__file__).resolve().parents[1]
    folder=web/'content/worlds'
    skin=json.loads((folder/'grimm-skin.json').read_text(encoding='utf8'))
    def merge(target,source,path=''):
        for key,value in source.items():
            if key not in target:target[key]=copy.deepcopy(value)
            elif isinstance(value,dict) and isinstance(target[key],dict):merge(target[key],value,path+'/'+key)
            elif target[key]!=value:raise ValueError('Conflicting chapter copy: '+path+'/'+key)
    for filename in skin.get('chapters',[]):
        path=(folder/filename).resolve()
        if not path.is_relative_to(folder.resolve()):raise ValueError('Chapter leaves content folder')
        chapter=json.loads(path.read_text(encoding='utf8'))
        if chapter.pop('sourceSha256',None)!=skin['sourceSha256']:raise ValueError('Chapter source changed')
        merge(skin,chapter)
    return skin

def apply_skin(raw,skin,locale):
    if locale not in ['en','zh-CN']:raise ValueError('Unsupported skin locale')
    if hashlib.sha256(raw).hexdigest()!=skin['sourceSha256']:raise ValueError('Original content fingerprint changed')
    package=json.loads(raw);original=copy.deepcopy(package);guide=skin['characterId'];name=skin['name'][locale]
    changed=[]
    def set_value(obj,key,value,path):
        if obj.get(key)!=value:obj[key]=value;changed.append(path)
    character=next(c for c in package['characters'] if c['id']==guide)
    set_value(character,'name',name,'characters/南贤/name')
    aliases={guide:name,**{id:text[locale] for id,text in skin.get('speakerNames',{}).items()}}
    for character in package['characters']:
        if character['id'] in aliases:character['name']=aliases[character['id']]
    for category,definitions in skin.get('definitions',{}).items():
        if category not in COPY_CATEGORIES:raise ValueError('Unsupported copy category: '+category)
        by_id={definition['id']:definition for definition in package[category]}
        for id,fields in definitions.items():
            for field,text in fields.items():
                if field not in ['name','description'] or not isinstance(by_id[id].get(field),str):raise ValueError('Invalid display field')
                set_value(by_id[id],field,text[locale],category+'/'+id+'/'+field)
    for m in package['maps']:
        labels=skin['maps'].get(m['id'])
        if labels:
            for key,value in labels.items():set_value(m,key,value[locale],'maps/'+m['id']+'/'+key)
        for location in m.get('locations',[]):
            if location['id']==guide:
                location['name']=name;location['description']=skin['guideLocation'][locale]
                location['picture']='头像.南贤'
            elif location['id']=='南贤居':
                location['name']=skin['maps']['南贤居']['name'][locale];location['description']=skin['houseLocation'][locale]
            for field,text in skin.get('locations',{}).get(m['id'],{}).get(location['id'],{}).items():
                if field not in ['name','description']:raise ValueError('Invalid location display field')
                location[field]=text[locale]
    scripts={s['name']:s for script in package['storyScripts'].values() for s in script['segments']}
    for id,lines in skin['segments'].items():
        segment=scripts[id];dialogues=[step for step in segment['steps'] if step['kind']=='dialogue']
        if len(dialogues)!=len(lines[locale]):raise ValueError('Dialogue slot count changed: '+id)
        for step,text in zip(dialogues,lines[locale]):step['text']=text
    # Only contiguous dialogue runs may be shortened. Commands, conditions,
    # choices and jumps between those runs retain their original order.
    for id,edits in skin.get('dialogueEdits',{}).items():
        steps=scripts[id]['steps'];previous_end=0
        for edit in sorted(edits,key=lambda item:item['start']):
            start,count=edit['start'],edit['expectedCount']
            if start<previous_end or count<1 or len(steps[start:start+count])!=count or any(step['kind']!='dialogue' for step in steps[start:start+count]) or (start>0 and steps[start-1]['kind']=='dialogue') or (start+count<len(steps) and steps[start+count]['kind']=='dialogue'):
                raise ValueError('Original dialogue run changed: '+id)
            allowed_speakers={guide,'主角',*[step['speaker'] for step in steps[start:start+count]]}
            if not edit['lines'] or any(line['speaker'] not in allowed_speakers or not line['text'].get(locale) for line in edit['lines']):
                raise ValueError('Invalid compressed dialogue: '+id)
            previous_end=start+count
        for edit in sorted(edits,key=lambda item:item['start'],reverse=True):
            steps[edit['start']:edit['start']+edit['expectedCount']]=[{'kind':'dialogue','speaker':line['speaker'],'text':line['text'][locale]} for line in edit['lines']]
    for id,texts in skin['choiceText'].items():
        choices=[step for step in scripts[id]['steps'] if step['kind']=='choice']
        if len(choices)!=1 or len(choices[0]['blocks'])!=1 or choices[0]['blocks'][0]['kind']!='options':raise ValueError('Choice structure changed: '+id)
        choice=choices[0];choice['prompt']['text']=texts['prompt'][locale]
        options=choice['blocks'][0]['options']
        if len(options)!=len(texts['options'][locale]):raise ValueError('Choice slot count changed: '+id)
        for option,text in zip(options,texts['options'][locale]):option['text']=text
    text_command=re.compile(r"^(journal|suggest)\('([^']*)'\)$")
    def walk(value):
        if isinstance(value,dict):
            # Keep story speaker identities canonical. The view projection
            # supplies names; the host can still resolve portraits by ID.
            if value.get('kind')=='command' and (match:=text_command.fullmatch(value['call'])):
                replacement=skin['commandText'].get(match[2])
                if replacement:
                    text=replacement[locale]
                    if "'" in text:text=text.replace("'",'’')
                    value['call']=match[1]+"('"+text+"')"
            for child in value.values():walk(child)
        elif isinstance(value,list):
            for child in value:walk(child)
    walk(package['storyScripts'])
    browser=package['browser']
    for key in ['title','subtitle','description']:browser[key]=skin[key][locale]
    browser['chapterTitle']=skin['subtitle'][locale]
    browser['contentVersion']=skin['version']
    for objective in browser['objectives']:
        if objective['id'] in skin['objectives']:objective['title']=skin['objectives'][objective['id']][locale]
    def localize(value):
        if isinstance(value,dict):return value[locale] if set(value)=={'en','zh-CN'} else {k:localize(v) for k,v in value.items()}
        if isinstance(value,list):return [localize(v) for v in value]
        return value
    if 'chapterGuide' in skin:
        chapter_guide=localize(skin['chapterGuide']);goal_ids={o['id'] for o in browser['objectives']}
        if set(chapter_guide['stepOrder'])!=goal_ids or len(chapter_guide['stepOrder'])!=len(goal_ids) or {s['id'] for s in chapter_guide['steps']}!=goal_ids or len(chapter_guide['steps'])!=len(goal_ids):raise ValueError('Chapter guide goals do not match')
        if any(s.get('panel') not in [None,'equipment','cultivation','save'] for s in chapter_guide['steps']):raise ValueError('Chapter guide panel unsupported')
        maps={m['id']:{l['id'] for l in m.get('locations',[])} for m in package['maps']}
        routes=[s.get('route',[]) for s in chapter_guide['steps']]+list(chapter_guide['taskRoutes'].values())
        for route in routes:
            for hop in route:
                if hop['locationId'] not in maps.get(hop['mapId'],set()):raise ValueError('Chapter guide location missing')
        if chapter_guide['recommendedSectId'] not in {s['id'] for s in package['sects']}:raise ValueError('Chapter guide school missing')
        browser['chapterGuide']=chapter_guide
    if 'worldAtlas' in skin:
        atlas=localize(skin['worldAtlas'])
        native=next((m for m in package['maps'] if m['id']==atlas.get('mapId') and m.get('kind')=='large'),None)
        regions=atlas.get('regions',[])
        locations=[id for region in regions for id in region.get('locations',[])]
        if native is None or len(locations)!=len(set(locations)) or set(locations)!={l['id'] for l in native['locations']}:raise ValueError('Atlas must cover native destinations exactly once')
        if not regions or len({r['id'] for r in regions})!=len(regions) or any(not re.fullmatch(r'[a-z][a-z0-9-]*',r['id']) or not r.get('name') or any(type(r.get(axis)) not in [int,float] or not 5<=r[axis]<=95 for axis in ['x','y']) for r in regions):raise ValueError('Invalid atlas region')
        if not re.fullmatch(r'art/worlds/[a-z0-9-]+[.](png|webp)',atlas.get('image','')):raise ValueError('Invalid atlas artwork path')
        browser['worldAtlas']=atlas
    for key,text in skin.get('browserText',{}).items():
        if key not in ['defaultName','currencyName','currencyUnit']:raise ValueError('Invalid browser text field')
        browser[key]=text[locale]
    for key,text in skin.get('terms',{}).items():browser.setdefault('terms',{})[key]=text[locale]
    for task in browser.get('legacyTasks',[]):
        if task['id'] in skin.get('taskDescriptions',{}):task['description']=skin['taskDescriptions'][task['id']][locale]
    if 'creationText' in skin:
        questions=browser['creation']['questions']
        if len(questions)!=len(skin['creationText']):raise ValueError('Creation question count changed')
        for question,text in zip(questions,skin['creationText'],strict=True):
            question['title']=text['title'][locale]
            if len(question['options'])!=len(text['options'][locale]):raise ValueError('Creation option count changed')
            for option,label in zip(question['options'],text['options'][locale],strict=True):option['text']=label
    for group in ['characters','portraits']:browser['media'][group][guide]=skin['portrait']
    for resource in ['头像.南贤','头像.'+name]:browser['media']['resources'][resource]=skin['portrait']
    # A presentation overlay of this same game keeps jyx: existing legacy rule
    # selection depends on this identity. App-level storage is separately scoped.
    if browser['id']!='jyx':raise ValueError('The source rule identity must stay jyx')
    assert_same_flow(original,package)
    return package,{'locale':locale,'sourceSha256':skin['sourceSha256'],'guideId':guide,'displayName':name,'translatedSegments':list(skin['segments'])+list(skin.get('dialogueEdits',{})),'sameGameplayFlow':True}

def compile_runtime_package(original,display,extra_labels=None):
    """Keep all rule-facing definitions exact; attach presentation separately.

    Legacy hooks compare Skill.Name and Character.Name, not just IDs. Feeding
    localized names into those definitions silently disables combinations.
    """
    runtime=copy.deepcopy(original)
    runtime['storyScripts']=copy.deepcopy(display['storyScripts'])
    runtime['browser']=copy.deepcopy(display['browser'])
    candidates={};id_candidates={};category_candidates={}
    def remember(category,id,before,after):
        fields={key:after[key] for key in ['name','description'] if key in after and before.get(key)!=after[key]}
        if after.get('picture')!=before.get('picture') and after.get('picture'):
            fields['image']=display['browser']['media']['resources'][after['picture']]
        if fields:
            prior=id_candidates.setdefault(id,{})
            scoped=category_candidates.setdefault(category,{}).setdefault(id,{})
            for key,value in fields.items():
                prior.setdefault(key,set()).add(value)
                scoped.setdefault(key,set()).add(value)
                if key=='name':prior.setdefault('sourceName',set()).add(before.get('name') or id)
                if key=='name':scoped.setdefault('sourceName',set()).add(before.get('name') or id)
                old=before.get(key,id if key=='name' else '')
                if old:candidates.setdefault(old,set()).add(value)
    for category,definitions in original.items():
        if not isinstance(definitions,list) or category in ['resources']:continue
        for before,after in zip(definitions,display[category],strict=True):
            if isinstance(before,dict) and isinstance(before.get('id'),str):
                remember(category,before['id'],before,after)
                if category=='maps':
                    for old,new in zip(before.get('locations',[]),after.get('locations',[]),strict=True):remember('locations',old['id'],old,new)
    by_id={id:{field:next(iter(values)) for field,values in fields.items() if len(values)==1} for id,fields in id_candidates.items()}
    catalog={'schemaVersion':1,'byId':by_id,'text':{source:next(iter(values)) for source,values in candidates.items() if len(values)==1}}
    catalog['byCategory']={category:{id:{field:next(iter(values)) for field,values in fields.items() if len(values)==1} for id,fields in entries.items()} for category,entries in category_candidates.items()}
    catalog['text'].update(extra_labels or {})
    runtime['browser']['displayCatalog']=catalog
    # No names, descriptions or labels ever enter the rule definitions.
    for key in original:
        if key not in ['browser','storyScripts'] and runtime[key]!=original[key]:raise ValueError('Rule package changed: '+key)
    assert_same_flow(original,{**runtime,'browser':{k:v for k,v in runtime['browser'].items() if k!='displayCatalog'}})
    return runtime

def assert_same_flow(original,adapted):
    for key in original:
        if key not in ['browser','maps','characters','storyScripts']:
            before=copy.deepcopy(original[key]);after=copy.deepcopy(adapted[key])
            if key in COPY_CATEGORIES:
                for definitions in [before,after]:
                    for definition in definitions:
                        definition.pop('name',None);definition.pop('description',None)
            if before!=after:raise ValueError('A reskin changed original gameplay definitions: '+key)
    for before,after in zip(original['characters'],adapted['characters'],strict=True):
        before=copy.deepcopy(before);after=copy.deepcopy(after)
        before.pop('name',None);after.pop('name',None)
        if before!=after:raise ValueError('A reskin changed character rules')
    def stripped(value,category=None):
        if isinstance(value,list):return [stripped(v,category) for v in value if not (isinstance(v,dict) and v.get('kind')=='dialogue')]
        if not isinstance(value,dict):return value
        result={}
        for key,item in value.items():
            if key in ['name','description','text','speaker'] and not (key=='name' and 'steps' in value):continue
            if key=='picture' and value.get('id')=='南贤':continue
            if key=='browser':continue
            if key=='call' and re.match(r"^(journal|suggest)\(",item):result[key]=item.split('(',1)[0]+'(display text)'
            else:result[key]=stripped(item,key)
        return result
    if stripped(original)!=stripped(adapted):raise ValueError('A reskin changed original gameplay data or flow')
    # Browser fields control battle rules and rewards too; compare everything
    # except the explicit presentation allowlist.
    def browser_rules(browser):
        browser=copy.deepcopy(browser)
        for key in ['title','subtitle','description','chapterTitle','contentVersion','media','defaultName','currencyName','currencyUnit','terms','chapterGuide','worldAtlas']:browser.pop(key,None)
        for objective in browser['objectives']:objective.pop('title',None)
        for task in browser.get('legacyTasks',[]):task.pop('description',None)
        for question in browser.get('creation',{}).get('questions',[]):
            question.pop('title',None)
            for option in question['options']:option.pop('text',None)
        return browser
    if browser_rules(original['browser'])!=browser_rules(adapted['browser']):raise ValueError('A reskin changed browser gameplay rules')

def build_worlds(web,manifest):
    skin=load_skin(web)
    raw=(web/'public/data/packs/jyx/content-package.json').read_bytes()
    reports=[]
    for locale in ['en','zh-CN']:
        display,report=apply_skin(raw,skin,locale);package=compile_runtime_package(json.loads(raw),display,{key:text[locale] for key,text in skin.get('uiLabels',{}).items()});reports.append(report)
        path=web/'public/data/packs/worlds'/locale/'content-package.json';path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(package,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
    (web/'public/data/packs/worlds/skin-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return package
