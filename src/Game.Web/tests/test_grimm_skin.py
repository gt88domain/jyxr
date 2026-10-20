"""Protect real-game rules while changing the guide's presentation."""
import copy,json,sys,unittest
from pathlib import Path
WEB=Path(__file__).resolve().parents[1];sys.path.insert(0,str(WEB/'scripts'))
from grimm_skin import apply_skin,assert_same_flow

class GrimmSkinTests(unittest.TestCase):
 def setUp(self):
  self.raw=(WEB/'public/data/packs/jyx/content-package.json').read_bytes()
  self.source=json.loads(self.raw);self.skin=json.loads((WEB/'content/worlds/grimm-skin.json').read_text())
 def test_both_languages_keep_same_locations_rules_and_first_battle(self):
  for locale in ['en','zh-CN']:
   game,report=apply_skin(self.raw,self.skin,locale)
   self.assertTrue(report['sameGameplayFlow']);self.assertEqual(game['battles'],self.source['battles'])
   self.assertEqual(game['items'],self.source['items']);self.assertEqual(game['externalSkills'],self.source['externalSkills'])
   self.assertEqual(game['browser']['initialMapId'],'南贤屋内');self.assertEqual(game['browser']['id'],'jyx')
   m=next(m for m in game['maps'] if m['id']=='南贤屋内');old=next(source_map for source_map in self.source['maps'] if source_map['id']==m['id'])
   self.assertEqual([l['id'] for l in m['locations']],[l['id'] for l in old['locations']])
   for a,b in zip(m['locations'],old['locations']):self.assertEqual(a.get('position'),b.get('position'));self.assertEqual(a['events'],b['events'])
   character=next(c for c in game['characters'] if c['id']=='南贤');self.assertEqual(character['name'],self.skin['name'][locale])
 def test_each_original_dialogue_slot_and_story_id_is_retained(self):
  game,_=apply_skin(self.raw,self.skin,'en')
  old=[s for f in self.source['storyScripts'].values() for s in f['segments']]
  new=[s for f in game['storyScripts'].values() for s in f['segments']]
  self.assertEqual([s['name'] for s in old],[s['name'] for s in new])
  for before,after in zip(old,new):self.assertEqual(len(before['steps']),len(after['steps']))
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
  self.skin['segments']['新手村_南贤开场']['en'].pop()
  with self.assertRaisesRegex(ValueError,'slot count'):apply_skin(self.raw,self.skin,'en')

if __name__=='__main__':unittest.main()
