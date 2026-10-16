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
 const started=render({records:rows(journeys[0]).slice(0,1)});assert.match(started,/1 \/ 15 lessons completed/);assert.match(started,/6%/);assert.match(started,/Continue Beginner roadmap/);assert.match(started,/python-algebra%3Apython-control-flow/);
 const complete=render({records:rows(journeys[0])});assert.match(complete,/Review Beginner roadmap/);assert.match(complete,/100%/);
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
