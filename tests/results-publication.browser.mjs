// Component/browser test, NOT a substitute for the real SQL/RLS suite.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {build}=await import(pathToFileURL(resolve(process.env.KAIZ_ESBUILD_MODULE)));
const {chromium}=await import(pathToFileURL(resolve(process.env.KAIZ_PLAYWRIGHT_MODULE)));
const bundle=await build({entryPoints:['tests/fixtures/results-publication-qa.tsx'],bundle:true,platform:'browser',format:'esm',write:false,define:{'process.env.NODE_ENV':'"production"','process.env':'{}'}});
const css=readdirSync('.next/static/chunks').filter(f=>f.endsWith('.css')).map(f=>readFileSync('.next/static/chunks/'+f)).join('\n');
const server=createServer((req,res)=>{if(req.url==='/qa.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents);}else if(req.url==='/qa.css'){res.setHeader('Content-Type','text/css');res.end(css);}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local publication component QA</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa-root"></div><script type="module" src="/qa.js"></script></body></html>');}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];let views=0;mkdirSync('work/results-privacy-browser',{recursive:true});
try{
 for(const width of [375,1440])for(const theme of ['light','dark']){
  const c=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce'});await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());const p=await c.newPage();p.on('pageerror',e=>errors.push(e.name));await p.goto(origin);await p.getByRole('heading',{name:'Local publication controls QA'}).waitFor();await p.evaluate(t=>document.documentElement.classList.toggle('dark',t==='dark'),theme);
  assert.equal(await p.getByRole('checkbox',{name:/Publish/}).count(),0);
  const publish=p.getByRole('button',{name:'Publish standings',exact:true});await publish.focus();await p.keyboard.press('Enter');await p.getByRole('button',{name:'Withdraw publication',exact:true}).waitFor();
  assert.deepEqual(JSON.parse(await p.getByLabel('Submitted fields').innerText()),{resultSetId:'ad000000-0000-4000-8000-000000000001',published:'true'});
  await p.getByRole('button',{name:'Withdraw publication',exact:true}).click();await p.getByRole('button',{name:'Publish standings',exact:true}).waitFor();assert.equal(JSON.parse(await p.getByLabel('Submitted fields').innerText()).published,'false');
  await p.evaluate(()=>document.documentElement.style.fontSize='200%');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:`work/results-privacy-browser/${width}-${theme}.png`,fullPage:true});views++;await c.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({componentBrowser:'PASS',views,keyboard:true,reducedMotion:true,textZoom:'200%',scopedPayload:true,noMetadataPublishCheckbox:true,realAuthTest:false,productionAccess:false}));
}finally{await browser.close();await new Promise(done=>server.close(done));}
