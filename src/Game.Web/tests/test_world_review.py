"""Cover source completeness and branch meaning in the editorial export."""
import copy
import csv
import hashlib
import io
import json
import sys
import unittest
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WEB / 'scripts'))
from grimm_skin import apply_skin,load_skin
from world_review import COPY_FIELDS, csv_bytes, get_at, make_copy_rows, make_flow_rows


class WorldReviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = (WEB / 'public/data/packs/jyx/content-package.json').read_bytes()
        cls.source = json.loads(cls.raw)
        cls.sha = hashlib.sha256(cls.raw).hexdigest()
        skin = load_skin(WEB)
        cls.localized = {lang: apply_skin(cls.raw, skin, lang)[0] for lang in ['zh-CN', 'en']}
        cast = json.loads((WEB / 'content/worlds/cast-map.json').read_text())
        cls.before = copy.deepcopy(cls.source)
        cls.texts = make_copy_rows(cls.source, cls.localized, cast, cls.sha)
        cls.flows = make_flow_rows(cls.source, cls.sha)

    def test_every_source_dialogue_and_non_dialogue_step_is_accounted_for(self):
        kinds = []
        def walk(value):
            if isinstance(value, dict):
                if 'kind' in value:
                    kinds.append(value['kind'])
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)
        walk(self.source['storyScripts'])
        self.assertEqual(kinds.count('dialogue'), 8577)
        self.assertEqual(sum(row['source_line_count'] for row in self.texts), 8577)
        for kind in set(kinds) - {'dialogue'}:
            self.assertEqual(sum(row['kind'] == kind for row in self.flows), kinds.count(kind), kind)
        self.assertEqual(self.source, self.before)
        self.assertEqual(hashlib.sha256((WEB / 'public/data/packs/jyx/content-package.json').read_bytes()).hexdigest(), self.sha)

    def test_shortened_opening_has_one_honest_comparison_and_keeps_reward_separate(self):
        opening = [r for r in self.texts if r['segment_id'] == '新手村_南贤开场' and r['kind'] == 'dialogue_run']
        self.assertEqual(len(opening), 1)
        self.assertEqual(opening[0]['source_line_count'], 23)
        self.assertEqual(opening[0]['new_en'].count('\n\n') + 1, 6)
        self.assertIn('Grimm', opening[0]['new_en'])
        village = [r for r in self.flows if r['segment_id'] == '新手村_小村介绍']
        reward = next(r for r in village if r['item_id'] == '内功入门')
        self.assertEqual(reward['action'], "item('内功入门', 1)")

    def test_untranslated_material_stays_blank_and_candidates_are_not_claimed_implemented(self):
        rows = [r for r in self.texts if r['segment_id'] == '倚天屠龙_张无忌']
        self.assertTrue(rows)
        self.assertTrue(all(r['status'] == 'pending' and r['new_en'] == r['new_zh_CN'] == '' for r in rows))
        self.assertTrue(any('哪吒' in r['proposed_speakers'] for r in rows))

    def test_source_pointers_resolve_and_ids_do_not_depend_on_new_copy(self):
        for row in self.texts + self.flows:
            path = [part.replace('~1', '/').replace('~0', '~') for part in row['source_pointer'].split('/')[1:]]
            value = self.source
            for part in path:
                value = value[int(part)] if isinstance(value, list) else value[part]
            self.assertIsNotNone(value)
        altered = copy.deepcopy(self.localized)
        segment = next(s for s in altered['en']['storyScripts']['legacy']['segments'] if s['name'] == '新手村_南贤开场')
        segment['steps'][0]['text'] = 'A different opening.'
        cast = json.loads((WEB / 'content/worlds/cast-map.json').read_text())
        changed = make_copy_rows(self.source, altered, cast, self.sha)
        self.assertEqual([r['row_id'] for r in changed], [r['row_id'] for r in self.texts])

    def test_map_entrances_and_host_task_conditions_are_exported_verbatim(self):
        expected = sum(len(l.get('events', [])) for m in self.source['maps'] for l in m.get('locations', []))
        self.assertEqual(sum(r['kind'] == 'map_event' for r in self.flows), expected)
        task = self.source['browser']['legacyTasks'][0]
        entry = next(r for r in self.flows if r['source_pointer'] == '/browser/legacyTasks/0/storyId')
        self.assertEqual(entry['target_story_id'], task['storyId'])
        self.assertEqual(json.loads(entry['conditions']), [task['when']])
        condition = self.source['browser']['companionConditions'][0]
        row = next(r for r in self.flows if r['source_pointer'] == '/browser/companionConditions/0')
        self.assertEqual(json.loads(row['conditions']), [condition['expression']])

    def test_branch_fallback_battle_and_choice_contexts_remain_distinct(self):
        fixture = {'storyScripts': {'test': {'segments': [{'name': 'test', 'steps': [
            {'kind': 'branch', 'cases': [
                {'when': 'first', 'steps': [{'kind': 'jump', 'target': 'one'}]},
                {'when': 'second', 'steps': [{'kind': 'command', 'call': "join('ally')"}]}],
             'fallback': [{'kind': 'battle', 'battleId': 'fight', 'outcomes': {
                 'win': [{'kind': 'command', 'call': "item('reward', 2)"}],
                 'lose': [{'kind': 'jump', 'target': 'retry'}]}}]},
            {'kind': 'options', 'options': [{'text': 'Accept', 'steps': [{'kind': 'jump', 'target': 'accepted'}]}]}
        ]}]}}, 'maps': [], 'worldTriggers': [], 'sects': [], 'browser': {}}
        rows = make_flow_rows(fixture, 'test')
        ally = next(r for r in rows if r['join_character_id'])
        self.assertEqual(json.loads(ally['conditions']), ['!(first)', 'second'])
        reward = next(r for r in rows if r['item_id'])
        self.assertEqual(json.loads(reward['conditions']), ['!(first)', '!(second)', 'battle_outcome=win'])
        retry = next(r for r in rows if r['target_story_id'] == 'retry')
        self.assertIn('battle_outcome=lose', json.loads(retry['conditions']))
        accepted = next(r for r in rows if r['target_story_id'] == 'accepted')
        self.assertEqual(json.loads(accepted['conditions']), ['selected_option=0: Accept'])

    def test_csv_round_trip_multiline_quotes_and_spreadsheet_formula_text(self):
        row = dict(self.texts[0])
        row['source_text'] = '包含逗号, 引号"和\n换行'
        row['new_en'] = '=HYPERLINK("test")'
        data = csv_bytes([row], COPY_FIELDS)
        self.assertTrue(data.startswith(b'\xef\xbb\xbf'))
        actual = list(csv.DictReader(io.StringIO(data.decode('utf-8-sig'))))[0]
        self.assertEqual(actual['source_text'], row['source_text'])
        self.assertEqual(actual['new_en'], "'" + row['new_en'])
        self.assertEqual(actual['row_id'], row['row_id'])

    def test_renaming_a_speaker_alone_does_not_claim_a_route_is_rewritten(self):
        rows = [r for r in self.texts if r['segment_id'] == '倚天屠龙_张无忌' and r['kind'] == 'dialogue_run']
        self.assertTrue(rows)
        self.assertTrue(all(r['status'] == 'pending' and not r['new_en'] for r in rows))


if __name__ == '__main__':
    unittest.main()
