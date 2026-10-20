#!/usr/bin/env python3
"""Generate real campaign checkpoints without editing save contents."""
import hashlib,json,os,shutil,subprocess,tempfile
from pathlib import Path

web=Path(__file__).resolve().parents[1]
repo=web.parents[1]
content=web/'public/data/packs/jyx/content-package.json'
dotnet=str(Path(os.environ['DOTNET_ROOT'])/('dotnet.exe' if os.name=='nt' else 'dotnet')) if os.environ.get('DOTNET_ROOT') else shutil.which('dotnet')
if not dotnet:raise SystemExit('Activate the .NET 10 SDK before preparing campaign checkpoints.')
results=web/'test-results';results.mkdir(exist_ok=True)
destination=results/'midgame'
fingerprint=hashlib.sha256(content.read_bytes()).hexdigest()
with tempfile.TemporaryDirectory(prefix='midgame-',dir=results) as temporary:
    root=Path(temporary);run=root/'run';snapshots=root/'snapshots';snapshots.mkdir()
    provenance={'contentSha256':fingerprint,'method':'actual questionnaire, dialogue, trade, recruitment, training, travel and battle commands; no edited stats or forced outcomes','checkpoints':{}}
    for stage,name in [('new','opening'),('--resume','first-mainline'),('--midgame','medicine'),('--chapter2','chapter2')]:
        attempt=subprocess.run([dotnet,'run','--project','src/Game.Web.Runtime/Smoke/Smoke.csproj','--','--campaign',str(content),str(run),stage],cwd=repo)
        if attempt.returncode:
            evidence=run/'failure.json'
            failure=json.loads(evidence.read_text()) if evidence.exists() else {}
            if name!='chapter2' or failure.get('state',{}).get('phase')!='gameover':
                destination.mkdir(exist_ok=True)
                shutil.copytree(run,destination/'failed-attempt',dirs_exist_ok=True)
                raise subprocess.CalledProcessError(attempt.returncode,attempt.args)
            # A real original-story defeat is evidence of a losing route,
            # never evidence that the requested later chapter was completed.
            save=(run/'last-stable-save.json').read_bytes()
            (snapshots/'loss-checkpoint.json').write_bytes(save)
            (snapshots/'loss-action.json').write_bytes((run/'last-action.json').read_bytes())
            (snapshots/'loss-observed.json').write_bytes(evidence.read_bytes())
            provenance['chapter2Attempt']={'outcome':'gameover','exitCode':attempt.returncode,'checkpointSha256':hashlib.sha256(save).hexdigest(),'error':failure['error']}
            print('OBSERVED original-story defeat; later chapter not completed. Preserved real checkpoint for UI recovery checks.')
            break
        save=(run/'normal-save.json').read_bytes();report=json.loads((run/'normal-report.json').read_text())
        (snapshots/(name+'.json')).write_bytes(save)
        (snapshots/(name+'.report.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        provenance['checkpoints'][name]={'sha256':hashlib.sha256(save).hexdigest(),'battles':report['battles'],'wins':report['wins'],'mainline':report['mainline']}
    assert fingerprint==hashlib.sha256(content.read_bytes()).hexdigest()
    (snapshots/'provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
    destination.mkdir(exist_ok=True)
    for path in snapshots.iterdir():os.replace(path,destination/path.name)
print(f'Prepared {len(provenance["checkpoints"])} unedited campaign checkpoints in {destination}')
