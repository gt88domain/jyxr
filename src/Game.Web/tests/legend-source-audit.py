#!/usr/bin/env python3
"""Audit every original legend row and the source-backed trigger policy."""
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

WEB = Path(__file__).resolve().parents[1]
ROOT = WEB.parents[1]
sys.path.insert(0, str(WEB / "scripts"))
from legacy_legend_rules import LEGEND_RESOLUTION

source = (ROOT / "jyx-legacy-dll/JyGame/AoyiLogic.cs").read_text(encoding="utf-8-sig")
assert source.index("Tools.ProbabilityTest") < source.index("foreach (AoyiCondition condition")
for text in ['sprite.Role.wuxing / 150.0 * 0.2', 'num += 0.5;', 'HasTalent("屌丝") && currentSkill.Name == "野球拳"',
             'num += 0.1;', 'trigger.Argvs[0] == item.Name', '(float)int.Parse(trigger.Argvs[2]) / 100f',
             'result = item;\n\t\t\t\t\tbreak;']:
    assert text in source, text
assert 'public float probability;' in (ROOT / 'jyx-legacy-dll/JyGame/Aoyi.cs').read_text(encoding='utf-8-sig')
package = json.loads((WEB / 'public/data/content-package.json').read_text())
rows = ET.parse(ROOT / 'jyx-legacy-data/data-origin/aoyis.xml').getroot().findall('aoyi')
assert len(rows) == len(package['legendSkills']) == 137
assert package['browser']['legendResolution'] == LEGEND_RESOLUTION
for row, definition in zip(rows, package['legendSkills']):
    assert (definition['name'], definition['startSkill'], definition['requiredLevel'], definition['probability']) == (
        row.get('name'), row.get('start'), int(row.get('level', '1')), float(row.get('probability', '0')))
    expected = []
    for condition in row.findall('condition'):
        kind = {'skill': 'skill', 'internalskill': 'internal_skill', 'talent': 'talent', 'specialskill': 'special_skill'}[condition.get('type')]
        value = {'type': kind, 'targetId': condition.get('value')}
        level = condition.get('level') or condition.get('levelValue')
        if level: value['level'] = int(level)
        expected.append(value)
    assert definition['conditions'] == expected, definition['id']
poor = next(t for t in package['talents'] if t['id'] == '屌丝')
assert poor['affixes'] == [{'type': 'source_skill_legend_chance_bonus', 'skillName': '野球拳', 'bonus': .1}]
report = json.loads((WEB / 'public/data/content-build-report.json').read_text())['legendRuleEffects']
assert report['unselectableStarts'] == [{'id': '太玄神功奥义式-太玄神功', 'name': '太玄神功奥义式', 'startSkill': '太玄神功'}]
assert report['unsupportedConditionRecords'] == ['万劫闪电貂-万劫刀法']
assert 'condition.type == "specialskill"' not in source
frontier = json.loads((WEB / 'public/data/packs/frontier/content-package.json').read_text())
assert 'legendResolution' not in frontier['browser']
print('PASS all 137 ordered source legend records/conditions, explicit JyX trigger policy and isolated default pack; one unselectable start and one unsupported original condition recorded')
