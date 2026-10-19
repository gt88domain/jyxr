#!/usr/bin/env python3
"""Build the independent frontier module without original-game repositories."""
import hashlib
import importlib.util
import json
from pathlib import Path

WEB=Path(__file__).resolve().parents[1]

def build():
    folder=WEB/'content/frontier'
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
    if manifest['schemaVersion']!=1 or manifest['id']!='frontier':
        raise ValueError('Unsupported frontier module manifest')
    spec=importlib.util.spec_from_file_location('frontier_chapter',folder/'chapter.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    package=module.build_frontier()
    if package['browser']['id']!=manifest['id']:raise ValueError('Content identity differs from manifest')
    package['browser']['contentVersion']=manifest['version']
    for category,values in package.items():
        if isinstance(values,list):
            ids=[value['id'] for value in values if 'id' in value]
            if len(ids)!=len(set(ids)):raise ValueError(f'Duplicate IDs in {category}')
    for entry in manifest['assets']:
        path=WEB/'public'/entry['path']
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=entry['sha256']:
            raise ValueError(f"Missing or changed asset {entry['path']}; run npm run assets:restore")
    output=WEB/'public/data';output.mkdir(parents=True,exist_ok=True)
    def write(path,payload):
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    write(output/'packs/frontier/content-package.json',package)
    write(output/'packs/index.json',{'schemaVersion':1,'defaultPackId':'frontier','packs':[{
        'id':'frontier','title':package['browser']['title'],'subtitle':package['browser']['subtitle'],
        'description':package['browser']['description'],'url':'packs/frontier/content-package.json'}]})
    write(output/'module-manifest.json',manifest)
    print(f"Built frontier {manifest['version']}: {len(package['maps'])} maps, {len(package['battles'])} battles; no original content dependency")

if __name__=='__main__':build()
