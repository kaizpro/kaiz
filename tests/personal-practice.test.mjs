import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTypescript} from './helpers/load-typescript.mjs';
const load=loadTypescript();
const {practiceScoreBounds,validatePracticeScore}=load('lib/validation/problem.ts');
test('metric-aware scores preserve direction, zero, signed metrics and source-backed maximums',()=>{
 for(const metric of ['Accuracy','F1','F1 macro','AUC','ROC-AUC']){assert.equal(validatePracticeScore('0',metric),null);assert.equal(validatePracticeScore('1',metric),null);assert.ok(validatePracticeScore('1.01',metric));assert.ok(validatePracticeScore('-0.1',metric));}
 assert.equal(validatePracticeScore('99','Accuracy (%)'),null);assert.ok(validatePracticeScore('101','Accuracy (%)'));
 assert.equal(validatePracticeScore('0','RMSE'),null);assert.equal(validatePracticeScore('123','RMSE'),null);assert.ok(validatePracticeScore('-1','RMSE'));
 assert.equal(validatePracticeScore('-2','R2'),null);assert.equal(validatePracticeScore('-2','Custom signed metric'),null);
 assert.equal(validatePracticeScore('100','Points',{score_bounds:{min:0,max:100}}),null);assert.ok(validatePracticeScore('101','Points',{score_bounds:{min:0,max:100}}));
 assert.ok(validatePracticeScore('-1','Points'));assert.ok(validatePracticeScore('NaN','F1'));assert.ok(validatePracticeScore('Infinity','F1'));
 assert.ok(practiceScoreBounds('Points',{score_bounds:{max:'100'}}).error);assert.ok(practiceScoreBounds('F1',{score_bounds:{min:2,max:1}}).error);
 assert.equal(practiceScoreBounds('Points',{reference_score:10}).max,undefined,'reference score is not a maximum');
});
test('archive renders private status only for individual tasks and never infers solved from score',()=>{
 const {ArchiveList}=load('components/learning/archive-list.tsx');
 const item={id:'problem:a',external:false,title:'Task',competition:'Independent',tags:[],source:'KAIZ',type:'task',difficulty:'unrated',availability:'open',href:'/problems/task'};
 const state={problem_id:'a',status:'attempted',latest_score:0.8,metric_name:'F1'};
 const html=renderToStaticMarkup(React.createElement(ArchiveList,{items:[item,{...item,id:'collection:a',external:true}],personal:[state]}));
 assert.equal((html.match(/data-status="attempted"/g)||[]).length,2);assert.match(html,/Latest: 0.8 F1 · Self-reported/);assert.doesNotMatch(html,/Solved — Self-reported/);
 const solved=renderToStaticMarkup(React.createElement(ArchiveList,{items:[item],personal:[{...state,status:'solved'}]}));assert.match(solved,/✓ Solved — Self-reported/);
 const guest=renderToStaticMarkup(React.createElement(ArchiveList,{items:[item]}));assert.doesNotMatch(guest,/Unattempted|Latest:|data-status/);
});
test('personal DAL scopes every read/count, bounds history and retains unknown on failure',async()=>{
 let signedIn=false,fail=false;const calls=[];
 const query={select(...args){calls.push(['select',...args]);return this;},eq(...args){calls.push(['eq',...args]);return this;},in(...args){calls.push(['in',...args]);return this;},order(){return this;},limit(n){calls.push(['limit',n]);return this;},then(resolve){return Promise.resolve({data:[],count:fail?null:0,error:fail?{code:'PGRST205'}:null}).then(resolve);}};
 const dal=loadTypescript({'@/lib/supabase/env':{hasSupabaseEnv:()=>true},'@/lib/auth':{getCurrentUser:async()=>signedIn?{id:'owner'}:null},'@/lib/supabase/server':{createClient:async()=>({from:()=>query})}})('lib/data/problem-progress.ts');
 assert.equal((await dal.getOwnProblemProgress()).signedIn,false);assert.equal(calls.length,0);
 signedIn=true;const empty=await dal.getOwnProblemProgress();assert.equal(empty.attempted,0);assert.equal(empty.solved,0);assert.equal(empty.error,null);assert.equal(calls.filter(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]==='owner').length,3);assert.ok(calls.some(c=>c[0]==='limit'&&c[1]===20));
 fail=true;const unknown=await dal.getOwnProblemProgress();assert.ok(unknown.error);assert.equal(unknown.attempted,null);assert.equal(unknown.solved,null);
});
test('status action reauthenticates, validates and derives owner at RPC boundary',async()=>{
 let signedIn=false;const writes=[],paths=[];
 const client={from(){return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{id:'94000000-0000-4000-8000-000000000001',slug:'task'},error:null})};},rpc:async(name,args)=>{writes.push({name,args});return {error:null};}};
 const {setPersonalProblemStatus}=loadTypescript({'@/lib/auth':{getCurrentUser:async()=>signedIn?{id:'owner'}:null},'@/lib/supabase/server':{createClient:async()=>client},'next/cache':{revalidatePath:path=>paths.push(path)}})('app/problems/actions.ts');
 const form=new FormData();form.set('status','solved');form.set('user_id','victim');form.set('verified','true');
 const id='94000000-0000-4000-8000-000000000001';assert.ok((await setPersonalProblemStatus(id,{},form)).error);assert.equal(writes.length,0);
 signedIn=true;assert.ok((await setPersonalProblemStatus('bad-id',{},form)).error);assert.equal(writes.length,0);
 assert.ok((await setPersonalProblemStatus(id,{},form)).success);assert.equal(writes[0].name,'set_problem_status');assert.deepEqual(Object.keys(writes[0].args).sort(),['p_problem_id','p_status']);for(const path of ['/problems','/problems/task','/dashboard'])assert.ok(paths.includes(path));
 form.set('status','clear');assert.ok((await setPersonalProblemStatus(id,{},form)).success);assert.equal(writes[1].args.p_status,null);
});
