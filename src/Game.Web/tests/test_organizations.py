"""Source-backed names must project without altering affiliation rules."""
import copy,json,sys,unittest
from pathlib import Path
WEB=Path(__file__).resolve().parents[1];sys.path.insert(0,str(WEB/'scripts'))
from grimm_skin import apply_skin,compile_runtime_package,load_skin

class OrganizationTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.raw=(WEB/'public/data/packs/jyx/content-package.json').read_bytes();cls.original=json.loads(cls.raw);cls.skin=load_skin(WEB)
 def test_reviewed_names_share_one_owner_and_keep_original_rules(self):
  expected={'大轮寺':'Knights of the Round Table','少林派':'Shaolin Temple','血刀门':"Van Helsing's Hunters"}
  for locale in ['en','zh-CN']:
   display,_=apply_skin(self.raw,self.skin,locale);runtime=compile_runtime_package(self.original,display)
   self.assertEqual(runtime['sects'],self.original['sects'])
   self.assertEqual(runtime['characters'],self.original['characters'])
   for o in display['browser']['chapterGuide']['organizations']:
    self.assertEqual(next(s for s in display['sects'] if s['id']==o['id'])['name'],o['name'])
    if o['id'] in expected and locale=='en':self.assertEqual(o['name'],expected[o['id']])
   self.assertEqual(len(display['sects']),9)
 def test_registry_records_pending_persona_review_without_recasting(self):
  o=next(o for o in self.skin['chapterGuide']['organizations'] if o['id']=='星宿派')
  self.assertEqual(o['reviewStatus'],'needs-review');self.assertIn('Heimdall',o['reviewNote'])
  self.assertEqual(self.skin['speakerNames']['丁春秋']['en'],'Heimdall')
 def test_invalid_or_missing_affiliation_catalog_cannot_ship(self):
  for mutate,reason in [
   (lambda o:o.pop(),'cover the original choices'),
   (lambda o:o[0]['affiliationIds'].append(o[1]['affiliationIds'][0]),'Duplicate affiliation alias'),
   (lambda o:o[1].update(mentorId='missing'),'mentor missing')]:
   skin=copy.deepcopy(self.skin);mutate(skin['chapterGuide']['organizations'])
   with self.assertRaisesRegex(ValueError,reason):apply_skin(self.raw,skin,'en')

if __name__=='__main__':unittest.main()
