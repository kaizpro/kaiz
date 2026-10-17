-- LOCAL ONLY. All fixtures and privileged changes are rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id,email) values
 ('81000000-0000-0000-0000-000000000001','presentation-owner@example.test'),
 ('81000000-0000-0000-0000-000000000002','presentation-member@example.test'),
 ('81000000-0000-0000-0000-000000000003','presentation-admin@example.test');
update public.profiles set role='admin' where id='81000000-0000-0000-0000-000000000003';
insert into public.competitions(id,title,slug,description,organizer,start_date,end_date,format,category)
 values ('82000000-0000-0000-0000-000000000001','Local QA','presentation-local-qa','Local only','QA',now(),now(),'online','AI');
insert into public.competition_result_sets(id,competition_id,name,published,presentation) values
 ('83000000-0000-0000-0000-000000000001','82000000-0000-0000-0000-000000000001','Qualification',true,'{"stageLabel":"Qualification","coverage":"partial"}'),
 ('83000000-0000-0000-0000-000000000002','82000000-0000-0000-0000-000000000001','Final draft',false,'{"stageLabel":"Final"}');
insert into public.competition_results(id,competition_id,result_set_id,user_id,participant_name,rank,score,presentation) values
 ('84000000-0000-0000-0000-000000000001','82000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','Local owner',1,0,'{"scores":{"day_1":"0.000","day_2":null}}'),
 ('84000000-0000-0000-0000-000000000002','82000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000002','81000000-0000-0000-0000-000000000001','Private fixture',1,99,'{"comments":"DRAFT MUST STAY PRIVATE"}');
select is((select presentation from public.competitions limit 1),'{}'::jsonb,'old insert receives empty default');
select is((select count(*) from pg_class where oid in ('public.competitions'::regclass,'public.competition_result_sets'::regclass,'public.competition_results'::regclass) and relrowsecurity),3::bigint,'all three tables retain RLS');
select ok(has_column_privilege('anon','public.competition_results','presentation','SELECT'),'public column grant inherited');
select ok(has_column_privilege('authenticated','public.competition_results','presentation','UPDATE'),'table grant inherited, guarded by RLS');
select throws_ok($$update public.competitions set presentation='[]'$$,'23514',null,'competition rejects non-object');
select throws_ok($$update public.competition_result_sets set presentation='[]'$$,'23514',null,'set rejects non-object');
select throws_ok($$update public.competition_results set presentation='[]'$$,'23514',null,'row rejects non-object');
select throws_ok($$update public.competition_results set presentation=null$$,'23502',null,'row rejects SQL null');
select throws_ok($$update public.competition_results set presentation=jsonb_build_object('comments',repeat('x',16001))$$,'23514',null,'row size bounded');
set local role anon;
select is((select count(*) from public.competition_result_sets),1::bigint,'anonymous only sees published stage');
select is((select count(*) from public.competition_results),1::bigint,'anonymous only sees published entries');
select is((select presentation->'scores'->>'day_1' from public.competition_results),'0.000','original zero string preserved');
select is((select presentation->'scores'->'day_2' from public.competition_results),'null'::jsonb,'missing value not coerced to zero');
select throws_ok($$insert into public.competition_results(competition_id,result_set_id,participant_name,rank) values ('82000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000001','Forged',1)$$,'42501',null,'anonymous cannot insert');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
select is((select count(*) from public.competition_results),1::bigint,'result owner cannot see own unpublished official row');
with changed as (update public.competition_results set presentation='{"scores":{"day_1":999}}' returning id)
 select is(count(*),0::bigint,'owner cannot edit official score presentation') from changed;
select throws_ok($$update public.profiles set role='admin' where id=auth.uid()$$,'42501',null,'owner cannot self-promote');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000002',true);
select is((select count(*) from public.competition_result_sets),1::bigint,'member cannot see draft stages');
with changed as (update public.competitions set presentation='{"year":2000}' returning id)
 select is(count(*),0::bigint,'member cannot edit edition presentation') from changed;
with changed as (delete from public.competition_results returning id)
 select is(count(*),0::bigint,'member cannot delete results') from changed;
select throws_ok($$insert into public.competition_result_sets(competition_id,name,published) values ('82000000-0000-0000-0000-000000000001','Forged',true)$$,'42501',null,'member cannot insert published set');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.competition_result_sets),2::bigint,'admin sees both stages');
select is((select count(*) from public.competition_results),2::bigint,'admin sees draft entries');
select lives_ok($$update public.competitions set presentation='{"seriesSlug":"qa","year":2026}'$$,'admin edits presentation');
select lives_ok($$update public.competition_results set presentation='{"scores":{"day_1":"0,000"}}' where id='84000000-0000-0000-0000-000000000001'$$,'admin preserves source strings');
select lives_ok($$update public.competition_result_sets set published=false where id='83000000-0000-0000-0000-000000000001'$$,'admin withdraws publication');
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select is((select count(*) from public.competition_results),0::bigint,'withdrawal hides scores and presentation');
reset role;
select * from finish();
rollback;
