import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTypescript} from './helpers/load-typescript.mjs';
const load=loadTypescript();const {sourceAttemptSchema,safePracticeUrl}=load('lib/validation/source-practice.ts');
const attempt={raw_score:'0.87',attempted_at:'2026-01-01T12:30',practice_metric:'Accuracy',practice_outcome:'practiced',practice_direction:'higher_is_better'};
test('external score validation preserves units, direction, zero and missing score without fabricated limits',()=>{
 assert.equal(sourceAttemptSchema.parse(attempt).raw_score,'0.87','Decimal form text stays lossless until PostgreSQL NUMERIC');
 for(const raw_score of ['0','1'])assert.ok(sourceAttemptSchema.safeParse({...attempt,raw_score}).success);
 for(const raw_score of ['-1','1.1','Infinity','NaN'])assert.equal(sourceAttemptSchema.safeParse({...attempt,raw_score}).success,false);
 assert.ok(sourceAttemptSchema.safeParse({...attempt,raw_score:'350',practice_metric:'points',practice_direction:''}).success);
 assert.ok(sourceAttemptSchema.safeParse({...attempt,raw_score:'-10',practice_metric:'custom signed'}).success);
 const empty=sourceAttemptSchema.parse({...attempt,raw_score:'',practice_metric:'  ',practice_direction:''});assert.equal(empty.raw_score,null);assert.equal(empty.practice_metric,null);assert.equal(empty.practice_direction,null);
 assert.equal(sourceAttemptSchema.safeParse({...attempt,practice_metric:''}).success,false);
 assert.equal(sourceAttemptSchema.safeParse({...attempt,practice_outcome:'solved'}).success,false);
 assert.ok(sourceAttemptSchema.safeParse({...attempt,practice_outcome:'solved',practice_task_title:'Individual task'}).success);
 assert.equal(sourceAttemptSchema.safeParse({...attempt,practice_outcome:'solved',practice_task_title:'x'}).success,false);
});
test('user URLs are HTTPS only, no credentials/invitations/local targets or secret queries',()=>{
 for(const url of ['http://example.test/a','javascript:alert(1)','https://x:y@example.test','https://127.0.0.1/a','https://10.0.0.1/a','https://[::1]/a','https://example.test/t/invite','https://example.test/?token=hidden'])assert.equal(safePracticeUrl(url),false,url);
 assert.equal(safePracticeUrl('https://www.kaggle.com/competitions/public-task'),true);
});
test('external archive progress is distinct from internal solved tasks and never inferred from scores',()=>{
 const {ArchiveList}=load('components/learning/archive-list.tsx');
 const item={id:'source-a-problem-1',title:'Collection',external:true,href:'/problems/sources/source-a-problem-1',tags:[],source:'FAIO',type:'contest',difficulty:'Unrated',availability:'public'};
 const html=renderToStaticMarkup(React.createElement(ArchiveList,{items:[item],sources:[{catalog_id:item.id,status:'practiced',latest_score:350,metric:'points'}]}));assert.match(html,/Practiced \/ Participated/);assert.match(html,/350 points/);assert.doesNotMatch(html,/Solved/);
 const finished=renderToStaticMarkup(React.createElement(ArchiveList,{items:[item],sources:[{catalog_id:item.id,status:'finished'}]}));assert.match(finished,/✓ Finished — Self-reported/);assert.match(finished,/data-status="finished"/);
});
test('source DAL fails closed and never queries for guests or an empty allowlist',async()=>{
 let signedIn=false,calls=0;
 const dal=loadTypescript({'@/lib/supabase/env':{hasSupabaseEnv:()=>true},'@/lib/auth':{getCurrentUser:async()=>signedIn?{id:'owner'}:null},'@/lib/supabase/server':{createClient:async()=>{calls++;throw Error('Unavailable');}}})('lib/data/source-practice.ts');
 assert.equal((await dal.getOwnSourceSummaries()).signedIn,false);assert.equal(calls,0);
 signedIn=true;assert.equal((await dal.getOwnSourceSummaries([])).count,0);assert.equal(calls,0);
 const failed=await dal.getOwnSourceSummaries();assert.ok(failed.error);assert.equal(failed.count,null);
 assert.ok((await dal.writeSourcePractice('not-in-catalog','create',null,new FormData())).error);assert.equal(calls,1);
});
