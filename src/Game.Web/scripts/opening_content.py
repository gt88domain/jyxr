"""Build the standalone opening scene; shared game data is never rewritten."""
import hashlib,json,shutil

def build_opening(web,output,cast):
    chapter=json.loads((web/'content/worlds/opening.json').read_text(encoding='utf8'))
    assert chapter['kind']=='opening-preview' and chapter['primaryGuide']=='Grimm'
    guide=next(a for a in cast['actors'] if a['legacyIdentity']==chapter['guideLegacyIdentity'])
    assert guide['figureId']==chapter['guideFigureId']=='de.jacob-grimm' and guide['status']=='locked'
    chapter['guideActorId']=guide['actorId']
    for text in [chapter[key] for key in ['title','location','scene','artAlt']]+list(chapter['speakers'].values()):
        assert all(isinstance(text.get(lang),str) and text[lang].strip() for lang in ['en','zh-CN'])
    assert set(chapter['ui']['en'])==set(chapter['ui']['zh-CN'])
    reached=set()
    def walk(id,parents):
        assert id not in parents,'Opening contains a loop'
        node=chapter['nodes'][id]
        assert node['speaker'] in chapter['speakers']
        assert all(node['text'].get(lang) for lang in ['en','zh-CN'])
        reached.add(id)
        for choice in node.get('choices',[]):
            assert all(choice['text'].get(lang) for lang in ['en','zh-CN'])
            walk(choice['next'],parents|{id})
        if 'next' in node:walk(node['next'],parents|{id})
    walk(chapter['start'],set())
    assert reached==set(chapter['nodes'])
    assert all(task['node'] in reached for task in chapter['tasks'])
    art=json.loads((web/'opening/art/source.json').read_text(encoding='utf8'))
    image=web/'opening/art/grimm-study.png'
    assert image.stat().st_size==art['bytes'] and hashlib.sha256(image.read_bytes()).hexdigest()==art['sha256']
    assert chapter['art']=='art/grimm-study.png'
    (output/'art').mkdir(exist_ok=True)
    shutil.copyfile(image,output/chapter['art'])
    shutil.copyfile(web/'opening/art/source.json',output/'art/grimm-study.source.json')
    payload=json.dumps(chapter,ensure_ascii=False,separators=(',',':'))+'\n'
    (output/'data/opening.json').write_text(payload,encoding='utf8')
    version=hashlib.sha256((payload+''.join((web/'opening'/name).read_text(encoding='utf8') for name in ['opening.mjs','opening-state.mjs','opening.css'])+art['sha256']).encode()).hexdigest()[:12]
    for name in ['opening.mjs','opening-state.mjs','opening.css']:shutil.copyfile(web/'opening'/name,output/'assets'/name)
    (output/'opening').mkdir(exist_ok=True)
    (output/'opening/index.html').write_text((web/'opening/index.html').read_text(encoding='utf8').replace('{{VERSION}}',version),encoding='utf8')
    return {'id':chapter['id'],'guideActorId':chapter['guideActorId'],'version':version,'nodes':len(chapter['nodes'])}
