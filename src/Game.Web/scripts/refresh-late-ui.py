#!/usr/bin/env python3
"""Read pinned Unity YAML and unchanged UI textures; never run the old game.

Explicit reference refresh only. Normal frontend builds consume saved JSON.
Requires PyYAML; HTTP downloads are verified against the pinned Git blob IDs.
"""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import subprocess
import urllib.parse
import urllib.request
import yaml

PIN='4acd2c718a8afc562f0d5a0cd38464fea6699453'
REPOSITORY='UnicomGamer/X-Heroes-of-Jin-Yong'
WEB=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--reference-root',type=Path,required=True);parser.add_argument('--cache',type=Path,required=True);args=parser.parse_args()
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=args.reference_root,text=True).strip()==PIN
entries={}
for row in subprocess.check_output(['git','ls-tree','-rz',PIN],cwd=args.reference_root).split(b'\0'):
    if not row:continue
    meta,name=row.split(b'\t',1);mode,kind,sha=meta.split()
    if kind==b'blob':entries[name.decode()]=sha.decode()
args.cache.mkdir(parents=True,exist_ok=True)
sources={}
def read(path):
    sha=entries[path];cache=args.cache/sha
    raw=cache.read_bytes() if cache.exists() else None
    if raw is None:
        local=args.reference_root/path
        if local.is_file():raw=local.read_bytes()
        else:
            url='https://raw.githubusercontent.com/'+REPOSITORY+'/'+PIN+'/'+urllib.parse.quote(path)
            with urllib.request.urlopen(url,timeout=60) as response:raw=response.read()
    assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==sha,path
    cache.write_bytes(raw)
    sources[path]={'path':path,'gitBlob':sha,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
    return raw
def documents(raw):
    parts=re.split(r'^--- !u!(\d+) &(-?\d+).*\n',raw.decode('utf-8-sig'),flags=re.M)
    return {int(parts[i+1]):(int(parts[i]),next(iter(yaml.safe_load(parts[i+2]).values()))) for i in range(1,len(parts),3)}
def guid(raw):return re.search(r'^guid:\s*(\w+)',raw.decode(),re.M)[1]

# Read only standalone UI metadata, not hundreds of animation atlas frames.
textures=[p for p in entries if p.startswith('Assets/Texture2D/') and p.endswith('.png') and not re.search(r'(SpriteAtlas|icon|sfc|Map_|map_|portrait|tx_|Skill|skill|wugong|shangpin)',Path(p).name)]
sprite_paths={p:'Assets/Sprite/'+Path(p).stem+'.asset' for p in textures if 'Assets/Sprite/'+Path(p).stem+'.asset.meta' in entries}
sprite_paths['Assets/Resources/heads/zhujue2.png']='Assets/Resources/heads/zhujue2.asset'
sprite_paths['Assets/Resources/heads/zhuoyihang.png']='Assets/Resources/heads/zhuoyihang.asset'
sprite_paths['Assets/Resources/icons/icon_neigong_001.png']='Assets/Resources/icons/icon_neigong_001.asset'
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    metadata=list(pool.map(lambda pair:(guid(read(pair[1]+'.meta')),pair),sprite_paths.items()))
sprites={g:pair for g,pair in metadata};media={};unresolved=set()
def sprite(g):
    if g in media:return media[g]['path']
    if g not in sprites:unresolved.add(g);return None
    image,asset=sprites[g]
    raw=read(image);meta=read(image+'.meta');data=documents(read(asset));definition=next(n for kind,n in data.values() if kind==213)
    assert definition['m_RD']['texture']['guid']==guid(meta),image
    target='art/late-interface/'+Path(image).name
    dest=WEB/'public'/target;dest.parent.mkdir(parents=True,exist_ok=True)
    if dest.exists():assert dest.read_bytes()==raw,'Preserve existing media: '+target
    else:dest.write_bytes(raw)
    media[g]={'path':target,'source':image,'gitBlob':entries[image],'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
    return target

def scene(path,roots):
    objects=documents(read(path));rects={i:n for i,(kind,n) in objects.items() if kind==224};paths={};boxes={}
    def node_path(i):
        if i not in rects:return ''
        if i not in paths:
            n=rects[i];paths[i]=node_path(n['m_Father']['fileID'])+'/'+objects[n['m_GameObject']['fileID']][1]['m_Name']
        return paths[i]
    def box(i):
        if i in boxes:return boxes[i]
        n=rects[i];parent=n['m_Father']['fileID']
        if node_path(i).endswith('/Canvas') or parent not in rects:
            result=(0,0,1140,640)
        else:
            px,py,pw,ph=box(parent);a=n['m_AnchorMin'];b=n['m_AnchorMax'];d=n['m_SizeDelta'];p=n['m_Pivot'];v=n['m_AnchoredPosition']
            w=pw*(b['x']-a['x'])+d['x'];h=ph*(b['y']-a['y'])+d['y']
            x=px+pw*(a['x']+(b['x']-a['x'])*p['x'])+v['x']-w*p['x']
            y=py+ph*(1-a['y']-(b['y']-a['y'])*p['y'])-v['y']-h*(1-p['y'])
            result=(x,y,w,h)
        boxes[i]=result;return result
    nodes=[]
    def visit(i,visible=True):
        n=rects[i];go=objects[n['m_GameObject']['fileID']][1];p=node_path(i)
        # Hover tooltips are hidden by their runtime script; templates are not
        # live character/skill instances. Do not turn their preset data into play.
        if '_tooltip' in p.lower() or '_headtooltip' in p.lower():return
        if not visible or not go.get('m_IsActive',1):return
        for c in go.get('m_Component',[]):
            ref=c.get('component',next(iter(c.values())));component=objects.get(ref['fileID'])
            if not component or component[0]!=114:continue
            data=component[1]
            if not data.get('m_Enabled',1):continue
            rect=[round(x,4) for x in box(i)]
            if 'm_Sprite' in data:
                s=data['m_Sprite'];g=s.get('guid');image=sprite(g) if g and not g.startswith('00000000') else None
                if g and not image:continue
                nodes.append({'kind':'image' if image else 'color','path':p,'rect':rect,'image':image,'color':data.get('m_Color',{'r':1,'g':1,'b':1,'a':1})})
            text=data.get('m_Text',data.get('m_text'))
            if text is not None and str(text).strip():
                font=data.get('m_FontData',{})
                nodes.append({'kind':'text','path':p,'rect':rect,'text':str(text),'fontSize':font.get('m_FontSize',data.get('m_fontSize',20)),'alignment':font.get('m_Alignment',4),'color':data.get('m_Color',data.get('m_fontColor',{'r':1,'g':1,'b':1,'a':1}))})
        for child in n.get('m_Children',[]):
            if child['fileID'] in rects:visit(child['fileID'])
    for root in roots:
        match=[i for i in rects if node_path(i)==root];assert len(match)==1,(path,root)
        # Opening a panel activates this root, while preserving descendants.
        objects[rects[match[0]]['m_GameObject']['fileID']][1]['m_IsActive']=1
        visit(match[0])
    return {'source':path,'width':1140,'height':640,'nodes':nodes}

layouts={'map':scene('Assets/Scenes/Map.unity',['/Canvas/RoleStatePanel','/Canvas/InfoPanel','/Canvas/ButtonPanel'])}
# Use the panel embedded in Map.unity: its hierarchy is the scene's real one.
layouts['character']=scene('Assets/Scenes/Map.unity',['/Canvas/RolePanel'])
layouts['battle']=scene('Assets/Scenes/Battle.unity',['/UICanvas'])
background='Assets/Texture2D/daditu.png'
if background in sprite_paths:
    bguid=next(g for g,(image,asset) in sprites.items() if image==background);layouts['map']['background']=sprite(bguid)
battle_background='Assets/Texture2D/zhulin.png'
if battle_background in sprite_paths:
    bguid=next(g for g,(image,asset) in sprites.items() if image==battle_background);layouts['battle']['background']=sprite(bguid)
result={'schemaVersion':1,'repository':'https://github.com/'+REPOSITORY,'commit':PIN,'version':'X1.1.0.6 reverse-engineered reference','stage':{'width':1140,'height':640},'scope':'Read-only reconstruction from Unity RectTransforms and original images. Serialized sample labels are not player data; font, clipping, dynamic population, and original scripts are not emulated.','layouts':layouts,'files':sorted(media.values(),key=lambda f:f['path']),'unresolvedSpriteGuids':sorted(unresolved),'sources':[sources[k] for k in sorted(sources)],'notices':['notices/x-heroes-README.md','notices/x-heroes-License']}
for file in ['reference-materials/late-ui-layout.json','public/late-ui-layout.json']:
    (WEB/file).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
for name in ['README.md','License']:
    dest=WEB/'public/notices'/('x-heroes-'+name);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(read(name))
print(json.dumps({'layouts':{k:len(v['nodes']) for k,v in layouts.items()},'originalImages':len(media),'unresolvedSprites':len(unresolved)},ensure_ascii=False))
