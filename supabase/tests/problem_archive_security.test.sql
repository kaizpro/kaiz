-- LOCAL ONLY: npx --no-install supabase test db
-- Transactional fixtures are rolled back; no credentials or hosted project needed.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users(id, email) values
  ('10000000-0000-0000-0000-000000000001', 'owner@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'other@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'admin@example.test');
update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000003';
insert into public.competitions(id, title, slug, description, organizer, start_date, end_date, format, category)
values
  ('20000000-0000-0000-0000-000000000001', 'Test event', 'integration-test-event', 'Local test', 'Test', now(), now(), 'online', 'AI'),
  ('20000000-0000-0000-0000-000000000002', 'Other event', 'integration-other-event', 'Local test', 'Test', now(), now(), 'online', 'AI');
insert into public.competition_result_sets(id, competition_id, name, published) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Draft results', false),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Public results', true),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Other results', true);
insert into public.competition_results(id, competition_id, result_set_id, user_id, participant_name, rank) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Owner', 1),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Owner', 1);
insert into public.problems(id, competition_id, title, slug, category, metric_name, metric_direction, source_provider, published) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Public problem', 'integration-public-problem', 'AI', 'Score', 'higher_is_better', 'manual', true),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Draft problem', 'integration-draft-problem', 'AI', 'Time', 'lower_is_better', 'manual', false);
insert into public.problem_performances(id, problem_id, user_id, competition_result_id, attempt_type, raw_score, attempted_at, status, normalized_performance) values
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'official', 50, now(), 'valid', null),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'official', 60, now(), 'valid', null),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'official', 70, now(), 'valid', null),
  ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'official', 80, now(), 'valid', null),
  ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'practice', 10, now(), 'valid', null),
  ('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', null, 'practice', 20, now(), 'valid', null),
  ('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'practice', 30, now(), 'invalidated', null),
  ('60000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'practice', 40, now(), 'valid', 0.5);
insert into public.problem_statistic_snapshots(problem_id, population_scope, is_current, calculation_version, calculated_at) values
  ('50000000-0000-0000-0000-000000000001', 'all_valid', true, 'test', now()),
  ('50000000-0000-0000-0000-000000000001', 'all_valid', false, 'test-old', now()),
  ('50000000-0000-0000-0000-000000000001', 'official_only', true, 'test-official', now()),
  ('50000000-0000-0000-0000-000000000002', 'all_valid', true, 'test-draft', now());

set local role anon;
select is((select count(*) from public.problem_performances), 1::bigint, 'anon reads only published problem AND result-set evidence');
select is((select count(*) from public.problems), 1::bigint, 'anon cannot read draft problems');
select is((select count(*) from public.problem_statistic_snapshots), 3::bigint, 'published problem snapshots are public across history/scopes; draft snapshots private');
select throws_ok($$insert into public.problem_performances(problem_id, user_id, attempt_type, raw_score, attempted_at) values ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','practice',1,now())$$, '42501', null, 'anon cannot write');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select count(*) from public.problem_performances where attempt_type = 'practice'), 3::bigint, 'owner can read own reviewed and self-reported practice');
select is((select count(*) from public.problem_performances where attempt_type = 'official'), 1::bigint, 'owner cannot bypass draft official publication');
select lives_ok($$insert into public.problem_performances(id,problem_id,user_id,attempt_type,raw_score,attempted_at,created_at,recorded_at) values ('60000000-0000-0000-0000-000000000009','50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','practice',5,now(),'2000-01-01','2000-01-01')$$, 'owner creates plain self-report');
select ok((select created_by = auth.uid() and updated_by = auth.uid() and created_at = now() and recorded_at = now() from public.problem_performances where id = '60000000-0000-0000-0000-000000000009'), 'audit attribution/times are server derived');
select lives_ok($$update public.problem_performances set raw_score = 15, attempted_at = now() where id = '60000000-0000-0000-0000-000000000009'$$, 'owner edits own raw score and attempt time');
select is((select raw_score from public.problem_performances where id = '60000000-0000-0000-0000-000000000009'), 15::numeric, 'owner edit is applied');
select throws_ok($$update public.problem_performances set status = 'valid' where id = '60000000-0000-0000-0000-000000000007'$$, '42501', null, 'owner cannot revalidate admin-invalidated attempt');
select throws_ok($$delete from public.problem_performances where id = '60000000-0000-0000-0000-000000000007'$$, '42501', null, 'owner cannot delete invalidation evidence');
select throws_ok($$update public.problem_performances set raw_score = 999 where id = '60000000-0000-0000-0000-000000000008'$$, '42501', null, 'owner cannot alter reviewed normalized evidence');
select throws_ok($$update public.problem_performances set normalized_performance = 1 where id = '60000000-0000-0000-0000-000000000005'$$, '42501', null, 'owner cannot normalize own attempt');
select throws_ok($$update public.problem_performances set source_provider = 'trusted' where id = '60000000-0000-0000-0000-000000000005'$$, '42501', null, 'owner cannot spoof provider');
select throws_ok($$update public.problem_performances set source_provenance = '{"validated":true}' where id = '60000000-0000-0000-0000-000000000005'$$, '42501', null, 'owner cannot spoof provenance');
select throws_ok($$update public.problem_performances set source_external_id = 'trusted-id' where id = '60000000-0000-0000-0000-000000000005'$$, '42501', null, 'owner cannot spoof external identity');
select throws_ok($$update public.problem_performances set created_by = '10000000-0000-0000-0000-000000000003' where id = '60000000-0000-0000-0000-000000000005'$$, '42501', null, 'owner cannot spoof creator');
select throws_ok($$update public.problem_performances set updated_by = '10000000-0000-0000-0000-000000000003' where id = '60000000-0000-0000-0000-000000000005'$$, '42501', null, 'owner cannot spoof updater');
select throws_ok($$update public.problem_performances set attempt_type = 'official' where id = '60000000-0000-0000-0000-000000000005'$$, '42501', null, 'owner cannot promote to official');
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at,normalized_performance) values ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','practice',1,now(),1)$$, '42501', null, 'owner cannot create normalized evidence');
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at,source_provider,source_provenance) values ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','practice',1,now(),'trusted','{"validated":true}')$$, '42501', null, 'owner cannot create trusted provider/provenance');
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at,status) values ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','practice',1,now(),'disqualified')$$, '42501', null, 'owner cannot choose administrative status');
select lives_ok($$delete from public.problem_performances where id = '60000000-0000-0000-0000-000000000009'$$, 'owner deletes plain self-report');
select is((select count(*) from public.problem_performances where id = '60000000-0000-0000-0000-000000000009'), 0::bigint, 'owner deletion is applied');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select is((select count(*) from public.problem_performances where id = '60000000-0000-0000-0000-000000000005'), 0::bigint, 'other member cannot read private practice');
with changed as (
  update public.problem_performances set raw_score = 999
  where id = '60000000-0000-0000-0000-000000000005' returning id
)
select is(count(*), 0::bigint, 'other member cannot update private practice') from changed;
select throws_ok($$insert into public.problem_performances(problem_id,user_id,attempt_type,raw_score,attempted_at) values ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','practice',1,now())$$, '42501', null, 'other member cannot insert for owner');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select is((select count(*) from public.problem_performances where attempt_type = 'official'), 4::bigint, 'admin reads draft and unlinked official records');
select lives_ok($$update public.problem_performances set normalized_performance = 0.9, source_provider = 'manual', source_provenance = '{"validated":true}' where id = '60000000-0000-0000-0000-000000000002'$$, 'admin manages official normalized/provenance data');
select lives_ok($$update public.problem_performances set status = 'disqualified' where id = '60000000-0000-0000-0000-000000000005'$$, 'admin invalidates practice');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select throws_ok($$update public.problem_performances set status = 'valid' where id = '60000000-0000-0000-0000-000000000005'$$, '42501', null, 'owner cannot undo actual administrator disqualification');
select is((select status::text from public.problem_performances where id = '60000000-0000-0000-0000-000000000005'), 'disqualified', 'administrative decision is preserved');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select throws_ok($$update public.problems set competition_id = null where id = '50000000-0000-0000-0000-000000000001'$$, '23503', null, 'problem cannot drop context with linked evidence');
select throws_ok($$update public.problems set competition_id = '20000000-0000-0000-0000-000000000002' where id = '50000000-0000-0000-0000-000000000001'$$, '23503', null, 'problem cannot change competition with linked evidence');
select throws_ok($$update public.competition_results set user_id = '10000000-0000-0000-0000-000000000002' where id = '40000000-0000-0000-0000-000000000001'$$, '23503', null, 'result cannot change participant with linked evidence');
select throws_ok($$update public.competition_results set user_id = null where id = '40000000-0000-0000-0000-000000000001'$$, '23503', null, 'result cannot orphan linked participant');
select throws_ok($$update public.competition_results set competition_id = '20000000-0000-0000-0000-000000000002', result_set_id = '30000000-0000-0000-0000-000000000003' where id = '40000000-0000-0000-0000-000000000001'$$, '23503', null, 'result cannot move competition with linked evidence');
select lives_ok($$delete from public.competition_results where id = '40000000-0000-0000-0000-000000000001'$$, 'existing result deletion still detaches official evidence');
select ok((select competition_result_id is null and linked_competition_id is null from public.problem_performances where id = '60000000-0000-0000-0000-000000000001'), 'detached evidence has no stale context');
select lives_ok($$update public.competition_result_sets set published = false where id = '30000000-0000-0000-0000-000000000002'$$, 'admin can withdraw standings publication');

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select is((select count(*) from public.problem_performances), 0::bigint, 'withdrawn or detached official evidence is no longer public');
reset role;
select lives_ok($$delete from auth.users where id = '10000000-0000-0000-0000-000000000001'$$, 'profile deletion retains existing cascades and result anonymization');
select is((select count(*) from public.problem_performances where user_id = '10000000-0000-0000-0000-000000000001'), 0::bigint, 'deleted profile leaves no performance rows');
select lives_ok($$delete from public.competitions where id = '20000000-0000-0000-0000-000000000001'$$, 'competition deletion retains existing cascade/set-null behavior');

select * from finish();
rollback;
