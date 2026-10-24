#!/usr/bin/env python3
"""Export observed playthrough notes. This is a report, never a game runner."""
import argparse, hashlib, json, shutil, statistics
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]
ROOT = WEB.parents[1]


def build(output, original, retest, before=None, after=None, knight=None):
    first = json.loads(Path(original).read_text())
    second = json.loads(Path(retest).read_text())
    alternate = json.loads(Path(knight).read_text()) if knight else None
    if alternate and (not alternate['passed'] or alternate['scope'] != 'alternate Windrider ending'):
        raise ValueError('Knight branch needs a successful observed alternate ending')
    if not second['passed'] or second['scope'] != 'first two endings and Dulcinea training':
        raise ValueError('First two endings must have a successful actual retest')
    reports = [(first, Path(original).parent), (second, Path(retest).parent)]
    if alternate:
        reports.append((alternate, Path(knight).parent))
    for report, directory in reports:
        source = ROOT / report['sourceSave']
        if hashlib.sha256(source.read_bytes()).hexdigest() != report['sourceSha256']:
            raise ValueError('Observed input save changed: ' + str(source))
        for name, expected in report['checkpoints'].items():
            # Earlier failed runs wrote a rejected-save object called failure;
            # it is not a usable checkpoint and is excluded from this export.
            if name == 'failure':
                continue
            raw = (directory / (name + '.json')).read_bytes()
            if hashlib.sha256(raw).hexdigest() != expected or 'error' in json.loads(raw):
                raise ValueError('Checkpoint changed or was rejected: ' + name)
    en = json.loads((WEB / 'public/data/packs/worlds/en/content-package.json').read_text())
    zh = json.loads((WEB / 'public/data/packs/worlds/zh-CN/content-package.json').read_text())
    translations = {}
    choice_translations = {}
    def pair(a, b):
        if isinstance(a, dict) and isinstance(b, dict):
            if a.get('kind') == 'dialogue':
                translations.setdefault((a['speaker'], a['text']), set()).add(b['text'])
            if isinstance(a.get('text'), str) and isinstance(b.get('text'), str):
                choice_translations.setdefault(a['text'], set()).add(b['text'])
            for key in a.keys() & b.keys():
                pair(a[key], b[key])
        elif isinstance(a, list) and isinstance(b, list):
            for x, y in zip(a, b):
                pair(x, y)
    pair(en['storyScripts'], zh['storyScripts'])
    catalogs = {locale: p['browser']['displayCatalog'] for locale, p in [('en', en), ('zh-CN', zh)]}
    required = set(next(b for b in en['battles'] if b['id']=='庖丁解牛_战斗')['requiredCharacterIds'])
    observed = [sorted({u['definitionId'] for u in e['data']['units'] if u['team']==1}) for e in second['events'] if e['kind']=='battle-start' and e['data']['id']=='庖丁解牛_战斗']
    formation_matched = bool(observed) and all(required <= set(ids) for ids in observed)
    def label(id, category):
        return {locale: c.get('byCategory', {}).get(category, {}).get(id, {}).get('name', c['text'].get(id, id)) for locale, c in catalogs.items()}
    rows = []
    hero_names = {u['name'] for report, _ in reports for e in report['events'] if e['kind'] == 'battle-start' for u in e['data']['units'] if u.get('definitionId') == '主角'}
    selected = [('retest', e) for e in second['events']]
    selected += [('initial', e) for e in first['events'] if e['stage'] in ['italy', 'recovery', 'italy-retry']]
    if alternate:
        selected += [('knight', e) for e in alternate['events']]
    for run, e in selected:
        kind, data = e['kind'], e['data']
        if kind == 'combat':
            continue
        row = dict(run=run, stage=e['stage'], kind=kind, sequence=e['sequence'])
        if kind == 'dialogue':
            candidates = translations.get(('主角' if data['speaker'] in hero_names else data['speaker'], data['text']), set())
            row.update(speaker=label(data['speaker'], 'characters'), text={'en': data['text'], 'zh-CN': next(iter(candidates)) if len(candidates) == 1 else data['text']}, translationMatched=len(candidates) == 1)
        elif kind == 'visit':
            row.update(map=label(data['mapId'], 'maps'), place=label(data['locationId'], 'locations'), time=data['time'])
        elif kind == 'recruit':
            row.update(character=label(data['definitionId'], 'characters'), level=data['level'], id=data['definitionId'])
        elif kind == 'item':
            row.update(item=label(data['id'], 'items'), delta=data['delta'], id=data['id'])
        elif kind in ['battle-start', 'battle-end']:
            row.update(battleId=data['id'], battle=label(data['id'], 'battles'), outcome=data.get('outcome'), actions=data.get('turns'), medicine=data.get('medicine'), units=[dict(name=label(u.get('definitionId', u['name']), 'characters'), team=u['team'], hp=u['hp'], maxHp=u['maxHp']) for u in data['units']])
        elif kind == 'checkpoint':
            row.update(name=data['name'], sha256=data['sha256'], heroLevel=data['heroLevel'], party=[label(c['definitionId'], 'characters') for c in data['party']])
            directory = Path({'retest': retest, 'initial': original, 'knight': knight}[run]).parent
            saved = json.loads((directory / (data['name'] + '.json')).read_text())['game']
            row['silver'] = saved['currency']['silver']
            row['inventory'] = [dict(item=label(i['itemDefinitionId'], 'items'), quantity=i['quantity']) for i in saved['inventory']['entries'] if i['kind'] == 'stack']
        elif kind == 'companion-build':
            row.update(character=label(data['definitionId'], 'characters'), cultivation=data['cultivation'], points=data['unspentStatPoints'], equipment=[label(x['item']['id'], 'items') for x in data['equipment'] if x['item']], mastery=label(data['equippedInternalSkillId'], 'internalSkills'))
            row['trainingSkill'] = label(data['cultivation']['skillId'], 'externalSkills' if data['cultivation']['kind'] == 'External' else 'internalSkills')
        elif kind == 'choice':
            def choice_text(text):
                candidates = choice_translations.get(text, set())
                return {'en': text, 'zh-CN': next(iter(candidates)) if len(candidates) == 1 else text}
            row['prompt'] = choice_text(data['prompt']['text']) if data['prompt'] else None
            row['options'] = [choice_text(o if isinstance(o, str) else o.get('text', o.get('label', ''))) for o in data['options']]
        else:
            row['data'] = data
        rows.append(row)
    perf = {}
    for name, path in [('before', before), ('after', after)]:
        if not path:
            continue
        p = json.loads(Path(path).read_text())
        perf[name] = dict(ui={a: round(statistics.median(x['ms'] for x in p['ui'] if x['action'] == a), 1) for a in sorted({x['action'] for x in p['ui']})}, dispatchMedianMs=round(statistics.median(x['dispatchMs'] for x in p['runtime']), 1), parseMedianMs=round(statistics.median(x['parseMs'] for x in p['runtime']), 1), responseBytes=p['runtime'][0]['bytes'], longTasks=len(p['longTasks']))
    result = dict(title='Three-story playthrough', sourceSave=second['sourceSave'], sourceSha256=second['sourceSha256'], contentSha256=second['contentSha256'], rows=rows, performance=perf,
                  deploymentAudit=dict(requiredIds=sorted(required),observedIds=observed,matched=formation_matched),
                  outcomes=[dict(country='Spain', original='白马啸西风', status='cleared', companions=['Dulcinea'], note='Normal difficulty; actual reward, equipment, mastery, spell study, formation, and save reload verified.'),
                            dict(country='France', original='书剑恩仇录', status='cleared' if formation_matched else 'needs-review', companions=['Milady de Winter', "D’Artagnan"], note='Ending and required deployment verified; this does not establish original-engine difficulty parity.' if formation_matched else 'Ending and rewards reached, but the required final deployment was not enforced. This is NOT complete combat or difficulty validation. The host defect remains unresolved.'),
                            dict(country='Italy', original='鸳鸯刀', status='blocked', companions=[], note='First two fights won twice; the original solo finale lost twice. Pinocchio has NOT been recruited. Blue Fairy is a story ally.')])
    if alternate:
        result['alternate'] = dict(passed=True, sourceSave=alternate['sourceSave'], sourceSha256=alternate['sourceSha256'], battles=[e['data']['id'] for e in alternate['events'] if e['kind']=='battle-end'], checkpoints=alternate['checkpoints'])
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'data.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    # Full evidence includes the failed trial and the subsequent successful
    # two-story retest. The smaller viewer never needs to parse combat telemetry.
    (output / 'observations.json').write_text(json.dumps(dict(initial=first, retest=second, knight=alternate), ensure_ascii=False, separators=(',', ':')) + '\n')
    saves = output / 'checkpoints'
    saves.mkdir(exist_ok=True)
    manifest = []
    for name, path in [('start', ROOT / second['sourceSave']), ('spain-trained', Path(retest).parent / 'spain-trained.json'), ('france-complete', Path(retest).parent / 'france-complete.json'), ('italy-ready', Path(original).parent / 'italy-ready.json'), ('italy-trained', Path(original).parent / 'italy-trained.json')]:
        raw = path.read_bytes()
        (saves / (name + '.json')).write_bytes(raw)
        manifest.append(dict(name=name, sha256=hashlib.sha256(raw).hexdigest(), bytes=len(raw)))
    (saves / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    if alternate:
        for name, path in [('knight-start', ROOT / alternate['sourceSave']), ('knight-ending', Path(knight).parent / 'knight-ending.json')]:
            raw = path.read_bytes()
            (saves / (name + '.json')).write_bytes(raw)
            manifest.append(dict(name=name, sha256=hashlib.sha256(raw).hexdigest(), bytes=len(raw)))
        (saves / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    for path in (WEB / 'playthrough').iterdir():
        if path.is_file():
            shutil.copyfile(path, output / path.name)
    return dict(rows=len(rows), outcomes=result['outcomes'], performance=perf)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--original', required=True)
    parser.add_argument('--retest', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--before')
    parser.add_argument('--after')
    parser.add_argument('--knight')
    args = parser.parse_args()
    print(json.dumps(build(args.output, args.original, args.retest, args.before, args.after, args.knight), ensure_ascii=False, indent=2))
