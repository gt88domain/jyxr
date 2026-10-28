import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHarness} from './ui-harness.mjs';
const dir=process.env.PLAYTHROUGH_CHECKPOINTS;assert.ok(dir);
const file=dir+'/italy-trained.json',raw=await readFile(file);
const manifest=JSON.parse(await readFile(dir+'/manifest.json','utf8'));
assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.find(x=>x.name==='italy-trained').sha256);
const h=await createHarness('market-supply',{viewport:{width:390,height:844}},{trace:false});
const {page,report,click,ready,state,pass,noOverflow,finish}=h;
let failure;
try{
 await page.goto(report.baseURL);await page.locator('[data-action="new"]').waitFor({timeout:120000});
 await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');await ready();
 await click('[data-action="interact"][data-id="长安"]');
 for(const id of ['长安西市','长安城中心','长安城边'])assert.doesNotMatch(await page.locator(`[data-action="interact"][data-id="${id}"]`).innerText(),/[\u3400-\u9fff]/);
 await click('[data-action="interact"][data-id="长安西市"]');assert.equal((await state()).map.name,'West Market');
 await click('[data-action="interact"][data-id="商店"]');
 const s=await state(),product=s.shop.products.find(p=>p.itemId==='九花玉露丸');
 assert.equal(s.shop.name,'West Market Supplies');assert.equal(product.name,'Ninepetal Elixir');
 assert.match(product.description,/600 Health and 300 Energy/);assert.match(product.description,/cooldowns apply above Normal difficulty/);
 assert.equal(product.price,100);assert.equal(s.silver,494);
 const quantity=s.inventory.find(i=>i.id==='九花玉露丸')?.count||0;
 await page.locator('#shop-quantity').fill('4');await click(`[data-action="buy-item"][data-id="${product.id}"]`);
 const bought=await state();assert.equal(bought.silver,94);assert.equal(bought.inventory.find(i=>i.id==='九花玉露丸').count,quantity+4);
 await noOverflow('Actual market purchase at 390px');await page.screenshot({path:h.output+'market-supply-mobile.png'});
 pass('English city navigation reaches the real shop; four correctly described Energy elixirs cost 400 existing silver');
}catch(e){failure=e;}
await finish(failure);
