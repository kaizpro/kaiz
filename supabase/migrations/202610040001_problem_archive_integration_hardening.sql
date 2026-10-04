-- Follow-up to Ali's shared foundation migration; do not rewrite that history.

-- A linked measurement must retain BOTH its competition and participant context.
-- Native foreign keys protect parent updates and concurrent writes, not just
-- inserts into the child. Existing delete/set-null/cascade behavior is retained.
alter table public.competition_results
  add constraint competition_results_problem_context_key
    unique (id, competition_id, user_id);

alter table public.problem_performances add column linked_competition_id uuid;

update public.problem_performances as performance
set linked_competition_id = problem.competition_id
from public.problems as problem
where performance.problem_id = problem.id
  and performance.competition_result_id is not null;

alter table public.problem_performances
  add constraint problem_performances_link_context_check check (
    (competition_result_id is null and linked_competition_id is null)
    or (competition_result_id is not null and linked_competition_id is not null)
  ),
  add constraint problem_performances_problem_context_fkey
    foreign key (problem_id, linked_competition_id)
    references public.problems(id, competition_id)
    deferrable initially immediate,
  add constraint problem_performances_result_context_fkey
    foreign key (competition_result_id, linked_competition_id, user_id)
    references public.competition_results(id, competition_id, user_id)
    deferrable initially immediate;

create index problem_performances_result_context_idx
  on public.problem_performances(competition_result_id, linked_competition_id, user_id)
  where competition_result_id is not null;

create or replace function public.validate_problem_performance_result_link() returns trigger
language plpgsql set search_path = '' as $$
declare
  problem_competition_id uuid;
  result_competition_id uuid;
  result_user_id uuid;
begin
  -- This also runs for the existing FK's ON DELETE SET NULL action.
  if new.competition_result_id is null then
    new.linked_competition_id := null;
    return new;
  end if;

  if new.attempt_type <> 'official' then
    raise exception 'Only official performances may reference a competition result';
  end if;

  select competition_id into problem_competition_id
  from public.problems where id = new.problem_id;
  select competition_id, user_id into result_competition_id, result_user_id
  from public.competition_results where id = new.competition_result_id;

  if problem_competition_id is null or result_competition_id is null
    or problem_competition_id <> result_competition_id then
    raise exception 'Problem and competition result must belong to the same competition';
  end if;
  if result_user_id is null or result_user_id <> new.user_id then
    raise exception 'Problem performance and competition result must belong to the same user';
  end if;

  new.linked_competition_id := problem_competition_id;
  return new;
end;
$$;

-- Admins and members share the authenticated database role, so column grants
-- alone cannot distinguish them. RLS continues to enforce ownership; this
-- SECURITY INVOKER trigger protects the trusted fields even through direct API
-- writes. Only plain self-reports may be edited/deleted by their owner.
create function public.protect_practice_performance_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') or public.is_admin() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.attempt_type <> 'practice'
      or new.user_id is distinct from (select auth.uid())
      or new.competition_result_id is not null
      or new.linked_competition_id is not null
      or new.status is distinct from 'valid'::public.problem_performance_status
      or new.normalized_performance is not null
      or new.source_provider is not null
      or new.source_external_id is not null
      or new.source_provenance is distinct from '{}'::jsonb
      or (new.created_by is not null and new.created_by is distinct from (select auth.uid()))
      or (new.updated_by is not null and new.updated_by is distinct from (select auth.uid())) then
      raise exception using errcode = '42501', message = 'Members may only create untrusted self-reported practice attempts';
    end if;
    new.created_by := (select auth.uid());
    new.updated_by := (select auth.uid());
    new.created_at := now();
    new.updated_at := now();
    new.recorded_at := now();
    return new;
  end if;

  if old.attempt_type <> 'practice'
    or old.user_id is distinct from (select auth.uid())
    or old.status <> 'valid'
    or old.normalized_performance is not null
    or old.source_provider is not null
    or old.source_external_id is not null
    or old.source_provenance <> '{}'::jsonb then
    raise exception using errcode = '42501', message = 'Only administrators may modify reviewed practice attempts';
  end if;

  if tg_op = 'DELETE' then return old; end if;

  -- An allowlist also protects new system columns added by later migrations.
  if (to_jsonb(new) - array['raw_score', 'attempted_at', 'updated_at', 'updated_by'])
    is distinct from (to_jsonb(old) - array['raw_score', 'attempted_at', 'updated_at', 'updated_by'])
    or (new.updated_by is distinct from old.updated_by and new.updated_by is distinct from (select auth.uid())) then
    raise exception using errcode = '42501', message = 'Members may only edit the raw score and attempt time';
  end if;
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

-- Alphabetical ordering runs this before the existing timestamp/link triggers.
create trigger a_protect_practice_performance_fields
  before insert or update or delete on public.problem_performances
  for each row execute function public.protect_practice_performance_fields();

revoke execute on function public.protect_practice_performance_fields()
  from public, anon, authenticated;
revoke execute on function public.validate_problem_performance_result_link()
  from public, anon, authenticated;

drop policy "problem performances official or self read" on public.problem_performances;
create policy "problem performances official or self read"
  on public.problem_performances for select
  using (
    public.is_admin()
    or (attempt_type = 'practice' and user_id = (select auth.uid()))
    or (
      attempt_type = 'official'
      and exists (
        select 1 from public.problems
        where id = problem_performances.problem_id and published
      )
      and exists (
        select 1
        from public.competition_results as result
        join public.competition_result_sets as result_set on result_set.id = result.result_set_id
        where result.id = problem_performances.competition_result_id and result_set.published
      )
    )
  );

comment on column public.problem_performances.linked_competition_id is
  'Trigger-derived context for composite foreign keys; null for unlinked performances.';
comment on column public.problem_performances.status is
  'Administrative validity state, not proof of trust. A member self-report starts valid with no normalization or provenance.';
