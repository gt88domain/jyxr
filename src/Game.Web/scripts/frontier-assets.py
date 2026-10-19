#!/usr/bin/env python3
"""Restore four existing generated images and verify their locked hashes."""
import hashlib,json,os,tempfile,urllib.request
from pathlib import Path

web=Path(__file__).resolve().parents[1]
manifest=json.loads((web/'content/frontier/manifest.json').read_text(encoding='utf-8'))
for entry in manifest['assets']:
    target=web/'public'/entry['path'];target.parent.mkdir(parents=True,exist_ok=True)
    if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest()==entry['sha256']:continue
    with urllib.request.urlopen(entry['url'],timeout=60) as response:data=response.read()
    if hashlib.sha256(data).hexdigest()!=entry['sha256']:raise ValueError(f"Asset checksum mismatch: {entry['path']}")
    fd,name=tempfile.mkstemp(prefix='.restore-',dir=target.parent)
    try:
        with os.fdopen(fd,'wb') as stream:stream.write(data)
        os.replace(name,target)
    finally:Path(name).unlink(missing_ok=True)
print(f"Verified {len(manifest['assets'])} generated frontier images")
