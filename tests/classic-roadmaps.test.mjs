import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTypescript} from './helpers/load-typescript.mjs';
const load=loadTypescript();
const {journeys}=load('lib/learning/journeys.ts');
const {courseFor,courseProgress,lessonHref,learningSummary}=load('lib/learning/course.ts');
const {classicModules,classicNext}=load('lib/learning/classic-roadmap.ts');
const {beginnerCore}=load('lib/learning/beginner-learning.ts');
const row=(roadmap,id)=>({roadmap_id:roadmap,lesson_id:id,completed_at:'2026-10-20T00:00:00Z',started_at:'2026-10-20T00:00:00Z',updated_at:'2026-10-20T00:00:00Z'});

test('premium page visuals stay decorative; roadmap cards retain actual counts without guest progress',()=>{
 const {PageHero,ProductEmptyState}=load('components/product/page-hero.tsx');
 for(const motif of ['learning','competition','ranking','practice']){
  const html=renderToStaticMarkup(React.createElement(PageHero,{title:'A real page',description:'One useful sentence.',motif}));
  assert.match(html,/<h1>A real page<\/h1>/);assert.match(html,/<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
  assert.doesNotMatch(html,/<script|<animate|<progress|<img|<form/);
 }
 const {RoadmapProgressList}=load('components/learning/roadmap-progress-list.tsx');
 const guest=renderToStaticMarkup(React.createElement(RoadmapProgressList,{records:[],signedIn:false,error:null}));
 assert.equal((guest.match(/curriculum lessons/g)??[]).length,3);
 assert.doesNotMatch(guest,/<progress|0%|0 Learning XP/);
 const empty=renderToStaticMarkup(React.createElement(ProductEmptyState,{title:'No results'},'Nothing published.'));
 assert.match(empty,/<h2>No results<\/h2>/);assert.doesNotMatch(empty,/<table/);
});

test('classic module projection preserves all 40 original identities and only adds the existing shared Analysis reference',()=>{
 let own=0;
 for(const path of journeys){
  const projected=classicModules(path).flatMap(module=>[...module.lessons,...module.supporting]);
  const expected=courseFor(path).flatMap(module=>module.lessons);
  assert.equal(classicModules(path).length,4);
  assert.deepEqual(projected.filter(item=>item.roadmap===path.level).map(item=>item.id).sort(),expected.map(item=>item.id).sort());
  for(const item of projected)assert.equal(item.href,lessonHref(item.roadmap,item.id));
  const shared=projected.filter(item=>item.roadmap!==path.level);
  assert.equal(shared.length,path.level==='beginner'?1:0);
  if(shared.length){assert.equal(shared[0].roadmap,'intermediate');assert.equal(shared[0].id,'prepare-data:exploratory-analysis');}
  own+=expected.length;
 }
 assert.equal(own,40);
});

test('each whole roadmap row is one keyboard-native link with live progress and no nested controls',()=>{
 const {RoadmapProgressList}=load('components/learning/roadmap-progress-list.tsx');
 const html=renderToStaticMarkup(React.createElement(RoadmapProgressList,{records:[row('beginner',beginnerCore[0].lessonId)],signedIn:true,error:null}));
 assert.equal((html.match(/<a /g)??[]).length,3);
 assert.equal((html.match(/<progress /g)??[]).length,3);
 assert.match(html,/<section[^>]*Beginner roadmap progress[^>]*><a[^>]*href="\/roadmaps\/beginner"/);
 assert.match(html,/aria-label="Continue Beginner roadmap"/);
 assert.match(html,/aria-describedby="roadmap-beginner-progress"/);
 assert.match(html,/1 \/ 15 lessons completed/);assert.match(html,/10 Learning XP/);
 assert.doesNotMatch(html,/<button|tabindex|role="button"/i);
 const guest=renderToStaticMarkup(React.createElement(RoadmapProgressList,{records:[],signedIn:false,error:null}));
 for(const path of journeys)assert.ok(guest.includes(`aria-label="Open ${path.title} roadmap"`));
 assert.equal((guest.match(/lucide-chevron-right/g)??[]).length,3);
 assert.doesNotMatch(guest,/smallAction|>Browse|<button/);
});

test('desktop and mobile navigation retain all seven destinations with a direct active Strategist link and no More menu',()=>{
 const {MainNav,MobileNav}=loadTypescript({'next/navigation':{usePathname:()=>'/strategist/preparation'}})('components/main-nav.tsx');
 for(const Component of [MainNav,MobileNav]){
  const html=renderToStaticMarkup(React.createElement(Component));
  assert.equal((html.match(/<a /g)??[]).length,7);
  for(const href of ['/competitions','/problems','/leaderboards','/roadmaps','/discussions','/learn','/strategist'])assert.ok(html.includes(`href="${href}"`));
  assert.match(html,/<a[^>]*aria-current="page"[^>]*href="\/strategist"[^>]*>Personal AI Strategist<\/a>/);
  assert.doesNotMatch(html,/>More<|dropdown/i);
 }
 const desktop=renderToStaticMarkup(React.createElement(MainNav));assert.doesNotMatch(desktop,/<details|<summary/);
});

test('all 40 lessons retain one completion control, compact actions and complete collapsed instruction content',async()=>{
 const calls=[];
 const pageLoad=loadTypescript({
  '@/lib/data/learning-progress':{getOwnLearningState:async()=>({user:{id:'fixture'},records:[],error:null})},
  '@/components/learning/completion-control':{CompletionControl:props=>{calls.push(props);return React.createElement('button',null,'Complete');}},
  'next/navigation':{notFound(){throw Error('not found');}},
 });
 const Page=pageLoad('app/roadmaps/[level]/lessons/[lesson]/page.tsx').default;
 const {lessonPracticeLinks,practiceLinkFor}=load('lib/learning/lesson-practice-links.ts');
 const {beginnerStep}=load('lib/learning/beginner-learning.ts');
 let count=0,external=0;
 for(const path of journeys) for(const unit of courseFor(path)) for(const item of unit.lessons){
  calls.length=0;
  assert.ok(Object.hasOwn(lessonPracticeLinks,item.topic.id),`explicit practice audit: ${item.topic.id}`);
  const html=renderToStaticMarkup(await Page({params:Promise.resolve({level:path.level,lesson:item.id})}));
  assert.equal(calls.length,1);assert.equal(calls[0].roadmap,path.level);assert.equal(calls[0].lesson,item.id);
  assert.equal((html.match(/aria-label="Lesson completion"/g)??[]).length,1);
  assert.equal((html.match(/data-practice-actions=/g)??[]).length,1);
  assert.match(html,/Study Material/);assert.match(html,/KAIZ does not verify external solutions/);
  assert.match(html,/<details[^>]*data-practice-instructions="true"><summary>Task instructions/);
  assert.doesNotMatch(html,/<details[^>]*\bopen[^>]*data-practice-instructions/);
  const resource=practiceLinkFor(item.topic.id);
  if(resource){external++;assert.ok(html.includes(resource.href));assert.equal(new URL(resource.href).hostname,'www.kaggle.com');assert.match(resource.href,/\/(code|competitions)\//);assert.ok(resource.evidence.startsWith('https://'));}
  else assert.doesNotMatch(html,/Practice on Kaggle/);
  const guided=path.level==='beginner'?beginnerStep(item.topic.id):null;
  if(guided){assert.ok(html.includes(guided.practice.title));assert.match(html,/Optional hints/);assert.match(html,/Worked example/);}
  count++;
 }
 assert.equal(count,40);assert.ok(external>=25);
 assert.match(practiceLinkFor('numpy').note,/Community notebook.*not an official/);
});

test('Strategist is static, has two real destinations, rejects unknown pages and exposes no fake AI or collection',async()=>{
 const pageLoad=loadTypescript({'next/navigation':{notFound(){throw Error('not found');}}});
 const html=renderToStaticMarkup(React.createElement(pageLoad('app/strategist/page.tsx').default));
 assert.match(html,/<svg[^>]*viewBox="0 0 420 260"[^>]*aria-hidden="true"[^>]*focusable="false"/);
 assert.equal((html.match(/Coming soon/g)??[]).length,2);
 for(const focus of ['olympiads','preparation']){
  assert.ok(html.includes(`/strategist/${focus}`));
  const child=renderToStaticMarkup(await pageLoad('app/strategist/[focus]/page.tsx').default({params:Promise.resolve({focus})}));
  assert.match(child,/Coming soon/);assert.match(child,/Explore Roadmaps/);assert.doesNotMatch(child,/<form|<input|<textarea|<button/);
 }
 await assert.rejects(pageLoad('app/strategist/[focus]/page.tsx').default({params:Promise.resolve({focus:'toString'})}),/not found/);
 assert.doesNotMatch(html,/<form|<input|<textarea|<button/);
});
test('classic Beginner preserves every improved teaching step in order without making maths or DL prerequisites',()=>{
 const modules=classicModules(journeys[0]);
 assert.deepEqual(Array.from(modules.filter(module=>!module.optional).flatMap(module=>module.lessons.map(item=>item.topic.id))),Array.from(beginnerCore,item=>item.topicId));
 assert.equal(modules[3].optional,true);
 assert.deepEqual(Array.from(modules.flatMap(module=>module.supporting.map(item=>item.topic.id))),['algebra','math-functions']);
 const records=[];
 for(const step of beginnerCore){
  assert.equal(classicNext(journeys[0],records,true).next.href,lessonHref(step.roadmap,step.lessonId));
  records.push(row(step.roadmap,step.lessonId));
 }
 assert.equal(classicNext(journeys[0],records,true).next,null);
 assert.ok(courseProgress(journeys[0],records).count<15,'core review must not claim all optional curriculum is completed');
 assert.equal(learningSummary(records).count,11);
 assert.equal(learningSummary(records).xp,110);
 assert.equal(learningSummary(records).total,40);
});
test('guest/error/wrong-roadmap/started-only records never fabricate continue or completion',()=>{
 const first=beginnerCore[0],completed=row(first.roadmap,first.lessonId);
 for(const [records,ready] of [[[completed],false],[[{...completed,roadmap_id:'advanced'}],true],[[{...completed,completed_at:null}],true]]){
  const next=classicNext(journeys[0],records,ready);
  assert.equal(next.continuing,false);assert.equal(next.next.href,lessonHref(first.roadmap,first.lessonId));
 }
 assert.equal(classicNext(journeys[0],[completed],true).continuing,true);
});
test('shared Analysis completion is scoped to its original roadmap, renders once and cannot duplicate XP',()=>{
 const calls=[];
 const {CourseModules}=loadTypescript({'./completion-control':{CompletionControl:props=>{calls.push(props);return null;}}})('components/learning/course-modules.tsx');
 const records=[row('intermediate','prepare-data:exploratory-analysis')];
 const html=renderToStaticMarkup(React.createElement(CourseModules,{path:journeys[0],records,canSave:true}));
 assert.match(html,/Shared Intermediate lesson · ✓ Completed/);
 const bridge=calls.filter(props=>props.roadmap==='intermediate');assert.equal(bridge.length,1);
 assert.equal(bridge[0].lesson,'prepare-data:exploratory-analysis');assert.equal(bridge[0].completed,true);
 assert.equal(courseProgress(journeys[0],records).xp,0);
 assert.equal(learningSummary(records).xp,10);
});
test('classic landing uses three compact levels; overview has visible saved progress and an optional Atlas',async()=>{
 const pageLoad=loadTypescript({
  '@/lib/data/learning-progress':{getOwnLearningState:async()=>({user:{id:'fixture'},records:[row('beginner',beginnerCore[0].lessonId)],error:null})},
  '@/components/learning/journey-competitions':{JourneyCompetitions:()=>null},
  'next/navigation':{useRouter:()=>({refresh(){}}),notFound(){throw Error('not found');}},
 });
 const landing=renderToStaticMarkup(await pageLoad('app/start/page.tsx').default());
 for(const path of journeys)assert.ok(landing.includes(`${path.title} roadmap progress`));
 assert.doesNotMatch(landing,/Small steps|data-entry-profile|entryCards/);
 const Page=pageLoad('app/start/[level]/page.tsx').default;
 const html=renderToStaticMarkup(await Page({params:Promise.resolve({level:'beginner'})}));
 assert.match(html,/Beginner AI Olympiad Roadmap/);assert.match(html,/Continue learning · Python Practice/);
 assert.match(html,/1 \/ 15 lessons/);assert.match(html,/10 Learning XP/);
 assert.equal((html.match(/data-course-module=/g)??[]).length,4);
 assert.doesNotMatch(html,/data-atlas-root|data-course-area|Your saved progress/);
 assert.match(html,/Explore Skill Atlas/);
 const atlas=renderToStaticMarkup(await Page({params:Promise.resolve({level:'beginner'}),searchParams:Promise.resolve({view:'map'})}));
 assert.match(atlas,/data-atlas-root/);assert.match(atlas,/Back to roadmap/);
});
