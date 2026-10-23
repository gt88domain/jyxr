"""Read-only companion cast inventory from the frozen runtime commands.

JOIN/FOLLOW records are not immediate recruitment predicates or playthrough
proof. Conditions and earlier branches remain in the original game package.
"""
import csv,io,json,re
from collections import defaultdict

COMMAND=re.compile(r"(join|follow)\('([^']+)'\)")

def recruitment_instructions(package):
    result=[]
    def walk(value,path,story):
        if isinstance(value,dict):
            if value.get('kind')=='command' and (m:=COMMAND.fullmatch(value.get('call',''))):
                result.append({'characterId':m[2],'kind':m[1].upper(),'storyId':story,'pointer':path})
            for key,child in value.items():walk(child,path+'/'+str(key),story)
        elif isinstance(value,list):
            for index,child in enumerate(value):walk(child,path+'/'+str(index),story)
    for file,script in package['storyScripts'].items():
        for index,segment in enumerate(script['segments']):
            walk(segment['steps'],f'/storyScripts/{file}/segments/{index}/steps',segment['name'])
    return result

def companion_inventory(package,cast,figures,skin,runtime):
    instructions=recruitment_instructions(package);by_id=defaultdict(list)
    for instruction in instructions:by_id[instruction['characterId']].append(instruction)
    expected={id for a in cast['actors'] for id in a['recruitmentDefinitionIds']}
    if set(by_id)!=expected:raise ValueError('Companion cast does not cover native JOIN/FOLLOW forms')
    figure_by_id={f['id']:f for f in figures};rows=[]
    authored=set(skin.get('segments',{}))|set(skin.get('dialogueEdits',{}))
    for actor in cast['actors']:
        forms=actor['recruitmentDefinitionIds']
        if not forms:continue
        commands=[command for id in forms for command in by_id[id]]
        names={}
        for locale,content in runtime.items():
            catalog=content['browser']['displayCatalog'];characters={c['id']:c for c in content['characters']}
            names[locale]={id:catalog.get('byCategory',{}).get('characters',{}).get(id,{}).get('name',characters[id]['name']) for id in forms}
        figure=figure_by_id[actor['figureId']]
        rows.append({'actorId':actor['actorId'],'legacyIdentity':actor['legacyIdentity'],'name':actor['name'],'status':actor['status'],
                     'country':actor['primaryCountry'],'sourceWork':figure['sourceWork'],'recognition':figure['recognition'],
                     'forms':forms,'runtimeNames':names,'displayApplied':all(name==actor['name'][locale] for locale,labels in names.items() for name in labels.values()),
                     'authoredJoinStories':sorted({c['storyId'] for c in commands if c['storyId'] in authored}),
                     'instructions':commands,'containsTestSegment':any(c['storyId'].startswith('test_') for c in commands)})
    rows.sort(key=lambda r:(r['status']!='locked',r['name']['en']))
    return {'schemaVersion':1,'sourceSha256':skin['sourceSha256'],
            'scope':'Source JOIN/FOLLOW inventory. Display names and authored join scenes do not prove a complete recruitment route or current availability.',
            'counts':{'identities':len(rows),'forms':len(by_id),'instructions':len(instructions),'fixedIdentities':sum(r['status']=='locked' for r in rows),
                      'displayAppliedIdentities':sum(r['displayApplied'] for r in rows),'authoredJoinScenes':len({id for r in rows for id in r['authoredJoinStories']})},'characters':rows}

def export_companions(folder,inventory):
    (folder/'companions.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    stream=io.StringIO(newline='');writer=csv.writer(stream)
    writer.writerow(['legacy_identity','new_name_zh_CN','new_name_en','casting_status','country','source_work','recognition','display_applied','source_forms','join_follow_story_ids','authored_join_scene_count','contains_test_segment','scope'])
    for row in inventory['characters']:
        writer.writerow([row['legacyIdentity'],row['name']['zh-CN'],row['name']['en'],row['status'],row['country'],row['sourceWork'],row['recognition'],row['displayApplied'],
                         ','.join(row['forms']),','.join(dict.fromkeys(c['storyId'] for c in row['instructions'])),len(row['authoredJoinStories']),row['containsTestSegment'],inventory['scope']])
    (folder/'companions.csv').write_text('\ufeff'+stream.getvalue(),encoding='utf8',newline='')
