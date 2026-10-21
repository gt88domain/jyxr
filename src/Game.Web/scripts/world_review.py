"""Read-only, source-addressed copy and flow exports for editorial review.

Dialogue runs are units so a 23-line introduction can be compared with its
six-line rewrite without pretending the remaining old lines were translated.
CSV files are review drafts, not executable content or an automatic import.
"""
import collections
import csv
import hashlib
import io
import json
import re
from pathlib import Path

from grimm_skin import apply_skin

WEB = Path(__file__).resolve().parents[1]
TEXT_KEYS = {'name', 'description', 'text', 'title', 'subtitle', 'chapterTitle',
             'defaultName', 'currencyName', 'currencyUnit', 'primaryFocus'}
COPY_FIELDS = ['row_id', 'category', 'owner_id', 'script_id', 'segment_id', 'kind',
               'speaker_ids', 'proposed_speakers', 'countries', 'source_text',
               'new_zh_CN', 'new_en', 'status', 'notes', 'source_pointer',
               'source_line_count', 'source_sha256']
FLOW_FIELDS = ['row_id', 'category', 'owner_id', 'script_id', 'segment_id', 'kind',
               'conditions', 'action', 'target_story_id', 'target_map_id',
               'battle_id', 'item_id', 'join_character_id', 'detail_json',
               'source_pointer', 'source_sha256']


def encoded(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def pointer(path):
    return '/' + '/'.join(str(x).replace('~', '~0').replace('/', '~1') for x in path)


def row_id(prefix, path):
    return prefix + '-' + hashlib.sha256(pointer(path).encode()).hexdigest()[:20]


def story_units(value, path=()):
    """Walk display fields in semantic order; group only adjacent dialogue nodes."""
    if isinstance(value, list):
        index = 0
        while index < len(value):
            item = value[index]
            if isinstance(item, dict) and item.get('kind') == 'dialogue':
                end = index + 1
                while end < len(value) and isinstance(value[end], dict) and value[end].get('kind') == 'dialogue':
                    end += 1
                yield {'path': path + (index,), 'kind': 'dialogue_run', 'nodes': value[index:end],
                       'text': '\n\n'.join(n.get('speaker', '') + '：' + n['text'] for n in value[index:end])}
                index = end
            else:
                yield from story_units(item, path + (index,))
                index += 1
    elif isinstance(value, dict):
        for key, item in value.items():
            if key == 'text' and isinstance(item, str):
                yield {'path': path + (key,), 'kind': 'text', 'nodes': [], 'text': item,
                       'speaker': value.get('speaker', '')}
            elif key == 'call' and isinstance(item, str):
                match = re.fullmatch(r"(journal|suggest)\('((?:[^'\\]|\\.)*)'\)", item)
                if match:
                    yield {'path': path + (key,), 'kind': match[1], 'nodes': [], 'text': match[2]}
            elif isinstance(item, (list, dict)):
                yield from story_units(item, path + (key,))


def display_fields(value, path=()):
    if isinstance(value, dict):
        for key, item in value.items():
            if key in {'media', 'resources'}:
                continue
            if isinstance(item, str) and (key in TEXT_KEYS or (path and path[-1] == 'terms')):
                yield path + (key,), item
            elif isinstance(item, (dict, list)):
                yield from display_fields(item, path + (key,))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from display_fields(item, path + (index,))


def get_at(value, path):
    for key in path:
        value = value[key]
    return value


def make_copy_rows(original, localized, cast, source_sha):
    actors = {}
    for actor in cast['actors']:
        for name in [actor['legacyIdentity'], *actor['legacyNames'], *[f['legacyId'] for f in actor['forms']]]:
            actors.setdefault(name, []).append(actor)

    def make_row(path, category, owner, source, current, kind, speakers=(), script='', segment='', line_count=0):
        proposals, countries = [], set()
        for speaker in dict.fromkeys(speakers):
            for actor in actors.get(speaker, []):
                label = speaker + ' → ' + actor['name']['zh-CN'] + ' / ' + actor['name']['en'] + ' [' + actor['status'] + ']'
                if label not in proposals:
                    proposals.append(label)
                countries.update(actor['relatedCountries'])
        translated = {lang: text if text != source else '' for lang, text in current.items()}
        return {'row_id': row_id('copy', path), 'category': category, 'owner_id': owner,
                'script_id': script, 'segment_id': segment, 'kind': kind,
                'speaker_ids': '\n'.join(dict.fromkeys(speakers)), 'proposed_speakers': '\n'.join(proposals),
                'countries': ','.join(sorted(countries)), 'source_text': source,
                'new_zh_CN': translated['zh-CN'], 'new_en': translated['en'],
                'status': 'implemented' if any(translated.values()) else 'pending', 'notes': '',
                'source_pointer': pointer(path), 'source_line_count': line_count, 'source_sha256': source_sha}

    rows = []
    for script_id, script in original['storyScripts'].items():
        for index, segment in enumerate(script['segments']):
            prefix = ('storyScripts', script_id, 'segments', index)
            before = list(story_units(segment['steps'], prefix + ('steps',)))
            after = {locale: list(story_units(package['storyScripts'][script_id]['segments'][index]['steps']))
                     for locale, package in localized.items()}
            if any(len(units) != len(before) for units in after.values()):
                raise ValueError('Display unit boundaries changed: ' + segment['name'])
            for position, unit in enumerate(before):
                if any(units[position]['kind'] != unit['kind'] for units in after.values()):
                    raise ValueError('Display unit kind changed: ' + segment['name'])
                speakers = [node.get('speaker', '') for node in unit['nodes']] or [unit.get('speaker', '')]
                # A translated speaker label alone is not rewritten dialogue.
                current = {lang: units[position]['text'] if unit['kind'] != 'dialogue_run' or
                           [n['text'] for n in unit['nodes']] != [n['text'] for n in units[position]['nodes']]
                           else unit['text'] for lang, units in after.items()}
                rows.append(make_row(unit['path'], 'storyScripts', segment['name'], unit['text'], current,
                                     unit['kind'], [s for s in speakers if s], script_id, segment['name'], len(unit['nodes'])))
    for category, collection in original.items():
        if category in {'storyScripts', 'resources'}:
            continue
        for path, source in display_fields(collection, (category,)):
            owner = category
            if isinstance(collection, list) and len(path) > 1:
                definition = collection[path[1]]
                if isinstance(definition, dict):
                    owner = definition.get('id', definition.get('name', category))
            speakers = [owner] if category == 'characters' else []
            rows.append(make_row(path, category, owner, source,
                                 {lang: get_at(package, path) for lang, package in localized.items()},
                                 str(path[-1]), speakers))
    # Locations often display their stable ID until an explicit label is added.
    # Point the comparison at that existing ID, never treat it as editable data.
    for i, game_map in enumerate(original['maps']):
        for j, location in enumerate(game_map.get('locations', [])):
            names = {lang: package['maps'][i]['locations'][j].get('name', location['id']) for lang,package in localized.items()}
            if 'name' not in location and any(name != location['id'] for name in names.values()):
                rows.append(make_row(('maps',i,'locations',j,'id'), 'maps', game_map['id']+'/'+location['id'],
                                     location['id'], names, 'display_label'))
    ids = [row['row_id'] for row in rows]
    if len(set(ids)) != len(ids):
        raise ValueError('Duplicate copy row identity')
    return rows


def make_flow_rows(package, source_sha):
    rows = []

    def add(path, category, owner, kind, conditions=(), action='', script='', segment='', detail=None):
        detail = detail or {}
        targets = {'target_story_id': detail.get('target', '') if kind == 'jump' else '',
                   'target_map_id': '', 'battle_id': detail.get('battleId', ''), 'item_id': '', 'join_character_id': ''}
        # Read only literal first arguments. Keep every original action intact;
        # this index never evaluates conditions or invents dynamic destinations.
        for call, target in [('story', 'target_story_id'), ('map', 'target_map_id'),
                             ('item', 'item_id'), ('join', 'join_character_id')]:
            match = re.match(r"^" + call + r"\(\s*'([^']*)'", action)
            if match:
                targets[target] = match[1]
        rows.append({'row_id': row_id('flow', path), 'category': category, 'owner_id': owner,
                     'script_id': script, 'segment_id': segment, 'kind': kind,
                     'conditions': encoded(list(conditions)), 'action': action, **targets,
                     'detail_json': encoded(detail), 'source_pointer': pointer(path), 'source_sha256': source_sha})

    def walk(value, path, script, segment, conditions=()):
        if isinstance(value, list):
            for i, item in enumerate(value):
                walk(item, path + (i,), script, segment, conditions)
        elif isinstance(value, dict):
            kind = value.get('kind')
            if kind and kind != 'dialogue':
                # Child branches get their own rows; do not repeat entire trees.
                detail = {k: v for k, v in value.items() if k not in {'steps', 'blocks', 'options', 'cases', 'fallback', 'outcomes'}}
                add(path, 'storyScripts', segment, kind, conditions, value.get('call', ''), script, segment, detail)
            if kind == 'branch':
                tests = [case['when'] for case in value['cases']]
                for i, case in enumerate(value['cases']):
                    context = (*conditions, *['!(' + test + ')' for test in tests[:i]], case['when'])
                    walk(case['steps'], path + ('cases', i, 'steps'), script, segment, context)
                walk(value.get('fallback', []), path + ('fallback',), script, segment,
                     (*conditions, *['!(' + test + ')' for test in tests]))
                return
            for key, item in value.items():
                if key == 'outcomes' and kind == 'battle':
                    for outcome, steps in item.items():
                        walk(steps, path + (key, outcome), script, segment, (*conditions, 'battle_outcome=' + outcome))
                elif key == 'options' and kind == 'options':
                    for index, option in enumerate(item):
                        context = (*conditions, 'selected_option=' + str(index) + ': ' + option['text'])
                        option_path = path + (key, index)
                        add(option_path, 'storyScripts', segment, 'option', context, script=script, segment=segment,
                            detail={k: v for k, v in option.items() if k != 'steps'})
                        walk(option['steps'], option_path + ('steps',), script, segment, context)
                elif isinstance(item, (dict, list)):
                    walk(item, path + (key,), script, segment, conditions)

    for script_id, script in package['storyScripts'].items():
        for index, segment in enumerate(script['segments']):
            walk(segment['steps'], ('storyScripts', script_id, 'segments', index, 'steps'), script_id, segment['name'])
    for i, game_map in enumerate(package['maps']):
        for j, location in enumerate(game_map.get('locations', [])):
            for k, event in enumerate(location.get('events', [])):
                add(('maps', i, 'locations', j, 'events', k), 'maps', game_map['id'], 'map_event',
                    (event.get('when', 'true'),), event['action'],
                    detail={'map_id': game_map['id'], 'location_id': location['id'], **event})
    for i, trigger in enumerate(package['worldTriggers']):
        add(('worldTriggers', i), 'worldTriggers', trigger['id'], 'world_trigger',
            (trigger.get('when', 'true'),), trigger['action'], detail=trigger)
    for i, sect in enumerate(package['sects']):
        if sect.get('storyId'):
            add(('sects', i, 'storyId'), 'sects', sect['id'], 'sect_entry', action="story('" + sect['storyId'] + "')")
    # Host-configured entrances are separate from map event conditions.
    def browser_entries(value, path, conditions=()):
        if isinstance(value, dict):
            context = (*conditions, value['when']) if isinstance(value.get('when'), str) else conditions
            if path and len(path) > 1 and path[1] == 'companionConditions' and isinstance(value.get('expression'), str):
                add(path, 'browser', value.get('id', 'companionConditions'), 'host_condition_reference',
                    (value['expression'],), detail=value)
            for key, item in value.items():
                if (key == 'storyId' or key.endswith('StoryId')) and isinstance(item, str):
                    add(path + (key,), 'browser', value.get('id', key), 'host_story_reference', context,
                        action="story('" + item + "')")
                elif key == 'companionRecruitmentStories':
                    for index, story in enumerate(item):
                        add(path + (key, index), 'browser', key, 'host_story_reference', context,
                            action="story('" + story + "')")
                elif isinstance(item, (dict, list)):
                    browser_entries(item, path + (key,), context)
        elif isinstance(value, list):
            for index, item in enumerate(value):
                browser_entries(item, path + (index,), conditions)
    browser_entries(package['browser'], ('browser',))
    if len({r['row_id'] for r in rows}) != len(rows):
        raise ValueError('Duplicate flow row identity')
    return rows


def csv_bytes(rows, fields):
    stream = io.StringIO(newline='')
    writer = csv.DictWriter(stream, fieldnames=fields)
    writer.writeheader()
    for row in rows:
        # Spreadsheet review must not interpret source text as a formula.
        writer.writerow({key: "'" + value if isinstance(value, str) and value.lstrip().startswith(('=', '+', '-', '@')) else value
                         for key, value in row.items() if key in fields})
    return ('\ufeff' + stream.getvalue()).encode('utf8')


def build_review(output, web=WEB):
    raw = (web / 'public/data/packs/jyx/content-package.json').read_bytes()
    source_sha = hashlib.sha256(raw).hexdigest()
    skin = json.loads((web / 'content/worlds/grimm-skin.json').read_text())
    localized = {locale: apply_skin(raw, skin, locale)[0] for locale in ['zh-CN', 'en']}
    original = json.loads(raw)
    cast = json.loads((web / 'content/worlds/cast-map.json').read_text())
    texts = make_copy_rows(original, localized, cast, source_sha)
    flows = make_flow_rows(original, source_sha)
    segments = [s['name'] for script in original['storyScripts'].values() for s in script['segments']]
    known = set(segments)
    unresolved = sorted({r['target_story_id'] for r in flows if r['target_story_id'] and r['target_story_id'] not in known})
    summary = {'schemaVersion': 1, 'sourceSha256': source_sha, 'segments': len(segments),
               'sourceDialogueLines': sum(row['source_line_count'] for row in texts), 'textUnits': len(texts),
               'implementedUnits': sum(row['status'] == 'implemented' for row in texts), 'flowNodes': len(flows),
               'mapEvents': sum(row['kind'] == 'map_event' for row in flows),
               'categories': dict(collections.Counter(row['category'] for row in texts)),
               'unresolvedStoryReferences': unresolved, 'reachabilityVerified': False,
               'csvImportSupported': False, 'scope': 'Content-package display fields and static flow references; UI source strings and executable-condition reachability are not included.'}
    output.mkdir(parents=True, exist_ok=True)
    for name, rows, fields in [('copy', texts, COPY_FIELDS), ('flow', flows, FLOW_FIELDS)]:
        (output / (name + '.json')).write_text(encoded(rows) + '\n', encoding='utf8')
        (output / (name + '.csv')).write_bytes(csv_bytes(rows, fields))
    (output / 'manifest.json').write_text(encoded({'summary': summary, 'segments': segments}) + '\n', encoding='utf8')
    return summary


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=WEB.parents[1] / 'artifacts/world-review')
    args = parser.parse_args()
    print(json.dumps(build_review(args.output), ensure_ascii=False, indent=2))
