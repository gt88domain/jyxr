#!/usr/bin/env python3
"""Validate control talent constants against pinned source, not descriptions."""
import json
from pathlib import Path
import re
import sys

WEB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WEB / "scripts"))
from legacy_control_rules import SEALS

source = (WEB.parents[1] / "jyx-legacy-dll/JyGame/AttackLogic.cs").read_text(encoding="utf-8-sig")
block = source[source.index('double num16 ='):source.index('if (role.HasTalent("大小姐")')]
assert 'role.AttributesFinal["fuyuan"] / 100 - role2.AttributesFinal["dingli"] / 100' in block
assert 'double num17 = 0.25;' in block and 'num17 += 0.12;' in block
assert 'role.HasTalent("神拳无敌")' in block and 'skill.Type == 0' in block
package = json.loads((WEB / "public/data/content-package.json").read_text())
talents = {t["id"]: t for t in package["talents"]}
for i, name in enumerate(SEALS):
    source_part = block[block.index(f'if (role.HasTalent("{name}")'):]
    source_part = source_part[:source_part.index('\n\t\t\tif ', 1)] if '\n\t\t\tif ' in source_part[1:] else source_part
    buff = re.search(r'buff\d+.Name = "([^"]+)";\s*buff\d+.Level = (\d+);\s*buff\d+.Round = (\d+);', source_part)
    assert buff.groups() == (name, '0', '2')
    hook = talents[name]["affixes"][0]
    condition = hook["conditions"][-1]
    assert condition == {"type":"stat_difference_chance", "sourceStat":"fuyuan", "targetStat":"dingli", "divisor":100, "truncateQuotients":True, "inclusive":name=="诸般封印"}
    assert ('Tools.GetRandom(0.0, 1.0) <= num16' in source_part) == condition['inclusive']
    assert hook['effects'][0]['buffId'] == name and hook['effects'][0]['level'] == 0 and hook['effects'][0]['duration'] == 2
    assert hook['priority'] == -101-i
for name, factor, level in [('阴阳',.01,0),('寒冰真气',.5,3)]:
    assert f'role.HasTalent("{name}") && Tools.ProbabilityTest((double)role.Level * {factor})' in block
    hook=talents[name]['affixes'][0]
    assert hook['conditions'][-1]['valuePerLevel']==factor
    assert hook['effects'][0]['buffId']=='麻痹' and hook['effects'][0]['level']==level and hook['effects'][0]['duration']==2
iron=talents['铁拳无双']['affixes']
assert [h['conditions'][-1]['value'] for h in iron]==[.25,.37,.25,.37]
assert [h['conditions'][-2]['absent'] for h in iron]==[True,False,True,False]
assert 'if (sourceSprite.Role.HasTalent("灵心慧质"))' in source
for name in ['铁拳无双',*SEALS,'阴阳','寒冰真气']:
    affixes=talents[name]['affixes']
    assert affixes[0]['conditions'][1]['relation']=='enemy' and affixes[-1]['conditions'][1]['relation']=='ally'
    assert 'Legend' not in affixes[-1]['conditions'][2]['kinds']
    assert affixes[-1]['conditions'][3]=={'type':'context_unit_effective_talent','talentIds':['灵心慧质'],'absent':True}
print('PASS eight source control rules, 神拳无敌 enhancement, quotient truncation, inclusive/strict comparisons and unmodified level*0.5')
