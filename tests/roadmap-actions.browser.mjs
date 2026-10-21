// Guest-only local production-build checks; no database or third-party writes.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadTypescript} from './helpers/load-typescript.mjs';
const base=new URL(process.env.KAIZ_LEARNING_URL??'http://127.0.0.1:3101');
assert.ok(['localhost','127.0.0.1'].includes(base.hostname));
const {chromium}=await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
const load=loadTypescript();
const {journeys}=load('lib/learning/journeys.ts');
const {courseFor,lessonHref}=load('lib/learning/course.ts');
const {practiceLinkFor}=load('lib/learning/lesson-practice-links.ts');
const output=process.env.KAIZ_SCREENSHOTS??'work/classic-roadmaps/final';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];
try{
 for(const width of [375,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await context.addInitScript(value=>localStorage.setItem('theme',value),theme);
  await context.route('**/*',route=>new URL(route.request().url()).origin===base.origin&&['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const go=path=>page.goto(base.origin+path);
  const layout=async()=>{await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width} ${theme} ${page.url()}`);};
  await go('/roadmaps');await layout();
  for(const path of journeys){
   const row=page.getByRole('region',{name:`${path.title} roadmap progress`});
   assert.equal(await row.getByRole('link').count(),1);
   const link=row.getByRole('link');
   const bounds=await link.boundingBox(),region=await row.boundingBox();assert.ok(Math.abs(bounds.width-region.width)<1,'entire row is the link');
   await link.focus();assert.notEqual(await link.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Enter');await page.waitForURL(base.origin+`/roadmaps/${path.level}`);
   await layout();await go('/roadmaps');
  }
  const primary=page.getByRole('navigation',{name:width>=1280?'Primary navigation':'Mobile navigation'});
  const toggle=width>=1280?page.locator('summary').filter({hasText:'More'}):page.getByLabel('Open navigation');
  await toggle.focus();await page.keyboard.press('Enter');
  const strategist=primary.getByRole('link',{name:'Personal AI Strategist',exact:true});await strategist.focus();await page.keyboard.press('Enter');await page.waitForURL(base.origin+'/strategist');await layout();
  assert.equal(await page.locator('main form, main input, main textarea').count(),0);
  await page.screenshot({path:join(output,`strategist-${width}-${theme}.png`),fullPage:true,animations:'disabled'});
  for(const [label,focus]of [['Strategy for Olympiads','olympiads'],['Preparation Strategy','preparation']]){
   await page.getByRole('link',{name:new RegExp(label)}).focus();await page.keyboard.press('Enter');await page.waitForURL(base.origin+`/strategist/${focus}`);await page.getByText('Coming soon',{exact:true}).waitFor();await layout();
   await page.addStyleTag({content:'html{font-size:200% !important}'});await layout();await go('/strategist');
  }
  for(const path of journeys)for(const unit of courseFor(path))for(const lesson of unit.lessons){
   await go(lessonHref(path.level,lesson.id));await layout();
   const actions=page.locator('[data-practice-actions]');assert.equal(await actions.count(),1);
   await actions.getByRole('link',{name:/^Study Material/}).waitFor();
   assert.equal(await actions.getByRole('link',{name:/^Practice on Kaggle/}).count(),practiceLinkFor(lesson.topic.id)?1:0);
   const instructions=page.locator('[data-practice-instructions]').first();assert.equal(await instructions.getAttribute('open'),null);
   assert.equal(await page.getByRole('region',{name:'Lesson completion',exact:true}).count(),1);
   await page.getByRole('link',{name:'Sign in to save progress',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/Mark completed/}).count(),0);
   await instructions.locator(':scope > summary').focus();await page.keyboard.press('Enter');assert.notEqual(await instructions.getAttribute('open'),null);
   await page.addStyleTag({content:'html{font-size:200% !important}'});await layout();
   for(const link of await page.locator('nav[aria-label="Learning step sections"] a').all()) {
    assert.equal(await link.evaluate(e=>getComputedStyle(e).whiteSpace),'nowrap','section labels stay intact at 200%');
   }
   if(lesson.topic.id==='python-fundamentals'){
    await instructions.locator(':scope > summary').click();
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:join(output,`practice-${width}-${theme}.png`),fullPage:true,animations:'disabled'});
   }
  }
  // Repeat the historically intermittent reduced-motion desktop path.
  for(let i=0;i<3;i++){
   await go('/roadmaps/beginner');await page.getByRole('link',{name:'Explore Skill Atlas',exact:true}).click();
   await page.locator('[data-atlas-root]').waitFor();await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
   assert.deepEqual(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').map(a=>a.animationName)),[]);await layout();
  }
  await context.close();console.log(`PASS ${width}px ${theme}: 40 lessons, full-row keyboard links, practice disclosures/actions, Strategist, 200% text, reduced motion x3`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
