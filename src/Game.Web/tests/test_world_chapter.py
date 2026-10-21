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
  self.assertEqual(len(self.skin['dialogueEdits'])+len(self.skin['segments']),78)
  self.assertNotIn('倚天屠龙_张无忌',self.skin['dialogueEdits'])

if __name__=='__main__':unittest.main()
