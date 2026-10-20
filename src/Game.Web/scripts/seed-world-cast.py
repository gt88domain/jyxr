#!/usr/bin/env python3
"""One-time editorial draft. Persist output; never run it as a game build step."""
import argparse,collections,csv,hashlib,json,re,unicodedata
from pathlib import Path

WEB=Path(__file__).resolve().parents[1]
DATA=WEB/'content/worlds'
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--companions',type=Path,required=True)
parser.add_argument('--write',action='store_true')
args=parser.parse_args()
project=json.loads((DATA/'project.json').read_text())
raw=args.source.read_bytes()
if hashlib.sha256(raw).hexdigest()!=project['baseline']['contentSha256']:raise SystemExit('Frozen source fingerprint mismatch')
pack=json.loads(raw)
definitions=pack['characters'];by_id={c['id']:c for c in definitions}
catalog=json.loads(args.companions.read_text())
countries=json.loads((DATA/'countries.json').read_text());country_ids={c['id'] for c in countries}

def slug(text):
 return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',text).encode('ascii','ignore').decode().lower()).strip('-')
figures=[]
source_labels=json.loads((DATA/'source-labels.json').read_text())
for r in csv.DictReader((DATA/'figures.tsv').open(encoding='utf8'),delimiter='|'):
 figures.append({'id':r['country'].lower()+'.'+slug(r['en']),'country':r['country'],'name':{'zh-CN':r['zh-CN'],'en':r['en']},'sourceWork':r['work'],'sourceType':'existing-figure','gender':r['gender'],'roles':r['roles'].split(),'recognition':r['recognition'],'original':False})
 figures[-1]['sourceLabel']={'zh-CN':source_labels[r['work']],'en':r['work']}
assert len({f['id'] for f in figures})==len(figures)
figure_by_en={f['name']['en']:f for f in figures}

# These IDs identify one actual legacy person, not merely equal display names.
aliases={'萧峰':'乔峰','神秘萧远山':'萧远山','神秘慕容博':'慕容博','神秘胡一刀':'胡一刀','受重伤的东方不败':'东方不败','温青':'温青青','木婉清(蒙面)':'木婉清','木婉清.蒙面':'木婉清','程英.初级':'程英','程英.高级':'程英','血刀老祖2':'血刀老祖','血刀老祖3':'血刀老祖','黄衫女子强化':'黄衫女子','黄衫女子再强化':'黄衫女子','金轮法王强化':'金轮法王','长安深夜神秘女子2':'长安深夜神秘女子','长安深夜神秘女子3':'长安深夜神秘女子','神林平之':'林平之'}
prefixes=['黑木崖超级','左右互搏','炼狱','松鼠','华山','天关','变身','神级','超级','不败','疯狂','阉割','变态','儿时','发狂','新手村','忘情']
aliases.update({'九难':'阿九','长安深夜神秘女子':'霓裳'})
def canonical(c):
 if c['name']=='小虾米':return '主角'
 id=c['id']
 while True:
  if id in aliases:
   next_id=aliases[id]
  else:next_id=next((id[len(pre):] for pre in prefixes if id.startswith(pre) and id[len(pre):] in by_id),id)
  if next_id==id:return id
  id=next_id
groups=collections.defaultdict(list)
for c in definitions:groups[canonical(c)].append(c)
definition_to_actor={c['id']:key for key,forms in groups.items() for c in forms}

def story_country(name):
 for prefixes,country in [(['白马啸西风'],'ES'),(['书剑恩仇录'],'FR'),(['鸳鸯刀'],'IT'),(['雪山飞狐','飞狐外传','苗人凤居.'],'DK'),(['鹿鼎记'],'US'),(['sdxl_','original_女主.神雕侠侣','门派古墓','门派大轮寺'],'GB'),(['射雕英雄传','全真教','original_女主.射雕英雄传'],'DE'),(['连城诀','血刀门'],'RO'),(['笑傲江湖','笑傲邪'],'JP'),(['倚天屠龙','倚天邪线','yttlj_','武当派','破庙'],'CN'),(['碧血剑','bixuejianShyou'],'EG'),(['侠客行'],'GR'),(['tlbb.','灵鹫宫','门派灵鹫宫','星宿派','门派星宿','original_女主.天龙八部'],'NO')]:
  if any(name.startswith(p) for p in prefixes):return country
 for token,country in [('长安一梦','ES'),('回纥男子','ES'),('山庄风云','RO'),('长安深夜怪事','DE')]:
  if token in name:return country
 return None
references=collections.defaultdict(lambda:collections.defaultdict(lambda:{'stories':set(),'kinds':collections.Counter()}))
def note(id,country,story,kind):
 actor=definition_to_actor.get(id)
 if actor and country:
  v=references[actor][country];v['stories'].add(story);v['kinds'][kind]+=1
def walk(x):
 if isinstance(x,dict):
  yield x
  for v in x.values():yield from walk(v)
 elif isinstance(x,list):
  for v in x:yield from walk(v)
battles={b['id']:b for b in pack['battles']}
for script in pack['storyScripts'].values():
 for story in script['segments']:
  country=story_country(story['name'])
  if not country:continue
  for step in walk(story):
   if step.get('kind')=='dialogue':note(step.get('speaker'),country,story['name'],'speaker')
   if step.get('kind')=='command':
    for id in re.findall("'([^']+)'",step.get('call','')):note(id,country,story['name'],'command-reference')
   if step.get('kind')=='battle':
    for unit in battles[step['battleId']]['participants']:note(unit.get('characterId'),country,story['name'],'battle-definition')

system_names={'旁白','旁白君','箱子','石壁','九尊殿','九宫阁','九华阁','灵鹫宫后山树林','江城快报','返回','藏经阁','佛像','向前走','向左走','向右走','支付宝二维码','cg','home','御虚阁','烧香坊','静念楼','汉家松鼠'}
system_translations={'旁白':'Narrator','旁白君':'Narrator voice','箱子':'Chest','石壁':'Inscribed wall','九尊殿':'Hall entrance','九宫阁':'Pavilion entrance','九华阁':'Upper pavilion','灵鹫宫后山树林':'Rear forest','江城快报':'News board','返回':'Return','藏经阁':'Library entrance','佛像':'Statue','向前走':'Move forward','向左走':'Move left','向右走':'Move right','支付宝二维码':'Archived payment marker','cg':'Cinematic marker','home':'Home marker','御虚阁':'Inner pavilion','烧香坊':'Incense hall','静念楼':'Quiet hall','汉家松鼠':'Original creator credit'}
template_rules=[
 ('弟子|明教徒|伙夫|和尚|禅师|首座|高手|剑宗弟子|首座', 'guild-member','组织成员','Guild member','fighter'),
 ('杀手|刺客|蒙面黑衣人|东厂杀手','assassin','蒙面刺客','Masked assassin','fighter'),
 ('火枪兵|精兵铁卫|近卫|士兵|司马|太监','guard','城堡卫兵','Castle guard','fighter'),
 ('小混混|恶棍|马贼|山贼|部落众|商家堡成员','outlaw','荒野匪徒','Outlaw','fighter'),
 ('猴子|大蛇','wild-beast','野兽','Wild beast','beast'),
 ('民女|女子|西夏女子|小孩|路人甲|牧民|男子|农夫|菜农|小贩|侍从|车夫|商人|酒楼老板|部落长老|江湖豪客|长安官员|陌生男子|武师|黑老大|船老大|镖局老大','townsperson','当地居民','Town resident','civilian'),
]
# The mask is intentional: these source IDs are unrelated people despite sharing a display name.
named_exceptions={'李白','文艺吕布','长安深夜神秘女子','霓裳','山庄风云神秘人','神秘人','回纥男子花市刺客','回纥男子刺客','曼陀山庄神秘人','神秘剑客','神秘伍长','神秘刺史','神秘使者','魔君','黑影','另一名黑衣人','黑衣人'}
def kind(key,forms):
 if key=='主角':return 'player',None
 if forms[0]['name'] in system_names:return 'system',None
 if key not in named_exceptions:
  for pattern,typ,zh,en,role in template_rules:
   if re.search(pattern,forms[0]['name']):return 'archetype',{'id':typ,'name':{'zh-CN':zh,'en':en},'role':role}
 return 'named',None

locked={
 '南贤':'Jacob Grimm','北丑':'Wilhelm Grimm','令狐冲':'Miyamoto Musashi','狄云':'Dracula','石破天':'Heracles','乔峰':'Thor','张无忌':'Nezha','袁承志':'Horus','杨过':'King Arthur','小龙女':'The Lady of the Lake','郭襄':'Alice','郭靖':'The Huntsman','黄蓉':'Snow White','陈家洛':"D'Artagnan",'李文秀':'Dulcinea','陈达海':'Don Quixote','袁冠南':'Pinocchio','胡斐':'Kai','程灵素':'Gerda',
 '韦小宝':'The Scarecrow','阿珂':'Dorothy Gale','苏荃':'Glinda','鳌拜':'The Tin Woodman','康熙':'The Wizard of Oz','陈近南':'The Cowardly Lion',
}
curated={
 '孔八拉':'Hephaestus','田伯光':'Ishikawa Goemon','小昭':'Xiaoqing','周芷若':'Bai Suzhen','赵敏':'Hua Mulan','段誉':'Loki','虚竹':'Odin','王语嫣':'Idunn','钟灵':'Eir','阿朱':'Sif','阿碧':'Nanna','阿紫':'Hel','段正淳':'Njord','段正明':'Tyr','慕容复':'Baldr','慕容博':'Borr','萧远山':'Buri','无崖子':'Mimir','逍遥子':'Ymir','李秋水':'Freyja','天山童姥':'Skadi','庄聚贤':'Sigmund',
 '程英':'Guinevere','郭芙':'Wendy Darling','神雕':'The Griffin','李莫愁':'Morgan le Fay','公孙谷主':'Mordred','林朝英':'The Queen of Snow White','黄衫女子':'Persephone','杨冰儿':'Tinker Bell',
 '苗人凤':'Holger Danske','胡一刀':'The Steadfast Tin Soldier','田青文':'The Snow Queen','苗若兰':'Thumbelina','田归农':'The Mirror Troll','商宝震':'Clod Hans','商老太':'The Sea Witch','商剑鸣':'The Emperor of the New Clothes','阎基':'Ole Lukoie','毒手药王':'Hans Christian Andersen','宝树':'The Chimney Sweep',
 '柳燕':'Jellia Jamb','太后':'The Wicked Witch of the West','毛东珠':'Mombi','胖头陀':'The Shaggy Man','瘦头陀':'Tik-Tok','洪教主':'The Nome King','陈圆圆':'Betsy Bobbin','李自成':'Captain Ahab','吴三桂':'The Headless Horseman','郑克爽':'Button-Bright','冯锡范':'General Guph',
 '风清扬':'Tsukahara Bokuden','独孤求败':'Ito Ittosai','岳不群':'Yagyu Munenori','东方不败':'Sasaki Kojiro','任盈盈':'Tomoe Gozen','任我行':'Oda Nobunaga','向问天':'Honda Tadakatsu','上官云':'Maeda Toshiie','左冷禅':'Tokugawa Ieyasu','岳灵珊':'Princess Kaguya','林平之':'Minamoto Yoshitsune','封不平':'Yagyu Jubei','曲非烟':'Izumo no Okuni','蓝凤凰':'Circe','平一指':'Hippocrates',
 '黄药师':'Faust','洪七公':'Siegfried','欧阳锋':'Mephistopheles','一灯大师':'Drosselmeyer','周伯通':'The Nutcracker Prince','王重阳':'Iron John','梅超风':'Rapunzel','瑛姑':'Brunhild','黄裳':'The Pied Piper',
 '水笙':'Mina Harker','血刀老祖':'Abraham Van Helsing','梅念笙':'Jonathan Harker','狮吼子':'Renfield',
 '张三丰':'Taiyi Zhenren','灭绝师太':'Guanyin','成昆':'Shen Gongbao','紫衫龙王':'Princess Iron Fan','殷天正':'Li Jing','谢逊':'The Bull Demon King','韦一笑':'Lei Zhenzi','杨逍':'Erlang Shen','范遥':'Jiang Ziya','渡厄':'Golden Horn','渡劫':'Silver Horn','渡难':'Zhenyuan Daxian',
 '温青青':'Isis','阿九':'Cleopatra','金蛇郎君':'Osiris','穆人清':'Thoth','木桑道长':'Imhotep','何红药':'Nephthys','黄真':'Anubis','归辛树':'Sobek','归二娘':'Sekhmet','玉真子':'Set','崇祯皇帝':'Ramesses II','安小慧':'Hathor','孙仲寿':'Ptah',
 '霍青桐':'Milady de Winter','张召重':'Rochefort','萧中慧':'The Blue Fairy','烟霞神龙':'The Talking Cricket','双手开碑':'Mangiafuoco','流星赶月':'Lampwick','盖七省':'The Fox','卓天雄':'Orlando',
 '石清':'Zeus','石中玉':'Hermes','龙岛主':'Poseidon','木岛主':'Hades','白自在':'Ares','谢烟客':'Chiron','张三':'Prometheus','李四':'Epimetheus','阿青':'Athena','李白':'Li Bai','文艺吕布':'Lu Bu',
 '神秘剑客':'Zorro','神秘使者':'Professor Moriarty','神秘伍长':'The White Knight','神秘刺史':'Sir Kay','魔君':'Surtr',
}
assert set(locked).issubset(groups),set(locked)-set(groups)
assert set(curated).issubset(groups),set(curated)-set(groups)
reserved={v for v in [*locked.values(),*curated.values()]}
assert len(reserved)==len(locked)+len(curated),'A named figure cannot stand for two unrelated people'
used=set();assignments={};review=[]
def choose_country(key):
 refs=references[key]
 if refs:return max(sorted(refs),key=lambda country:len(refs[country]['stories']))
 if re.search('少林|和尚|方丈|玄慈|玄难|玄寂|枯荣|天龙|丐帮|苏星河',key):return 'NO'
 if re.search('武当|昆仑|朱元璋|常遇春|徐达|康茂才|彭和尚|宋青书',key):return 'CN'
 if re.search('五毒|石梁|温方|温正|温青|崔秋山|哑仆|太监',key):return 'EG'
 if re.search('华山|嵩山|青城|曲非烟|陆猴儿|梁发|莫大|费彬|鲁连荣|天乙真人|仪清|秦婆婆',key):return 'JP'
 return 'GB'
def tags_for(key,forms):
 tags={'fighter'}
 skills=' '.join(s['id'] for f in forms for s in f.get('externalSkills',[]))
 if '剑' in skills or '刀' in skills:tags.add('swordsman')
 if re.search('药|医|毒|生|素',key):tags.add('healer')
 if re.search('师|老|父|长|师太|公|道长|先生',key):tags.add('mentor')
 if re.search('王|主|皇|帝|掌门',key):tags.add('ruler')
 if re.search('猴|蛇|雕',key):tags.add('beast')
 if re.search('商|贩|老板',key):tags.add('merchant')
 return tags
requirements=collections.Counter()
for key,forms in groups.items():
 if kind(key,forms)[0]=='named':
  target=locked.get(key) or curated.get(key)
  requirements[figure_by_en[target]['country'] if target else choose_country(key)]+=1
print('Named-figure demand:',dict(requirements))
print('Existing-figure supply:',dict(collections.Counter(f['country'] for f in figures)))
for key in sorted(groups,key=lambda k:(k not in locked,k not in curated,k)):
 forms=groups[key];entity,archetype=kind(key,forms);preferred=choose_country(key)
 base=next((c for c in forms if c['id']==key),forms[0]);gender=base.get('gender','other')
 target=locked.get(key) or curated.get(key)
 if entity=='named':
  if target:
   figure=figure_by_en[target]
  else:
   pool=[f for f in figures if f['country']==preferred and f['id'] not in used and f['name']['en'] not in reserved]
   if not pool:raise SystemExit(f'Need suitable existing figures for {preferred}: {key}')
   tags=tags_for(key,forms)
   def score(f):return (8*(f['gender']==gender)+4*len(tags&set(f['roles']))+{'wide':3,'genre':2,'regional':1}[f['recognition']])
   figure=max(pool,key=score)
  if figure['id'] in used:raise SystemExit('Duplicate named identity: '+figure['id'])
  used.add(figure['id']);country=figure['country'];name=figure['name'];figure_id=figure['id']
 elif entity=='player':
  country=None;name={'zh-CN':'玩家角色','en':'Player character'};figure_id=None
 elif entity=='system':
  country=None;name={'zh-CN':base['name'],'en':system_translations[base['name']]};figure_id=None
 else:
  country=preferred;name=archetype['name'];figure_id=None
 related=set(references[key]);related.update([country] if country else [])
 flags=[]
 if entity=='named' and figure['gender']!=gender:flags.append('presentation-and-relationship-review')
 if entity=='named' and figure['recognition']=='regional':flags.append('regional-familiarity-review')
 if key=='温青' or any(f['id']!=f['name'] for f in forms):flags.append('legacy-form-label-review')
 status='locked' if key in locked else 'proposed' if entity=='named' else 'classified'
 if status=='proposed':flags.append('story-role-review')
 assignments[key]={'actorId':'actor-'+hashlib.sha256(key.encode()).hexdigest()[:12],'legacyIdentity':key,'legacyNames':sorted({f['name'] for f in forms}),'kind':entity,'status':status,'figureId':figure_id,'name':name,'primaryCountry':country,'relatedCountries':sorted(related),'traveler':entity=='named' and len(related)>1,'reviewFlags':flags,'selectionReason':'fixed-core-identity' if key in locked else 'curated-existing-figure' if target else 'existing-figure-candidate' if entity=='named' else 'non-character-label' if entity=='system' else 'player-customization' if entity=='player' else 'shared-archetype','originalReason':None,'forms':[{'legacyId':f['id'],'legacyName':f['name'],'gender':f.get('gender'),'level':f['level'],'skills':[s['id'] for s in f.get('externalSkills',[])],'talents':f.get('talentIds',[]),'definitionSha256':hashlib.sha256(json.dumps(f,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()} for f in forms],'referenceEvidence':[{'country':co,'kinds':dict(v['kinds']),'storyIds':sorted(v['stories'])} for co,v in sorted(references[key].items())],'recruitmentDefinitionIds':[c['id'] for c in forms if any(x['id']==c['id'] for x in catalog['characters'])]}

output={'schemaVersion':1,'baseline':project['baseline'],'policy':'Named figures are existing-source candidates first; no original named fallback. Proposed mappings need editorial review. Generic roles and non-character labels are separate. Internal game definitions and conditions remain unchanged.','actors':list(assignments.values())}
index={'schemaVersion':1,'baseline':project['baseline'],'definitions':[{'id':c['id'],'name':c['name'],'actorId':assignments[canonical(c)]['actorId']} for c in definitions],'recruitmentCatalog':{'forms':len(catalog['characters']),'displayNames':len({c['name'] for c in catalog['characters']}),'definitionIds':[c['id'] for c in catalog['characters']]},'sourceDisplayNames':len({c['name'] for c in definitions})}
if args.write:
 locks={a['legacyIdentity']:a['figureId'] for a in assignments.values() if a['status']=='locked'}
 lockfile=DATA/'locked-identities.json'
 if lockfile.exists() and json.loads(lockfile.read_text())!=locks:raise SystemExit('Core identities are locked; review a deliberate mapping migration first')
 if not lockfile.exists():lockfile.write_text(json.dumps(locks,ensure_ascii=False,indent=2)+'\n')
 for name,value in [('figures.json',figures),('cast-map.json',output),('legacy-index.json',index)]:
  (DATA/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sourceDefinitions':len(definitions),'sourceDisplayNames':index['sourceDisplayNames'],'identityGroups':len(groups),'kinds':dict(collections.Counter(a['kind'] for a in assignments.values())),'locked':sum(a['status']=='locked' for a in assignments.values()),'existingFigureCandidates':len(figures),'namedOriginalFallbacks':0,'countryCounts':dict(collections.Counter(a['primaryCountry'] for a in assignments.values()))},ensure_ascii=False,indent=2))
