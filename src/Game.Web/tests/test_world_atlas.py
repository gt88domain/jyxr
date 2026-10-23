import copy,json,sys,unittest
from pathlib import Path
WEB=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(WEB/'scripts'))
from grimm_skin import load_skin,apply_skin,compile_runtime_package

class WorldAtlasTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.raw=(WEB/'public/data/packs/jyx/content-package.json').read_bytes()
  cls.source=json.loads(cls.raw);cls.skin=load_skin(WEB)

 def test_localized_atlas_covers_every_destination_without_changing_native_rules(self):
  for locale in ['en','zh-CN']:
   display,_=apply_skin(self.raw,self.skin,locale)
   runtime=compile_runtime_package(self.source,display)
   atlas=runtime['browser']['worldAtlas']
   native=next(m for m in self.source['maps'] if m['id']==atlas['mapId'])
   ids=[id for r in atlas['regions'] for id in r['locations']]
   self.assertEqual(len(ids),71);self.assertEqual(set(ids),{l['id'] for l in native['locations']})
   self.assertEqual(len(ids),len(set(ids)))
   self.assertIsInstance(atlas['title'],str)
   for key in self.source:
    if key not in ['browser','storyScripts']:self.assertEqual(runtime[key],self.source[key],key)

 def test_invented_missing_and_duplicate_destinations_are_rejected(self):
  for edit in ['invented','missing','duplicate']:
   skin=copy.deepcopy(self.skin);locations=skin['worldAtlas']['regions'][0]['locations']
   if edit=='invented':locations[0]='missing'
   elif edit=='missing':locations.pop()
   else:locations.append(locations[0])
   with self.assertRaisesRegex(ValueError,'cover native'):apply_skin(self.raw,skin,'en')

 def test_invalid_art_paths_and_display_coordinates_are_rejected(self):
  for field,value in [('image','../old.png'),('regions',None)]:
   skin=copy.deepcopy(self.skin)
   if field=='image':skin['worldAtlas'][field]=value
   else:skin['worldAtlas']['regions'][0]['x']=999
   with self.assertRaisesRegex(ValueError,'atlas'):apply_skin(self.raw,skin,'en')

if __name__=='__main__':unittest.main()
