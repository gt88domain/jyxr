"""Recruitment reskin coverage and native condition invariants, not a playthrough."""
import copy,json,sys,unittest
from pathlib import Path

WEB=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(WEB/'scripts'))
from grimm_skin import apply_skin,assert_same_flow,compile_runtime_package,load_skin
from world_cast import load
from world_companions import companion_inventory,recruitment_instructions

class CompanionReskinTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.raw=(WEB/'public/data/packs/jyx/content-package.json').read_bytes()
  cls.source=json.loads(cls.raw);cls.skin=load_skin(WEB)
  _,_,cls.figures,cls.cast,_,_,_=load()
  cls.display={locale:apply_skin(cls.raw,cls.skin,locale)[0] for locale in ['en','zh-CN']}
  cls.runtime={locale:compile_runtime_package(cls.source,pkg,{key:text[locale] for key,text in cls.skin.get('uiLabels',{}).items()}) for locale,pkg in cls.display.items()}

 def test_inventory_distinguishes_identity_form_display_and_debug_records(self):
  inventory=companion_inventory(self.source,self.cast,self.figures,self.skin,self.runtime)
  self.assertEqual(inventory['counts'],{'identities':62,'forms':65,'instructions':80,'fixedIdentities':20,'displayAppliedIdentities':34,'authoredJoinScenes':26})
  hatter=next(a for a in inventory['characters'] if a['legacyIdentity']=='达尔巴')
  self.assertTrue(hatter['displayApplied'])
  for actor in inventory['characters']:
   if actor['status']=='locked':self.assertTrue(actor['displayApplied'],actor['legacyIdentity'])
   self.assertEqual(actor['containsTestSegment'],any(c['storyId'].startswith('test_') for c in actor['instructions']))
  self.assertIn('do not prove',inventory['scope'])
  self.assertTrue(any(a['containsTestSegment'] for a in inventory['characters']))

 def test_recruitment_and_all_native_definitions_are_identical_in_both_languages(self):
  for locale,runtime in self.runtime.items():
   for key,value in self.source.items():
    if key not in ['browser','storyScripts']:self.assertEqual(value,runtime[key],(locale,key))
   for key in ['companionConditions','companionRecruitmentStories']:
    self.assertEqual(runtime['browser'][key],self.source['browser'][key],(locale,key))
   # Dialogue lengths can change, so compare commands and enclosing story IDs.
   project=lambda p:[(c['characterId'],c['kind'],c['storyId']) for c in recruitment_instructions(p)]
   self.assertEqual(project(runtime),project(self.source))
   assert_same_flow(self.source,self.display[locale])

 def test_flow_guard_rejects_changed_recruitment_command_and_morality_gate(self):
  game=copy.deepcopy(self.display['en'])
  segment=next(s for f in game['storyScripts'].values() for s in f['segments'] if s['name']=='笑傲江湖_令狐冲加入')
  next(s for s in segment['steps'] if s['kind']=='command')['call']="join('乔峰')"
  with self.assertRaises(ValueError):assert_same_flow(self.source,game)
  game=copy.deepcopy(self.display['en'])
  def gates(value):
   if isinstance(value,dict):
    for key,child in value.items():
     if isinstance(child,str) and 'morality' in child and ('35' in child or '65' in child):yield value,key
     else:yield from gates(child)
   elif isinstance(value,list):
    for child in value:yield from gates(child)
  owner,key=next(gates(game))
  owner[key]='true'
  with self.assertRaises(ValueError):assert_same_flow(self.source,game)

 def test_no_dialogue_or_join_is_invented_for_command_only_or_debug_segments(self):
  chapter=json.loads((WEB/'content/worlds/chapter-companions.json').read_text())
  self.assertEqual(len(chapter['dialogueEdits']),24)
  self.assertFalse(any(id.startswith('test_') for id in chapter['dialogueEdits']))
  source={s['name']:s for f in self.source['storyScripts'].values() for s in f['segments']}
  new={s['name']:s for f in self.display['en']['storyScripts'].values() for s in f['segments']}
  command_only_joins={c['storyId'] for c in recruitment_instructions(self.source) if not any(s['kind']=='dialogue' for s in source[c['storyId']]['steps'])}
  self.assertTrue(command_only_joins)
  for id in command_only_joins|{'test_是'}:self.assertEqual(new[id],source[id],id)

 def test_gauntlets_fragments_and_item_talent_gates_keep_correct_display(self):
  for id in ['天山掌法','天罗地网掌','大嵩阳手','伏虎掌','小洪拳','绵掌','参合指']:
   copy=self.skin['definitions']['externalSkills'][id]['description']
   self.assertNotIn('cast',copy['en'].lower());self.assertNotIn('咒',copy['zh-CN']);self.assertNotIn('符术',copy['zh-CN'])
  for locale in ['en','zh-CN']:
   catalog=self.runtime[locale]['browser']['displayCatalog']['byCategory']
   self.assertNotEqual(catalog['items']['金蛇剑法秘籍残篇']['name'],catalog['items']['金蛇剑法秘籍']['name'])
   self.assertTrue(catalog['talents']['阉人']['name'])
   self.assertEqual(self.runtime[locale]['items'],self.source['items'])

 def test_random_equipment_can_resolve_every_talent_and_unlocked_technique_name(self):
  ids={id for table in self.source['randomAffixTables'] for option in table['options'] if option['kind']=='talent' for id in option['pool']}
  self.assertEqual(len(ids),14)
  for id in ids:self.assertIn(id,self.skin['definitions']['talents'])
  forms=[form['id'] for category in ['externalSkills','internalSkills'] for skill in self.source[category] for form in skill.get('formSkills',[])]
  self.assertEqual(len(forms),97)
  for locale,game in self.runtime.items():
   labels=game['browser']['displayCatalog']['text']
   for id in forms:
    self.assertEqual(labels[id],self.skin['uiLabels'][id][locale])
   for category in ['externalSkills','internalSkills']:
    for id,definition in self.skin['definitions'][category].items():
     if id in self.skin.get('uiLabels',{}):self.assertEqual(self.skin['uiLabels'][id],definition['name'])

if __name__=='__main__':unittest.main()
