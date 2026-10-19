// Opt-in, fresh disposable localhost PostgreSQL only. No .env or hosted access.
// Set KAIZ_EMBEDDED_POSTGRES_MODULE to an installed embedded-postgres entry point.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {loadTypescript} from './helpers/load-typescript.mjs';
assert.ok(process.env.KAIZ_EMBEDDED_POSTGRES_MODULE,'Provide a locally installed PostgreSQL test runtime; never a production connection URL');
const {default:EmbeddedPostgres}=await import(pathToFileURL(process.env.KAIZ_EMBEDDED_POSTGRES_MODULE).href);
const folder=await mkdtemp(join(tmpdir(),'kaiz-learning-'));
const pg=new EmbeddedPostgres({databaseDir:join(folder,'db'),user:'postgres',password:randomBytes(32).toString('hex'),port:55441,persistent:true,postgresFlags:['-h','127.0.0.1'],onLog:()=>{},onError:()=>{}});
let client;
try{
 await mkdir(join(folder,'db'));await pg.initialise();await pg.start();client=pg.getPgClient();await client.connect();
 const version=(await client.query("select current_setting('server_version') as version")).rows[0].version;
 assert.match(version,/^17\./,'Use the intended PostgreSQL 17 test runtime');
 await client.query(await readFile('tests/fixtures/disposable-supabase.sql','utf8'));
 const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort();
 const privacy='202610160001_personal_problem_progress.sql';
 const external='202610170001_external_source_practice.sql';
 for(const file of files.filter(file=>file!==privacy&&file!==external))await client.query(await readFile('supabase/migrations/'+file,'utf8'));
 const load=loadTypescript();const {journeys}=load('lib/learning/journeys.ts');const {courseFor}=load('lib/learning/course.ts');
 const expected=journeys.flatMap(p=>courseFor(p).flatMap(m=>m.lessons.map(l=>p.level+'/'+l.id))).sort();
 const actual=(await client.query('select roadmap_id,lesson_id from public.learning_lesson_keys where active')).rows.map(r=>r.roadmap_id+'/'+r.lesson_id).sort();
 assert.deepEqual(actual,Array.from(expected),'Database registry exactly matches the real curriculum');
 let assertions=0;
 for(const file of ['problem_archive_security.test.sql','external_account_security.test.sql','learning_progress_security.test.sql']){
  const sql=(await readFile('supabase/tests/'+file,'utf8')).replace('create extension if not exists pgtap with schema extensions;','');
  const result=await client.query(sql);const count=result.flatMap(r=>r.rows??[]).filter(row=>Object.values(row).some(v=>typeof v==='string'&&v.startsWith('ok: '))).length;
  assertions+=count;console.log(JSON.stringify({suite:file,assertions:count,status:'PASS'}));
 }
 // Preserve the historical moderation regression at its original schema state,
 // then verify the additive privacy tightening, rather than weakening old tests.
 if(files.includes(privacy)){
  await client.query(await readFile('supabase/migrations/'+privacy,'utf8'));
  const sql=(await readFile('supabase/tests/personal_problem_progress_security.test.sql','utf8')).replace('create extension if not exists pgtap with schema extensions;','');
  const result=await client.query(sql);const count=result.flatMap(r=>r.rows??[]).filter(row=>Object.values(row).some(v=>typeof v==='string'&&v.startsWith('ok: '))).length;
  assertions+=count;console.log(JSON.stringify({suite:'personal_problem_progress_security.test.sql',assertions:count,status:'PASS'}));
 }
 if(files.includes(external)){
  await client.query(await readFile('supabase/migrations/'+external,'utf8'));
  const sql=(await readFile('supabase/tests/external_source_practice_security.test.sql','utf8')).replace('create extension if not exists pgtap with schema extensions;','');
  const result=await client.query(sql);const count=result.flatMap(r=>r.rows??[]).filter(row=>Object.values(row).some(v=>typeof v==='string'&&v.startsWith('ok: '))).length;
  assertions+=count;console.log(JSON.stringify({suite:'external_source_practice_security.test.sql',assertions:count,status:'PASS'}));
  const previous=(await readFile('supabase/tests/personal_problem_progress_security.test.sql','utf8')).replace('create extension if not exists pgtap with schema extensions;','');
  const checked=await client.query(previous);const regressions=checked.flatMap(r=>r.rows??[]).filter(row=>Object.values(row).some(v=>typeof v==='string'&&v.startsWith('ok: '))).length;
  assertions+=regressions;console.log(JSON.stringify({suite:'personal_problem_progress_security.test.sql after external extension',assertions:regressions,status:'PASS'}));
 }
 // A separate connection establishes that committed completion survives a new session.
 await client.query("insert into auth.users(id,email) values('92000000-0000-4000-8000-000000000001','persist@example.test')");
 await client.query("set role authenticated;select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000001',false);select public.set_learning_completion('beginner','python-algebra:python-functions',true)");
 const second=pg.getPgClient();await second.connect();
 try{
  await second.query("set role authenticated;select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000001',false)");
  const read=async()=> (await second.query('select count(*)::int as n,min(completed_at)::text as completed from public.learning_progress where completed_at is not null')).rows[0];
  const saved=await read();assert.equal(saved.n,1);
  const complete="select public.set_learning_completion('beginner','python-algebra:python-functions',true)";
  await Promise.all([client.query(complete),second.query(complete)]);
  assert.deepEqual(await read(),saved,'Concurrent retries preserve a single completion and its original timestamp');
  await second.query("select public.set_learning_completion('beginner','python-algebra:python-functions',false)");
  assert.equal((await client.query('select count(*)::int as n from public.learning_progress where completed_at is not null')).rows[0].n,0,'Undo persists to the other session');
  await Promise.all([client.query(complete),second.query(complete)]);assert.equal((await read()).n,1);
 }finally{await second.end();}
 console.log(JSON.stringify({status:'PASS',version,assertions,registryLessons:actual.length,persistenceNewConnection:true,concurrentRetryAndUndo:true,migrations:files.length,productionAccess:false,managedAuthOrStorageVerified:false}));
}catch(error){console.error(JSON.stringify({status:'FAIL',type:error.name,sqlState:error.code??null,message:error.message}));process.exitCode=1;}
finally{if(client)await client.end();await pg.stop();}
