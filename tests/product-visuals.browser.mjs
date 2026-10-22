// Local application only, guest reads. Screenshots contain no user records.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const base=new URL(process.env.KAIZ_LEARNING_URL??'http://127.0.0.1:3101');
assert.ok(['localhost','127.0.0.1'].includes(base.hostname));
const {chromium}=await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
const output=process.env.KAIZ_SCREENSHOTS??'work/premium-ui';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];let views=0;
try{
 for(const width of [320,768,1280,1440,1920])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.addInitScript(t=>localStorage.setItem('theme',t),theme);
  await context.route('**/*',route=>new URL(route.request().url()).origin===base.origin&&['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/roadmaps','/strategist','/strategist/olympiads','/strategist/preparation']){
   await page.goto(base.origin+route);await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('main h1').count(),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} ${width} ${theme}`);
   if(route==='/roadmaps'){
    for(const level of ['Beginner','Intermediate','Advanced']){
     const link=page.getByRole('region',{name:`${level} roadmap progress`}).getByRole('link');
     await page.keyboard.press('Tab');await link.focus();assert.notEqual(await link.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
     await link.hover();assert.equal(await link.evaluate(e=>getComputedStyle(e).transform),'none','reduced motion disables card movement');
    }
    if(width>=1440){const links=page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link');const first=await links.nth(0).boundingBox(),second=await links.nth(1).boundingBox();assert.ok(second.x-first.x-first.width>=10,'navigation breathing room');}
   }
   if(width===320||width===1440)await page.screenshot({path:`${output}/${route.replaceAll('/','_')}-${width}-${theme}.png`,fullPage:true,animations:'disabled'});
   await page.addStyleTag({content:'html{font-size:200% !important}'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`200% ${route} ${width}`);views++;
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${views} page/theme/viewport checks, 100/200% text, keyboard and reduced motion`);
}finally{await browser.close();}
