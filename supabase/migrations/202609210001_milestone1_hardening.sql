-- Milestone 1 hardening for fresh and existing KAIZ projects.

-- Support email/password and OAuth users without allowing malformed profile names
-- to abort the auth.users insert trigger.
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_name text;
begin
  candidate_name := trim(coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Member'
  ));

  if char_length(candidate_name) < 2 then
    candidate_name := 'Member';
  end if;

  insert into public.profiles(id, display_name)
  values(new.id, left(candidate_name, 60));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Only public identity fields are readable through the Data API. Provider metadata
-- remains available to trusted backend roles for future verified integrations.
revoke select on table public.external_accounts from anon, authenticated;
grant select(id, user_id, provider, external_username, verified_at, created_at, updated_at)
  on table public.external_accounts to anon, authenticated;
