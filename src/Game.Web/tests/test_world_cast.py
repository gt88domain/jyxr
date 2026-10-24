"""Checks that protect shared identities and source coverage during editing."""
import copy,json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from world_cast import WEB,load,validate

class CastIdentityTests(unittest.TestCase):
 def setUp(self):self.data=copy.deepcopy(load())
 def test_complete_bilingual_coverage(self):
  result=validate(*self.data)
  self.assertEqual(result['sourceDefinitions'],513)
  self.assertEqual(result['namedOriginals'],0)
  self.assertEqual(result['recruitmentForms'],65)
 def test_two_people_cannot_share_a_named_figure(self):
  actors=self.data[3]['actors'];a=next(a for a in actors if a['legacyIdentity']=='张无忌');b=next(a for a in actors if a['legacyIdentity']=='狄云')
  for key in ['figureId','name','primaryCountry']:a[key]=copy.deepcopy(b[key])
  a['relatedCountries']=list(set(a['relatedCountries']+[a['primaryCountry']]))
  a['traveler']=len(a['relatedCountries'])>1
  with self.assertRaisesRegex(ValueError,'One figure assigned'):validate(*self.data)
 def test_missing_definition_is_rejected(self):
  self.data[3]['actors'][0]['forms'].pop()
  with self.assertRaisesRegex(ValueError,'coverage'):validate(*self.data)
 def test_wen_brothers_are_not_merged_by_the_bad_old_display_names(self):
  actors=self.data[3]['actors'];a=next(a for a in actors if a['legacyIdentity']=='温方义');b=next(a for a in actors if a['legacyIdentity']=='温方施')
  a['forms'].extend(b['forms']);actors.remove(b)
  for definition in self.data[4]['definitions']:
   if definition['actorId']==b['actorId']:definition['actorId']=a['actorId']
  with self.assertRaisesRegex(ValueError,'Wen brothers'):validate(*self.data)
 def test_original_fallback_requires_a_real_reason(self):
  a=next(a for a in self.data[3]['actors'] if a['kind']=='named')
  figure=next(f for f in self.data[2] if f['id']==a['figureId']);figure['original']=True
  with self.assertRaisesRegex(ValueError,'Original name requires'):validate(*self.data)
 def test_missing_english_name_is_rejected(self):
  del self.data[2][0]['name']['en']
  with self.assertRaisesRegex(ValueError,'missing en'):validate(*self.data)
 def test_locked_core_cannot_silently_change(self):
  used={a['figureId'] for a in self.data[3]['actors']}
  f=next(f for f in self.data[2] if f['country']=='CN' and f['id'] not in used)
  a=next(a for a in self.data[3]['actors'] if a['legacyIdentity']=='张无忌')
  a['figureId']=f['id'];a['name']=f['name']
  with self.assertRaisesRegex(ValueError,'Locked identity changed'):validate(*self.data)
 def test_locales_have_the_same_complete_interface_keys(self):
  translations=json.loads((WEB/'cast/translations.json').read_text(encoding='utf8'))
  self.assertEqual(set(translations['en']),set(translations['zh-CN']))
  self.assertTrue(all(isinstance(v,str) and v.strip() for lang in translations.values() for v in lang.values()))
 def test_training_prop_does_not_consume_a_named_legendary_figure(self):
  actor=next(a for a in self.data[3]['actors'] if a['legacyIdentity']=='木头人')
  self.assertEqual(actor['kind'],'archetype');self.assertIsNone(actor['figureId'])
  self.assertEqual(actor['name']['en'],'Training Dummy')
 def test_external_origin_is_allowed_without_adding_a_main_story_country(self):
  actor=next(a for a in self.data[3]['actors'] if a['kind']=='named' and a['status']=='proposed')
  figure=next(f for f in self.data[2] if f['id']==actor['figureId'])
  figure['country']='KR';actor['primaryCountry']='KR'
  actor['relatedCountries']=list(dict.fromkeys([*actor['relatedCountries'],'KR']));actor['traveler']=True
  result=validate(*self.data)
  self.assertEqual(result['storyCountries'],13);self.assertEqual(result['originCountries'],14)
  self.assertIn('KR',result['namedByCountry'])
 def test_unregistered_origin_is_rejected(self):
  self.data[2][0]['country']='ZZ'
  with self.assertRaisesRegex(ValueError,'Unknown figure country'):validate(*self.data)
 def test_external_origin_cannot_be_a_new_legacy_story_country(self):
  actor=next(a for a in self.data[3]['actors'] if a['referenceEvidence'])
  actor['relatedCountries'].append('KR');actor['traveler']=actor['kind']=='named' and len(actor['relatedCountries'])>1
  actor['referenceEvidence'][0]['country']='KR'
  with self.assertRaisesRegex(ValueError,'Story-country evidence mismatch'):validate(*self.data)
 def test_duplicate_origins_and_changed_core_origins_are_rejected(self):
  self.data[-1].append(copy.deepcopy(self.data[-1][0]))
  with self.assertRaisesRegex(ValueError,'Duplicate origin country'):validate(*self.data)
  self.data[-1].pop();self.data[-1][0]['name']['en']='Changed core'
  with self.assertRaisesRegex(ValueError,'Story-country origin drift'):validate(*self.data)

if __name__=='__main__':unittest.main()
