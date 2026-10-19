import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTypescript} from './helpers/load-typescript.mjs';
const load=loadTypescript({'next/navigation':{useRouter:()=>({refresh(){}})}});
const {journeys}=load('lib/learning/journeys.ts');
const {courseFor,getCourseLesson,courseProgress,learningSummary,lessonHref,courseLessonFromSegment}=load('lib/learning/course.ts');
const row=(path,lesson,completed=true)=>({roadmap_id:path,lesson_id:lesson,completed_at:completed?'2026-10-15T01:00:00Z':null,started_at:'2026-10-15T00:00:00Z',updated_at:'2026-10-15T01:00:00Z'});
test('course identities preserve curated topics/order and are independent of titles',()=>{
 let total=0;
 for(const path of journeys){
  const modules=courseFor(path);assert.equal(modules.length,4);
  const keys=modules.flatMap(m=>m.lessons.map(l=>l.id));total+=keys.length;assert.equal(new Set(keys).size,keys.length);
  for(let i=0;i<4;i++){assert.deepEqual(Array.from(modules[i].lessons,l=>l.topic.id),Array.from(path.steps[i].topics));assert.equal(modules[i].number,i+1);}
  const renamed={...path,steps:path.steps.map(s=>({...s,title:'Renamed title'}))};assert.deepEqual(Array.from(courseFor(renamed).flatMap(m=>m.lessons),l=>l.id),Array.from(keys));
  const reordered={...path,steps:[...path.steps].reverse()};assert.deepEqual(Array.from(courseFor(reordered).flatMap(m=>m.lessons),l=>l.id).sort(),Array.from(keys).sort());
 }
 assert.equal(total,40);
 for(const pair of [['__proto__','x'],['beginner','constructor'],['beginner','evaluation:model-evaluation']])assert.equal(getCourseLesson(...pair),undefined);
});
test('real completion count, XP idempotency, undo and retired content',()=>{
 const path=journeys[0],lessons=courseFor(path).flatMap(m=>m.lessons);
 const duplicate=row(path.level,lessons[0].id);
 let p=courseProgress(path,[duplicate,duplicate,row('advanced',lessons[1].id),row(path.level,'retired:old')]);
 assert.equal(p.count,1);assert.equal(p.xp,10);assert.equal(p.percent,6);assert.equal(p.next.id,lessons[1].id);
 p=courseProgress(path,[row(path.level,lessons[0].id,false)]);assert.equal(p.count,0);assert.equal(p.xp,0);assert.equal(p.next.id,lessons[0].id);
 p=courseProgress(path,lessons.map(l=>row(path.level,l.id)));assert.equal(p.percent,100);assert.equal(p.xp,150);assert.equal(p.next,undefined);
 assert.equal(learningSummary([row('advanced','retired:old')]).active,undefined);
 assert.ok(lessonHref('beginner',lessons[0].id).includes('%3A'));
});
test('encoded lesson routes decode once; malformed or multiply encoded keys fail closed',()=>{
 const key='python-algebra:python-fundamentals';
 assert.equal(courseLessonFromSegment('beginner',encodeURIComponent(key)).lesson.id,key);
 assert.equal(courseLessonFromSegment('beginner',key).lesson.id,key);
 for(const value of ['%','%GG',encodeURIComponent(encodeURIComponent(key)),key+'/extra','x'.repeat(481)])assert.equal(courseLessonFromSegment('beginner',value),undefined);
});
test('guest/error summaries never claim saved percentage, XP or completion',()=>{
 const {CourseProgress}=load('components/learning/course-progress.tsx');
 const render=props=>renderToStaticMarkup(React.createElement(CourseProgress,{path:journeys[0],records:[],...props}));
 assert.match(render({signedIn:false,error:null}),/Sign in to save/);assert.doesNotMatch(render({signedIn:false,error:null}),/\d+%|\d+ Learning XP|<progress/);
 assert.doesNotMatch(render({signedIn:true,error:'Unavailable'}),/\d+%|\d+ Learning XP|<progress/);
 const saved=render({signedIn:true,error:null});assert.match(saved,/0 Learning XP/);assert.match(saved,/Start first lesson/);assert.match(saved,/<progress/);
});
test('action validates current curriculum, strips owner/counters, and handles failed writes',async()=>{
 let writes=[],invalidations=[];
 const {setLessonCompletion}=loadTypescript({'@/lib/data/learning-progress':{writeOwnCompletion:async(...args)=>{writes.push(args);return args[2]?{success:'Saved'}:{error:'Not saved'};}},'next/cache':{revalidatePath:p=>invalidations.push(p)}})('app/roadmaps/actions.ts');
 const key=courseFor(journeys[0])[0].lessons[0].id;
 const data=new FormData();data.set('completed','true');data.set('user_id','another-owner');data.set('xp','999');
 assert.ok((await setLessonCompletion('beginner','forged:lesson',{},data)).error);assert.equal(writes.length,0);
 assert.ok((await setLessonCompletion('beginner',key,{},data)).success);assert.deepEqual(Array.from(writes[0]),['beginner',key,true]);assert.ok(invalidations.includes('/dashboard'));
 invalidations=[];data.set('completed','false');assert.ok((await setLessonCompletion('beginner',key,{},data)).error);assert.equal(invalidations.length,0);
});
test('stored completions render checkmarks/module counts without completing external clicks',()=>{
 const {CourseModules}=loadTypescript({'@/app/roadmaps/actions':{setLessonCompletion:async()=>({success:'Saved'})}})('components/learning/course-modules.tsx');
 const first=courseFor(journeys[0])[0].lessons[0];
 const html=renderToStaticMarkup(React.createElement(CourseModules,{path:journeys[0],records:[row('beginner',first.id)],canSave:true}));
 assert.match(html,/1 \/ 5 completed/);assert.match(html,/Completed · Undo/);assert.match(html,/name="completed" value="false"/);assert.match(html,/1\.1/);
 assert.doesNotMatch(html,/onClick=|localStorage|award.*rating/i);
});
test('DAL derives authenticated ownership, does not cache and fails closed',async()=>{
 let calls=[],authenticated=false,fail=false;
 const client={rpc:async(name,args)=>{calls.push({name,args});return {error:fail?{}:null};},from(){return {select(){return this;},eq(column,id){calls.push({column,id});return Promise.resolve({data:[],error:fail?{}:null});}};}};
 const dal=loadTypescript({'@/lib/auth':{getCurrentUser:async()=>authenticated?{id:'owner'}:null},'@/lib/supabase/env':{hasSupabaseEnv:()=>true},'@/lib/supabase/server':{createClient:async()=>client}})('lib/data/learning-progress.ts');
 assert.ok((await dal.writeOwnCompletion('beginner','x',true)).error);assert.equal(calls.length,0);
 authenticated=true;assert.ok((await dal.writeOwnCompletion('beginner','x',true)).success);assert.equal('user_id' in calls[0].args,false);
 fail=true;assert.ok((await dal.getOwnLearningState()).error);assert.deepEqual(calls.at(-1),{column:'user_id',id:'owner'});
 authenticated=false;assert.equal((await dal.getOwnLearningState()).user,null);
});
test('migration protects ownership and trusted timestamps without competitive counters',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/202610150001_learning_progress.sql',import.meta.url),'utf8');
 assert.match(sql,/foreign key\(roadmap_id,lesson_id\)/i);assert.match(sql,/primary key\(user_id,roadmap_id,lesson_id\)/i);
 assert.doesNotMatch(sql,/public\.is_admin\(\)|security definer|add column.*(?:xp|rating)/i);
 assert.match(sql,/grant update\(completed_at\)/i);assert.match(sql,/new\.completed_at := case/);
});

test('disposable SQL runner applies every migration canonically before discovering all current-schema suites',()=>{
 const runner=readFileSync(new URL('./learning-progress.postgres.mjs',import.meta.url),'utf8');
 assert.match(runner,/readdir\('supabase\/migrations'\)\)\.filter\(f=>f\.endsWith\('\.sql'\)\)\.sort\(\)/);
 assert.match(runner,/for\(const file of files\)await client\.query\(await readFile\('supabase\/migrations\/\'\+file,'utf8'\)\)/);
 assert.match(runner,/readdir\('supabase\/tests'\)\)\.filter\(f=>f\.endsWith\('\.test\.sql'\)\)\.sort\(\)/);
 assert.ok(runner.indexOf('for(const file of files)')<runner.indexOf('for(const file of suites)'));
 assert.doesNotMatch(runner,/files\.filter|files\.includes|const privacy=|const external=/);
 assert.match(runner,/mkdtemp\(join\(tmpdir\(\),'kaiz-learning-'\)\)/);
 assert.match(runner,/postgresFlags:\['-h','127\.0\.0\.1'\]/);
});

test('archive assertions enforce current admin cross-owner denial, not the superseded moderation exception',()=>{
 const sql=readFileSync(new URL('../supabase/tests/problem_archive_security.test.sql',import.meta.url),'utf8');
 assert.match(sql,/count\(\*\) from public\.problem_performances where attempt_type = 'practice'\), 0::bigint, 'admin cannot read another owner private practice'/);
 assert.match(sql,/select is\(count\(\*\), 0::bigint, 'admin cannot invalidate another owner private practice'\) from changed/);
 assert.match(sql,/'valid', 'denied admin update preserves the owner private attempt'/);
 assert.match(sql,/owner cannot revalidate admin-invalidated attempt/);
 assert.match(sql,/admin manages official normalized\/provenance data/);
 assert.doesNotMatch(sql,/'admin invalidates practice'/);
});

test('dashboard practice reads only the authenticated owner and preserves unavailable state',async()=>{
 let signedIn=false,fail=false;const calls=[];
 const query={select(...args){calls.push(['select',...args]);return this;},eq(...args){calls.push(['eq',...args]);return this;},order(...args){calls.push(['order',...args]);return this;},limit(n){calls.push(['limit',n]);return Promise.resolve({data:[],count:fail?null:0,error:fail?{}:null});}};
 const {getOwnRecentPractice}=loadTypescript({'@/lib/auth':{getCurrentUser:async()=>signedIn?{id:'owner'}:null},'@/lib/supabase/server':{createClient:async()=>({from(table){calls.push(['from',table]);return query;}})}})('lib/data/personal-practice.ts');
 assert.equal((await getOwnRecentPractice()).count,0);assert.equal(calls.length,0);
 signedIn=true;assert.equal((await getOwnRecentPractice()).error,null);
 assert.ok(calls.some(c=>c[0]==='select'&&c[1].includes('problems!problem_performances_problem_id_fkey(')),'Disambiguate the simple problem FK from the official-result composite context FK');
 assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]==='owner'));
 assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='attempt_type'&&c[2]==='practice'));
 assert.ok(calls.some(c=>c[0]==='limit'&&c[1]===20));
 fail=true;assert.match((await getOwnRecentPractice()).error,/No empty history is assumed/);
});
