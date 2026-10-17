#!/usr/bin/env python3
"""Compare mastery/range/blood formulas with pinned C# source."""
import json
from pathlib import Path
import sys

WEB=Path(__file__).resolve().parents[1]
ROOT=WEB.parents[1]
sys.path.insert(0,str(WEB/'scripts'))
from legacy_mastery_rules import BLOOD_FORMULA, MASTERY_TALENTS

def source(name):return (ROOT/'jyx-legacy-dll/JyGame'/name).read_text(encoding='utf-8-sig')
skill=source('SkillBox.cs');attack=source('AttackLogic.cs');inner=source('InternalSkillInstance.cs')
size=skill[skill.index('private int GetSize()'):skill.index('private int GetCastSize()')]
cast=skill[skill.index('private int GetCastSize()'):]
assert size.index('GetBuff("致盲")') < size.index('HasTalent("寸长寸强")') and 'num++;' in size
assert 'HasTalent("吴钩霜雪") && Name == "太玄神功"' in cast and 'num += 3;' in cast
assert 'HasTalent("金刚伏魔圈") && Name == "日月神鞭"' in cast
assert cast.index('return 10;') < cast.index('GetBuff("致盲")')
assert 'InternalSkill.Yang * Level / 10' in inner and 'HasTalent("至刚至阳")' in inner and 'num = (int)((double)num * 1.3);' in inner
assert 'HasTalent("至空至明") && Tools.ProbabilityTest(0.15)' in attack and 'target.SkillCdRecover();' in attack
assert 'defence *= 1.2;\n\t\t\t\tdefence += (double)(10 * role2.Level);' in attack
assert 'critical_chacne -= 0.3 * (double)(role2.Level / 30);' in attack
blood=attack[attack.index('float num34 = 0f;'):attack.index('if (source.Role.HasTalent("北冥神功")')]
for text in ['num34 = 0.1f;', 'num34 = 0.2f;', 'num34 += 0.2f;', 'num34 += 0.15f;',
             '0.05f + (float)((double)(0.05f * (float)source.Role.level) / 30.0)',
             'int num35 = (int)((float)attackResult.Hp * num34);', 'num35 /= 2;']:
    assert text in blood,text
p=json.loads((WEB/'public/data/content-package.json').read_text());talents={t['id']:t for t in p['talents']}
assert all(talents[name]['affixes'] for name in MASTERY_TALENTS)
assert talents['寸长寸强']['affixes'][0]['stage']=='AfterBlind'
assert talents['吴钩霜雪']['affixes'][0]['skillName']=='太玄神功'
assert talents['金刚伏魔圈']['affixes'][0]['value']=={'op':'override','delta':10}
assert talents['金刚伏魔圈']['affixes'][0]['stage']=='AfterBlind'
assert talents['至刚至阳']['affixes'][0]['traitId']=='IncreaseInternalSkillYangAffinity'
assert talents['至空至明']['affixes'][0]['conditions'][-1]['value']==.15
assert talents['金刚']['affixes'][0]['effects'][1]['op']=='post_add'
assert talents['御风']['affixes'][0]['effects'][0]['unitLevelStep']==30
formula=BLOOD_FORMULA['parameters']
assert [r['rate'] for r in formula['skillRates']]==[.1,.2]
assert [r['rate'] for r in formula['talentRates']]==[.2,.15]
assert formula['levelRate']=={'talentId':'嗜血狂魔','baseRate':.05,'ratePerLevel':.05,'divisor':30}
for name in ['嗜血狂魔','血海魔功','血魔刀法']:
    assert talents[name]['affixes'][0]['effects']==[BLOOD_FORMULA]
b=next(s for s in p['externalSkills'] if s['id']=='血刀大法')
assert b['affixes'][-1]['effect']['effects']==[BLOOD_FORMULA]
print('PASS ten source mastery rules: ordered blindness, exact skill names, Yang/cooldown/defence/critical and float blood-drain constants')
