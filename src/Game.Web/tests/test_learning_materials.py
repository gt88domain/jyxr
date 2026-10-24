"""Learning names belong to presentation; the approved starter is explicit."""
import copy,json,sys,unittest
from pathlib import Path
WEB=Path(__file__).resolve().parents[1];sys.path.insert(0,str(WEB/'scripts'))
from grimm_skin import apply_skin,assert_same_flow,compile_runtime_package,load_skin

class LearningMaterialTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.raw=(WEB/'public/data/packs/jyx/content-package.json').read_bytes();cls.original=json.loads(cls.raw);cls.skin=load_skin(WEB)

 def test_books_match_the_ability_they_teach(self):
  display,_=apply_skin(self.raw,self.skin,'en');items={i['id']:i for i in display['items']}
  self.assertEqual(items['内功入门']['name'],'Steadfast Mastery Manual')
  self.assertEqual(items['罗汉拳谱']['name'],'Hearthward Fist Manual')
  self.assertEqual(items['黑血神针秘籍']['name'],'Bloodthorn Bolt Tome')
  skills={s['id']:s for s in display['externalSkills']}
  for item in items.values():
   effects=item.get('useEffects',[])
   if item.get('type')!='skill_book' or len(effects)!=1 or effects[0]['type'] not in ['internal_skill','external_skill']:continue
   spell=effects[0]['type']=='external_skill' and skills[effects[0]['skillId']]['type']=='qimen'
   self.assertTrue(item['name'].endswith(' Tome' if spell else ' Manual'),item['id'])

 def test_rule_names_effects_conditions_and_ids_remain_canonical(self):
  display,_=apply_skin(self.raw,self.skin,'en');runtime=compile_runtime_package(self.original,display)
  for group in ['items','characters','internalSkills','externalSkills','battles','maps']:
   self.assertEqual(runtime[group],self.original[group],group)
  self.assertEqual(runtime['browser']['displayCatalog']['byCategory']['items']['内功入门']['name'],'Steadfast Mastery Manual')
  self.assertEqual(runtime['browser']['starterEquipmentId'],'木刀')

 def test_creation_answers_keep_their_original_rewards(self):
  display,_=apply_skin(self.raw,self.skin,'en')
  def rules(creation):
   creation=copy.deepcopy(creation)
   for q in creation['questions']:
    q.pop('title',None)
    for o in q['options']:o.pop('text',None)
   return creation
  self.assertEqual(rules(display['browser']['creation']),rules(self.original['browser']['creation']))
  self.assertNotIn('starterEquipmentId',self.original['browser'])

 def test_other_starter_grants_are_rejected(self):
  skin=copy.deepcopy(self.skin);skin['starterEquipmentId']='玄铁剑'
  with self.assertRaisesRegex(ValueError,'Unsupported starter equipment'):apply_skin(self.raw,skin,'en')
  display,_=apply_skin(self.raw,self.skin,'en');display['browser']['starterEquipmentId']='玄铁剑'
  with self.assertRaisesRegex(ValueError,'Unsupported starter equipment'):assert_same_flow(self.original,display)

 def test_bilingual_copy_and_intro_reference_the_same_real_abilities(self):
  en,_=apply_skin(self.raw,self.skin,'en');zh,_=apply_skin(self.raw,self.skin,'zh-CN')
  self.assertEqual(next(i for i in zh['items'] if i['id']=='内功入门')['name'],'坚毅专精手册')
  self.assertEqual(next(i for i in zh['items'] if i['id']=='黑血神针秘籍')['name'],'血棘飞矢法术书')
  self.assertEqual(en['browser']['chapterGuide']['steps'][1]['panel'],'loadout')
  self.assertEqual(zh['browser']['chapterGuide']['steps'][2]['panel'],'loadout')
  assert_same_flow(self.original,en);assert_same_flow(self.original,zh)

if __name__=='__main__':unittest.main()
