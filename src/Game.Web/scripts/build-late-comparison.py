#!/usr/bin/env python3
"""Generate a named, source-backed comparison without running any old code."""
import argparse
from collections import Counter
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET

WEB=Path(__file__).resolve().parents[1];REPO=WEB.parents[1]
PIN='4acd2c718a8afc562f0d5a0cd38464fea6699453'
parser=argparse.ArgumentParser();parser.add_argument('--late-root',type=Path,required=True);parser.add_argument('--remake-root',type=Path,required=True);args=parser.parse_args()
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=args.late_root,text=True).strip()==PIN
manifest=json.loads((WEB/'reference-materials/manifest.json').read_text())
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=args.remake_root,text=True).strip()==next(s['commit'] for s in manifest['sources'] if s['id']=='remake')
baseline=REPO/'jyx-legacy-data/data-origin';template=args.late_root/'gamedata/modcache/Template/Scripts';editor=args.late_root/'Assets/assetbundlesource/editor/scripts'
bundled=json.loads((WEB/'reference-materials/late-runtime.json').read_text());assert bundled['commit']==PIN
bundled_root=Path('late-bundled-data')
sources={}
def xml(path):
    if path.is_relative_to(bundled_root):
        record=bundled['files'][path.stem];sources['Assets/StreamingAssets/xml#'+path.stem]={k:record[k] for k in ['sha256','bytes']}
        return list(ET.fromstring(record['xml']))
    raw=path.read_bytes();sources[str(path.relative_to(args.late_root)) if path.is_relative_to(args.late_root) else 'jyx-legacy-data/'+str(path.relative_to(REPO/'jyx-legacy-data'))]={'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
    return list(ET.fromstring(raw))
aliases=sorted({v['baseline']:v['reference'] for d in manifest['differences']['late'].values() for v in d['spellingVariants']}.items(),key=lambda p:-len(p[0]))
def value(v):
    for a,b in aliases:v=v.replace(a,b)
    if re.fullmatch(r'-?\d+(?:\.\d+)?',v):v=str(Decimal(v).normalize())
    return v
def canon(n,unordered=False):
    children=[canon(c,unordered) for c in n]
    if unordered:children.sort(key=repr)
    return (n.tag,tuple(sorted((k,value(v)) for k,v in n.attrib.items())),(n.text or '').strip(),tuple(children))
def indexed(nodes,legend=False):
    seen=Counter();result={}
    for n in nodes:
        key=value(n.get('key') or n.get('name') or n.tag)
        if legend:key+='—'+value(n.get('start',''))
        seen[key]+=1;result[(key,seen[key])]=n
    return result
def diff_fields(a,b,path=''):
    result=[]
    for key in sorted(a.attrib.keys()|b.attrib.keys()):
        x=a.get(key);y=b.get(key)
        if (value(x) if x is not None else None)!=(value(y) if y is not None else None):result.append({'field':path+'@'+key,'baseline':x,'late':y})
    for i in range(max(len(a),len(b))):
        if i>=len(a) or i>=len(b):result.append({'field':path+f'/{i}','baseline':ET.tostring(a[i],encoding='unicode') if i<len(a) else None,'late':ET.tostring(b[i],encoding='unicode') if i<len(b) else None})
        else:result.extend(diff_fields(a[i],b[i],path+f'/{a[i].tag}[{i+1}]/'))
        if len(result)>6:break
    for field in result:
        for key in ['baseline','late']:
            if isinstance(field[key],str) and len(field[key])>300:field[key]=field[key][:300]+'…（完整内容见固定源文件）'
    return result[:6]
categories=[]
for stem,title in [('roles','人物'),('skills','外功'),('internal_skills','内功'),('special_skills','特技'),('aoyis','奥义记录'),('items','道具'),('maps','地图'),('battles','战斗配置'),('storys','主剧情表')]:
    a=xml(baseline/(stem+'.xml'));ai=indexed(a,stem=='aoyis');comparisons={}
    for label,folder in [('bundle',bundled_root),('template',template),('editor',editor)]:
        b=xml(folder/(stem+'.xml'));bi=indexed(b,stem=='aoyis')
        changed=[]
        for key,n in ai.items():
            if key not in bi or canon(n)==canon(bi[key]):continue
            changed.append({'id':key[0],'occurrence':key[1],'childOrderOnly':canon(n,True)==canon(bi[key],True),'fields':diff_fields(n,bi[key])})
        comparisons[label]={'records':len(b),'added':[k[0] for k in bi if k not in ai],'absent':[k[0] for k in ai if k not in bi],'changed':changed,'orderOnlyCount':sum(c['childOrderOnly'] for c in changed)}
    categories.append({'id':stem,'name':title,'baselineRecords':len(a),'references':comparisons})

runtime=json.loads((WEB/'public/data/content-package.json').read_text());checklist=json.loads((WEB/'public/data/restoration-checklist.json').read_text())
names=['伤口撕裂','御剑','情花奇毒','摧筋破骨','软猬宝甲'];talents=[]
code_hits=subprocess.run(['git','grep','-n',*[arg for name in names for arg in ['-e',name]],PIN,'--','*.cs','*.lua'],cwd=args.late_root,capture_output=True,text=True)
assert code_hits.returncode in [0,1],code_hits.stderr
for name in names:
    metadata=next(t for t in runtime['talents'] if t['id']==name)
    grants=[]
    for stem in ['roles','skills','internal_skills','special_skills','items','aoyis','storys','storysCG','storysPY','maps']:
        for node in xml(bundled_root/(stem+'.xml')):
            for leaf in node.iter():
                # Only exact token references; descriptions and dialogue are not grants.
                refs=[v for k,v in leaf.attrib.items() if k in ['talent','argvs'] and name in re.split('[#,]',v)]
                if refs:grants.append({'source':'Assets/StreamingAssets/xml#'+stem,'owner':node.get('key') or node.get('name'),'node':leaf.tag,'attributes':leaf.attrib})
    remake=[]
    for relative in ['gameDebug/src/modInterfaceLua/BattleSpriteExtend.lua','gameDebug/src/resScripts/time1/resource.lua']:
        path=args.remake_root/relative;text=path.read_text(encoding='utf-8-sig');lines=text.splitlines()
        for i,line in enumerate(lines):
            if name in line:remake.append({'source':relative,'line':i+1,'text':'\n'.join(lines[max(0,i-1):i+5])})
    hits=[line for line in code_hits.stdout.splitlines() if name in line]
    talents.append({'id':name,'description':metadata['description'],'points':metadata.get('point',0),'lateGrantReferences':grants,'lateExecutionStringHits':hits,'remakeEvidence':remake,'status':'有授予引用，未定位原版执行代码' if grants and not hits else '仅说明，未定位原版授予或执行代码' if not grants and not hits else '需人工核对执行引用'})

groups=[g for g in checklist['groups'] if g['id'].startswith('talents-partial') or g['id'].startswith('talents-referenced')]
legends=[]
for n in runtime['legendSkills']:
    issue=''
    if n['name']=='太玄神功奥义式':issue='起手写作太玄神功；当前可选派生招式为太玄神功.太玄真气，原名不匹配。'
    if n['name']=='万劫闪电貂':issue='要求特技闪电貂；固定后期AoyiLogic只识别外功、内功和天赋条件。'
    legends.append({k:n.get(k) for k in ['id','name','startSkill','requiredLevel','probability','conditions','powerExtra','buffs']}|{'knownIssue':issue,'verification':'触发数据已对照，完整效果与组合未逐条验收'})
maps=xml(bundled_root/'maps.xml');round_events=[]
for m in maps:
    for location in m:
        for event in location:
            conditions=[dict(c.attrib) for c in event if c.tag=='condition' and any(x in c.get('type','').lower() for x in ['round','zhoumu'])]
            if conditions:round_events.append({'map':m.get('name'),'location':location.get('name'),'action':event.get('type'),'target':event.get('value'),'conditions':conditions})
bonus=manifest['lateBonusCompanions']
rounds=[{'round':r,'enemyAttackMultiplier':round(1+.1*(r-1),2),'enemyDefenceMultiplier':round(1+.08*(r-1),2),'skillCapBonus':r//2,'npcSkillBonus':r//2,'hpMpCap':10000+1000*(r-1),'chestCapacity':8+6*r,'bonusPoolCount':{1:0,2:17,3:10,4:7}.get(r,9)} for r in [1,2,3,4,5,6]]
round_notes=[
 {'title':'同一江湖重开','late':'下一周目Round加1，再清空本轮队伍、随行、行囊和剧情变量，回到人物生成；仓库与无悔标记保留。','current':'已接入重开/下一周目服务；不会保留上一轮整支队伍与身上装备。','source':'RuntimeData.cs:801; GameEngine.cs:335; Game.Application/SessionFlowService.cs'},
 {'title':'开局伙伴','late':'第一周目无赠送；二/三/四/五及以上周目从17/10/7/9人池抽一人，首候选双份权重。','current':'43个候选已经接入，不是每周目新增43人。','source':'RollRoleUI.cs:650-712; rollrole.lua.lua:35-44'},
 {'title':'武学与敌人','late':'技能上限/NPC技能按周目整除2增长；攻击与防御每后续周目按原系数递增，珍珑特殊处理。','current':'已有相应服务与默认配置；整场组合顺序和所有特殊战斗仍待核对。','source':'Role.cs:890; AttackLogic.cs:1425; main.lua.lua:50-66'},
 {'title':'血内上限与仓库','late':'上限10000+(周目-1)×1000；箱子容量8+周目×6。','current':'已由当前会话与周目规则计算。','source':'CommonSettings.cs:259; main.lua.lua:92-102'},
 {'title':'难度选择限制','late':'简单仅第一周目可选；无悔第一周目进入后，后续周目锁无悔。','current':'网页仍提供普通/困难/炼狱，尚未复原后期的这些选项限制与无悔实时存档。','source':'rollrole.lua.lua:55-69; src/Game.Web/src/main.ts'},
 {'title':'试炼奖励衔接疑点','late':'NextZhoumuClear保存trialRoles到局部变量，但Clear后没有写回；试炼计数与奖励衔接存在源码疑点。','current':'当前明确保存上一轮试炼人数用于开局奖励；不能称与该固定后期片段完全相同。','source':'RuntimeData.cs:809-817; SessionFlowService.cs:49-59'},
 {'title':'NPC血内比例','late':'配置声明每周目+15%HP/MP；全仓库源码仅找到配置和CommonSettings取值属性，未定位实际消费调用。','current':'现代工厂有实际HP/MP周目倍率；后期真实调用边界继续查证，不能只凭配置宣布等价。','source':'main.lua.lua:57-60; CommonSettings.cs:191-203; ProceduralBattleCharacterFactory.cs:155-182'},
]
power_differences=[]
for index,(a,b) in enumerate(zip(xml(baseline/'aoyis.xml'),xml(bundled_root/'aoyis.xml'))):
    assert value(a.get('name',''))==value(b.get('name','')) and value(a.get('start',''))==value(b.get('start','')),'Do not pair different legend variants by index'
    if Decimal(a.get('addPower','0'))!=Decimal(b.get('addPower','0')):power_differences.append({'name':a.get('name'),'start':a.get('start'),'occurrence':index+1,'baselineExtra':a.get('addPower','0'),'bundleExtra':b.get('addPower','0')})
result={'schemaVersion':1,'target':'X1.1.0.6','repository':'https://github.com/UnicomGamer/X-Heroes-of-Jin-Yong','commit':PIN,'scope':'Pinned reverse-engineered source, bundled/editor/template XML, compared with current HTML5 migration baseline. Bundled data is not independently verified against an official distributed executable. No original execution or campaign test.','comparisonRules':'统一已知异名、数字写法与属性顺序；保留子节点和重复奥义顺序。changed是记录结构差异，不等于新增玩法；仅子项排序的差异单列。','categories':categories,'talents':talents,'partialTalentGroups':groups,'legends':legends,'legendPowerDifferences':power_differences,'rounds':rounds,'roundNotes':round_notes,'roundEvents':round_events,'bonusCompanions':bonus,'sources':sources,'bundleSource':bundled['bundle'],'uiReference':'late-ui-layout.json','detailsFile':'late-version-details.json'}
for relative in ['reference-materials/late-version-comparison.json','public/late-version-details.json']:(WEB/relative).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
summary=json.loads(json.dumps(result))
for category in summary['categories']:
    for reference in category['references'].values():
        changes=reference.pop('changed');reference['changedCount']=len(changes);reference['changedSamples']=[c for c in changes if not c['childOrderOnly']][:8]
(WEB/'public/late-version-comparison.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'target':result['target'],'legends':len(legends),'namedTalentQuestions':len(talents),'roundEvents':len(round_events),'comparisons':{c['id']:{k:{'records':v['records'],'changed':len(v['changed']),'orderOnly':v['orderOnlyCount']} for k,v in c['references'].items()} for c in categories}},ensure_ascii=False))
