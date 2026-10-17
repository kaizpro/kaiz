// Fetches only two allowlisted public organizer pages. Produces review artifacts,
// never connects to Supabase, never publishes, never infers medals/ranks.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readOfficialTables,groupOfficialTables} from './official-table-review.mjs';
const dir='content/competitions/2026-10-17';
const batch=JSON.parse(await readFile('content/competitions/2026-10-12/ready-batch.json','utf8'));
const oldCatalog=JSON.parse(await readFile('content/competitions/2026-10-12/stage-catalog.json','utf8'));
const oldStages=oldCatalog.stages;
const stages=[],sourceChecks=[];
const identities={
 'ioai-2025':{'Individual contest':'ioai-2025-individual','Final Round of Team Challenge':'ioai-2025-team-final','GAITE contest':'ioai-2025-gaite'},
 'ioai-2026':{'Individual contest':'ioai-2026-individual','GA I TE contest':'ioai-2026-gaite'},
};
const decimal=value=>{if(value==='')return null;assert.match(value,/^-?\d+(?:[.,]\d+)?$/);return Number(value.replace(',','.'));};
for(const edition of Object.keys(identities)){
 const document=await readOfficialTables(edition),groups=groupOfficialTables(document.tables);
 assert.deepEqual(groups.map(t=>t.heading).sort(),Object.keys(identities[edition]).sort());
 for(const table of groups){
  const stageId=identities[edition][table.heading],team=stageId.endsWith('team-final'),first=team?2:3,totalIndex=table.headers.length-2;
  const columns=table.headers.slice(first,totalIndex).map((label,index)=>({key:`task_${index+1}`,label}));
  const rows=table.rows.map((cells,index)=>{
   assert.equal(cells.length,table.headers.length);assert.match(cells[0],/^\d+$/);assert.ok(cells[1]);
   return {participant_id:createHash('sha256').update(`${stageId}\0${cells[1]}\0${team?'':cells[2]}`).digest('hex').slice(0,24),display_name:cells[1],participant_type:team?'team':'individual',rank:Number(cells[0]),score:decimal(cells[totalIndex]),score_display:cells[totalIndex]||null,country_or_region:team?null:cells[2]||null,score_columns:Object.fromEntries(columns.map((column,n)=>[column.key,cells[first+n]||null])),award:cells.at(-1)||null,result_status:'ranked',provenance:{source_url:document.url,source_stage:table.heading,source_row:index+1}};
  });
  assert.equal(new Set(rows.map(row=>row.participant_id)).size,rows.length,'Duplicate participant requires manual resolution');
  // Publication totals are authoritative; rounded components can differ by 0.01.
  const arithmeticDifferences=rows.filter(row=>columns.length&&Math.abs(Object.values(row.score_columns).reduce((sum,value)=>sum+(decimal(value??'')??0),0)-(row.score??0))>0.00001).map(row=>row.provenance.source_row);
  stages.push({edition_id:edition,stage_id:stageId,stage_label:table.heading,source_title:`IOAI ${edition.slice(-4)} results — ${table.heading}`,source_url:document.url,source_verified:true,publication_authorization:{status:'owner_approval_pending',evidence:'Public organizer publication; no separate KAIZ publication approval has been issued.'},completeness:'complete_source_table',scope:'This named published table only; not a claim that all event stages are available.',original_fields:table.headers,columns,rows,arithmetic_differences:{source_rows:arithmeticDifferences,action:'Preserve published total and original component strings; never repair source totals silently.'},published:false});
 }
 sourceChecks.push({edition,url:document.url,checked_at:document.checkedAt,html_sha256:document.sha256,stages:groups.map(g=>({label:g.heading,rows:g.rows.length}))});
}
for(const set of batch.resultSets.filter(set=>!stages.some(stage=>stage.stage_id===set.key))){
 const stage=oldStages.find(s=>s.key===set.key),source=batch.sources.find(s=>set.sourceIds.includes(s.id));
 stages.push({edition_id:stage.editionKey,stage_id:set.key,stage_label:stage.exactStageLabel,source_title:source.id,source_url:stage.officialSourceUrl,source_verified:true,publication_authorization:{status:'owner_approval_pending',evidence:'Existing reviewed public-source draft; explicit KAIZ publication approval still required.'},completeness:'partial',scope:stage.rowCoverage,original_fields:stage.originalScoringFields,columns:[],rows:set.entries.map((row,index)=>({participant_id:row.externalParticipantId??createHash('sha256').update(`${set.key}\0${row.participantType}\0${row.participantName}\0${row.countryCode??''}`).digest('hex').slice(0,24),display_name:row.participantName,participant_type:row.participantType,rank:row.rank,score:row.score,score_display:row.scoreDisplay,country_or_region:row.countryCode,score_columns:{},award:row.award,result_status:row.resultStatus,provenance:{source_url:stage.officialSourceUrl,source_stage:stage.exactStageLabel,source_row:index+1,review:'Reused selected draft, not a fresh full transcription'}})),published:false});
}
const requested=['ioai-2024','ioai-2025','ioai-2026','apoai-2026','euroai-2026','iaio-2026','ai-olymp-kazakhstan-2025','ai-olymp-kazakhstan-2026','faio-2025','faio-2026','neoai-2025','neoai-2026','usaaio-2025','poland-oai-2025','onia-2026'];
for(const stage of stages.filter(s=>s.completeness==='partial'))for(const row of stage.rows)row.provenance.source_row=null;
for(const original of oldCatalog.selectedOriginalComponents){
 const stage=stages.find(s=>s.stage_id===original.resultSetKey);if(!stage)continue;
 const indices=original.resultSetKey==='iaio-2026-final'?[1,2]:[0,1,2,3,4];
 stage.columns=indices.map((index,n)=>({key:`component_${n+1}`,label:original.originalScoringFields[index]}));
 for(const row of stage.rows){const source=original.rows.find(r=>r.name===row.display_name);assert.ok(source,'Component/source name mismatch');row.score_columns=Object.fromEntries(indices.map((index,n)=>[`component_${n+1}`,source.values[index]]));}
}
const editions=requested.map(id=>{const existing=batch.competitions.find(c=>c.editionKey===id);return {edition_id:id,metadata:existing??null,status:existing?'metadata_draft':'organizer_metadata_and_publication_blocked',results:stages.filter(s=>s.edition_id===id).map(s=>s.stage_id),notes:id==='neoai-2026'?'Russia is organizer context, not the location of every distributed participant; Central University is the approved organizer mapping, not a uniquely established canonical international host. No city invented.':id.startsWith('ai-olymp-kazakhstan')?'Private source transcription retained outside Git. Identity, finality and organizer permission must be resolved before including student names or importing a public competition.':null};});
await mkdir(dir,{recursive:true});
await writeFile(`${dir}/publication-manifest.json`,JSON.stringify({version:1,checked_at:'2026-10-17',mode:'review_only',production_writes:0,editions,stages,source_checks:sourceChecks,excluded_secondary:['iaio-2024','usaaio-2026'],original_draft:{sets:14,rows:49,reused_partial_sets:stages.filter(s=>s.completeness==='partial').length}},null,2)+'\n');
console.log(JSON.stringify({mode:'review_only',editions:editions.length,stages:stages.length,rows:stages.reduce((n,s)=>n+s.rows.length,0),fullSourceTables:stages.filter(s=>s.completeness==='complete_source_table').length,publicationAuthorized:0,productionAccess:false}));
