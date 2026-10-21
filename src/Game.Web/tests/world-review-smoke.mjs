import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const base=process.env.WORLD_REVIEW_URL||'http://127.0.0.1:4218/review/';
const output=fileURLToPath(new URL('../test-results/',import.meta.url));
await mkdir(output,{recursive:true});
const report={base,checks:[],errors:[],passed:false};
const pass=label=>{report.checks.push(label);console.log('PASS '+label);};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:900}});
page.setDefaultTimeout(20000);
page.on('pageerror',error=>report.errors.push(error.message));
page.on('console',msg=>{if(msg.type()==='error')report.errors.push(msg.text());});
page.on('requestfailed',request=>report.errors.push(request.url()));
page.on('response',response=>{if(response.status()>=400)report.errors.push(response.status()+' '+response.url());});
const ready=()=>page.waitForFunction(()=>document.querySelector('#review')?.getAttribute('aria-busy')==='false'&&document.querySelector('.record'));
async function selectSegment(name){
  await page.locator('#tools').evaluate(el=>el.open=true);
  await page.locator('#segment').fill(name);await page.locator('#segment').press('Tab');
  await page.waitForFunction(value=>(new URL(location.href).searchParams.get('segment')||'')===value,name);
  await ready();
}
try{
  await page.goto(base);await ready();
  assert.match(await page.locator('#summary').innerText(),/1887.*8577/);
  assert.equal(await page.locator('.record').count(),40);
  pass('full source inventory loads with paginated display');
  await page.locator('#more').click();
  assert.equal(await page.locator('.record').count(),80);
  await page.locator('#category').selectOption('items');await ready();
  assert.ok((await page.locator('.record .meta').allTextContents()).every(text=>text.includes('物品与装备')));
  await page.locator('#category').selectOption('');await ready();
  await page.locator('#status').selectOption('implemented');await ready();
  assert.ok((await page.locator('.record .badge').allTextContents()).every(text=>text==='已接入改写'));
  await page.locator('#status').selectOption('');await ready();
  pass('pagination, item category and implemented-copy filters show matching records');
  await page.evaluate(()=>localStorage.setItem('jyxr-web.review-sentinel','preserved'));
  await selectSegment('新手村_南贤开场');
  assert.equal(await page.locator('.record').count(),2); // dialogue run plus separate journal command
  assert.match(await page.locator('.columns').first().innerText(),/我是格林/);
  assert.match(await page.locator('.columns').first().innerText(),/I'm Grimm/);
  assert.equal((await page.locator('.copy-column').nth(2).locator('p').innerText()).split('\n\n').length,6);
  pass('23 original opening lines compare honestly with six bilingual replacement lines');
  await page.locator('.record a').first().click();
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('mode')==='flow');await ready();
  assert.match(await page.locator('#results').innerText(),/新手村_小村介绍/);
  await selectSegment('新手村_小村介绍');
  assert.match(await page.locator('#results').innerText(),/item\('内功入门', 1\)/);
  pass('copy-to-flow navigation retains the original tutorial reward');
  await page.locator('#copy-tab').click();await ready();
  await selectSegment('倚天屠龙_张无忌');
  assert.match(await page.locator('#results').innerText(),/待改写/);
  assert.ok((await page.locator('.copy-column .pending').count())>0);
  await page.locator('.record details').first().evaluate(el=>el.open=true);
  assert.match(await page.locator('#results').innerText(),/哪吒/);
  pass('untranslated Yitian dialogue stays pending with proposed casting separate');
  await selectSegment('');
  await page.locator('#search').fill('张无忌');
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('q')==='张无忌');await ready();
  const before=await page.locator('#summary').innerText();await page.reload();await ready();
  assert.equal(await page.locator('#search').inputValue(),'张无忌');
  assert.equal(await page.locator('#summary').innerText(),before);
  pass('Chinese search and filters survive a shareable URL reload');
  await page.locator('#search').fill('<img src=x onerror=alert(1)>');
  await page.waitForSelector('.empty');
  assert.equal(await page.locator('#results img').count(),0);
  pass('review text and search use text nodes rather than executable markup');
  await page.locator('#search').fill('');await ready();
  for(const width of [375,320]){
    await page.setViewportSize({width,height:812});
    await page.locator('#tools').evaluate(el=>el.open=false);
    const dimensions=await page.evaluate(()=>({viewport:innerWidth,content:document.documentElement.scrollWidth}));
    assert.ok(dimensions.content<=dimensions.viewport+1,JSON.stringify(dimensions));
    const search=await page.locator('#search').boundingBox();assert.ok(search.y+search.height<812);
    const first=await page.locator('.record h2').first().boundingBox();assert.ok(first.y+first.height<812);
  }
  await page.screenshot({path:output+'world-review-mobile.png',fullPage:false});
  pass('320px and 375px phones keep search and first record on the first screen without overflow');
  await page.locator('#tools').evaluate(el=>el.open=true);
  for(const name of ['copy','flow']){
    const response=await page.request.get(new URL('data/'+name+'.csv',base).href);
    assert.equal(response.status(),200);
    const bytes=await response.body();assert.equal(bytes.subarray(0,3).toString('hex'),'efbbbf');
    assert.match(bytes.toString('utf8'),/source_sha256/);
  }
  pass('both complete Excel-compatible CSV downloads are served');
  assert.equal(await page.evaluate(()=>localStorage.getItem('jyxr-web.review-sentinel')),'preserved');
  assert.deepEqual(await page.evaluate(()=>indexedDB.databases()),[]);
  assert.deepEqual(report.errors,[]);pass('review never creates game databases or changes legacy storage');
  report.passed=true;
}catch(error){
  report.failure={message:error.message,stack:error.stack};process.exitCode=1;console.error(error);
  await page.screenshot({path:output+'world-review-failure.png',fullPage:false}).catch(()=>{});
}finally{
  await writeFile(output+(process.env.WORLD_REVIEW_REPORT||'world-review-smoke')+'.json',JSON.stringify(report,null,2));
  await browser.close();
}
