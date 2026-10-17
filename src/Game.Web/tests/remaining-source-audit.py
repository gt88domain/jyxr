#!/usr/bin/env python3
"""Check the remaining-rule implementation against pinned source evidence."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

WEB = Path(__file__).resolve().parents[1]
ROOT = WEB.parents[1]
source = (ROOT / 'jyx-legacy-dll/JyGame/AttackLogic.cs').read_text(encoding='utf-8-sig')
for text in ['Math.Abs(source.Mp - target.Mp)', 'num22 > 10000', 'Tools.GetRandom(0.1, 0.25)',
             'Math.Max(attackResult.Hp, (int)((float)targetSprite.Hp * 0.25f))',
             'Tools.GetRandomInt(num30, num30 * 2)', 'defence -= 70.0;',
             'critical_chacne += 0.3;', 'defence += 250.0;',
             'attackResult.Hp = (int)((float)attackResult.Hp * 0.3f);',
             '(double)(list4.Count + 1)', 'Tools.GetRandomInt(0, list5.Count) % list5.Count',
             'attackResult.Hp = (int)((double)attackResult.Hp * 0.2);',
             'Math.Min((int)((double)attackResult.Hp * 0.05), (int)((double)target.MaxHp * 0.1))',
             'int num31 = (int)((double)attackResult.Hp * 0.5);']:
    assert text in source, text
field = (ROOT / 'jyx-legacy-dll/JyGame/BattleField.cs').read_text(encoding='utf-8-sig')
assert '_sprites.Remove(sp.gameObject);' in field
assert 'Role.HasTalent("魔神降临") && Tools.ProbabilityTest(0.12)' in field
assert 'Role.HasTalent("百变千幻") && Tools.ProbabilityTest(0.1)' in field
assert field.index('double num4 = 0.0;') < field.index('Tools.ProbabilityTest(num4)')
p = json.loads((WEB / 'public/data/content-package.json').read_text())
audit = json.loads((WEB / 'public/data/original-battle-rule-audit.json').read_text())
remaining = [x['id'] for x in audit['sections']['talents']['entries'] if x['configurationState'] == 'metadata-only']
assert remaining == ['伤口撕裂', '御剑', '情花奇毒', '摧筋破骨', '软猬宝甲']
assert all(not x['sourceLiteralReferences'] for x in audit['sections']['talents']['entries'] if x['id'] in remaining)
assert p['browser']['formationRules']['supportRadius'] == 5
assert all(next(t for t in p['talents'] if t['id'] == name).get('affixes') for name in p['browser']['sourceRuleTalents'])
assert all(not x['fullBehaviorVerified'] for x in audit['sections']['talents']['entries'])
m = json.loads((WEB / 'public/art/legacy/audio-manifest.json').read_text())
assert m['clips'] == 183
audio_ids = {r.get('key') for r in ET.parse(ROOT / 'jyx-legacy-data/data-origin/resource.xml').getroot()
             if r.get('key', '').startswith(('音乐.', '战斗音乐.', '音效.'))}
assert set(m['resources']) == audio_ids and len(audio_ids) == 166
assert p['browser']['audio']['resources'] == m['resources']
for path, metadata in m['files'].items():
    data = (WEB / 'public/art/legacy' / path).read_bytes()
    assert len(data) == metadata['bytes'] and hashlib.sha256(data).hexdigest() == metadata['sha256'], path
print('PASS pinned remaining-rule constants; all 27 newly connected talent/formation entries and five evidence gaps; 183 original clips, all 166 resource IDs and encoded file hashes')
