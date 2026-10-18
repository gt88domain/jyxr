#!/usr/bin/env python3
"""Extract TextAssets from the pinned reference's Unity bundle as data only."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
import UnityPy

PIN='4acd2c718a8afc562f0d5a0cd38464fea6699453'
parser=argparse.ArgumentParser();parser.add_argument('--reference-root',type=Path,required=True);args=parser.parse_args()
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=args.reference_root,text=True).strip()==PIN
source='Assets/StreamingAssets/xml';raw=subprocess.check_output(['git','show',PIN+':'+source],cwd=args.reference_root)
blob=subprocess.check_output(['git','rev-parse',PIN+':'+source],cwd=args.reference_root,text=True).strip()
assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob
files={}
for obj in UnityPy.load(raw).objects:
    if obj.type.name!='TextAsset':continue
    data=obj.read();name=data.m_Name
    assert name not in ['.','..'] and '/' not in name and '\\' not in name
    text=data.m_Script;text=text.encode('utf-8',errors='surrogateescape') if isinstance(text,str) else text
    ET.fromstring(text);assert name not in files
    files[name]={'sha256':hashlib.sha256(text).hexdigest(),'bytes':len(text),'xml':text.decode('utf-8-sig')}
result={'schemaVersion':1,'repository':'https://github.com/UnicomGamer/X-Heroes-of-Jin-Yong','commit':PIN,'bundle':{'path':source,'gitBlob':blob,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)},'scope':'Bundled data in the pinned reverse-engineered repository; not independently verified against an official distributed1.1.0.6 executable.','files':files}
web=Path(__file__).resolve().parents[1];(web/'reference-materials/late-runtime.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Verified original bundle and extracted '+str(len(files))+' XML TextAssets without running assemblies')
