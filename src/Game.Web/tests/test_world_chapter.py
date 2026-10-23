"""Check the authored batch against frozen source, without claiming a campaign playthrough."""
import json
import re
import sys
import unittest
from pathlib import Path

WEB=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(WEB/'scripts'))
from grimm_skin import load_skin,apply_skin,assert_same_flow

class ChapterTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.raw=(WEB/'public/data/packs/jyx/content-package.json').read_bytes()
  cls.source=json.loads(cls.raw);cls.skin=load_skin(WEB)
  cls.segments={s['name']:s for f in cls.source['storyScripts'].values() for s in f['segments']}

 def test_authored_english_has_no_hidden_chinese_copy(self):
  def walk(value,path='',english=False):
   if isinstance(value,str) and english:self.assertIsNone(re.search(r'[\u3400-\u9fff]',value),path+': '+value)
   elif isinstance(value,dict):
    for key,child in value.items():walk(child,path+'/'+key,english or key=='en')
   elif isinstance(value,list):
    for i,child in enumerate(value):walk(child,path+'/'+str(i),english)
  walk(self.skin)

 def test_every_tutorial_dialogue_segment_is_authored(self):
  expected={n for n,s in self.segments.items() if n.startswith('original_新手引导.') and any(x['kind']=='dialogue' for x in s['steps'])}
  self.assertGreater(len(expected),15)
  self.assertFalse(expected-self.skin['dialogueEdits'].keys())

 def test_all_early_drop_items_and_basic_skills_have_fantasy_copy(self):
  for item in self.source['items']:
   if item.get('canDrop') and item.get('level',0)<=3:
    self.assertIn(item['id'],self.skin['definitions']['items'])
  for category in ['externalSkills','internalSkills']:
   for skill in self.source[category]:
    if skill.get('hard',999)<=3:
     self.assertIn(skill['id'],self.skin['definitions'][category])

 def test_confirmed_families_keep_gauntlets_spells_and_masteries_distinct(self):
  display,_=apply_skin(self.raw,self.skin,'en')
  names={s['id']:s['name'] for s in display['externalSkills']}
  self.assertEqual(names['野球拳'],"Traveler's Gauntlet Strike")
  self.assertEqual(names['罗汉拳'],'Hearthward Fist')
  self.assertEqual(names['疯魔杖法'],'Wandering Arcana')
  self.assertEqual(self.skin['uiLabels']['拳掌']['en'],'Gauntlets')
  self.assertEqual(self.skin['uiLabels']['奇门']['en'],'Spells')
  self.assertEqual(self.skin['uiLabels']['刀法']['en'],'Heavy Weapons')
  self.assertEqual(display['browser']['terms']['internalSkills'],'Passive masteries')
  self.assertEqual(next(s for s in display['internalSkills'] if s['id']=='基本内功')['name'],'Steadfast Mastery')
  choice=self.skin['choiceText']['original_新手引导.买药']['options']['en']
  self.assertTrue(choice[0].startswith('Gauntlets —'))
  self.assertTrue(choice[3].startswith('Spells —'))

 def test_catalog_covers_all_base_skills_rewards_specials_and_statuses(self):
  for group in ['externalSkills','internalSkills','items','specialSkills','buffs']:
   self.assertEqual({s['id'] for s in self.source[group]},set(self.skin['definitions'][group]),group)
   for s in self.source[group]:
    copy=self.skin['definitions'][group][s['id']]
    for field in ['name','description']:
     for locale in ['en','zh-CN']:self.assertTrue(copy[field][locale].strip(),(group,s['id'],field,locale))

 def test_american_spelling_in_all_authored_english(self):
  forbidden=re.compile(r'\b(defence|armour|travellers?|travelling|practise|centre|grey|favour|sabre)\b',re.I)
  def walk(v,english=False):
   if isinstance(v,str) and english:self.assertIsNone(forbidden.search(v),v)
   elif isinstance(v,dict):
    for k,x in v.items():walk(x,english or k=='en')
   elif isinstance(v,list):
    for x in v:walk(x,english)
  walk(self.skin)

 def test_all_nine_school_entries_include_their_choice_closures(self):
  pending=[s['storyId'] for s in self.source['sects']];seen=set()
  def jumps(value):
   if isinstance(value,dict):
    if value.get('kind')=='jump':pending.append(value['target'])
    for child in value.values():jumps(child)
   elif isinstance(value,list):
    for child in value:jumps(child)
  while pending:
   name=pending.pop()
   if name in seen:continue
   seen.add(name);self.assertIn(name,self.skin['dialogueEdits']);jumps(self.segments[name])
  self.assertEqual(len(self.source['sects']),9);self.assertEqual(len(seen),16)
  self.assertTrue({'少林派_剃度','少林派_不剃度','门派星宿_入门口号对','门派星宿_入门口号错'}<=seen)

 def test_all_authored_branches_keep_the_original_gameplay_flow(self):
  for locale in ['en','zh-CN']:
   display,report=apply_skin(self.raw,self.skin,locale)
   self.assertTrue(report['sameGameplayFlow']);assert_same_flow(self.source,display)
  self.assertEqual(len(self.skin['dialogueEdits'])+len(self.skin['segments']),128)
  self.assertNotIn('倚天屠龙_张无忌',self.skin['dialogueEdits'])

if __name__=='__main__':unittest.main()
