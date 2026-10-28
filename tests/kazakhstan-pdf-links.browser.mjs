// Component/browser QA only. No actual PDF URLs, uploads, DB or Auth sessions.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {build}=await import(pathToFileURL(resolve(process.env.KAIZ_ESBUILD_MODULE)));
const {chromium}=await import(pathToFileURL(resolve(process.env.KAIZ_PLAYWRIGHT_MODULE)));
const bundle=await build({entryPoints:['tests/fixtures/kazakhstan-pdf-qa.tsx'],bundle:true,platform:'browser',format:'esm',write:false,outdir:'work/kazakhstan-pdf-browser/bundle',define:{'process.env.NODE_ENV':'"production"','process.env':'{}'}});
const css=readdirSync('.next/static/chunks').filter(f=>f.endsWith('.css')).map(f=>readFileSync('.next/static/chunks/'+f)).join('\n')+'\n'+bundle.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('\n');
const server=createServer((req,res)=>{
 if(req.url==='/qa.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles.find(f=>f.path.endsWith('.js')).contents);}
 else if(req.url==='/qa.css'){res.setHeader('Content-Type','text/css');res.end(css);}
 else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local PDF link QA</title><link rel="stylesheet" href="/qa.css"></head><body class="bg-background text-foreground"><div id="qa-root"></div><script type="module" src="/qa.js"></script></body></html>');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];let views=0;
mkdirSync('work/kazakhstan-pdf-browser',{recursive:true});
try{
 for(const width of [375,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.getByRole('heading',{name:'Local Kazakhstan PDF link QA'}).waitFor();
  await page.evaluate(t=>document.documentElement.classList.toggle('dark',t==='dark'),theme);
  await page.getByText('Results',{exact:true}).focus();await page.keyboard.press('Enter');
  for(const year of ['2025','2026'])for(const mode of ['missing','ready','unsafe']){
   await page.getByLabel('Edition',{exact:true}).selectOption(year);await page.getByLabel('Configuration',{exact:true}).selectOption(mode);
   await page.getByText(year==='2025'?'38 recorded / 40 announced finalists. No medals inferred.':'39 recorded / 40 qualifiers. Confirmed medals: 3 Gold, 5 Silver, 15 Bronze.',{exact:true}).waitFor();
   const link=page.getByRole('link',{name:/View Results PDF/});
   assert.equal(await link.count(),mode==='ready'?1:0);
   if(mode==='ready'){
    assert.equal(await link.getAttribute('href'),'https://drive.google.com/file/d/SYNTHETIC_QA_PDF_FILE_NOT_PUBLISHED/view');
    assert.equal(await link.getAttribute('target'),'_blank');assert.match(await link.getAttribute('rel'),/noopener/);await link.focus();assert.equal(await link.evaluate(e=>e===document.activeElement),true);
   }else await page.getByText('Results PDF awaiting publication.',{exact:true}).waitFor();
   assert.equal(await page.locator('a[href*="docs.google.com"]').count(),0);
   await page.getByText('No published KAIZ standings yet. Use the official source when available.',{exact:true}).waitFor();
   await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));views++;
  }
  await page.getByLabel('Configuration',{exact:true}).selectOption('ready');await page.screenshot({path:`work/kazakhstan-pdf-browser/${width}-${theme}.png`,fullPage:true});await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'PASS',views,keyboard:true,textZoom:'200%',reducedMotion:true,themes:['light','dark'],syntheticConfigurationOnly:true,actualAnonymousHostedPdfAccess:'PENDING_REAL_URLS',productionWrites:0}));
}finally{await browser.close();await new Promise(done=>server.close(done));}
