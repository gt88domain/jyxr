"""Check that the comparison uses the actual bundle and preserves each variant."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

web=Path(__file__).resolve().parents[1]
bundle=json.loads((web/'reference-materials/late-runtime.json').read_text())
report=json.loads((web/'public/late-version-comparison.json').read_text())
details=json.loads((web/'public/late-version-details.json').read_text())
ui=json.loads((web/'public/late-ui-layout.json').read_text())
assert bundle['commit']==report['commit']==details['commit']==ui['commit']=='4acd2c718a8afc562f0d5a0cd38464fea6699453'
assert len(bundle['files'])==23
for name,entry in bundle['files'].items():
    raw=entry['xml'].encode();assert len(raw)==entry['bytes'] and hashlib.sha256(raw).hexdigest()==entry['sha256'],name
assert len(report['legends'])==len(ET.fromstring(bundle['files']['aoyis']['xml']))==137
assert sum(len(l['conditions']) for l in report['legends'])==223
assert len({l['id'] for l in report['legends']})==137,'Same-name variants collapsed'
assert len([l for l in report['legends'] if l['knownIssue']])==2
assert all('addPower' not in n.attrib for n in ET.fromstring(bundle['files']['aoyis']['xml']))
baseline=list(ET.parse(web.parents[1]/'jyx-legacy-data/data-origin/aoyis.xml').getroot())
assert len(report['legendPowerDifferences'])==sum(float(n.get('addPower',0))!=0 for n in baseline)==107
grant=next(t for t in report['talents'] if t['id']=='御剑')
assert any(r['owner']=='天山剑法' and r['attributes'].get('lv')=='12' for r in grant['lateGrantReferences'])
assert not any(t['lateExecutionStringHits'] for t in details['talents'])
for name in ['伤口撕裂','情花奇毒','摧筋破骨','软猬宝甲']:
    assert not next(t for t in report['talents'] if t['id']==name)['lateGrantReferences']
assert len(report['roundEvents'])==8
for r in report['rounds']:
    assert r['skillCapBonus']==r['round']//2 and r['chestCapacity']==8+r['round']*6
assert len(ui['files'])==len({f['path'] for f in ui['files']})
for file in ui['files']:
    raw=(web/'public'/file['path']).read_bytes();assert len(raw)==file['bytes'] and hashlib.sha256(raw).hexdigest()==file['sha256'],file['path']
state=[n for n in ui['layouts']['map']['nodes'] if n['path'].endswith('/ButtonZhuangtai')]
assert len(state)==1 and state[0]['rect']==[1043.1,410.7,84.0,84.0],state
assert (web/'public/late-ui-layout.json').read_bytes()==(web/'reference-materials/late-ui-layout.json').read_bytes()
assert (web/'public/late-version-details.json').read_bytes()==(web/'reference-materials/late-version-comparison.json').read_bytes()
print('PASS actual23 bundled XML hashes, all137 variants/223 conditions,107 power differences,5 talent questions,8 round events, original UI coordinates and every texture hash')
