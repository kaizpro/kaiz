// Actual guest application routes only; no fake authentication or hosted requests.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadTypescript} from './helpers/load-typescript.mjs';
const base=new URL(process.env.KAIZ_LEARNING_URL??'http://localhost:3104');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(base.hostname));
assert.ok(process.env.KAIZ_PLAYWRIGHT_MODULE);
const {chromium}=await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
const output='work/learning-progress/screenshots';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];
const load=loadTypescript();const {journeys}=load('lib/learning/journeys.ts');const {courseFor,lessonHref}=load('lib/learning/course.ts');
try{
 for(const width of [375,1440])for(const theme of ['dark','light']){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme});
  await context.addInitScript(value=>localStorage.setItem('theme',value),theme);
  await context.route('**/*',r=>new URL(r.request().url()).origin===base.origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const size of [100,200])for(const path of journeys){
   assert.equal((await page.goto(base.origin+'/roadmaps/'+path.level)).status(),200);
   await page.evaluate(value=>document.documentElement.style.fontSize=value+'%',size);
   const units=page.locator('details[data-course-module]');assert.equal(await units.count(),4);
   for(const unit of await units.all())if(await unit.getAttribute('open')===null)await unit.locator(':scope > summary').click();
   const lessons=courseFor(path).flatMap(m=>m.lessons);
   assert.equal(await page.getByRole('link',{name:/Open lesson /}).count(),lessons.length);
   assert.equal(await page.getByRole('progressbar').count(),0);
   assert.equal(await page.getByRole('button',{name:/Mark completed/}).count(),0);
   await page.getByRole('link',{name:'Sign in to save progress',exact:true}).waitFor();
   const first=units.first().locator(':scope > summary');await first.focus();await page.keyboard.press('Enter');assert.equal(await units.first().getAttribute('open'),null);await page.keyboard.press('Enter');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(size===100)await page.screenshot({path:join(output,`${path.level}-${width}-${theme}.png`),fullPage:false});
   await page.getByRole('link',{name:new RegExp(`Open lesson 1.1:`)}).click();
   await page.getByRole('heading',{level:1,name:'1.1 '+lessons[0].topic.title,exact:true}).waitFor();
   await page.evaluate(value=>document.documentElement.style.fontSize=value+'%',size);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.reload();assert.equal(await page.getByRole('button',{name:/Mark completed/}).count(),0);
   await page.getByRole('link',{name:path.title+' roadmap',exact:true}).click();
   await page.waitForURL(base.origin+'/roadmaps/'+path.level);
   await page.getByRole('link',{name:'Sign in to save progress',exact:true}).waitFor();
   assert.equal(new URL(page.url()).pathname,'/roadmaps/'+path.level);
  }
  await page.goto(base.origin+'/dashboard');await page.waitForURL(url=>url.pathname==='/auth/login');assert.equal(new URL(page.url()).searchParams.get('next'),'/dashboard');
  await context.close();console.log(`PASS ${width}px ${theme}: numbered modules, lessons, disclosures, keyboard, 100/200% text, guest save gates/dashboard redirect`);
 }
 const context=await browser.newContext();const page=await context.newPage();
 await context.route('**/*',r=>new URL(r.request().url()).origin===base.origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 for(const path of journeys)for(const lesson of courseFor(path).flatMap(m=>m.lessons))assert.equal((await page.goto(base.origin+lessonHref(path.level,lesson.id))).status(),200);
 assert.equal((await page.goto(base.origin+'/roadmaps/beginner/lessons/forged')).status(),404);
 await context.close();assert.deepEqual(errors,[]);console.log('PASS all 40 real lesson routes; no private progress simulated or hosted requests');
}finally{await browser.close();}
