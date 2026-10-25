import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareKazakhstanStandings} from '../scripts/content/kazakhstan-results-plan.mjs';
import {loadContentModule} from '../scripts/content/load.mjs';
const read = file => JSON.parse(readFileSync(new URL('../'+file,import.meta.url)));
const permission = read('content/competitions/2026-10-25/organizer-evidence.json');
const metadata = read('content/competitions/2026-10-25/metadata-batch.json');
function fixtures() {
  const a={rows:Array.from({length:38},(_,i)=>({rank:i===36?36:i+1,last_name:'Synthetic',first_name:'Row'+i,city:'Original city',remote:1,day_1:2,day_2:3,total:6,award:null}))};
  const b=[[null,'Final Scores AI Olymp Final 2026'],['Rank','Username','First Name','Last Name','Total Score','First original task','Second original task','Third original task'],...Array.from({length:39},(_,i)=>[i<2?1:i,'qa'+i,'Synthetic','Person'+i,6,1,2,3])];
  const awards={verified:true,sourceUrl:metadata.sources[1].url,mappings:Array.from({length:23},(_,i)=>({sourceName:'Synthetic Person'+i,officialName:'Official alias '+i,award:i<3?'Gold':i<8?'Silver':'Bronze'}))};
  return {a,b,awards};
}
test('direct organizer authority clears obsolete finality hold but never authorizes production',()=>{
  const {a,b,awards}=fixtures(),p=prepareKazakhstanStandings(a,b,permission,awards);
  assert.equal(p.productionWrites,0);assert.equal(p.approvalReady,false);
  assert.equal(p.holds.length,1);assert.match(p.holds[0],/separate owner authorization/);
  assert.deepEqual(p.resultSets.map(s=>s.entries.length),[38,39]);
  assert.ok(p.resultSets.every(s=>s.form.published===false&&s.coverage==='partial'));
  assert.ok(p.resultSets[0].entries.every(r=>r.award===null));
  assert.deepEqual(['Gold','Silver','Bronze'].map(a=>p.resultSets[1].entries.filter(r=>r.award===a).length),[3,5,15]);
  assert.equal(p.resultSets[1].entries.filter(r=>r.award===null).length,16);
  assert.equal(p.resultSets[0].entries[36].presentation.comments,undefined,'Uncertain city review stays internal');
  assert.ok(!JSON.stringify(p).includes('docs.google.com'));
});
test('awards fail closed for unreviewed, duplicate, missing, ambiguous or incomplete names',()=>{
  for(const change of [x=>x.verified=false,x=>x.mappings.pop(),x=>x.sourceUrl='https://example.org',x=>x.mappings[0].sourceName='Missing',x=>x.mappings[1].sourceName=x.mappings[0].sourceName,x=>x.mappings[1].officialName=x.mappings[0].officialName,x=>x.mappings[0].award='Winner']){
    const {a,b,awards}=fixtures();change(awards);assert.throws(()=>prepareKazakhstanStandings(a,b,permission,awards));
  }
  const {a,b,awards}=fixtures();b[3][3]=b[2][3];assert.throws(()=>prepareKazakhstanStandings(a,b,permission,awards));
});
test('metadata B is two editions only; C is 77 drafts; strict replay and conflict checks remain',()=>{
  const {prepareContentPlan}=loadContentModule(),{a,b,awards}=fixtures(),p=prepareKazakhstanStandings(a,b,permission,awards);
  const snapshot={version:1,checkedAt:'2026-10-25',scope:'admin_complete',competitions:[],resultSets:[]};
  const B=prepareContentPlan(metadata,snapshot);assert.equal(B.valid,true,JSON.stringify(B.errors));
  assert.deepEqual(Array.from(B.actions,a=>a.action),['create_competition','create_competition']);
  assert.equal(metadata.competitions[0].form.verified,false);assert.match(metadata.competitions[0].dateScope,/owner-reported/i);
  assert.deepEqual([metadata.competitions[1].form.startDate,metadata.competitions[1].form.endDate],['2026-04-11','2026-04-12']);
  snapshot.competitions=metadata.competitions.map((c,i)=>({editionKey:c.editionKey,form:c.form,id:`91000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`}));
  const C={...metadata,competitions:[],resultSets:p.resultSets};
  const initial=prepareContentPlan(C,snapshot);assert.equal(initial.valid,true,JSON.stringify(initial.errors));
  assert.equal(initial.actions.filter(a=>a.action==='create_draft_set').length,2);assert.equal(initial.actions.filter(a=>a.action==='add_draft_row').length,77);
  snapshot.resultSets=p.resultSets.map((s,i)=>({id:`92000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,competitionId:snapshot.competitions[i].id,form:s.form,entries:s.entries.map((data,j)=>({id:`93000000-0000-4000-8000-${String(i*100+j+1).padStart(12,'0')}`,verified:false,data}))}));
  const replay=prepareContentPlan(C,snapshot);assert.equal(replay.valid,true);assert.equal(replay.actions.length,77);assert.ok(replay.actions.every(a=>a.action==='skip'));
  const conflict=structuredClone(C);conflict.resultSets[1].entries[0].award='Silver';const rejected=prepareContentPlan(conflict,snapshot);assert.equal(rejected.valid,false);assert.equal(rejected.actions.length,0);
});
