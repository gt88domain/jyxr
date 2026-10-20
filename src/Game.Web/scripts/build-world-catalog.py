#!/usr/bin/env python3
"""Build both locale views from one validated cast, without touching the game."""
import csv,hashlib,io,json,shutil,zipfile
from pathlib import Path
from world_cast import WEB,load,validate
from opening_content import build_opening

project,countries,figures,cast,index,locks=load()
summary=validate(project,countries,figures,cast,index,locks)
output=WEB.parents[1]/'artifacts/fantasy-worlds-site'
output.mkdir(parents=True,exist_ok=True)
for name in ['assets','data','zh','en']:(output/name).mkdir(exist_ok=True)
for name in ['catalog.css','catalog.mjs','favicon.svg']:shutil.copyfile(WEB/'cast'/name,output/'assets'/name)
translations=json.loads((WEB/'cast/translations.json').read_text())
payload={'project':project,'countries':countries,'figures':figures,'actors':cast['actors'],'summary':summary}
encoded=json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n'
(output/'data/catalog.json').write_text(encoded)
(output/'data/translations.json').write_text(json.dumps(translations,ensure_ascii=False,separators=(',',':'))+'\n')
html=(WEB/'cast/index.html').read_text()
version=hashlib.sha256((encoded+(WEB/'cast/catalog.mjs').read_text()+(WEB/'cast/catalog.css').read_text()+json.dumps(translations,ensure_ascii=False)).encode()).hexdigest()[:12]
for locale,folder,prefix in [('en','en','../'),('zh-CN','zh','../'),('en','','./')]:
 text=html.replace('{{LANG}}',locale).replace('{{TITLE}}',project['title'][locale]).replace('{{PREFIX}}',prefix)
 text=text.replace('{{OTHER_LANG}}','中文' if locale=='en' else 'English').replace('{{OTHER_PATH}}',prefix+('zh/' if locale=='en' else 'en/'))
 text=text.replace('{{OTHER_LANG_CODE}}','zh-CN' if locale=='en' else 'en').replace('{{VERSION}}',version)
 (output/folder/'index.html').write_text(text)

# One row per original definition, including growth forms, for spreadsheet review.
stream=io.StringIO(newline='');writer=csv.writer(stream)
writer.writerow(['legacy_definition_id','legacy_identity','legacy_display_name','actor_id','kind','country','name_zh_CN','name_en','status','source_work','recognition','traveler','related_countries','review_flags'])
by_figure={f['id']:f for f in figures}
for a in cast['actors']:
 f=by_figure.get(a['figureId'],{})
 for form in a['forms']:writer.writerow([form['legacyId'],a['legacyIdentity'],form['legacyName'],a['actorId'],a['kind'],a['primaryCountry'] or '',a['name']['zh-CN'],a['name']['en'],a['status'],f.get('sourceWork',''),f.get('recognition',''),a['traveler'],','.join(a['relatedCountries']),','.join(a['reviewFlags'])])
(output/'data/cast.csv').write_text('\ufeff'+stream.getvalue(),newline='')
opening=build_opening(WEB,output,cast)
shutil.copyfile(WEB.parents[1]/'LICENSE',output/'LICENSE')
archive=output.parent/'fantasy-worlds-cast.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for path in sorted(output.rglob('*')):
  if path.is_file():z.write(path,path.relative_to(output).as_posix())
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for path in output.rglob('*'):
  if path.is_file():assert z.read(path.relative_to(output).as_posix())==path.read_bytes()
print(json.dumps({'site':str(output),'archive':str(archive),'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'summary':summary,'opening':opening},ensure_ascii=False,indent=2))
