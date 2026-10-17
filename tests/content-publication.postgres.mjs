// Fresh local PostgreSQL only. Never loads .env, never takes a database URL.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {preparePublicationPlan} from '../scripts/content/publication-plan.mjs';
import {loadContentModule} from '../scripts/content/load.mjs';
assert.ok(process.env.KAIZ_EMBEDDED_POSTGRES_MODULE&&process.env.KAIZ_PRESENTATION_MIGRATION,'Provide disposable PG17 runtime and exact reviewed PR24 migration file');
const presentation=await readFile(process.env.KAIZ_PRESENTATION_MIGRATION);
assert.equal(createHash('sha256').update(presentation.toString().replaceAll('\r\n','\n')).digest('hex'),'c5ef2f4c99b692e2a1bd080692f22647ca6253ae27454499c18afc153539be59','Reviewed canonical Git bytes; tolerate checkout line endings only');
const {default:EmbeddedPostgres}=await import(pathToFileURL(process.env.KAIZ_EMBEDDED_POSTGRES_MODULE).href);
const folder=await mkdtemp(join(tmpdir(),'kaiz-content-import-'));
const pg=new EmbeddedPostgres({databaseDir:join(folder,'db'),user:'postgres',password:randomBytes(32).toString('hex'),port:55442,persistent:true,initdbFlags:['--encoding=UTF8','--locale=C'],postgresFlags:['-h','127.0.0.1'],onLog:()=>{},onError:()=>{}});
let client;
try{
 await mkdir(join(folder,'db'));await pg.initialise();await pg.start();client=pg.getPgClient();await client.connect();
 assert.match((await client.query("select current_setting('server_version') v")).rows[0].v,/^17\./);
 await client.query(await readFile('tests/fixtures/disposable-supabase.sql','utf8'));
 const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort();
 for(const file of files){if(file>'202610120001'&&!files.some(f=>f.startsWith('202610120001'))&&!files.slice(0,files.indexOf(file)).some(f=>f>'202610120001'))await client.query(presentation.toString());await client.query(await readFile('supabase/migrations/'+file,'utf8'));}
 if(existsSync('supabase/tests/competition_presentation_security.test.sql')){
  const sql=(await readFile('supabase/tests/competition_presentation_security.test.sql','utf8')).replace('create extension if not exists pgtap with schema extensions;','');
  const results=await client.query(sql);const assertions=results.flatMap(r=>r.rows??[]).filter(row=>Object.values(row).some(v=>typeof v==='string'&&v.startsWith('ok: '))).length;
  console.log(JSON.stringify({suite:'competition_presentation_security.test.sql',assertions,status:'PASS'}));
 }
 const read=async path=>JSON.parse(await readFile(path,'utf8'));
 const manifest=await read('content/competitions/2026-10-17/publication-manifest.json'),batch=await read('content/competitions/2026-10-12/ready-batch.json'),snapshot=await read('content/competitions/2026-10-15/admin-snapshot.json');
 const plan=preparePublicationPlan(manifest,batch,snapshot);assert.equal(plan.valid,true);
 const {competitionSchema}=loadContentModule('@/lib/validation/competition');
 async function competition(form,id){const c=competitionSchema.parse(form);return(await client.query('insert into public.competitions(id,title,slug,description,organizer,official_website,start_date,end_date,city,country,format,status,category,eligibility,tags,verified) values(coalesce($1,gen_random_uuid()),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning id',[id??null,c.title,c.slug,c.description,c.organizer,c.officialWebsite||null,c.startDate,c.endDate,c.city||null,c.country||null,c.format,c.status,c.category,c.eligibility,c.tags,c.verified])).rows[0].id;}
 for(const old of snapshot.competitions)await competition(old.form,old.id);
 const fingerprints=async()=> (await client.query('select id,md5(to_jsonb(c)::text) fingerprint from public.competitions c where id=any($1::uuid[]) order by id',[snapshot.competitions.map(c=>c.id)])).rows;
 const before=await fingerprints();
 await client.query("insert into auth.users(id,email) values('99000000-0000-4000-8000-000000000001','content-admin@example.test'),('99000000-0000-4000-8000-000000000002','content-member@example.test');update public.profiles set role='admin' where id='99000000-0000-4000-8000-000000000001';set role authenticated;select set_config('request.jwt.claim.sub','99000000-0000-4000-8000-000000000001',false)");
 const ids=new Map(snapshot.competitions.map(c=>[c.editionKey,c.id]));
 for(const edition of manifest.editions.filter(e=>e.metadata&&!ids.has(e.edition_id)))ids.set(edition.edition_id,await competition(edition.metadata.form));
 const sets=[];
 for(const stage of manifest.stages){const original=plan.batch.resultSets.find(s=>s.key===stage.stage_id),p=plan.standingsPresentation.find(s=>s.key===stage.stage_id);const set=(await client.query('insert into public.competition_result_sets(competition_id,name,status,source,source_label,source_url,published,presentation) values($1,$2,$3,$4,$5,$6,false,$7) returning id',[ids.get(stage.edition_id),original.form.name,original.form.status,original.form.source,original.form.sourceLabel,stage.source_url,p.set])).rows[0].id;sets.push({id:set,count:stage.rows.length});
  for(let repeat=0;repeat<2;repeat++)for(const row of stage.rows)await client.query('insert into public.competition_results(competition_id,result_set_id,participant_name,participant_type,rank,score,score_display,country_code,award,result_status,external_participant_id,presentation,metadata,verified) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false) on conflict(result_set_id,external_participant_id) where external_participant_id is not null do nothing',[ids.get(stage.edition_id),set,row.display_name,row.participant_type,row.rank,row.score,row.score_display,/^[A-Z]{2,3}$/.test(row.country_or_region??'')?row.country_or_region:null,row.award,row.result_status,row.participant_id,p.rows.find(r=>r.participantId===row.participant_id).presentation,{provenance:row.provenance,publication_authorization:stage.publication_authorization}]);
 }
 assert.deepEqual(await fingerprints(),before,'Five existing competition records preserved byte-for-byte');
 assert.equal(Number((await client.query('select count(*) n from public.competition_results')).rows[0].n),809);
 const actual=(await client.query('select external_participant_id,participant_name,rank,score_display,award,presentation from public.competition_results')).rows;
 for(const stage of manifest.stages)for(const row of stage.rows){const saved=actual.find(r=>r.external_participant_id===row.participant_id);assert.ok(saved);assert.equal(saved.participant_name,row.display_name);assert.equal(saved.rank,row.rank);assert.equal(saved.score_display,row.score_display);assert.equal(saved.award,row.award);assert.deepEqual(saved.presentation.scores,row.score_columns);}
 await client.query("reset role;select set_config('request.jwt.claim.sub','',false);set role anon");assert.equal(Number((await client.query('select count(*) n from public.competition_results')).rows[0].n),0,'Drafts hidden to anonymous');
 await client.query("reset role;set role authenticated;select set_config('request.jwt.claim.sub','99000000-0000-4000-8000-000000000002',false)");assert.equal(Number((await client.query('select count(*) n from public.competition_results')).rows[0].n),0,'Drafts hidden to members');
 await client.query("reset role;set role authenticated;select set_config('request.jwt.claim.sub','99000000-0000-4000-8000-000000000001',false)");await client.query('update public.competition_result_sets set published=true where id=$1',[sets[0].id]);await client.query("reset role;select set_config('request.jwt.claim.sub','',false);set role anon");assert.equal(Number((await client.query('select count(*) n from public.competition_results')).rows[0].n),sets[0].count,'Only this locally published source stage visible');
 console.log(JSON.stringify({status:'PASS',environment:'disposable localhost PostgreSQL17',editions:13,stages:14,rows:809,idempotentReplay:true,existingFiveUnchanged:true,allNamesRanksScoresAwardsColumnsRoundtrip:true,draftMemberAnonymousBoundary:true,productionAccess:false,managedSupabaseRecoveryVerified:false}));
}catch(error){console.error(JSON.stringify({status:'FAIL',type:error.name,sqlState:error.code??null,message:error.message}));process.exitCode=1;}
finally{if(client)await client.end();await pg.stop();}
