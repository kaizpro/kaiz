-- LOCAL ONLY: npx --no-install supabase test db --local
-- All fixtures and changes are rolled back, including privileged writes.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users(id, email) values
  ('71000000-0000-0000-0000-000000000001', 'external-owner@example.test'),
  ('71000000-0000-0000-0000-000000000002', 'external-other@example.test'),
  ('71000000-0000-0000-0000-000000000003', 'external-admin@example.test');
update public.profiles set role = 'admin' where id = '71000000-0000-0000-0000-000000000003';
insert into public.external_accounts(user_id, provider, external_username, external_user_id, verified_at, metadata)
values ('71000000-0000-0000-0000-000000000001', 'kaggle', 'verified-owner', 'provider-123', now(), '{"trusted":true}');

select ok(not has_column_privilege('authenticated', 'public.external_accounts', 'metadata', 'SELECT'), 'private metadata remains unreadable');
select ok(not has_column_privilege('authenticated', 'public.external_accounts', 'external_user_id', 'SELECT'), 'private provider identity remains unreadable');

set local role anon;
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username) values ('71000000-0000-0000-0000-000000000001','github','anon')$$, '42501', null, 'anon cannot insert');
with changed as (update public.external_accounts set external_username = 'anon' returning id)
select is(count(*), 0::bigint, 'anon cannot update') from changed;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
select throws_ok($$update public.profiles set role = 'admin' where id = auth.uid()$$, '42501', null, 'owner cannot self-promote into the trusted admin path');
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username,verified_at) values ('71000000-0000-0000-0000-000000000001','github','new-forged',now())$$, '42501', null, 'fresh insert cannot forge verification');
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username,metadata) values ('71000000-0000-0000-0000-000000000001','github','new-forged','{"trusted":true}')$$, '42501', null, 'fresh insert cannot forge provenance');
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username,external_user_id) values ('71000000-0000-0000-0000-000000000001','github','new-forged','provider-id')$$, '42501', null, 'fresh insert cannot forge provider identity');
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username,metadata) values ('71000000-0000-0000-0000-000000000001','github','new-forged','null')$$, '42501', null, 'JSON null cannot substitute for empty provenance');
select lives_ok($$insert into public.external_accounts(id,user_id,provider,external_username,created_at,updated_at) values ('72000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001','github','owner','2000-01-01','2000-01-01')$$, 'owner can link an unverified account');
select ok((select id <> '72000000-0000-0000-0000-000000000001' and created_at = now() and updated_at = now() from public.external_accounts where user_id = auth.uid() and provider = 'github'), 'identity and recording timestamps are server derived');
select is((select verified_at from public.external_accounts where user_id = auth.uid() and provider = 'github'), null::timestamptz, 'owner link starts unverified');
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username,verified_at) values ('71000000-0000-0000-0000-000000000001','github','forged',now())$$, '42501', null, 'insert cannot forge verification even on an existing link');
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username,metadata) values ('71000000-0000-0000-0000-000000000001','github','forged','{"trusted":true}')$$, '42501', null, 'insert cannot forge provenance');
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username,external_user_id) values ('71000000-0000-0000-0000-000000000001','github','forged','provider-id')$$, '42501', null, 'insert cannot forge provider identity');
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username) values ('71000000-0000-0000-0000-000000000002','github','forged-owner')$$, '42501', null, 'owner cannot link for another member');

select lives_ok($$update public.external_accounts set external_username = 'owner-edited', updated_at = '2000-01-01' where user_id = auth.uid() and provider = 'github'$$, 'owner can edit username');
select ok((select external_username = 'owner-edited' and updated_at = now() from public.external_accounts where user_id = auth.uid() and provider = 'github'), 'edit is applied with server timestamp');
select throws_ok($$update public.external_accounts set verified_at = now() where user_id = auth.uid() and provider = 'github'$$, '42501', null, 'owner cannot verify own link');
select throws_ok($$update public.external_accounts set metadata = '{"trusted":true}' where user_id = auth.uid() and provider = 'github'$$, '42501', null, 'owner cannot forge metadata');
select throws_ok($$update public.external_accounts set external_user_id = 'forged-id' where user_id = auth.uid() and provider = 'github'$$, '42501', null, 'owner cannot forge provider identity');
select throws_ok($$update public.external_accounts set provider = 'github' where user_id = auth.uid() and provider = 'kaggle'$$, '42501', null, 'provider identity is immutable');
select throws_ok($$update public.external_accounts set user_id = '71000000-0000-0000-0000-000000000002' where user_id = auth.uid() and provider = 'github'$$, '42501', null, 'row ownership is immutable');
select throws_ok($$update public.external_accounts set id = '72000000-0000-0000-0000-000000000002' where user_id = auth.uid() and provider = 'github'$$, '42501', null, 'row identity is immutable');
select throws_ok($$update public.external_accounts set created_at = '2000-01-01' where user_id = auth.uid() and provider = 'github'$$, '42501', null, 'creation timestamp is immutable');
select throws_ok($$update public.external_accounts set external_username = 'mixed-forgery', verified_at = now() where user_id = auth.uid() and provider = 'github'$$, '42501', null, 'allowed plus protected edit is rejected atomically');
select is((select external_username from public.external_accounts where user_id = auth.uid() and provider = 'github'), 'owner-edited', 'failed mixed edit leaves username unchanged');
select lives_ok($$insert into public.external_accounts(user_id,provider,external_username) values ('71000000-0000-0000-0000-000000000001','kaggle','verified-owner') on conflict (user_id,provider) do update set external_username = excluded.external_username$$, 'unchanged profile upsert works on a trusted link');
select ok((select verified_at is not null from public.external_accounts where user_id = auth.uid() and provider = 'kaggle'), 'unchanged username preserves verification');
select lives_ok($$insert into public.external_accounts(user_id,provider,external_username) values ('71000000-0000-0000-0000-000000000001','kaggle','different-account') on conflict (user_id,provider) do update set external_username = excluded.external_username$$, 'profile upsert can change a trusted username');
select is((select verified_at from public.external_accounts where user_id = auth.uid() and provider = 'kaggle'), null::timestamptz, 'changed username cannot inherit verification');
reset role;
select ok((select external_user_id is null and metadata = '{}'::jsonb from public.external_accounts where user_id = '71000000-0000-0000-0000-000000000001' and provider = 'kaggle'), 'changed username clears private provider identity and provenance');

set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000002', true);
with changed as (update public.external_accounts set external_username = 'other' where user_id = '71000000-0000-0000-0000-000000000001' returning id)
select is(count(*), 0::bigint, 'other member cannot update owner link') from changed;
with removed as (delete from public.external_accounts where user_id = '71000000-0000-0000-0000-000000000001' returning id)
select is(count(*), 0::bigint, 'other member cannot delete owner link') from removed;

select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000003', true);
select lives_ok($$insert into public.external_accounts(user_id,provider,external_username,verified_at,external_user_id,metadata) values ('71000000-0000-0000-0000-000000000003','github','admin',now(),'admin-provider-id','{"trusted":true}')$$, 'admin retains trusted insert on own row');
select lives_ok($$update public.external_accounts set verified_at = now(), external_user_id = 'admin-edited-id', metadata = '{"reviewed":true}' where user_id = auth.uid()$$, 'admin retains trusted update on own row');
select ok((select verified_at is not null from public.external_accounts where user_id = auth.uid()), 'admin verification persisted');
select throws_ok($$insert into public.external_accounts(user_id,provider,external_username,verified_at) values ('71000000-0000-0000-0000-000000000002','github','admin-for-other',now())$$, '42501', null, 'admin insert bypass does not broaden self-only RLS');
with changed as (update public.external_accounts set verified_at = now() where user_id = '71000000-0000-0000-0000-000000000001' returning id)
select is(count(*), 0::bigint, 'admin trigger bypass does not broaden self-only RLS') from changed;

reset role;
set local role service_role;
select lives_ok($$update public.external_accounts set verified_at = now(), external_user_id = 'system-id', metadata = '{"system":true}' where user_id = '71000000-0000-0000-0000-000000000001' and provider = 'github'$$, 'trusted backend retains cross-owner verification path');
select ok((select verified_at is not null and external_user_id = 'system-id' and metadata = '{"system":true}'::jsonb from public.external_accounts where user_id = '71000000-0000-0000-0000-000000000001' and provider = 'github'), 'system trusted fields persisted');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'service_role', true);
select throws_ok($$update public.external_accounts set verified_at = null where user_id = auth.uid() and provider = 'github'$$, '42501', null, 'client role claim cannot bypass actual database role');
select lives_ok($$delete from public.external_accounts where user_id = auth.uid() and provider = 'github'$$, 'owner retains unlink even for verified account');
select is((select count(*) from public.external_accounts where user_id = auth.uid() and provider = 'github'), 0::bigint, 'unlink actually deletes the row');
select lives_ok($$insert into public.external_accounts(user_id,provider,external_username) values ('71000000-0000-0000-0000-000000000001','github','relinked')$$, 'owner can relink after delete');
select is((select verified_at from public.external_accounts where user_id = auth.uid() and provider = 'github'), null::timestamptz, 'relinked account is unverified');
select throws_ok($$truncate public.external_accounts$$, '42501', null, 'member cannot bypass row protection through TRUNCATE');
select throws_ok($$create or replace trigger a_protect_external_account_fields before update on public.external_accounts for each row execute function public.set_updated_at()$$, '42501', null, 'member cannot replace the guard with a timestamp-only trigger');
select throws_ok($$set local session_replication_role = 'replica'$$, '42501', null, 'member cannot suppress triggers through replication mode');

reset role;
set local role anon;
select throws_ok($$truncate public.external_accounts$$, '42501', null, 'anon cannot bypass row protection through TRUNCATE');
select throws_ok($$create or replace trigger a_protect_external_account_fields before update on public.external_accounts for each row execute function public.set_updated_at()$$, '42501', null, 'anon cannot replace the protection trigger');

reset role;
select ok(not has_function_privilege('authenticated', 'public.protect_external_account_fields()', 'EXECUTE'), 'guard cannot be called directly by a member');
select ok(not has_function_privilege('anon', 'public.protect_external_account_fields()', 'EXECUTE'), 'guard cannot be called directly by anon');
select * from finish();
rollback;
