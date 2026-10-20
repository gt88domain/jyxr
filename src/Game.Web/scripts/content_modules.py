"""Shared content-module build and verified asset restoration."""
import concurrent.futures
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import tempfile
import urllib.parse
import urllib.request

WEB = Path(__file__).resolve().parents[1]

def selected_module(value=None):
    module = value or os.environ.get('GAME_MODULE', 'jyx')
    if module not in {'jyx', 'frontier'}:
        raise ValueError(f'Unknown content module: {module}')
    return module

def manifest_for(module):
    folder = WEB / 'content' / selected_module(module)
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    if manifest['schemaVersion'] != 1 or manifest['id'] != module:
        raise ValueError('Invalid content-module identity')
    entries = manifest.get('assets')
    if entries is None:
        entries = json.loads((folder / manifest['inventory']).read_text(encoding='utf-8'))['files']
    paths = set()
    for entry in entries:
        path = PurePosixPath(entry['path'])
        if path.is_absolute() or '..' in path.parts or '\\' in str(path) or str(path) in paths:
            raise ValueError(f'Invalid or duplicate resource path: {path}')
        paths.add(str(path))
    return folder, manifest, entries

def matches(path, entry):
    return path.is_file() and path.stat().st_size == entry['bytes'] and hashlib.sha256(path.read_bytes()).hexdigest() == entry['sha256']

def verify(module, root=None):
    _, manifest, entries = manifest_for(module)
    root = Path(root) if root else WEB / 'public'
    for entry in entries:
        if not matches(root / entry['path'], entry):
            raise ValueError(f"Missing or changed resource: {entry['path']}; run npm run assets:restore")
    return manifest, entries

def restore(module, source=None):
    _, manifest, entries = manifest_for(module)
    source = Path(source).resolve() if source else None
    def one(entry):
        target = WEB / 'public' / entry['path']
        if matches(target, entry):
            return
        if source:
            data = (source / entry['path']).read_bytes()
        else:
            url = entry.get('url') or manifest['source']['baseUrl'] + urllib.parse.quote(entry['path'], safe='/')
            with urllib.request.urlopen(url, timeout=45) as response:
                data = response.read()
        if len(data) != entry['bytes'] or hashlib.sha256(data).hexdigest() != entry['sha256']:
            raise ValueError(f"Resource checksum mismatch: {entry['path']}")
        target.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix='.restore-', dir=target.parent)
        try:
            with os.fdopen(fd, 'wb') as stream:
                stream.write(data)
            os.replace(temporary, target)
        finally:
            Path(temporary).unlink(missing_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(one, entries))
    print(f'Verified {len(entries)} resources for {module}')

def write(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def build(module):
    folder, manifest, _ = manifest_for(module)
    verify(module)
    output = WEB / 'public/data'
    if module == 'frontier':
        spec = importlib.util.spec_from_file_location('frontier_chapter', folder / manifest['entry'])
        chapter = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(chapter)
        package = chapter.build_frontier()
        package['browser']['contentVersion'] = manifest['version']
        for category, values in package.items():
            if isinstance(values, list):
                ids = [value['id'] for value in values if 'id' in value]
                if len(ids) != len(set(ids)):
                    raise ValueError(f'Duplicate IDs in {category}')
        write(output / 'packs/frontier/content-package.json', package)
    else:
        # The locked package is used as-is. No converter, numerical edits,
        # story rewriting or version merging is performed during this build.
        package = json.loads((WEB / 'public' / manifest['entry']).read_text(encoding='utf-8'))
    browser = package['browser']
    if browser['id'] != module:
        raise ValueError('Runtime content identity differs from module manifest')
    write(output / 'packs/index.json', {'schemaVersion': 1, 'defaultPackId': module, 'packs': [{
        'id': module, 'title': browser['title'], 'subtitle': browser['subtitle'],
        'description': browser['description'], 'url': f'packs/{module}/content-package.json'}]})
    write(output / 'module-manifest.json', manifest)
    print(f"Built {module} {manifest['version']}: {len(package['maps'])} maps, "
          f"{sum(len(script['segments']) for script in package['storyScripts'].values())} story segments")
