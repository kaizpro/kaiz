// Isolated QA only. One synthetic task; guest UI reads; no real user data.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createClient} from '@supabase/supabase-js';
const api=new URL(process.env.KAIZ_QA_SUPABASE_URL??''),base=new URL(process.env.KAIZ_LEARNING_URL??'');
assert.equal(api.origin,'https://venniccblkybvfbxyhug.supabase.co');assert.equal(base.origin,'http://localhost:3106');
assert.ok(process.env.KAIZ_QA_SERVICE_KEY&&process.env.KAIZ_PLAYWRIGHT_MODULE);
const service=createClient(api.href,process.env.KAIZ_QA_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{assert.equal(new URL(input instanceof Request?input.url:input).origin,api.origin);return fetch(input,init);}}});
const check=r=>{if(r.error)throw Object.assign(Error('Isolated anchor fixture failed'),{code:r.error.code});return r.data;};
let task,browser;const errors=[];
try{
 task=check(await service.from('problems').insert({title:'Temporary anchor layout QA',slug:'anchor-qa-'+randomUUID(),category:'AI',metric_name:'F1',metric_direction:'higher_is_better',source_provider:'manual',published:true}).select('id,slug').single());
 const {chromium}=await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,375,1280,1440])for(const theme of ['light','dark'])for(const size of [100,200]){
  const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});await ctx.addInitScript(t=>localStorage.setItem('theme',t),theme);
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===base.origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.name));
  await page.goto(`${base.origin}/problems/${task.slug}`);await page.locator('main h1').waitFor();await page.addStyleTag({content:`html{font-size:${size}% !important}`});
  const action=page.getByRole('link',{name:'Record practice ↓',exact:true});await page.keyboard.press('Tab');await action.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>{const title=document.querySelector('#practice h2'),header=document.querySelector('body > header');return title&&header&&title.getBoundingClientRect().top>=header.getBoundingClientRect().bottom&&title.getBoundingClientRect().bottom<=innerHeight;});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await page.locator('#practice form').count(),0);
  const login=page.locator('#practice').getByRole('link',{name:'Sign in',exact:true});assert.equal(await login.getAttribute('href'),'/auth/login?next='+encodeURIComponent('/problems/'+task.slug));
  await ctx.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'PASS',anchorCases:16,keyboard:true,headerOverlap:false,guestSignInDestination:true,textZoom200:true,productionAccess:false}));
}finally{
 if(browser)await browser.close();
 if(task){const rows=check(await service.from('problems').delete().eq('id',task.id).select('id'));assert.equal(rows.length,1);assert.equal(check(await service.from('problems').select('id').eq('id',task.id)).length,0);console.log('Synthetic anchor task removed.');}
}
