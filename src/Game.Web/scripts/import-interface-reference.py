"""Copy a small, pinned set of official UI originals; never execute old game code."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--reference-root',type=Path,required=True)
args=parser.parse_args()
commit='3fa22b12126bd1e7a3cc2645a4cb200216643175'
prefix='JyGameSilverlight/JyGame/Resource/ui/'
names=['help0.jpg','UI-kuang8.png','skillbox.png','button_zhuangtai.png',
       'button_wupin.png','button_rizhi.png','button_xitong.png','button_jineng.png']
web=Path(__file__).resolve().parents[1]
output=web/'public/art/legacy-interface'
output.mkdir(parents=True,exist_ok=True)
record={'schemaVersion':1,'repository':'https://github.com/hansquirrel/JyGameSilverlight',
        'commit':commit,'version':'Official Silverlight 0.6.x reference',
        'scope':'Original tutorial screenshot with its original annotations and UI image assets; not a screenshot of the browser remake or proof of Unity 1.0/1.1 layout.',
        'ownership':'Original ownership, license and notices remain applicable. Images are copied byte-for-byte, not newly authored artwork.',
        'license':'GPL-3.0; retain the upstream README copyright and noncommercial notice. No new license is granted to the original artwork.',
        'files':[]}
for name in names:
    source=prefix+name
    raw=subprocess.check_output(['git','show',commit+':'+source],cwd=args.reference_root)
    destination=output/name
    if destination.exists() and destination.read_bytes()!=raw:
        raise SystemExit('Existing media differs; preserve it before replacing: '+str(destination))
    destination.write_bytes(raw)
    record['files'].append({'source':source,'path':'art/legacy-interface/'+name,
                            'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
notices=web/'public/notices'
notices.mkdir(parents=True,exist_ok=True)
for source,destination in [('LICENSE','jygame-silverlight-LICENSE.txt'),('README.md','jygame-silverlight-README.md')]:
    raw=subprocess.check_output(['git','show',commit+':'+source],cwd=args.reference_root)
    (notices/destination).write_bytes(raw)
record['notices']=['notices/jygame-silverlight-LICENSE.txt','notices/jygame-silverlight-README.md']
(web/'public/original-interface.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print('Copied and indexed '+str(len(names))+' byte-identical official UI references')
