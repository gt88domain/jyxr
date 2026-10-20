"""Schema and identity checks for the persisted bilingual cast proposal."""
import collections,json,re
from pathlib import Path

WEB=Path(__file__).resolve().parents[1]
DATA=WEB/'content/worlds'
def read(name):return json.loads((DATA/name).read_text(encoding='utf8'))

def validate(project,countries,figures,cast,index,locks):
 def require(condition,message):
  if not condition:raise ValueError(message)
 def localized(value,label):
  require(isinstance(value,dict),label+' must be localized')
  for lang in project['locales']:require(isinstance(value.get(lang),str) and bool(value[lang].strip()),label+' missing '+lang)
  require(not re.search(r'[\u3400-\u9fff]',value['en']),label+' English name contains untranslated Chinese')
 require(project['locales']==['zh-CN','en'] and project['defaultLocale']=='en','One bilingual project with English default is required')
 require(project['gameReady'] is False,'A cast preview cannot claim completed gameplay')
 require(project['policy']['usCoreDifficultyCeiling']=='medium','US main-story ceiling changed')
 localized(project['title'],'Project title')
 ids=[c['id'] for c in countries]
 require(len(ids)==13 and len(set(ids))==13,'Expected thirteen unique countries')
 require(set(ids)=={'ES','FR','IT','DK','US','GB','DE','RO','JP','CN','EG','GR','NO'},'Country selection changed')
 for c in countries:
  localized(c['name'],'Country '+c['id']);localized(c['theme'],'Theme '+c['id'])
  require(c['flag']==''.join(chr(0x1f1e6+ord(s)-ord('A')) for s in c['id']),'Incorrect country flag')
 require(next(c for c in countries if c['id']=='DK')['legacyStories']==['飞狐外传','雪山飞狐'],'The fox stories must share Denmark')
 require(next(c for c in countries if c['id']=='US')['coreDifficulty']=='medium','US line must stay medium')
 require(cast['baseline']==project['baseline']==index['baseline'],'Baseline drift')
 figures_by_id={f['id']:f for f in figures}
 require(len(figures_by_id)==len(figures),'Duplicate figure ID')
 for f in figures:
  require(f['country'] in ids,'Unknown figure country')
  localized(f['name'],'Figure '+f['id'])
  localized(f['sourceLabel'],'Source '+f['id'])
  require(bool(f.get('sourceWork')),'Missing figure source')
  require(f['recognition'] in ['wide','genre','regional'],'Unknown familiarity label')
 actors=cast['actors'];actor_ids=[a['actorId'] for a in actors]
 require(len(set(actor_ids))==len(actor_ids),'Duplicate actor identity')
 require(len({a['legacyIdentity'] for a in actors})==len(actors),'Duplicate legacy identity')
 definitions={d['id']:d for d in index['definitions']}
 require(len(definitions)==513 and index['sourceDisplayNames']==413,'Source inventory changed')
 covered={};used_figures={};source_to_actor={}
 for a in actors:
  localized(a['name'],'Actor '+a['actorId'])
  require(a['kind'] in ['named','archetype','system','player'],'Unknown entity kind')
  require(a['status'] in ['locked','proposed','classified'],'Unknown casting status')
  country=a['primaryCountry']
  require(country is None or country in ids,'Invalid primary country')
  require(len(a['relatedCountries'])==len(set(a['relatedCountries'])),'Duplicate related countries')
  require(set(a['relatedCountries']).issubset(ids),'Unknown related country')
  require(country is None or country in a['relatedCountries'],'Primary country omitted')
  require(a['traveler']==(a['kind']=='named' and len(a['relatedCountries'])>1),'Traveler must reflect story references, not party travel')
  if a['kind']=='named':
   f=figures_by_id.get(a['figureId']);require(f is not None,'Missing named figure')
   require(a['name']==f['name'] and country==f['country'],'Figure name or fixed home drift')
   require(f['id'] not in used_figures,'One figure assigned to unrelated legacy people')
   used_figures[f['id']]=a['actorId']
   if f['original']:require(isinstance(a.get('originalReason'),str) and len(a['originalReason'].strip())>=30,'Original name requires a documented existing-figure gap')
  else:require(a['figureId'] is None,'Generic or interface entities cannot consume named figures')
  require(bool(a['forms']),'Empty actor')
  for form in a['forms']:
   id=form['legacyId'];require(id in definitions,'Unknown original definition '+id)
   require(id not in covered,'Definition mapped twice '+id)
   require(definitions[id]['actorId']==a['actorId'],'Legacy actor index mismatch')
   require(re.fullmatch('[a-f0-9]{64}',form['definitionSha256']) is not None,'Missing source definition fingerprint')
   covered[id]=a['actorId'];source_to_actor[id]=a
  for ref in a['referenceEvidence']:
   require(ref['country'] in ids and ref['country'] in a['relatedCountries'],'Story-country evidence mismatch')
   require(len(ref['storyIds'])==len(set(ref['storyIds'])),'Duplicate source story')
 require(set(covered)==set(definitions),'Incomplete original definition coverage')
 for key,figure_id in locks.items():
  a=next((a for a in actors if a['legacyIdentity']==key),None)
  require(a and a['status']=='locked' and a['figureId']==figure_id,'Locked identity changed: '+key)
 require(set(locks)=={a['legacyIdentity'] for a in actors if a['status']=='locked'},'Missing or unexpected identity locks')
 require(len({source_to_actor[id]['actorId'] for id in ['乔峰','萧峰','天关乔峰','松鼠乔峰']})==1,'Qiao/Xiao Feng identity split')
 require(len({source_to_actor[id]['actorId'] for id in ['封不平','疯狂封不平','超级疯狂封不平','炼狱超级疯狂封不平']})==1,'Nested growth forms split')
 require(len({source_to_actor[id]['actorId'] for id in ['温方达','温方义','温方施','温方山','温方悟']})==5,'Wen brothers incorrectly merged by display name')
 require(source_to_actor['曼陀山庄神秘人']['actorId']!=source_to_actor['回纥男子刺客']['actorId'],'Unrelated masked people merged')
 require(source_to_actor['阿九']['actorId']==source_to_actor['九难']['actorId'],'The religious name must share Ah Jiu identity')
 require(len({source_to_actor[id]['actorId'] for id in ['霓裳','长安深夜神秘女子','长安深夜神秘女子2','长安深夜神秘女子3']})==1,'Revealed night visitor split into different people')
 require(set(index['recruitmentCatalog']['definitionIds']).issubset(covered),'Missing recruitment reference')
 require(set(id for a in actors for id in a['recruitmentDefinitionIds'])==set(index['recruitmentCatalog']['definitionIds']),'Recruitment index mismatch')
 summary={'sourceDefinitions':len(covered),'sourceDisplayNames':index['sourceDisplayNames'],'identityGroups':len(actors),'kinds':dict(collections.Counter(a['kind'] for a in actors)),'locked':len(locks),'proposed':sum(a['status']=='proposed' for a in actors),'recruitmentForms':index['recruitmentCatalog']['forms'],'recruitmentDisplayNames':index['recruitmentCatalog']['displayNames'],'recruitmentIdentities':sum(bool(a['recruitmentDefinitionIds']) for a in actors),'existingFigureLibrary':len(figures),'namedOriginals':sum(figures_by_id[a['figureId']]['original'] for a in actors if a['kind']=='named'),'travelers':sum(a['traveler'] for a in actors),'namedByCountry':dict(collections.Counter(a['primaryCountry'] for a in actors if a['kind']=='named'))}
 return summary

def load():
 names=['project.json','countries.json','figures.json','cast-map.json','legacy-index.json','locked-identities.json']
 return tuple(read(name) for name in names)

if __name__=='__main__':print(json.dumps(validate(*load()),ensure_ascii=False,indent=2))
