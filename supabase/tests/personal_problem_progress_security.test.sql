-- Disposable/local only. Synthetic transactional fixtures, never production.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email) values
('93000000-0000-4000-8000-000000000001','practice-owner@example.test'),
('93000000-0000-4000-8000-000000000002','practice-other@example.test'),
('93000000-0000-4000-8000-000000000003','practice-admin@example.test');
update public.profiles set role='admin' where id='93000000-0000-4000-8000-000000000003';
insert into public.problems(id,title,slug,category,metric_name,metric_direction,source_provider,published,source_provenance) values
('94000000-0000-4000-8000-000000000001','F1 task','privacy-f1','AI','F1','higher_is_better','manual',true,'{}'),
('94000000-0000-4000-8000-000000000002','RMSE task','privacy-rmse','AI','RMSE','lower_is_better','manual',true,'{}'),
('94000000-0000-4000-8000-000000000003','Draft task','privacy-draft','AI','Points','higher_is_better','manual',false,'{}'),
('94000000-0000-4000-8000-000000000004','Points task','privacy-points','AI','Points','higher_is_better','manual',true,'{"score_bounds":{"min":0,"max":100}}');
set local role anon;
select throws_ok($$select * from public.problem_progress$$,'42501',null,'anonymous private status read denied');
select throws_ok($$select * from public.own_problem_practice$$,'42501',null,'anonymous private summary read denied');
select throws_ok($$select public.set_problem_status('94000000-0000-4000-8000-000000000001','solved')$$,'42501',null,'anonymous status RPC denied');
select throws_ok($$insert into public.problem_progress(user_id,problem_id,status) values('93000000-0000-4000-8000-000000000001','94000000-0000-4000-8000-000000000001','solved')$$,'42501',null,'anonymous direct write denied');
reset role;set local role authenticated;
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.set_problem_status('94000000-0000-4000-8000-000000000001','attempted')$$,'owner marks attempted');
select is((select status from public.own_problem_practice),'attempted','attempted summary is real');
select lives_ok($$select public.set_problem_status('94000000-0000-4000-8000-000000000001','solved')$$,'owner explicitly marks solved');
select is((select status from public.own_problem_practice),'solved','solved is explicit');
select lives_ok($$select public.set_problem_status('94000000-0000-4000-8000-000000000001','solved')$$,'replay is safe');
select is((select count(*) from public.problem_progress),1::bigint,'replay does not duplicate status');
select throws_ok($$update public.problem_progress set user_id='93000000-0000-4000-8000-000000000002'$$,'42501',null,'owner field is immutable');
select throws_ok($$update public.problem_progress set updated_at='2099-01-01'$$,'42501',null,'trusted timestamps denied');
select throws_ok($$insert into public.problem_progress(user_id,problem_id,status) values('93000000-0000-4000-8000-000000000002','94000000-0000-4000-8000-000000000002','solved')$$,'42501',null,'cross-owner insert denied');
select throws_ok($$select public.set_problem_status('94000000-0000-4000-8000-000000000003','solved')$$,'22023',null,'draft task status rejected');
select throws_ok($$select public.set_problem_status('94000000-0000-4000-8000-000000000001','verified')$$,'22023',null,'no trusted status forgery');
select lives_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at) values('94000000-0000-4000-8000-000000000001',auth.uid(),'practice',0.8,now())$$,'existing score model reused');
select lives_ok($$select public.set_problem_status('94000000-0000-4000-8000-000000000001',null)$$,'undo manual solved');
select is((select status from public.own_problem_practice),'attempted','score history remains attempted, never implicitly solved');
select is((select latest_score from public.own_problem_practice),0.8::numeric,'latest private score preserved');
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at) values('94000000-0000-4000-8000-000000000001',auth.uid(),'practice',1.1,now())$$,'22023',null,'F1 above one rejected at DB boundary');
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at) values('94000000-0000-4000-8000-000000000001',auth.uid(),'practice',-0.1,now())$$,'22023',null,'negative F1 rejected');
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at) values('94000000-0000-4000-8000-000000000001',auth.uid(),'practice','NaN',now())$$,'22023',null,'NaN rejected');
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at) values('94000000-0000-4000-8000-000000000002',auth.uid(),'practice',-1,now())$$,'22023',null,'negative RMSE rejected');
select lives_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at) values('94000000-0000-4000-8000-000000000002',auth.uid(),'practice',0,now())$$,'zero RMSE retained without solved inference');
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at) values('94000000-0000-4000-8000-000000000004',auth.uid(),'practice',101,now())$$,'22023',null,'known maximum points enforced');
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at) values('94000000-0000-4000-8000-000000000003',auth.uid(),'practice',1,now())$$,'22023',null,'draft score refused');
select lives_ok($$select public.set_problem_status('94000000-0000-4000-8000-000000000002','solved')$$,'solve RMSE explicitly');
select is((select count(*) from public.own_problem_practice),2::bigint,'task totals are distinct, not attempt totals');
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.problem_progress),0::bigint,'other member cannot read private status');
select is((select count(*) from public.own_problem_practice),0::bigint,'other member cannot read private summary');
with changed as(update public.problem_progress set status='attempted' returning *) select is(count(*),0::bigint,'other member cannot edit owner status') from changed;
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.problem_progress),0::bigint,'authenticated admin cannot read other status');
select is((select count(*) from public.problem_performances where attempt_type='practice'),0::bigint,'authenticated admin cannot read other scores');
select is((select count(*) from public.own_problem_practice),0::bigint,'admin summary remains own only');
with changed as(update public.problem_performances set raw_score=0.9 where attempt_type='practice' returning *) select is(count(*),0::bigint,'admin cannot edit other private score') from changed;
with removed as(delete from public.problem_progress returning *) select is(count(*),0::bigint,'admin cannot delete other status') from removed;
reset role;
select ok((select relrowsecurity from pg_class where oid='public.problem_progress'::regclass),'status RLS enabled');
select ok((select not prosecdef from pg_proc where oid='public.set_problem_status(uuid,text)'::regprocedure),'RPC is invoker');
select ok((select reloptions @> array['security_invoker=true','security_barrier=true'] from pg_class where oid='public.own_problem_practice'::regclass),'view preserves invoker RLS and barrier');
update public.problems set published=false where id='94000000-0000-4000-8000-000000000002';
set local role authenticated;select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000001',true);
select is((select count(*) from public.own_problem_practice),1::bigint,'unpublished task removed from visible personal totals');
select lives_ok($$select public.set_problem_status('94000000-0000-4000-8000-000000000002',null)$$,'owner can clear status after unpublication');
select lives_ok($$delete from public.problem_performances where problem_id='94000000-0000-4000-8000-000000000001'$$,'existing owner attempt deletion works');
select is((select count(*) from public.own_problem_practice),0::bigint,'clear plus deleting attempts returns truly unattempted');
reset role;
-- Recheck original official publication boundaries after the restrictive policy.
insert into public.competitions(id,title,slug,description,organizer,start_date,end_date,format,category)
values('95000000-0000-4000-8000-000000000001','Private QA event','privacy-qa-event','Synthetic','QA',now(),now(),'online','AI');
insert into public.competition_result_sets(id,competition_id,name,published) values
('96000000-0000-4000-8000-000000000001','95000000-0000-4000-8000-000000000001','Published',true),
('96000000-0000-4000-8000-000000000002','95000000-0000-4000-8000-000000000001','Draft',false);
update public.problems set competition_id='95000000-0000-4000-8000-000000000001' where id='94000000-0000-4000-8000-000000000001';
insert into public.competition_results(id,competition_id,result_set_id,user_id,participant_name,rank) values
('97000000-0000-4000-8000-000000000001','95000000-0000-4000-8000-000000000001','96000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','Synthetic',1),
('97000000-0000-4000-8000-000000000002','95000000-0000-4000-8000-000000000001','96000000-0000-4000-8000-000000000002','93000000-0000-4000-8000-000000000001','Synthetic',1);
insert into public.problem_performances(problem_id,user_id,competition_result_id,attempt_type,raw_score,attempted_at) values
('94000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001','official',0.9,now()),
('94000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000002','official',0.7,now());
set local role anon;
select is((select count(*) from public.problem_performances where attempt_type='official'),1::bigint,'anonymous official publication boundary preserved');
reset role;set local role authenticated;select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.problem_performances where attempt_type='official'),2::bigint,'admin still reads official draft evidence');
select lives_ok($$update public.problem_performances set raw_score=0.95 where competition_result_id='97000000-0000-4000-8000-000000000001'$$,'official admin write remains available');
select is((select raw_score from public.problem_performances where competition_result_id='97000000-0000-4000-8000-000000000001'),0.95::numeric,'official update persists without touching practice');
select ok(not has_column_privilege('authenticated','public.problem_progress','updated_at','UPDATE'),'timestamp column grant remains denied');
reset role;select * from finish();rollback;
