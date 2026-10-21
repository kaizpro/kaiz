import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {loadTypescript} from './helpers/load-typescript.mjs';
const load=loadTypescript({'next/navigation':{useRouter:()=>({refresh(){}})}});
const {journeys}=load('lib/learning/journeys.ts');
const {courseFor,learningSummary}=load('lib/learning/course.ts');
const rows=path=>courseFor(path).flatMap(m=>m.lessons).map(l=>({roadmap_id:path.level,lesson_id:l.id,completed_at:'2026-10-16T00:00:00Z',updated_at:'2026-10-16T00:00:00Z'}));
const {RoadmapProgressList}=load('components/learning/roadmap-progress-list.tsx');
const render=props=>renderToStaticMarkup(React.createElement(RoadmapProgressList,{records:[],signedIn:true,error:null,...props}));
test('directory and dashboard use actual curriculum counts and contextual Start Continue Review',()=>{
 const empty=render({});assert.equal((empty.match(/Not started/g)||[]).length,3);assert.match(empty,/0 \/ 15 lessons completed/);assert.match(empty,/Start Beginner roadmap/);
 const started=render({records:rows(journeys[0]).slice(0,1)});assert.match(started,/1 \/ 15 lessons completed/);assert.match(started,/6%/);assert.match(started,/Continue Beginner roadmap/);
 const complete=render({records:rows(journeys[0])});assert.match(complete,/Review Beginner roadmap/);assert.match(complete,/100%/);
 for(const html of [empty,started,complete,render({signedIn:false})]){assert.doesNotMatch(html,/\/lessons\//);for(const path of journeys)assert.match(html,new RegExp(`href="/roadmaps/${path.level}"`));}
 const summary=learningSummary([...rows(journeys[0]),...rows(journeys[1]).slice(0,1)]);assert.equal(summary.count,16);assert.equal(summary.total,40);assert.equal(summary.percent,40);assert.equal(summary.activeCount,1);assert.equal(summary.xp,160);
 assert.equal(learningSummary([...rows(journeys[0]),...rows(journeys[0])]).xp,150);
});
test('unavailable progress shows one retry with no fictional progress, XP or Start claim',()=>{
 const html=render({error:'Progress unavailable'});assert.equal((html.match(/role="alert"/g)||[]).length,1);assert.match(html,/Retry saved progress/);assert.doesNotMatch(html,/<progress|\d+%|\d+ Learning XP|Start Beginner/);
 const guest=render({signedIn:false});assert.match(guest,/Sign in/);assert.doesNotMatch(guest,/<progress|\d+%|\d+ Learning XP/);
});
test('theme first visit is light without forcing or overwriting saved preferences',()=>{
 const source=readFileSync('components/theme-provider.tsx','utf8');assert.match(source,/defaultTheme="light"/);assert.match(source,/enableSystem/);assert.doesNotMatch(source,/forcedTheme|localStorage\.setItem/);
});
test('all learning views invalidated only after confirmed mutation',async()=>{
 const paths=[];const {setLessonCompletion}=loadTypescript({'@/lib/data/learning-progress':{writeOwnCompletion:async()=>({success:'Saved'})},'next/cache':{revalidatePath:path=>paths.push(path)}})('app/roadmaps/actions.ts');
 const form=new FormData();form.set('completed','true');await setLessonCompletion('beginner',rows(journeys[0])[0].lesson_id,{},form);
 for(const path of ['/roadmaps','/start','/dashboard','/roadmaps/beginner'])assert.ok(paths.includes(path));
});

test('all 40 lessons use structured objectives, ordered materials and one explicit practice completion panel',async()=>{
 let state={user:{id:'unit-owner'},records:[],error:null};
 const lessonLoad=loadTypescript({'@/lib/data/learning-progress':{getOwnLearningState:async()=>state},'@/app/roadmaps/actions':{setLessonCompletion:async()=>({success:'Saved'})},'next/navigation':{notFound(){throw new Error('Not found');},useRouter:()=>({refresh(){}})}});
 const Page=lessonLoad('app/roadmaps/[level]/lessons/[lesson]/page.tsx').default;
 const {getLearningStep}=lessonLoad('lib/learning/learning-steps.ts');
 const {beginnerStep}=lessonLoad('lib/learning/beginner-learning.ts');
 let count=0;
 for(const path of journeys)for(const lesson of courseFor(path).flatMap(m=>m.lessons)){
  const html=renderToStaticMarkup(await Page({params:Promise.resolve({level:path.level,lesson:encodeURIComponent(lesson.id)})}));count++;
  const guided=path.level==='beginner'?beginnerStep(lesson.topic.id):getLearningStep(lesson.topic.id);
  for(const heading of ['What you’ll learn','Recommended learning sequence','Lesson completion'])assert.ok(html.includes(heading));
  for(const heading of guided?['<h2>Learn</h2>','<h2>Practice</h2>','<h2>Next</h2>']:['Materials &amp; exercises','Task instructions'])assert.ok(html.includes(heading));
  assert.equal((html.match(/aria-label="Lesson completion"/g)||[]).length,1);
  assert.equal((html.match(/Mark completed: lesson/g)||[]).length,1);
  const practice=html.indexOf(guided?'id="practice"':'data-practice-exercise');
  assert.ok(html.indexOf('aria-label="Lesson completion"')>practice);
  assert.ok(practice>html.indexOf('Ordered learning materials'));
  assert.match(html,/KAIZ does not run or judge code/);assert.match(html,/private self-report/);
  assert.match(html,new RegExp(`href="/roadmaps/${path.level}"`));
  const objectives=html.slice(html.indexOf('What you’ll learn'),html.indexOf(guided?'Supporting maths':'Materials &amp; exercises'));
  assert.doesNotMatch(objectives,/Source [AB] starts|Stepik is unavailable/);
 }
 assert.equal(count,40);
 const params=Promise.resolve({level:'beginner',lesson:'python-algebra:python-fundamentals'});
 state={user:{id:'unit-owner'},records:rows(journeys[0]).slice(0,1),error:null};
 let html=renderToStaticMarkup(await Page({params}));assert.match(html,/Undo completion of lesson 1.1/);assert.match(html,/Next: Python Practice/);assert.match(html,/10 Learning XP/);
 state={user:null,records:[],error:null};html=renderToStaticMarkup(await Page({params}));assert.match(html,/Sign in to save progress/);assert.doesNotMatch(html,/Mark completed:|<progress|\d+ Learning XP/);
 state={user:{id:'unit-owner'},records:[],error:'Progress unavailable'};html=renderToStaticMarkup(await Page({params}));assert.match(html,/Retry saved progress/);assert.doesNotMatch(html,/Mark completed:|<progress|\d+ Learning XP/);
 await assert.rejects(()=>Page({params:Promise.resolve({level:'beginner',lesson:'forged'})}),/Not found/);
});

test('lesson material controls retain actual titles/URLs and do not activate unverified or unsafe destinations',()=>{
 const {LessonMaterials}=load('components/learning/lesson-materials.tsx');
 const resources=courseFor(journeys[0])[0].lessons[0].topic.resources;
 const html=renderToStaticMarkup(React.createElement(LessonMaterials,{resources}));
 assert.match(html,/Ordered learning materials/);assert.match(html,/View source details/);assert.doesNotMatch(html,/Hello, Python/);
 const {ioaiMaterials}=load('lib/learning/ioai-materials.ts');
 for(const item of resources){
  assert.ok(html.includes(item.title));
  const review=ioaiMaterials.find(resource=>resource.href===item.href);
  const held=['unavailable','challenge'].includes(item.availability)||(review&&review.verification.status!=='verified');
  if(held)assert.ok(!html.includes(`href="${item.href.replaceAll('&','&amp;')}"`));
  else assert.ok(html.includes(`href="${item.href.replaceAll('&','&amp;')}"`));
 }
 const sample=resources[0];
 for(const availability of ['unavailable','challenge']){const held=renderToStaticMarkup(React.createElement(LessonMaterials,{resources:[{...sample,availability}]}));assert.doesNotMatch(held,/target="_blank"/);assert.match(held,/No active resource link/);}
 for(const href of ['javascript:alert(1)','https://name:password@example.com/'])assert.doesNotMatch(renderToStaticMarkup(React.createElement(LessonMaterials,{resources:[{...sample,href}]})),/href=/);
});
