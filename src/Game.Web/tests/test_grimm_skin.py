"""Protect real-game rules while changing the guide's presentation."""
import copy,json,sys,unittest
from pathlib import Path
WEB=Path(__file__).resolve().parents[1];sys.path.insert(0,str(WEB/'scripts'))
from grimm_skin import apply_skin,assert_same_flow,compile_runtime_package,load_skin

class GrimmSkinTests(unittest.TestCase):
 def setUp(self):
  self.raw=(WEB/'public/data/packs/jyx/content-package.json').read_bytes()
  self.source=json.loads(self.raw);self.skin=load_skin(WEB)
 def test_both_languages_keep_same_locations_rules_and_first_battle(self):
  for locale in ['en','zh-CN']:
   game,report=apply_skin(self.raw,self.skin,locale)
   self.assertTrue(report['sameGameplayFlow'])
   for category in ['items','externalSkills','internalSkills','shops','battles']:
    rules=lambda definitions:[{key:value for key,value in d.items() if key not in ['name','description']} for d in definitions]
    self.assertEqual(rules(game[category]),rules(self.source[category]))
   assert_same_flow(self.source,game)
   self.assertEqual(game['browser']['initialMapId'],'南贤屋内');self.assertEqual(game['browser']['id'],'jyx')
   m=next(m for m in game['maps'] if m['id']=='南贤屋内');old=next(source_map for source_map in self.source['maps'] if source_map['id']==m['id'])
   self.assertEqual([l['id'] for l in m['locations']],[l['id'] for l in old['locations']])
   for a,b in zip(m['locations'],old['locations']):self.assertEqual(a.get('position'),b.get('position'));self.assertEqual(a['events'],b['events'])
   character=next(c for c in game['characters'] if c['id']=='南贤');self.assertEqual(character['name'],self.skin['name'][locale])
 def test_six_line_opening_retains_story_ids_and_non_dialogue_steps(self):
  game,_=apply_skin(self.raw,self.skin,'en')
  old=[s for f in self.source['storyScripts'].values() for s in f['segments']]
  new=[s for f in game['storyScripts'].values() for s in f['segments']]
  self.assertEqual([s['name'] for s in old],[s['name'] for s in new])
  for before,after in zip(old,new):
   if before['name'] not in self.skin['dialogueEdits']:self.assertEqual(len(before['steps']),len(after['steps']))
   self.assertEqual([s['kind'] for s in before['steps'] if s['kind']!='dialogue'],[s['kind'] for s in after['steps'] if s['kind']!='dialogue'])
  opening=next(s for s in new if s['name']=='新手村_南贤开场')
  self.assertEqual(sum(s['kind']=='dialogue' for s in opening['steps']),6)
  self.assertEqual(opening['steps'][-1],{'kind':'jump','target':'新手村_小村介绍'})
  self.assertEqual(next(s for s in new if s['name']=='新手村_小村介绍')['steps'][2],{'kind':'command','call':"item('内功入门', 1)"})
 def test_changed_damage_or_reward_is_rejected(self):
  game,_=apply_skin(self.raw,self.skin,'en');game['externalSkills'][0]['powerBase']=999
  with self.assertRaisesRegex(ValueError,'gameplay definitions'):assert_same_flow(self.source,game)
  game,_=apply_skin(self.raw,self.skin,'en')
  story=next(s for f in game['storyScripts'].values() for s in f['segments'] if s['name']=='新手村_小村介绍')
  next(s for s in story['steps'] if s.get('call')=="item('内功入门', 1)")['call']="item('内功入门', 99)"
  with self.assertRaisesRegex(ValueError,'flow'):assert_same_flow(self.source,game)
 def test_changed_map_position_or_story_jump_is_rejected(self):
  game,_=apply_skin(self.raw,self.skin,'en');game['maps'][0]['locations'][0]['position']['x']=99
  with self.assertRaisesRegex(ValueError,'flow'):assert_same_flow(self.source,game)
  game,_=apply_skin(self.raw,self.skin,'en')
  next(s for f in game['storyScripts'].values() for s in f['segments'] if s['name']=='新手村_南贤开场')['steps'][-1]['target']='missing'
  with self.assertRaisesRegex(ValueError,'flow'):assert_same_flow(self.source,game)
 def test_wrong_source_and_wrong_dialogue_count_fail(self):
  with self.assertRaisesRegex(ValueError,'fingerprint'):apply_skin(self.raw+b' ',self.skin,'en')
  self.skin['segments']['新手村_出生']['en'].pop()
  with self.assertRaisesRegex(ValueError,'slot count'):apply_skin(self.raw,self.skin,'en')
 def test_incomplete_dialogue_run_cannot_leave_hidden_old_lines(self):
  self.skin['dialogueEdits']['新手村_南贤开场'][0]['expectedCount']=22
  with self.assertRaisesRegex(ValueError,'run changed'):apply_skin(self.raw,self.skin,'en')
 def test_display_copy_cannot_change_prices_requirements_or_choice_targets(self):
  for field,value in [('price',99999),('requirements',[])]:
   game,_=apply_skin(self.raw,self.skin,'en')
   next(item for item in game['items'] if item['id']=='内功入门')[field]=value
   with self.assertRaisesRegex(ValueError,'gameplay definitions'):assert_same_flow(self.source,game)
  self.skin['definitions']['items']['内功入门']['price']={'en':'Free','zh-CN':'免费'}
  with self.assertRaisesRegex(ValueError,'display field'):apply_skin(self.raw,self.skin,'en')
 def test_instructor_cannot_gain_a_new_choice_or_unrelated_speaker(self):
  self.skin['choiceText']['新手村_武师选择']['options']['en'].append('Invented reward')
  with self.assertRaisesRegex(ValueError,'Choice slot'):apply_skin(self.raw,self.skin,'en')
  self.skin['choiceText']['新手村_武师选择']['options']['en'].pop()
  self.skin['dialogueEdits']['新手村_武师7'][0]['lines'][0]['speaker']='爱丽丝'
  with self.assertRaisesRegex(ValueError,'compressed dialogue'):apply_skin(self.raw,self.skin,'en')

 def test_runtime_preserves_every_rule_definition_and_name_based_combo(self):
  for locale in ['en','zh-CN']:
   display,_=apply_skin(self.raw,self.skin,locale)
   runtime=compile_runtime_package(self.source,display,self.skin.get('uiLabels',{}).get(locale,{}))
   for key,value in self.source.items():
    if key not in ['browser','storyScripts']:self.assertEqual(runtime[key],value,key)
   self.assertEqual(runtime['browser']['creation']['questions'],display['browser']['creation']['questions'])
   catalog=runtime['browser']['displayCatalog']
   skill=next(s for s in runtime['externalSkills'] if s['id']=='野球拳')
   self.assertEqual(skill['name'],'野球拳')
   talent=next(t for t in runtime['talents'] if t['id']=='屌丝')
   bonus=next(a for a in talent['affixes'] if a['type']=='source_skill_legend_chance_bonus')
   self.assertEqual(bonus['skillName'],skill['name'])
   self.assertEqual(bonus['bonus'],0.1)
   self.assertNotEqual(catalog['byId']['野球拳']['name'],skill['name'])
   self.assertEqual(next(c for c in runtime['characters'] if c['id']=='南贤')['name'],'南贤')

 def test_creation_changes_only_question_and_answer_copy(self):
  display,_=apply_skin(self.raw,self.skin,'en')
  for old,new in zip(self.source['browser']['creation']['questions'],display['browser']['creation']['questions']):
   self.assertNotEqual(old['title'],new['title'])
   self.assertEqual({k:v for k,v in old.items() if k not in ['title','options']},{k:v for k,v in new.items() if k not in ['title','options']})
   self.assertEqual(len(old['options']),len(new['options']))
   for a,b in zip(old['options'],new['options']):
    self.assertEqual({k:v for k,v in a.items() if k!='text'},{k:v for k,v in b.items() if k!='text'})

if __name__=='__main__':unittest.main()
