// Isolated project only. Public edition metadata + disposable synthetic fixtures; never production.
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createClient} from '@supabase/supabase-js';
import {preparePriorityEditionRelease} from '../scripts/content/priority-edition-plan.mjs';
const api=new URL(process.env.KAIZ_QA_SUPABASE_URL??''),base=new URL(process.env.KAIZ_LEARNING_URL??'');
assert.equal(api.origin,'https://venniccblkybvfbxyhug.supabase.co');
assert.equal(base.origin,'http://localhost:3106');
assert.ok(process.env.KAIZ_QA_SERVICE_KEY&&process.env.KAIZ_QA_ANON_KEY&&process.env.KAIZ_PLAYWRIGHT_MODULE);
const options={auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{assert.equal(new URL(input instanceof Request?input.url:input).origin,api.origin);return fetch(input,init);}}};
const service=createClient(api.href,process.env.KAIZ_QA_SERVICE_KEY,options),anon=createClient(api.href,process.env.KAIZ_QA_ANON_KEY,options);
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const guides=await read('content/competitions/edition-guides.json');
const batch=preparePriorityEditionRelease(await read('content/competitions/2026-10-19/release-catalog.json'),await read('content/competitions/2026-10-17/publication-manifest.json'),await read('content/competitions/2026-10-12/ready-batch.json'),await read('content/competitions/2026-10-23/production-snapshot.json')).batch;
const held=await read('content/competitions/2026-10-19/kazakhstan-metadata-review.json');
const forms=[...batch.competitions,...held.competitions].map(e=>e.form);
const check=r=>{if(r.error)throw Object.assign(Error('Isolated QA request failed'),{code:r.error.code});return r.data;};
const ids=[],errors=[];let browser,views=0,taskDetails=0;
try{
 assert.equal(check(await service.from('competitions').select('id').in('slug',forms.map(f=>f.slug))).length,0,'Do not overwrite existing QA fixtures');
 for(const f of forms){
  const created=check(await service.from('competitions').insert({title:f.title,slug:f.slug,description:f.description,organizer:f.organizer,
   official_website:f.officialWebsite,start_date:f.startDate,end_date:f.endDate,city:f.city||null,country:f.country,
   format:f.format,status:f.status,category:f.category,eligibility:f.eligibility,tags:f.tags.split(',').map(s=>s.trim()),verified:false,presentation:f.presentation??{}}).select('id').single());
  ids.push(created.id);
 }
 assert.equal(check(await anon.from('competitions').select('id').in('id',ids)).length,15);
 assert.equal(check(await anon.from('competition_result_sets').select('id').in('competition_id',ids)).length,0);
 const {chromium}=await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
 browser=await chromium.launch({channel:'chrome',headless:true});
 await mkdir('work/beta-content/screenshots',{recursive:true});
 for(const width of [375,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce'});
  await context.addInitScript(value=>localStorage.setItem('theme',value),theme);
  await context.route('**/*',route=>[base.origin,api.origin].includes(new URL(route.request().url()).origin)?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const guide of guides){
   assert.equal((await page.goto(base.origin+'/competitions/'+guide.slug)).status(),200);
   await page.getByRole('heading',{name:'About the competition',exact:true}).waitFor();
   await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   assert.ok(await page.getByRole('button',{name:'View Results',exact:true}).isVisible());
   if(guide.statistics.length)await page.getByRole('heading',{name:'At a glance',exact:true}).waitFor();
   assert.ok(await page.locator('[data-competition-summary] .micro-label').evaluateAll(elements=>elements.length===4&&elements.every(e=>e.getBoundingClientRect().height<=2*parseFloat(getComputedStyle(e).lineHeight)+1)),'Summary captions must not become letter-by-letter columns at 200%');
   if(['faio-2025','faio-2026','ai-olymp-kazakhstan-2025','ai-olymp-kazakhstan-2026'].includes(guide.slug))await page.screenshot({path:`work/beta-content/screenshots/${guide.slug}-overview-${width}-${theme}.png`,fullPage:true});
   const labelsFit=await page.locator('dt').filter({hasText:/^Contestants$/}).evaluateAll(elements=>elements.every(e=>e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)+1));
   assert.ok(labelsFit,'Contestants label must not split mid-word at 200%');
   const results=page.getByRole('button',{name:'View Results',exact:true});
   await results.focus();await page.keyboard.press('Enter');
   await page.getByText('No published KAIZ standings yet. Use the official source when available.',{exact:true}).waitFor();
   const links=page.getByRole('link',{name:/View Official Results/});
   assert.equal(await links.count(),guide.results.length);
   for(let i=0;i<guide.results.length;i++)assert.equal(await links.nth(i).getAttribute('href'),guide.results[i].url);
   assert.equal(await page.locator('table').count(),0,'No invented native standings');
   await page.getByRole('button',{name:'Overview',exact:true}).click();
   await page.getByRole('button',{name:'Explore Tasks',exact:true}).click();
   await page.getByRole('heading',{name:'Official tasks',exact:true}).waitFor();
   assert.equal(await page.getByRole('link',{name:/Open Task Collection/}).count(),guide.tasks.filter(t=>t.kind==='collection'&&t.url).length);
   assert.equal(await page.getByRole('link',{name:'Open task →',exact:true}).count(),guide.tasks.filter(t=>t.kind==='task'&&t.url).length);
   assert.equal(await page.locator('a[href*="docs.google.com"]').count(),0,'No restricted originals');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),guide.slug+' overflow');
   if(['ioai-2025','euroai-2026','neoai-2026','faio-2025','faio-2026','ai-olymp-kazakhstan-2025','ai-olymp-kazakhstan-2026'].includes(guide.slug))await page.screenshot({path:`work/beta-content/screenshots/${guide.slug}-${width}-${theme}.png`,fullPage:true});
   for(const task of guide.tasks.filter(t=>t.kind==='task'&&t.url)){
    assert.equal((await page.goto(`${base.origin}/competitions/${guide.slug}/tasks/${task.id}`)).status(),200);
    await page.getByRole('heading',{name:task.title,exact:true}).waitFor();
    assert.equal(await page.getByRole('link',{name:/Solve on Source/}).getAttribute('href'),task.url);
    assert.equal(await page.getByRole('button',{name:/Solved|Attempted/}).count(),0,'No second practice tracker');taskDetails++;
   }
   views++;
  }
  // Next can stream notFound after sending 200. Verify the actual boundary and noindex, not only transport status.
  await page.goto(base.origin+'/competitions/ioai-2025/tasks/source-1');
  await page.getByRole('heading',{name:'This page is off the leaderboard.',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:/Solve on Source/}).count(),0,'A collection is not an individual task');
  const robots=await page.locator('meta[name="robots"]').evaluateAll(elements=>elements.map(e=>e.getAttribute('content')));
  assert.ok(robots.length>0&&robots.every(value=>value.includes('noindex')),'Streamed missing task remains noindex');
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',editions:15,views,individualTaskViews:taskDetails,themes:['light','dark'],widths:[375,1440],textZoom:'200%',keyboard:true,reducedMotion:true,anonymousRealRls:true,nativeRowsCreated:0,productionAccess:false}));
}finally{
 if(browser)await browser.close();
 for(const id of ids)check(await service.from('competitions').delete().eq('id',id));
 assert.equal(check(await service.from('competitions').select('id').in('id',ids)).length,0,'All owned fixtures removed');
}
