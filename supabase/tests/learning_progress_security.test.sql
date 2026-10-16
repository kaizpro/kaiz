-- Isolated fixture transaction only. Native PostgreSQL or local Supabase + pgTAP.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public,extensions;
select no_plan();
insert into auth.users(id,email) values
 ('91000000-0000-4000-8000-000000000001','owner@example.test'),
 ('91000000-0000-4000-8000-000000000002','other@example.test'),
 ('91000000-0000-4000-8000-000000000003','admin@example.test');
update public.profiles set role='admin' where id='91000000-0000-4000-8000-000000000003';
select ok((select relrowsecurity from pg_class where oid='public.learning_progress'::regclass),'progress RLS enabled');
select ok(not has_table_privilege('anon','public.learning_progress','SELECT'),'anonymous progress read has no grant');
select ok(not has_function_privilege('anon','public.set_learning_completion(text,text,boolean)','EXECUTE'),'anonymous completion RPC has no grant');
set local role anon;
select is((select count(*) from public.learning_lesson_keys),40::bigint,'guest reads real lesson registry');
select throws_ok($$select * from public.learning_progress$$,'42501',null,'guest cannot read private progress');
select throws_ok($$select public.set_learning_completion('beginner','python-algebra:python-fundamentals',true)$$,'42501',null,'guest cannot save progress');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.set_learning_completion('beginner','python-algebra:python-fundamentals',true)$$,'owner saves valid lesson');
select lives_ok($$select public.set_learning_completion('beginner','python-algebra:python-fundamentals',true)$$,'duplicate completion succeeds idempotently');
select is((select count(*) from public.learning_progress),1::bigint,'one record after duplicate completion');
select is((select count(*)*10 from public.learning_progress where completed_at is not null),10::bigint,'XP cannot be multiplied by replay');
select throws_ok($$select public.set_learning_completion('beginner','forged:lesson',true)$$,'22023',null,'unknown lesson denied directly in database');
select throws_ok($$select public.set_learning_completion('beginner','evaluation:model-evaluation',true)$$,'22023',null,'lesson from another roadmap denied');
select throws_ok($$update public.learning_progress set user_id='91000000-0000-4000-8000-000000000002'$$,'42501',null,'owner cannot reassign progress');
select throws_ok($$update public.learning_progress set updated_at='2099-01-01'$$,'42501',null,'owner cannot forge timestamps');
select throws_ok($$insert into public.learning_lesson_keys values('beginner','injected:lesson',true,now(),now())$$,'42501',null,'owner cannot create lessons');
select throws_ok($$insert into public.learning_progress(user_id,roadmap_id,lesson_id,completed_at) values('91000000-0000-4000-8000-000000000002','beginner','python-algebra:python-functions',now())$$,'42501',null,'owner cannot forge another owner');
select lives_ok($$select public.set_learning_completion('beginner','python-algebra:python-fundamentals',false)$$,'undo is explicit');
select is((select count(*)*10 from public.learning_progress where completed_at is not null),0::bigint,'undo removes XP contribution');
select lives_ok($$select public.set_learning_completion('beginner','python-algebra:python-fundamentals',true)$$,'recomplete restores once');
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.learning_progress),0::bigint,'other user cannot read owner progress');
select lives_ok($$update public.learning_progress set completed_at=null$$,'cross-owner update sees no rows');
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.learning_progress),0::bigint,'admin has no private-progress bypass');
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000001',true);
select is((select count(*)*10 from public.learning_progress where completed_at is not null),10::bigint,'cross-user write did not change owner record');
reset role;
update public.learning_lesson_keys set active=false where roadmap_id='beginner' and lesson_id='python-algebra:python-fundamentals';
set local role authenticated;
select throws_ok($$select public.set_learning_completion('beginner','python-algebra:python-fundamentals',true)$$,'22023',null,'retired lesson rejects new completion');
select is((select count(*) from public.learning_progress),1::bigint,'retirement preserves historical record');
reset role;
select finish();
rollback;
