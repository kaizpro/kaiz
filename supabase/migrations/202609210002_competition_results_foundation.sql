-- Competition Experience + Results Foundation.
-- This migration preserves legacy competition_results rows while adding
-- publishable result sets and support for external individuals and teams.

create table public.competition_result_sets (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  name text not null default 'Official results' check (char_length(name) between 2 and 120),
  status text not null default 'official' check (status in ('provisional', 'official')),
  source text not null default 'manual' check (source ~ '^[a-z][a-z0-9_]{1,39}$'),
  source_label text check (source_label is null or char_length(source_label) between 2 and 120),
  source_url text check (source_url is null or source_url ~* '^https?://'),
  published boolean not null default false,
  fetched_at timestamptz,
  imported_at timestamptz,
  verified_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, competition_id)
);

create index competition_result_sets_competition_status_idx
  on public.competition_result_sets(competition_id, published, status, created_at desc);

alter table public.competition_results
  add column result_set_id uuid,
  add column participant_type text not null default 'individual'
    check (participant_type in ('individual', 'team')),
  add column participant_name text,
  add column team_id uuid references public.teams(id) on delete set null,
  add column country_code text
    check (country_code is null or country_code ~ '^[A-Z]{2,3}$'),
  add column score_display text
    check (score_display is null or char_length(score_display) <= 80),
  add column award text
    check (award is null or char_length(award) <= 80),
  add column result_status text not null default 'ranked'
    check (result_status in ('ranked', 'unranked', 'disqualified')),
  add column external_participant_id text
    check (external_participant_id is null or char_length(external_participant_id) <= 200),
  add column metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  add column created_by uuid references public.profiles(id) on delete set null,
  add column updated_by uuid references public.profiles(id) on delete set null;

-- Preserve any legacy results by grouping them into compatible KAIZ result sets.
insert into public.competition_result_sets (
  competition_id, name, status, source, published, verified_at, created_at, updated_at
)
select
  competition_id,
  case when verified then 'Official results' else 'Provisional results' end,
  case when verified then 'official' else 'provisional' end,
  'kaiz',
  verified,
  case when verified then now() else null end,
  min(created_at),
  max(updated_at)
from public.competition_results
group by competition_id, verified;

update public.competition_results as result
set
  result_set_id = (
    select result_set.id
    from public.competition_result_sets as result_set
    where result_set.competition_id = result.competition_id
      and result_set.source = 'kaiz'
      and result_set.status = case when result.verified then 'official' else 'provisional' end
  ),
  participant_name = coalesce(
    (select profile.display_name from public.profiles as profile where profile.id = result.user_id),
    result.external_reference,
    'Participant'
  ),
  result_status = case when result.rank is null then 'unranked' else 'ranked' end,
  external_participant_id = result.external_reference;

alter table public.competition_results
  alter column result_set_id set not null,
  alter column participant_name set not null,
  alter column user_id drop not null,
  drop constraint competition_results_user_id_fkey,
  add constraint competition_results_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete set null,
  drop constraint competition_results_competition_id_user_id_key,
  add constraint competition_results_result_set_competition_fkey
    foreign key (result_set_id, competition_id)
    references public.competition_result_sets(id, competition_id) on delete cascade,
  add constraint competition_results_participant_name_length
    check (char_length(participant_name) between 1 and 160),
  add constraint competition_results_rank_status_consistency
    check (
      (result_status = 'ranked' and rank is not null)
      or (result_status in ('unranked', 'disqualified') and rank is null)
    );

create index competition_results_set_rank_idx
  on public.competition_results(result_set_id, rank asc nulls last, created_at asc);
create unique index competition_results_set_user_unique_idx
  on public.competition_results(result_set_id, user_id) where user_id is not null;
create unique index competition_results_set_external_unique_idx
  on public.competition_results(result_set_id, external_participant_id)
  where external_participant_id is not null;

alter table public.competition_result_sets enable row level security;

drop policy "results public read" on public.competition_results;

create policy "result sets public read"
  on public.competition_result_sets for select
  using (published or public.is_admin());
create policy "result sets admin insert"
  on public.competition_result_sets for insert to authenticated
  with check (public.is_admin());
create policy "result sets admin update"
  on public.competition_result_sets for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "result sets admin delete"
  on public.competition_result_sets for delete to authenticated
  using (public.is_admin());

create policy "results published read"
  on public.competition_results for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.competition_result_sets
      where id = competition_results.result_set_id and published
    )
  );
create policy "results admin insert"
  on public.competition_results for insert to authenticated
  with check (public.is_admin());
create policy "results admin update"
  on public.competition_results for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "results admin delete"
  on public.competition_results for delete to authenticated
  using (public.is_admin());

revoke all on table public.competition_result_sets from anon, authenticated;
grant select on table public.competition_result_sets to anon, authenticated;
grant insert, update, delete on table public.competition_result_sets to authenticated;

revoke all on table public.competition_results from anon, authenticated;
grant select on table public.competition_results to anon, authenticated;
grant insert, update, delete on table public.competition_results to authenticated;

create trigger set_competition_result_sets_updated_at
  before update on public.competition_result_sets
  for each row execute function public.set_updated_at();
