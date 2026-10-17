// Explicitly opt-in: real isolated Supabase Auth/Data API + real localhost UI.
// No dotenv, production credentials, copied users, token injection or mocks.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createClient} from '@supabase/supabase-js';
const ref='venniccblkybvfbxyhug';
const api=new URL(process.env.KAIZ_QA_SUPABASE_URL??'');
const base=new URL(process.env.KAIZ_LEARNING_URL??'');
assert.equal(api.origin,`https://${ref}.supabase.co`,'Only the explicitly approved QA project');
assert.equal(base.origin,'http://localhost:3106','Only the isolated local app');
assert.ok(process.env.KAIZ_QA_ANON_KEY&&process.env.KAIZ_QA_SERVICE_KEY&&process.env.KAIZ_PLAYWRIGHT_MODULE);
const options={auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{assert.equal(new URL(input instanceof Request?input.url:input).origin,api.origin);return fetch(input,init);}}};
const member=()=>createClient(api.href,process.env.KAIZ_QA_ANON_KEY,options);
const service=createClient(api.href,process.env.KAIZ_QA_SERVICE_KEY,options);
const guest=member(),accounts=[],problems=[],errors=[],blocked=[];
let browser,step='setup';
const lesson='python-algebra:python-fundamentals',otherLesson='python-algebra:python-control-flow';
const lessonPath='/roadmaps/beginner/lessons/'+encodeURIComponent(lesson);
function check(response){if(response.error)throw Object.assign(new Error('Supabase request failed'),{code:response.error.code});return response.data;}
function denied(response){assert.equal(response.error?.code,'42501','Expected a real database permission/RLS denial, not a transport failure');}
async function account(label){
 const suffix=randomUUID().replaceAll('-','').slice(0,12),email=`release-a-${label}-${suffix}@example.test`,password=randomBytes(28).toString('base64url')+'aA9!';
 const created=check(await service.auth.admin.createUser({email,password,email_confirm:true}));
 const user={id:created.user.id,email,password,client:member()};accounts.push(user);
 check(await service.from('profiles').update({username:`qa_${label}_${suffix}`,display_name:`Disposable Release A ${label}`}).eq('id',user.id));
 const auth=check(await user.client.auth.signInWithPassword({email,password}));assert.equal(auth.user.id,user.id);assert.ok(auth.user.email_confirmed_at);
 return user;
}
async function rows(user){return check(await user.client.from('learning_progress').select('user_id,roadmap_id,lesson_id,completed_at,updated_at').eq('user_id',user.id));}
async function context(width=1440,theme='dark'){
 const ctx=await browser.newContext({viewport:{width,height:1000},colorScheme:theme});
 await ctx.addInitScript(value=>localStorage.setItem('theme',value),theme);
 await ctx.route('**/*',route=>{const origin=new URL(route.request().url()).origin;if([base.origin,api.origin].includes(origin))return route.continue();blocked.push(origin);return route.abort();});
 const page=await ctx.newPage();page.on('pageerror',error=>errors.push(error.name));return {ctx,page};
}
async function login(page,user){
 await page.goto(base.origin+'/auth/login?next=%2Froadmaps%2Fbeginner');
 await page.getByLabel('Email',{exact:true}).fill(user.email);await page.getByLabel('Password',{exact:true}).fill(user.password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(base.origin+'/roadmaps/beginner');
 await page.locator('section[aria-label="Beginner saved progress"]').waitFor();
}
async function progress(page,count){
 const summary=page.locator('section[aria-label="Beginner saved progress"]');
 await summary.waitFor();const text=await summary.innerText();
 assert.match(text,new RegExp(`${count} / 15 lessons`));assert.match(text,new RegExp(`\\b${count*10} Learning XP`));assert.match(text,new RegExp(`${Math.floor(count/15*100)}%`));
 assert.equal(await page.getByRole('progressbar',{name:'Beginner completion',exact:true}).getAttribute('value'),String(count));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
}
try{
 step='isolated accounts and real Auth';const owner=await account('owner'),other=await account('other');
 assert.equal((await rows(owner)).length,0);assert.equal((await rows(other)).length,0);
 step='dashboard practice relationship';
 check(await owner.client.from('problem_performances').select('id,problem:problems!problem_performances_problem_id_fkey(title,slug,metric_name,published)').eq('user_id',owner.id).limit(1));
 const {chromium}=await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);browser=await chromium.launch({channel:'chrome',headless:true});
 await mkdir('work/learning-progress/auth-screenshots',{recursive:true});
 const a=await context();step='real browser login';await login(a.page,owner);await progress(a.page,0);
 step='lesson completion';await a.page.goto(base.origin+lessonPath);
 await a.page.getByRole('button',{name:'Mark completed: lesson 1.1',exact:true}).click();
 await a.page.getByRole('button',{name:'Undo completion of lesson 1.1',exact:true}).waitFor();
 assert.equal((await rows(owner)).filter(r=>r.completed_at).length,1);
 await a.page.getByRole('link',{name:'Beginner roadmap',exact:true}).click();await a.page.waitForURL(base.origin+'/roadmaps/beginner');await progress(a.page,1);
 step='refresh persistence';await a.page.reload();await progress(a.page,1);
 step='retry idempotency';const saved=(await rows(owner))[0];
 for(const response of await Promise.all([true,true,true].map(()=>owner.client.rpc('set_learning_completion',{p_roadmap_id:'beginner',p_lesson_id:lesson,p_completed:true}))))check(response);
 const repeated=await rows(owner);assert.equal(repeated.length,1);assert.equal(repeated[0].completed_at,saved.completed_at);
 denied(await owner.client.from('learning_progress').update({updated_at:'2099-01-01T00:00:00Z'}).eq('user_id',owner.id));
 denied(await owner.client.from('learning_progress').update({user_id:other.id}).eq('user_id',owner.id));
 assert.equal((await owner.client.rpc('set_learning_completion',{p_roadmap_id:'beginner',p_lesson_id:'forged:lesson',p_completed:true})).error?.code,'22023');
 await a.page.reload();await progress(a.page,1);
 step='dashboard';await a.page.goto(base.origin+'/dashboard');await a.page.getByRole('heading',{name:'My learning',exact:true}).waitFor();await progress(a.page,1);
 await a.page.getByRole('heading',{name:'My practice',exact:true}).waitFor();
 await a.page.getByText(/0 private self-reported attempts/).waitFor();
 assert.equal(await a.page.getByText(/Private practice is unavailable/).count(),0);
 step='existing private practice history';
 const problem=check(await service.from('problems').insert({title:'Temporary Release A QA task',slug:'release-a-qa-'+randomUUID(),category:'AI',metric_name:'F1',metric_direction:'higher_is_better',source_provider:'manual',published:true}).select('id').single());problems.push(problem.id);
 // A deliberately past fixture avoids a client/DB clock-boundary race under
 // the additive practice migration's future-time protection.
 check(await owner.client.from('problem_performances').insert({problem_id:problem.id,user_id:owner.id,attempt_type:'practice',raw_score:0.842,attempted_at:new Date(Date.now()-60000).toISOString()}));
 await a.page.reload();await a.page.getByText(/1 private self-reported attempts/).waitFor();
 await a.page.getByRole('link',{name:'Temporary Release A QA task',exact:true}).waitFor();
 await a.page.getByText(/0\.842 F1 · Self-reported/).waitFor();
 await a.page.screenshot({path:'work/learning-progress/auth-screenshots/dashboard-desktop-dark.png',fullPage:true});
 step='logout and re-login';await a.page.getByRole('button',{name:'Sign out',exact:true}).click();await a.page.waitForURL(base.origin+'/');
 await a.page.goto(base.origin+'/roadmaps/beginner');assert.equal(await a.page.getByRole('progressbar').count(),0);
 await login(a.page,owner);await progress(a.page,1);
 step='independent browser session';const second=await context(375,'light');await login(second.page,owner);await progress(second.page,1);
 await second.page.screenshot({path:'work/learning-progress/auth-screenshots/roadmap-mobile-light.png',fullPage:true});
 step='cross-user real Auth and RLS';const b=await context();await login(b.page,other);await progress(b.page,0);
 await b.page.goto(base.origin+'/dashboard');await b.page.getByText(/0 private self-reported attempts/).waitFor();
 assert.equal(await b.page.getByRole('link',{name:'Temporary Release A QA task',exact:true}).count(),0);
 assert.deepEqual(check(await other.client.from('problem_performances').select('id').eq('user_id',owner.id)),[]);
 assert.deepEqual(check(await other.client.from('learning_progress').select('lesson_id').eq('user_id',owner.id)),[]);
 assert.deepEqual(check(await other.client.from('learning_progress').update({completed_at:null}).eq('user_id',owner.id).select('lesson_id')),[]);
 denied(await other.client.from('learning_progress').insert({user_id:owner.id,roadmap_id:'beginner',lesson_id:otherLesson,completed_at:new Date().toISOString()}));
 assert.equal((await rows(owner)).filter(r=>r.completed_at).length,1);
 check(await other.client.rpc('set_learning_completion',{p_roadmap_id:'beginner',p_lesson_id:otherLesson,p_completed:true}));
 assert.equal((await rows(other)).filter(r=>r.completed_at).length,1);assert.equal((await rows(owner)).filter(r=>r.completed_at).length,1);
 step='anonymous writes and browsing';denied(await guest.from('learning_progress').select('lesson_id'));
 denied(await guest.rpc('set_learning_completion',{p_roadmap_id:'beginner',p_lesson_id:lesson,p_completed:true}));
 denied(await guest.from('learning_progress').insert({user_id:owner.id,roadmap_id:'beginner',lesson_id:otherLesson,completed_at:new Date().toISOString()}));
 const anon=await context(375,'dark');await anon.page.goto(base.origin+'/roadmaps/beginner');await anon.page.getByRole('link',{name:'Sign in to save progress',exact:true}).waitFor();
 assert.equal(await anon.page.getByRole('progressbar').count(),0);assert.equal(await anon.page.getByRole('button',{name:/Mark completed/}).count(),0);
 step='undo and cross-session reconciliation';await second.page.goto(base.origin+lessonPath);
 await second.page.getByRole('button',{name:'Undo completion of lesson 1.1',exact:true}).click();
 await second.page.getByRole('button',{name:'Mark completed: lesson 1.1',exact:true}).waitFor();
 await second.page.getByRole('link',{name:'Beginner roadmap',exact:true}).click();await second.page.waitForURL(base.origin+'/roadmaps/beginner');await progress(second.page,0);
 await a.page.goto(base.origin+'/dashboard');await progress(a.page,0);assert.equal((await rows(owner)).filter(r=>r.completed_at).length,0);
 assert.equal((await rows(other)).filter(r=>r.completed_at).length,1);
 step='browser runtime and network isolation';assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
 console.log(JSON.stringify({status:'PASS',environment:'isolated hosted Supabase + localhost production build',realAuth:true,browserLogin:true,lessonCompletion:true,refreshPersistence:true,logoutLoginPersistence:true,independentBrowserSession:true,xpAndUndo:true,retryIdempotency:true,crossUserRls:true,guestRls:true,dashboard:true,existingPrivatePracticeHistory:true,mobileLightAndDesktopDark:true,productionAccess:false}));
}catch(error){console.error(JSON.stringify({status:'FAIL',step,type:error.name,code:error.code??null}));process.exitCode=1;}
finally{
 if(browser)await browser.close();
 let removed=0;for(const user of accounts){const result=await service.auth.admin.deleteUser(user.id);if(result.error){console.error('Disposable QA account cleanup failed; inspect isolated project');process.exitCode=1;}else removed++;}
 let removedProblems=0;for(const id of problems){const result=await service.from('problems').delete().eq('id',id).select('id');if(result.error||result.data?.length!==1){console.error('Disposable QA task cleanup failed; inspect isolated project');process.exitCode=1;}else removedProblems++;}
 console.log(JSON.stringify({disposableAccountsCreated:accounts.length,disposableAccountsRemoved:removed,disposableTasksCreated:problems.length,disposableTasksRemoved:removedProblems,productionAccess:false}));
}
