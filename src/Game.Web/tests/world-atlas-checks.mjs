import assert from 'node:assert/strict';

/** Runs against the real map reached through the native tutorial. */
export async function checkWorldAtlas(h) {
 const {page,state,click,pass,noOverflow,output}=h;
 const before=await state();
 assert.equal(before.map.id,'大地图');
 const atlas=before.pack.worldAtlas;
 assert.ok(atlas);assert.equal(before.map.locations.length,71);
 await page.locator('[data-world-atlas]').waitFor();
 await page.waitForFunction(()=>document.querySelector('.atlas-art')?.naturalWidth>0);
 const image=await page.locator('.atlas-art').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,url:img.currentSrc}));
 assert.equal(image.width,1536);assert.equal(image.height,1024);assert.match(image.url,/storybook-atlas[.]png/);
 assert.equal(await page.locator('[data-atlas-place]').count(),71);
 const guide=page.locator('[data-opening-guide]');
 assert.ok(await guide.count());
 assert.equal(await guide.evaluate(el=>!!(el.compareDocumentPosition(document.querySelector('[data-world-atlas]'))&Node.DOCUMENT_POSITION_FOLLOWING)),true,'Task guide must precede the atlas');
 assert.equal(await page.locator('[data-atlas-place]:visible').first().getAttribute('data-id'),'洛阳');
 assert.equal(await page.locator('[data-atlas-recommended]').getAttribute('data-id'),'洛阳');
 for(const place of before.map.locations) {
  const button=page.locator(`[data-atlas-place][data-id="${place.id}"]`);
  assert.equal(await button.isDisabled(),!place.action,place.id);
  assert.equal(await button.isVisible(),!!place.action,place.id);
  if(place.action)assert.match(await button.innerText(),new RegExp(`${place.timeSlots??1} ${atlas.timeUnit}`));
 }
 pass('generated atlas loads and all 71 destinations preserve host availability and travel time',image);
 const snapshot=s=>JSON.stringify({map:s.map,adventure:s.adventure,silver:s.silver,objectives:s.objectives,party:s.party});
 const original=snapshot(before);
 await page.locator('[data-atlas-browse]').click();
 assert.equal(await page.locator('.atlas-map-panel').evaluate(el=>el.open),false);
 assert.equal(await page.locator('[data-atlas-results]').evaluate(el=>el===document.activeElement),true);
 await page.locator('.atlas-map-panel>summary').click();
 assert.equal(await page.locator('.atlas-map-panel').evaluate(el=>el.open),true);
 for(const region of atlas.regions) {
  await page.locator(`.atlas-pin[data-atlas-region="${region.id}"]`).click();
  assert.equal(await page.locator(`.atlas-tab[data-atlas-region="${region.id}"]`).getAttribute('aria-pressed'),'true');
  const visible=await page.locator('[data-atlas-place]:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.id));
  assert.deepEqual(visible.sort(),before.map.locations.filter(p=>p.action&&region.locations.includes(p.id)).map(p=>p.id).sort());
 }
 assert.equal(snapshot(await state()),original);
 await page.locator('[data-atlas-unavailable]').check();
 await page.locator('.atlas-tab[data-atlas-region=""]').click();
 assert.equal(await page.locator('[data-atlas-place]:visible').count(),71);
 for(const place of before.map.locations.filter(p=>!p.action))assert.ok(await page.locator(`[data-atlas-place][data-id="${place.id}"]`).isDisabled());
 await page.locator('[data-atlas-unavailable]').uncheck();
 const target=before.map.locations.find(p=>p.id==='洛阳');assert.ok(target.action);
 await page.locator('#destination-search').fill(target.name);
 assert.equal(await page.locator(`[data-atlas-place][data-id="${target.id}"]`).isVisible(),true);
 assert.equal(await page.locator('.atlas-tab[data-atlas-region=""]').getAttribute('aria-pressed'),'true');
 const guideName=before.map.locations.find(p=>p.id==='南贤居').name.replace(/['‘’]/g,'');
 await page.locator('#destination-search').fill(guideName);
 assert.equal(await page.locator('[data-atlas-place][data-id="南贤居"]').isVisible(),true);
 await page.locator('#destination-search').fill('this-destination-does-not-exist');
 assert.equal(await page.locator('[data-atlas-place]:visible').count(),0);
 assert.equal(await page.locator('[data-atlas-empty]').isVisible(),true);
 await page.locator('#destination-search').fill('');
 assert.equal(snapshot(await state()),original);
 pass('island filters, unavailable places, global search and empty state do not advance the journey');
 await page.setViewportSize({width:375,height:812});
 await noOverflow('illustrated atlas on phone');
 for(const pin of await page.locator('.atlas-pin').all()) {
  const box=await pin.boundingBox();assert.ok(box.height>=44);assert.ok(box.x>=0&&box.x+box.width<=375);
 }
 await page.locator('.atlas-pin[data-atlas-region="meadow"]').click();
 const columns=await page.locator('.atlas-destinations').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
 assert.equal(columns,1,'Phone destination cards must use one readable column');
 await page.locator('[data-world-atlas]').screenshot({path:output+'storybook-atlas-mobile.png'});
 await page.locator('.atlas-tab[data-atlas-region=""]').click();
 await page.setViewportSize({width:1440,height:900});
 await page.locator('[data-world-atlas]').screenshot({path:output+'storybook-atlas-desktop.png'});
 assert.equal(snapshot(await state()),original);
 pass('mobile map has six touch targets and still uses unchanged native destination actions');
}
