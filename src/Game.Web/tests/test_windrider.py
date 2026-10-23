"""Complete White Horse copy coverage with frozen recruitment/reward rules."""
import copy,json,sys,unittest
from pathlib import Path
WEB=Path(__file__).resolve().parents[1];sys.path.insert(0,str(WEB/'scripts'))
from grimm_skin import apply_skin,assert_same_flow,load_skin

class WindriderTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.raw=(WEB/'public/data/packs/jyx/content-package.json').read_bytes();cls.native=json.loads(cls.raw);cls.skin=load_skin(WEB)
  cls.segments={s['name']:s for f in cls.native['storyScripts'].values() for s in f['segments']}

 def test_all_white_horse_and_cross_theme_continuations_are_authored(self):
  white={id for id in self.segments if id.startswith('白马啸西风_')}
  self.assertEqual(len(white),25)
  self.assertEqual(sum(any(s['kind']=='dialogue' for s in self.segments[id]['steps']) for id in white),24)
  authored=set(self.skin['dialogueEdits'])|set(self.skin['segments'])
  self.assertTrue({id for id in white if any(s['kind']=='dialogue' for s in self.segments[id]['steps'])}<=authored)
  self.assertTrue({'original_女主.白马啸西风','original_女主.白马啸西风.保护','original_女主.白马啸西风.坚强'}<=authored)
  self.assertNotIn('白马啸西风_陈达海加入2',self.skin['dialogueEdits'])

 def test_night_chance_trust_and_every_reward_stay_original(self):
  for locale in ['en','zh-CN']:
   game,_=apply_skin(self.raw,self.skin,locale);assert_same_flow(self.native,game)
   for before,after in zip(self.native['maps'],game['maps']):
    for a,b in zip(before['locations'],after['locations']):self.assertEqual(a['events'],b['events'])
  cases=self.segments['白马啸西风_再见李文秀']['steps'][-1]['cases']
  self.assertEqual([c['when'] for c in cases],["(favorability('李文秀') >= 60)","(favorability('李文秀') < 60)"])
  end=self.segments['白马啸西风_完结2']
  self.assertTrue({"grant_points('李文秀', 30)","change_stat('李文秀', '奇门', 40)","change_stat('李文秀', 'max_hp', 500)","change_stat('李文秀', 'max_mp', 500)","item('黑血神针秘籍', 1)"}<={s.get('call') for s in end['steps']})
  self.assertEqual(self.segments['白马啸西风_陈达海加入2']['steps'],[{'kind':'command','call':"join('陈达海')"},{'kind':'command','call':'change_morality(-2)'}])

 def test_wrong_trust_gate_or_reward_is_rejected(self):
  for mutation in ['trust','reward']:
   game,_=apply_skin(self.raw,self.skin,'en');segments={s['name']:s for f in game['storyScripts'].values() for s in f['segments']}
   if mutation=='trust':segments['白马啸西风_再见李文秀']['steps'][-1]['cases'][0]['when']="(favorability('李文秀') >= 50)"
   else:next(s for s in segments['白马啸西风_完结2']['steps'] if s.get('call')=="item('黑血神针秘籍', 1)")['call']="item('黑血神针秘籍', 2)"
   with self.assertRaises(ValueError):assert_same_flow(self.native,game)

 def test_second_story_has_real_early_entry_and_original_cutoffs(self):
  world=next(m for m in self.native['maps'] if m['id']=='大地图')
  camp=next(l for l in world['locations'] if l['id']=='回族部落')
  self.assertTrue(any(e['action']=="story('书剑恩仇录_回族部落')" and "!story_completed('mainStory_神秘剑客1')" in e['when'] for e in camp['events']))
  village=next(m for m in self.native['maps'] if m['id']=='回族部落')
  final=next(l for l in village['locations'] if l['id']=='张召重')['events'][0]
  self.assertIn("story_completed('书剑恩仇录_六和塔')",final['when'])
  self.assertIn("!story_completed('mainStory_紧急1')",final['when'])

 def test_guidance_references_real_stories_and_keeps_native_gates(self):
  for locale in ['en','zh-CN']:
   game,_=apply_skin(self.raw,self.skin,locale)
   guide=game['browser']['chapterGuide']['story']
   self.assertEqual(guide['trustGoal'],60)
   self.assertEqual(guide['trustTarget'],'李文秀')
   self.assertEqual(set(guide['nightSlots']),{'亥','子','丑','寅','卯'})
   self.assertTrue(set(guide['trackedStories'])<=self.segments.keys())
   stages={s['id']:s for s in guide['stages']}
   for stage,chance in [('night',20),('camp-conflict',30),('warrens',50),('alternate-warrens',50),('find-knight',20)]:
    text=guide['nightReady'] if stage=='night' else stages[stage]['detail']
    self.assertIn(str(chance)+'%',text)
   self.assertEqual(stages['knight-declined']['any'],['白马啸西风_陈达海加入3'])

 def test_missing_story_guide_reference_is_rejected(self):
  skin=copy.deepcopy(self.skin)
  skin['chapterGuide']['story']['trackedStories'].append('not-a-story')
  with self.assertRaisesRegex(ValueError,'Chapter story reference'):apply_skin(self.raw,skin,'en')

if __name__=='__main__':unittest.main()
