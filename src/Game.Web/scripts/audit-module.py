#!/usr/bin/env python3
import argparse
import json
from content_modules import verify, selected_module, WEB

parser = argparse.ArgumentParser(description='Check every module resource against its frozen baseline.')
parser.add_argument('--module')
parser.add_argument('--root', default=str(WEB / 'public'))
args = parser.parse_args()
module = selected_module(args.module)
manifest, entries = verify(module, args.root)
print(json.dumps({'module': module, 'verifiedFiles': len(entries), 'bytes': sum(e['bytes'] for e in entries),
    'baselineSource': manifest.get('source', {}).get('sourceCommit'), 'dataAndMediaUnchanged': True}, indent=2))
