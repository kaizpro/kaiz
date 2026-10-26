-- Disposable PostgreSQL only. Synthetic 38+39 rows; never production content.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email) values
 ('a1000000-0000-4000-8000-000000000001','privacy-admin@example.test'),
 ('a1000000-0000-4000-8000-000000000002','privacy-member@example.test');
update public.profiles set role='admin' where id='a1000000-0000-4000-8000-000000000001';
insert into public.competitions(id,title,slug,description,organizer,start_date,end_date,format,category)
 values('a2000000-0000-4000-8000-000000000001','Privacy QA','privacy-qa','Synthetic only','QA',now(),now(),'online','AI'),
 ('a2000000-0000-4000-8000-000000000002','Other QA','privacy-other','Synthetic only','QA',now(),now(),'online','AI');
insert into public.competition_result_sets(id,competition_id,name,created_by,updated_by,presentation)
 select ('a3000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 case when n=4 then 'a2000000-0000-4000-8000-000000000002'::uuid else 'a2000000-0000-4000-8000-000000000001'::uuid end,
 'Draft '||n,'a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','{"coverage":"partial"}' from generate_series(1,4)n;
insert into public.competition_results(competition_id,result_set_id,participant_name,rank,score,score_display,award,created_by,updated_by,metadata,external_reference,presentation)
 select 'a2000000-0000-4000-8000-000000000001',('a3000000-0000-4000-8000-'||lpad(s::text,12,'0'))::uuid,
 'Synthetic '||s||'-'||n,case when n=2 then 1 else n end,n/3.0,'original-'||n,
 case when s=2 then case when n<=3 then 'Gold' when n<=8 then 'Silver' when n<=23 then 'Bronze' end end,
 'a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001',
 '{"private_source":"PRIVATE-SENTINEL"}','PRIVATE-REFERENCE',jsonb_build_object('scores',jsonb_build_object('day_1',n,'day_2',0))
 from generate_series(1,2)s cross join lateral generate_series(1,case when s=1 then 38 else 39 end)n;
create temp table before_rows as select * from public.competition_results;
create temp table before_sets as select * from public.competition_result_sets;
grant select on before_rows,before_sets to authenticated;
create temp table publication_events(id uuid);
grant insert,select on publication_events to authenticated;
create function pg_temp.count_publication_update() returns trigger language plpgsql as $$begin insert into pg_temp.publication_events values(new.id); return new; end;$$;
create trigger test_only_count_publication after update on public.competition_result_sets for each row execute function pg_temp.count_publication_update();

select ok(not has_table_privilege('anon','public.competition_results','SELECT'),'no overriding anon table SELECT');
select ok(not has_table_privilege('authenticated','public.competition_results','SELECT'),'no overriding member table SELECT');
select ok(not has_column_privilege('anon','public.competition_results','metadata','SELECT'),'raw private metadata blocked');
select ok(not has_column_privilege('authenticated','public.competition_results','external_reference','SELECT'),'raw private reference blocked');
select ok(not has_function_privilege('anon','public.get_competition_result_audits(uuid)','EXECUTE'),'anonymous cannot execute audit RPC');
select ok(not has_function_privilege('anon','public.set_competition_results_publication(uuid,uuid[],boolean)','EXECUTE'),'anonymous cannot execute publication RPC');
select ok(not (select prosecdef from pg_proc where oid='public.set_competition_results_publication(uuid,uuid[],boolean)'::regprocedure),'publication has no definer elevation');
select is((select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' and pg_get_viewdef(c.oid)~'competition_result'),0::bigint,'no results view bypass introduced');
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select is((select count(*) from public.competition_result_sets),0::bigint,'anonymous drafts hidden');
select is((select count(*) from public.competition_results),0::bigint,'anonymous draft rows hidden');
select throws_ok($$select created_by from public.competition_result_sets$$,'42501',null,'anonymous set audit denied even for drafts');
select throws_ok($$select updated_by from public.competition_results$$,'42501',null,'anonymous row audit denied');
select throws_ok($$select * from public.competition_results$$,'42501',null,'wildcard intentionally denied');
select throws_ok($$select row_to_json(r) from public.competition_results r$$,'42501',null,'whole-row JSON cannot bypass columns');
select throws_ok($$select s.id,(select json_agg(r.created_by) from public.competition_results r where r.result_set_id=s.id) from public.competition_result_sets s$$,'42501',null,'nested audit select denied');
select throws_ok($$select * from public.get_competition_result_audits('a2000000-0000-4000-8000-000000000001')$$,'42501',null,'anonymous audit RPC denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.competition_results),0::bigint,'member drafts hidden');
select throws_ok($$select created_by from public.competition_results$$,'42501',null,'member audit denied');
select throws_ok($$select * from public.get_competition_result_audits('a2000000-0000-4000-8000-000000000001')$$,'42501',null,'member cannot call admin audit RPC');
select throws_ok($$select * from public.set_competition_results_publication('a2000000-0000-4000-8000-000000000001',array['a3000000-0000-4000-8000-000000000001'::uuid],true)$$,'42501',null,'member publication denied');
with changed as(update public.competition_result_sets set published=true returning id) select is(count(*),0::bigint,'member direct publication denied by RLS') from changed;
with changed as(update public.competition_results set score=999 returning id) select is(count(*),0::bigint,'member score write denied by RLS') from changed;

select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select is((select count(*) from public.competition_results),77::bigint,'admin retains all draft rows');
select is((select count(*) from public.get_competition_result_audits('a2000000-0000-4000-8000-000000000001')),80::bigint,'admin audit access includes three sets and 77 rows');
select ok((select bool_and(created_by='a1000000-0000-4000-8000-000000000001') from public.get_competition_result_audits('a2000000-0000-4000-8000-000000000001')),'admin audit attribution retained');
select throws_ok($$select * from public.set_competition_results_publication('a2000000-0000-4000-8000-000000000001',array[]::uuid[],true)$$,'22023',null,'empty targets denied');
select throws_ok($$select * from public.set_competition_results_publication('a2000000-0000-4000-8000-000000000001',array[null]::uuid[],true)$$,'22023',null,'null target denied');
select throws_ok($$select * from public.set_competition_results_publication('a2000000-0000-4000-8000-000000000001',array['a3000000-0000-4000-8000-000000000001'::uuid,'a3000000-0000-4000-8000-000000000001'::uuid],true)$$,'22023',null,'duplicate targets denied');
select throws_ok($$select * from public.set_competition_results_publication('a2000000-0000-4000-8000-000000000001',array['a3000000-0000-4000-8000-000000000001'::uuid,'a3000000-0000-4000-8000-000000000004'::uuid],true)$$,'P0002',null,'mixed competition request fails atomically');
select is((select count(*) from public.competition_result_sets where published),0::bigint,'failure leaves every draft unchanged');
select is((select count(*) from public.set_competition_results_publication('a2000000-0000-4000-8000-000000000001',array['a3000000-0000-4000-8000-000000000001'::uuid,'a3000000-0000-4000-8000-000000000002'::uuid],true)),2::bigint,'exact targets published');
select is((select count(*) from publication_events),2::bigint,'exactly two actual updates, not just matching timestamps');
reset role;
select ok(not exists((select * from public.competition_results except select * from before_rows) union all (select * from before_rows except select * from public.competition_results)),'all 77 complete participant rows unchanged');
select ok(not exists(select 1 from public.competition_result_sets s join before_sets b using(id) where (to_jsonb(s)-'published'-'updated_at')<>(to_jsonb(b)-'published'-'updated_at')),'only publication state and trigger timestamp changed');
select ok(not exists(select 1 from public.competition_result_sets s join before_sets b using(id) where s.id in ('a3000000-0000-4000-8000-000000000003','a3000000-0000-4000-8000-000000000004') and to_jsonb(s)<>to_jsonb(b)),'unselected and other competition sets untouched');
create temp table first_publication as select * from public.competition_result_sets;
set local role authenticated;
select lives_ok($$select * from public.set_competition_results_publication('a2000000-0000-4000-8000-000000000001',array['a3000000-0000-4000-8000-000000000001'::uuid,'a3000000-0000-4000-8000-000000000002'::uuid],true)$$,'publication replay succeeds without updates');
select is((select count(*) from publication_events),2::bigint,'replay invokes no update triggers');
reset role;
select ok(not exists((select * from public.competition_result_sets except select * from first_publication) union all (select * from first_publication except select * from public.competition_result_sets)),'repeat publication preserves timestamps too');
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select is((select count(*) from public.competition_results),77::bigint,'published rows readable anonymously');
select is((select count(*) from public.competition_result_sets),2::bigint,'only published sets visible');
select lives_ok($$select id,participant_name,rank,score,score_display,award,presentation from public.competition_results$$,'public explicit projection compatible');
select throws_ok($$select * from public.competition_result_sets$$,'42501',null,'set wildcard denied after publication');
select throws_ok($$select created_by,updated_by from public.competition_results$$,'42501',null,'published audits still denied');
select throws_ok($$select metadata,external_reference from public.competition_results$$,'42501',null,'private metadata/reference still denied');
select is((select count(*) from public.competition_results r join public.competition_result_sets s on s.id=r.result_set_id),77::bigint,'safe nested-equivalent join works');
select is((select count(*) from public.competition_results where result_set_id='a3000000-0000-4000-8000-000000000001'),38::bigint,'38-row stage preserved');
select is((select count(*) from public.competition_results where result_set_id='a3000000-0000-4000-8000-000000000002'),39::bigint,'39-row stage preserved');
select is((select count(*) from public.competition_results where award='Gold'),3::bigint,'three gold assignments');
select is((select count(*) from public.competition_results where award='Silver'),5::bigint,'five silver assignments');
select is((select count(*) from public.competition_results where award='Bronze'),15::bigint,'fifteen bronze assignments');
select is((select count(*) from public.competition_results where result_set_id='a3000000-0000-4000-8000-000000000001' and award is not null),0::bigint,'no inferred first-stage awards');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.competition_results),77::bigint,'ordinary member can read published scores');
select throws_ok($$select metadata from public.competition_results$$,'42501',null,'published private metadata denied for member');
select throws_ok($$select * from public.get_competition_result_audits('a2000000-0000-4000-8000-000000000001')$$,'42501',null,'member cannot bypass via audit accessor after publication');
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select * from public.set_competition_results_publication('a2000000-0000-4000-8000-000000000001',array['a3000000-0000-4000-8000-000000000001'::uuid],false)$$,'admin can withdraw exactly one selected stage');
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select is((select count(*) from public.competition_results),39::bigint,'withdrawal hides only selected rows');
reset role;
select ok(not exists((select * from public.competition_results except select * from before_rows) union all (select * from before_rows except select * from public.competition_results)),'withdrawal still leaves all 77 participant rows identical');
select * from finish();
rollback;
