import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {projectPresentation} from '../src/presentation.ts';
import {setUiDisplayLabels,translateUiText} from '../src/ui/locale.ts';

const chapter=JSON.parse(readFileSync(new URL('../content/worlds/chapter-okuni-recruitment.json',import.meta.url)));
for(const locale of ['en','zh-CN'])test(`Okuni's selected-event warning survives location-name projection (${locale})`,()=>{
 const pack=JSON.parse(readFileSync(new URL(`../public/data/packs/worlds/${locale}/content-package.json`,import.meta.url)));
 const location=pack.maps.find(m=>m.id==='衡阳郊外').locations.find(l=>l.id==='曲非烟');
 // The host presents the selected event description, rather than always the
 // location's generic description. A fixed category description hid this warning.
 for(const description of [location.events[0].description,location.description]){
  const raw={map:{locations:[{id:location.id,name:null,description,action:'story',timeSlots:1}]}};
  const before=structuredClone(raw);
  const projected=projectPresentation(raw,pack.browser.displayCatalog).map.locations[0];
  assert.equal(projected.name,chapter.speakerNames['曲非烟'][locale]);
  assert.equal(projected.description,chapter.uiLabels[description][locale]);
  assert.equal(projected.action,'story');assert.equal(projected.timeSlots,1);
  assert.deepEqual(raw,before);
 }
});
test('the actual Okuni title notification translates its canonical title, including summary counts',()=>{
 const pack=JSON.parse(readFileSync(new URL('../public/data/packs/worlds/en/content-package.json',import.meta.url)));
 setUiDisplayLabels(pack.browser.displayCatalog.text,pack.browser.displayCatalog);
 assert.equal(translateUiText('解锁称号：古琴知音'),'Title unlocked: A Place in the Troupe');
 assert.equal(translateUiText('解锁称号：古琴知音 1'),'Title unlocked: A Place in the Troupe 1');
});
