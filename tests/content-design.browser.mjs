// Read-only local application QA; no authenticated sessions or hosted writes.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const base=new URL(process.env.KAIZ_LEARNING_URL??'http://localhost:3102');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(base.hostname));
assert.ok(process.env.KAIZ_PLAYWRIGHT_MODULE);
const {chromium}=await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
const output=process.env.KAIZ_SCREENSHOTS??'work/content-design-sprint/screenshots';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
const overflows=[];
const routes=['/','/roadmaps','/roadmaps/beginner','/roadmaps/intermediate','/roadmaps/advanced','/learn','/learn/topics','/learn/python-fundamentals','/learn/vectors','/problems','/leaderboards','/competitions','/competitions/ioai-2026','/discussions','/u/timatema'];
try{
 for(const width of [360,375,768,1024,1440])for(const theme of ['dark','light']){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme});
  await context.addInitScript(value=>localStorage.setItem('theme',value),theme);
  await context.route('**/*',route=>new URL(route.request().url()).origin===base.origin?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const zoom of [100,200])for(const path of routes){
   const response=await page.goto(base.origin+path);assert.equal(response.status(),200,path);
   await page.locator('main').first().waitFor();
   await page.evaluate(value=>{document.documentElement.style.fontSize=value+'%';},zoom);
   await page.waitForFunction(value=>document.documentElement.classList.contains(value),theme);
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
   const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,culprits:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(e).display!=='none').slice(0,5).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,70)}))}));
   if(overflow.scroll>overflow.width+1){const failure=`${path} ${width}/${theme}/${zoom}% overflow: ${JSON.stringify(overflow)}`;overflows.push(failure);console.log(failure);}
   assert.equal(await page.locator('footer').count(),1,'one shared footer');
   if(width===360&&theme==='dark'&&zoom===200&&['/','/roadmaps/beginner','/learn/topics','/problems','/leaderboards'].includes(path))await page.screenshot({path:join(output,path.replaceAll('/','-')+`-${width}-${theme}-${zoom}.png`)});
   if(width===1440&&theme==='light'&&zoom===100&&['/roadmaps','/learn/vectors','/problems','/leaderboards'].includes(path))await page.screenshot({path:join(output,path.replaceAll('/','-')+`-${width}-${theme}-${zoom}.png`)});
  }
  // Verify actual GET forms and a keyboard-operable, Learn-last primary menu.
  await page.goto(base.origin+'/learn/topics');
  await page.getByLabel('Search topics',{exact:true}).fill('HuBERT');await page.getByRole('button',{name:'Apply filters'}).click();
  await page.getByRole('heading',{name:'Pre-trained Audio Encoders: HuBERT',exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Python Basics (Loops, Functions, etc.)',exact:true}).count(),0);
  await page.goto(base.origin+'/problems');await page.locator('select[name="competition"]').selectOption('NEOAI 2025');await page.getByRole('button',{name:'Apply filters'}).click();
  await page.waitForURL(url=>url.searchParams.get('competition')==='NEOAI 2025');
  await page.locator('#practice-sources article').first().waitFor();
  assert.equal(await page.locator('#practice-sources article').count(),8);
  await page.goto(base.origin+'/roadmaps');
  const mobile=page.getByLabel('Open navigation',{exact:true});
  if(await mobile.isVisible()){await mobile.focus();await page.keyboard.press('Enter');await page.getByRole('navigation',{name:'Mobile navigation',exact:true}).waitFor();const items=await page.getByRole('navigation',{name:'Mobile navigation',exact:true}).locator('a').allTextContents();assert.equal(items.at(-1),'Learn');await page.getByRole('navigation',{name:'Mobile navigation',exact:true}).getByRole('link',{name:'Roadmaps',exact:true}).focus();assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-current')),'page');}
  else{const items=await page.getByRole('navigation',{name:'Primary navigation',exact:true}).locator('a').allTextContents();assert.equal(items.join('|'),'Competitions|Problems|Leaderboards|Roadmaps|Discussions|Learn');}
  await context.close();console.log(`CHECKED ${width}px ${theme}: ${routes.length} routes at 100/200% text, filters and keyboard navigation`);
 }
 const c=await browser.newContext();const p=await c.newPage();
 await p.goto(base.origin+'/');await p.getByRole('link',{name:'Start Your AI Olympiad Journey',exact:true}).click();
 await p.locator('a[href="/roadmaps/beginner"]').click();await p.locator('a[href="/learn/python-fundamentals"]').first().click();
 assert.ok(await p.getByRole('link',{name:/Open material/}).count()>0);
 await p.goto(base.origin+'/problems');assert.ok(await p.locator('#practice-sources a[target="_blank"]').count()>0);
 await p.goto(base.origin+'/competitions/ioai-2026');await p.locator('a[href="https://ioai-official.org/republic-of-kazakhstan/results-2026/"]').waitFor();
 await p.goto(base.origin+'/leaderboards');await p.getByRole('heading',{name:'Official leaderboards',exact:true}).waitFor();
 await p.goto(base.origin+'/discussions');await p.getByRole('heading',{level:1}).waitFor();
 const old=await p.goto(base.origin+'/leaderboard');assert.equal(old.status(),200);assert.equal(new URL(p.url()).pathname,'/leaderboards');
 const missing=await p.goto(base.origin+'/roadmaps/not-a-level');assert.equal(missing.status(),404);
 await p.goto(base.origin+'/admin');assert.equal(new URL(p.url()).pathname,'/auth/login');
 await c.close();assert.deepEqual(errors,[]);assert.deepEqual(overflows,[],'No whole-page horizontal overflow at any tested text size');console.log('PASS complete anonymous student journey, aliases, 404 and admin protection');
}finally{await browser.close();}
