import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
const base=process.env.PLAYTHROUGH_URL||'http://127.0.0.1:4220/playthrough/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
let failure;
try{
 await page.goto(base);await page.locator('#summary article').first().waitFor();
 assert.equal(await page.locator('#summary .cleared').count(),2);assert.equal(await page.locator('#summary .blocked').count(),1);
 await page.locator('#stage').selectOption('france');
 await page.locator('#search').fill('米莱');assert.ok(await page.locator('#events .event').count()>0);
 await page.locator('#search').fill('');await page.locator('#language').selectOption('en');
 assert.match(await page.locator('#events').innerText(),/Milady de Winter/);
 await page.locator('#stage').selectOption('italy');assert.match(await page.locator('#events').innerText(),/lose/);
 await page.locator('#stage').selectOption('recovery');await page.locator('#search').fill('italy-ready');assert.match(await page.locator('#events').innerText(),/Reload/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#search').fill('');await page.locator('#language').selectOption('zh-CN');await page.screenshot({path:'artifacts/three-report-mobile.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS observed report: two cleared endings, blocked solo fight, bilingual transcript, companions, filtering, genuine reload and phone layout');
}catch(e){failure=e;console.error(e);}finally{
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/three-report-browser.json',JSON.stringify({passed:!failure,base,errors,error:failure?.stack},null,2)+'\n');await browser.close();
}
if(failure)process.exitCode=1;
