#!/usr/bin/env python3
"""Decode the uploaded Unity audio data; never load its game assemblies."""
from pathlib import Path
import argparse
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
import hashlib
import json
import subprocess
import xml.etree.ElementTree as ET
import UnityPy
from collections import defaultdict


def bind_resources(manifest, web):
    by_name = defaultdict(set)
    for path, url in manifest['paths'].items(): by_name[Path(path).name].add(url)
    manifest['resources'] = {}
    manifest['bindings'] = {}
    for resource in ET.parse(web.parents[1] / 'jyx-legacy-data/data-origin/resource.xml').getroot():
        path = resource.get('value', '').lower()
        exact = manifest['paths'].get(path)
        candidates = by_name.get(Path(path).name, set())
        if exact or len(candidates) == 1:
            key = resource.get('key')
            manifest['resources'][key] = exact or next(iter(candidates))
            manifest['bindings'][key] = {"sourcePath": resource.get('value'), "match": "exact" if exact else "unique-basename"}

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("data", type=Path)
parser.add_argument("--map-only", action="store_true")
args = parser.parse_args()
web = Path(__file__).resolve().parents[1]
source = args.data / 'StreamingAssets/audios'
if hashlib.sha256(source.read_bytes()).hexdigest() != '8a953753c0c5f6a267fce2001f3046c252b9fbbfce0f1cabd6c8f8f14728e90c':
    raise ValueError('Audio bundle does not match the reviewed X1.0.0.1 upload')
if args.map_only:
    target = web / 'public/art/legacy/audio-manifest.json'
    manifest = json.loads(target.read_text())
    assert hashlib.sha256(source.read_bytes()).hexdigest() == manifest['source']['sha256']
    bind_resources(manifest, web)
    for key in ['paths', 'resources', 'bindings', 'files']: manifest[key] = dict(sorted(manifest[key].items()))
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print('Mapped', len(manifest['resources']), 'original audio resource IDs')
    raise SystemExit()
env = UnityPy.load(str(source))
output = web / 'public/art/legacy'
(output / 'audio').mkdir(parents=True, exist_ok=True)
manifest = {"schemaVersion": 1, "source": {"archive": "X.rar", "versionLabel": "X1.0.0.1",
    "bundle": "StreamingAssets/audios", "sha256": hashlib.sha256(source.read_bytes()).hexdigest()},
    "paths": {}, "resources": {}, "files": {}, "clips": 0}
aliases = {}
for name, pointer in env.container.items():
    obj = pointer.deref()
    if obj.type.name == 'AudioClip':
        aliases.setdefault(obj.path_id, []).append('audios/' + name.lower().split('/audios/', 1)[1])


def encode(wav, names):
    result = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-map_metadata', '-1',
        '-c:a', 'libmp3lame', '-q:a', '5', '-threads', '1', '-write_xing', '0', '-id3v2_version', '0',
        '-f', 'mp3', 'pipe:1'], input=wav, capture_output=True, check=True)
    digest = hashlib.sha256(result.stdout).hexdigest()
    relative = 'audio/' + digest[:20] + '.mp3'
    (output / relative).write_bytes(result.stdout)
    return names, relative, {"sha256": digest, "bytes": len(result.stdout)}


def collect(futures):
    for f in futures:
        names, relative, entry = f.result()
        for name in names: manifest['paths'][name] = 'art/legacy/' + relative
        manifest['files'][relative] = entry
        manifest['clips'] += 1


pending = set()
with ThreadPoolExecutor(max_workers=3) as pool:
    for obj in env.objects:
        if obj.type.name != 'AudioClip': continue
        names = aliases.get(obj.path_id, [])
        samples = obj.read().samples
        if len(samples) != 1: raise ValueError('Expected one decoded audio stream per original clip')
        pending.add(pool.submit(encode, next(iter(samples.values())), names))
        if len(pending) >= 3:
            done, pending = wait(pending, return_when=FIRST_COMPLETED)
            collect(done)
    collect(pending)
bind_resources(manifest, web)
for key in ['paths', 'resources', 'bindings', 'files']: manifest[key] = dict(sorted(manifest[key].items()))
(output / 'audio-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'clips': manifest['clips'], 'resources': len(manifest['resources']),
    'bytes': sum(f['bytes'] for f in manifest['files'].values())}))
