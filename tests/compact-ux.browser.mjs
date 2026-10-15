// Local UI QA only. Run with backend environment values empty at build/runtime.
// No production sessions, fixture inserts, external navigation or write requests.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const base=new URL(process.env.KAIZ_LEARNING_URL??'http://localhost:3104');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(base.hostname));
assert.ok(process.env.KAIZ_PLAYWRIGHT_MODULE);
const {chromium}=await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
const output=process.env.KAIZ_SCREENSHOTS??'work/compact-ux/screenshots';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const routes=['/','/roadmaps','/roadmaps/beginner','/roadmaps/intermediate','/roadmaps/advanced','/learn','/learn/topics','/learn/python-fundamentals','/learn/vectors','/problems','/competitions','/leaderboards'];
const errors=[],overflows=[];
try{
 for(const width of [360,375,768,1024,1440])for(const theme of ['dark','light']){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme});
  await context.addInitScript(value=>localStorage.setItem('theme',value),theme);
  await context.route('**/*',route=>new URL(route.request().url()).origin===base.origin&&['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const textSize of [100,200])for(const path of routes){
   const response=await page.goto(base.origin+path);assert.equal(response.status(),200,path);
   await page.getByRole('heading',{level:1}).waitFor();
   await page.evaluate(async size=>{document.documentElement.style.fontSize=size+'%';await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);},textSize);
   await page.waitForFunction(value=>document.documentElement.classList.contains(value),theme);
   const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
   if(dimensions.scroll>dimensions.width+1)overflows.push({path,width,theme,textSize,...dimensions});
   assert.equal(await page.locator('footer').count(),1);
   if(path==='/problems'){
    assert.equal(await page.locator('#practice-sources article').count(),31);assert.equal(await page.locator('main form').count(),1);assert.equal(await page.locator('[data-archive-kind="internal"]').count(),0);
    if(width===1440&&textSize===100){const columns=await page.locator('#practice-sources article').first().locator(':scope > div').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);assert.equal(columns,5,'Dense desktop archive has five aligned columns');}
   }
   if(textSize===100&&[375,1440].includes(width)&&['/roadmaps','/roadmaps/beginner','/learn/topics','/learn/vectors','/problems','/leaderboards'].includes(path))await page.screenshot({path:join(output,`${path.replaceAll('/','-')}-${width}-${theme}.png`),fullPage:path!=='/learn/topics'&&path!=='/problems'});
  }
  await page.goto(base.origin+'/problems');
  await page.getByLabel('Source',{exact:true}).selectOption('Kaggle');await page.getByRole('button',{name:'Apply filters'}).click();
  await page.waitForURL(url=>url.searchParams.get('source')==='Kaggle');await page.locator('#practice-sources article').first().waitFor();
  assert.equal(await page.locator('#practice-sources article').count(),21);
  await page.getByLabel('Availability',{exact:true}).selectOption('account_required');await page.getByRole('button',{name:'Apply filters'}).click();
  await page.waitForURL(url=>url.searchParams.get('availability')==='account_required');await page.locator('#practice-sources article').first().waitFor();
  assert.equal(await page.locator('#practice-sources article').count(),15);
  await page.getByRole('link',{name:'Clear filters',exact:true}).click();await page.waitForURL(url=>url.pathname==='/problems'&&!url.search);
  await page.locator('#practice-sources article').first().waitFor();assert.equal(await page.locator('#practice-sources article').count(),31);
  await page.goto(base.origin+'/learn/topics?q=NumPy');
  await page.getByRole('heading',{name:'NumPy for Data Handling',exact:true}).waitFor();
  await page.locator('summary').filter({has:page.getByRole('heading',{name:'NumPy for Data Handling',exact:true})}).click();
  await page.getByRole('link',{name:/Open material: NumPy: the absolute basics/}).waitFor();
  await page.goto(base.origin+'/roadmaps/beginner');
  assert.equal(await page.getByRole('list',{name:'Ordered roadmap stages'}).locator(':scope > li').count(),4);
  for(const summary of await page.locator('summary').filter({hasText:'Goals & self-check'}).all())await summary.click();
  assert.equal(await page.getByRole('heading',{name:'Milestone / self-check',exact:true}).count(),4);
  await page.goto(base.origin+'/roadmaps');
  const menu=page.getByLabel('Open navigation',{exact:true});
  const nav=await menu.isVisible()?page.getByRole('navigation',{name:'Mobile navigation',exact:true}):page.getByRole('navigation',{name:'Primary navigation',exact:true});
  if(await menu.isVisible()){await menu.focus();await page.keyboard.press('Enter');}
  assert.equal((await nav.locator('a').allTextContents()).join('|'),'Competitions|Problems|Leaderboards|Roadmaps|Discussions|Learn');
  await nav.getByRole('link',{name:'Roadmaps',exact:true}).focus();assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-current')),'page');
  if(width===1440){const links=await nav.locator('a').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().toJSON()));for(let i=1;i<links.length;i++)assert.ok(links[i].left-links[i-1].right>=7,'Navigation gaps improved');}
  await context.close();console.log(`CHECKED ${width}px ${theme}: 12 routes at 100/200% text, unified filters, disclosure and keyboard`);
 }
 assert.deepEqual(overflows,[],'No whole-page overflow');assert.deepEqual(errors,[],'No browser runtime errors');
 console.log('PASS compact UX: 240 route/layout views; no backend, authentication or production writes');
}finally{await browser.close();}
