"""Replace presentation fields in the real JYX package, preserving its flow."""
import copy,hashlib,json,re
from pathlib import Path

def apply_skin(raw,skin,locale):
    if locale not in ['en','zh-CN']:raise ValueError('Unsupported skin locale')
    if hashlib.sha256(raw).hexdigest()!=skin['sourceSha256']:raise ValueError('Original content fingerprint changed')
    package=json.loads(raw);original=copy.deepcopy(package);guide=skin['characterId'];name=skin['name'][locale]
    changed=[]
    def set_value(obj,key,value,path):
        if obj.get(key)!=value:obj[key]=value;changed.append(path)
    character=next(c for c in package['characters'] if c['id']==guide)
    set_value(character,'name',name,'characters/南贤/name')
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
    scripts={s['name']:s for script in package['storyScripts'].values() for s in script['segments']}
    for id,lines in skin['segments'].items():
        segment=scripts[id];dialogues=[step for step in segment['steps'] if step['kind']=='dialogue']
        if len(dialogues)!=len(lines[locale]):raise ValueError('Dialogue slot count changed: '+id)
        for step,text in zip(dialogues,lines[locale]):step['text']=text
    choice=scripts['新手村_南贤']['steps'][0]
    choice['prompt']['text']=skin['choicePrompt'][locale]
    options=choice['blocks'][0]['options']
    if len(options)!=len(skin['choices'][locale]):raise ValueError('Choice slot count changed')
    for option,text in zip(options,skin['choices'][locale]):option['text']=text
    text_command=re.compile(r"^(journal|suggest)\('([^']*)'\)$")
    def walk(value):
        if isinstance(value,dict):
            if value.get('speaker')==guide:value['speaker']=name
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
    browser['contentVersion']='grimm-in-place-1'
    for objective in browser['objectives']:
        if objective['id'] in skin['objectives']:objective['title']=skin['objectives'][objective['id']][locale]
    for group in ['characters','portraits']:browser['media'][group][guide]=skin['portrait']
    for resource in ['头像.南贤','头像.'+name]:browser['media']['resources'][resource]=skin['portrait']
    # A presentation overlay of this same game keeps jyx: existing legacy rule
    # selection depends on this identity. App-level storage is separately scoped.
    if browser['id']!='jyx':raise ValueError('The source rule identity must stay jyx')
    assert_same_flow(original,package)
    return package,{'locale':locale,'sourceSha256':skin['sourceSha256'],'guideId':guide,'displayName':name,'translatedSegments':list(skin['segments']),'sameGameplayFlow':True}

def assert_same_flow(original,adapted):
    for key in original:
        if key not in ['browser','maps','characters','storyScripts'] and original[key]!=adapted[key]:raise ValueError('A reskin changed original gameplay definitions: '+key)
    for before,after in zip(original['characters'],adapted['characters'],strict=True):
        before=copy.deepcopy(before);after=copy.deepcopy(after)
        if before['id']=='南贤':before.pop('name',None);after.pop('name',None)
        if before!=after:raise ValueError('A reskin changed character rules')
    def stripped(value,category=None):
        if isinstance(value,list):return [stripped(v,category) for v in value]
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
        for key in ['title','subtitle','description','chapterTitle','contentVersion','media']:browser.pop(key,None)
        for objective in browser['objectives']:objective.pop('title',None)
        return browser
    if browser_rules(original['browser'])!=browser_rules(adapted['browser']):raise ValueError('A reskin changed browser gameplay rules')

def build_worlds(web,manifest):
    skin=json.loads((web/'content/worlds/grimm-skin.json').read_text(encoding='utf8'))
    raw=(web/'public/data/packs/jyx/content-package.json').read_bytes()
    reports=[]
    for locale in ['en','zh-CN']:
        package,report=apply_skin(raw,skin,locale);reports.append(report)
        path=web/'public/data/packs/worlds'/locale/'content-package.json';path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(package,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
    (web/'public/data/packs/worlds/skin-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return package
