// Actual local production routes, guest-only reads; no external navigation/data writes.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {loadTypescript} from './helpers/load-typescript.mjs';
const base=new URL(process.env.KAIZ_LEARNING_URL??'http://127.0.0.1:3101');
assert.ok(['localhost','127.0.0.1'].includes(base.hostname));
const {chromium}=await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
const items=loadTypescript()('lib/learning/unified-archive.ts').buildPracticeArchive([]);
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];let views=0;
await mkdir('work/premium-practice',{recursive:true});
try{
 for(const width of [320,768,1280,1440])for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await ctx.addInitScript(t=>localStorage.setItem('theme',t),theme);
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===base.origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  const layout=async()=>{await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width} ${theme} ${page.url()}`);};
  await page.goto(base.origin+'/problems');await page.getByRole('heading',{name:'Practice Archive',exact:true}).waitFor();
  const cards=page.locator('#practice-sources article');assert.equal(await cards.count(),31);await layout();
  assert.equal(await page.getByText(/Latest:|Solved — Self-reported/).count(),0);
  const more=page.locator('details').filter({has:page.locator('summary',{hasText:'More filters'})});assert.equal(await more.getAttribute('open'),null);
  await more.locator('summary').focus();await page.keyboard.press('Enter');await page.getByLabel('Difficulty',{exact:true}).selectOption({index:1});
  const difficulty=await page.getByLabel('Difficulty',{exact:true}).inputValue();assert.ok(difficulty);
  await page.getByRole('button',{name:'Apply filters'}).click();await page.waitForURL(u=>u.searchParams.get('difficulty')===difficulty);await more.locator('select').first().waitFor();assert.notEqual(await more.getAttribute('open'),null,'active advanced filters stay discoverable');
  await page.goto(base.origin+'/problems');
  await page.getByLabel('Source',{exact:true}).selectOption('Kaggle');await page.getByRole('button',{name:'Apply filters'}).click();await page.waitForURL(u=>u.searchParams.get('source')==='Kaggle');await cards.first().waitFor();assert.equal(await cards.count(),21);
  await page.goto(base.origin+'/problems?q=no-such-synthetic-practice');await page.getByRole('heading',{name:'No matching practice'}).waitFor();
  await page.goto(base.origin+'/problems');await cards.first().waitFor();
  const first=cards.first().getByRole('link');assert.equal(await cards.first().getByRole('link').count(),1);await page.keyboard.press('Tab');await first.focus();assert.notEqual(await first.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await first.hover();assert.equal(await first.evaluate(e=>getComputedStyle(e).transform),'none');await page.keyboard.press('Enter');await page.waitForURL(base.origin+items[0].href);
  for(const item of items){
   await page.goto(base.origin+item.href);await page.getByRole('heading',{name:item.title,exact:true}).waitFor();await layout();
   const external=page.locator('main a[target="_blank"]');assert.equal(await external.count(),item.originalHref?1:0);if(item.originalHref)assert.equal(await external.first().getAttribute('href'),item.originalHref);
   assert.equal(await page.getByRole('button',{name:/Mark Solved/}).count(),0);
   const details=page.locator('details').filter({has:page.locator('summary',{hasText:'View source details'})});assert.equal(await details.getAttribute('open'),null);await details.locator('summary').focus();await page.keyboard.press('Enter');assert.notEqual(await details.getAttribute('open'),null);
   await page.addStyleTag({content:'html{font-size:200% !important}'});await layout();
   if(['source-a-problem-2','source-a-problem-20'].includes(item.id)&&[320,1440].includes(width))await page.screenshot({path:`work/premium-practice/${width}-${theme}-${item.id}.png`,fullPage:true});views++;
  }
  await page.goto(base.origin+'/problems');await cards.first().waitFor();await page.addStyleTag({content:'html{font-size:200% !important}'});await layout();
  if(width===320||width===1440)await page.screenshot({path:`work/premium-practice/archive-${width}-${theme}.png`,fullPage:false});
  await ctx.close();
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${views} source page views, archive filtering/full-card keyboard links, light/dark, mobile/laptop/tablet/desktop, 200% text and reduced motion`);
}finally{await browser.close();}
