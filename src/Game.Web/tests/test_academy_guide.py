"""Keep academy guidance tied to the frozen conditions and actual rewards."""
import copy,json,sys,unittest
from pathlib import Path
WEB=Path(__file__).resolve().parents[1];sys.path.insert(0,str(WEB/'scripts'))
from grimm_skin import apply_skin,load_skin

class AcademyGuideTests(unittest.TestCase):
 def setUp(self):
  self.raw=(WEB/'public/data/packs/jyx/content-package.json').read_bytes()
  self.source=json.loads(self.raw);self.skin=load_skin(WEB)
 def test_day_threshold_and_departure_match_original_not_a_new_timer(self):
  display,_=apply_skin(self.raw,self.skin,'en');a=display['browser']['chapterGuide']['academies'][0]
  scripts={s['name']:s for f in self.source['storyScripts'].values() for s in f['segments']}
  branches=scripts['门派大轮寺_密宗大手印']['steps'][-1]['cases']
  self.assertEqual(branches[0]['when'],f"(elapsed_days > {a['graduationAfterDay']})")
  self.assertEqual(branches[0]['steps'][0]['target'],a['graduationStory'])
  graduate=scripts[a['graduationStory']]['steps']
  self.assertIn({'kind':'command','call':"join('达尔巴')"},graduate)
  snow=next(m for m in self.source['maps'] if m['id']=='大轮寺雪山')
  exit=next(p for p in snow['locations'] if p['id']=='返回')['events']
  self.assertEqual(exit[0]['when'],"(story_completed('门派大轮寺_大轮寺出师'))")
  self.assertEqual(exit[0]['action'],"map('大地图')")
 def test_missing_location_or_untracked_graduation_cannot_ship(self):
  for field,value,reason in [('exit',[{'mapId':'大地图','locationId':'invented teleport'}],'location missing'),('graduationStory','untracked','graduation must be tracked')]:
   skin=copy.deepcopy(self.skin);skin['chapterGuide']['academies'][0][field]=value
   with self.assertRaisesRegex(ValueError,reason):apply_skin(self.raw,skin,'en')
 def test_hatter_identity_matches_the_existing_candidate_and_keeps_recruit_id(self):
  cast=json.loads((WEB/'content/worlds/cast-map.json').read_text())
  actors=cast['actors']
  actor=next(a for a in actors if a['legacyIdentity']=='达尔巴')
  self.assertEqual(actor['name'],self.skin['speakerNames']['达尔巴'])
  for locale in ['en','zh-CN']:
   display,_=apply_skin(self.raw,self.skin,locale)
   self.assertEqual(next(c for c in display['characters'] if c['id']=='达尔巴')['name'],actor['name'][locale])

if __name__=='__main__':unittest.main()
