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
