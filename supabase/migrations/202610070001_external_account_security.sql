-- Row ownership does not authorize a member to assert verification/provenance.
-- Preserve existing RLS, read grants and unlink semantics; no data is rewritten.
-- TRUNCATE bypasses RLS; TRIGGER permits replacing the guard with another function.
-- Neither privilege is part of a client account-editing workflow.
revoke truncate, trigger on table public.external_accounts from public, anon, authenticated;

create function public.protect_external_account_fields() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  -- Use the actual SQL role, not a user-supplied provider/JWT metadata field.
  if current_user in ('postgres', 'supabase_admin', 'service_role') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.user_id is distinct from (select auth.uid())
      or new.verified_at is not null
      or new.external_user_id is not null
      or new.metadata is distinct from '{}'::jsonb then
      raise exception using errcode = '42501', message = 'Members may only link unverified external accounts';
    end if;
    new.id := pg_catalog.gen_random_uuid();
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- An allowlist also rejects writes to future system columns on UPDATE.
  -- Compare before invalidating trust so legitimate verified-link edits work.
  if (to_jsonb(new) - array['external_username', 'updated_at'])
    is distinct from (to_jsonb(old) - array['external_username', 'updated_at']) then
    raise exception using errcode = '42501', message = 'Members may only edit the external username';
  end if;

  -- Verification belongs to the previous provider identity, not its owner's row.
  if new.external_username is distinct from old.external_username then
    new.verified_at := null;
    new.external_user_id := null;
    new.metadata := '{}'::jsonb;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Runs before the existing set_external_accounts_updated_at trigger.
create trigger a_protect_external_account_fields
  before insert or update on public.external_accounts
  for each row execute function public.protect_external_account_fields();

revoke execute on function public.protect_external_account_fields()
  from public, anon, authenticated;

comment on function public.protect_external_account_fields() is
  'Member links are unverified; only external_username is editable, and rebinding clears prior trust. Existing RLS still controls row access.';
