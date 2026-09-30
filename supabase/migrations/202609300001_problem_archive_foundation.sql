-- Problem Archive Foundation.
-- Stores source-faithful problem metadata, separate official/practice
-- performances, and versioned aggregate statistics without defining a rating
-- algorithm.

create type public.problem_metric_direction as enum ('higher_is_better', 'lower_is_better');
create type public.problem_difficulty_status as enum ('unrated', 'provisional', 'rated');
create type public.problem_performance_type as enum ('official', 'practice');
create type public.problem_performance_status as enum ('valid', 'invalidated', 'disqualified');

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete set null,
  title text not null check (char_length(title) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  problem_code text check (problem_code is null or char_length(problem_code) between 1 and 40),
  summary text check (summary is null or char_length(summary) <= 600),
  statement_markdown text,
  statement_url text check (statement_url is null or statement_url ~* '^https?://'),
  category text not null check (char_length(category) between 2 and 80),
  tags text[] not null default '{}',
  metric_name text not null check (char_length(metric_name) between 1 and 80),
  metric_direction public.problem_metric_direction not null,
  reference_score numeric,
  difficulty_status public.problem_difficulty_status not null default 'unrated',
  difficulty_rating numeric check (difficulty_rating is null or difficulty_rating >= 0),
  source_provider text not null check (source_provider ~ '^[a-z][a-z0-9_]{1,39}$'),
  source_label text check (source_label is null or char_length(source_label) between 2 and 120),
  source_url text check (source_url is null or source_url ~* '^https?://'),
  source_external_id text check (source_external_id is null or char_length(source_external_id) <= 200),
  source_provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(source_provenance) = 'object'),
  published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint problems_difficulty_consistency check (
    (difficulty_status = 'unrated' and difficulty_rating is null)
    or difficulty_status = 'provisional'
    or (difficulty_status = 'rated' and difficulty_rating is not null)
  ),
  unique (id, competition_id)
);

create index problems_published_created_idx
  on public.problems(published, created_at desc);
create index problems_competition_order_idx
  on public.problems(competition_id, sort_order, title) where competition_id is not null;
create index problems_category_idx on public.problems(category);
create index problems_tags_idx on public.problems using gin(tags);
create unique index problems_source_identity_idx
  on public.problems(source_provider, source_external_id)
  where source_external_id is not null;

create table public.problem_performances (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  competition_result_id uuid references public.competition_results(id) on delete set null,
  attempt_type public.problem_performance_type not null,
  status public.problem_performance_status not null default 'valid',
  raw_score numeric not null,
  normalized_performance numeric
    check (normalized_performance is null or normalized_performance between 0 and 1),
  source_provider text check (source_provider is null or source_provider ~ '^[a-z][a-z0-9_]{1,39}$'),
  source_external_id text check (source_external_id is null or char_length(source_external_id) <= 200),
  source_provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(source_provenance) = 'object'),
  attempted_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint problem_performances_practice_not_official_result check (
    attempt_type = 'official' or competition_result_id is null
  )
);

create index problem_performances_problem_type_performance_idx
  on public.problem_performances(problem_id, attempt_type, normalized_performance desc nulls last, attempted_at desc);
create index problem_performances_user_type_attempted_idx
  on public.problem_performances(user_id, attempt_type, attempted_at desc);
create unique index problem_performances_official_result_unique_idx
  on public.problem_performances(problem_id, user_id, competition_result_id)
  where competition_result_id is not null;
create unique index problem_performances_source_identity_idx
  on public.problem_performances(source_provider, source_external_id)
  where source_provider is not null and source_external_id is not null;

create function public.validate_problem_performance_result_link() returns trigger
language plpgsql set search_path = '' as $$
declare
  problem_competition_id uuid;
  result_competition_id uuid;
  result_user_id uuid;
begin
  if new.competition_result_id is null then
    return new;
  end if;

  if new.attempt_type <> 'official' then
    raise exception 'Only official performances may reference a competition result';
  end if;

  select competition_id into problem_competition_id
  from public.problems where id = new.problem_id;

  select competition_id, user_id into result_competition_id, result_user_id
  from public.competition_results where id = new.competition_result_id;

  if problem_competition_id is null or problem_competition_id <> result_competition_id then
    raise exception 'Problem and competition result must belong to the same competition';
  end if;

  if result_user_id is null or result_user_id <> new.user_id then
    raise exception 'Problem performance and competition result must belong to the same user';
  end if;

  return new;
end;
$$;

create trigger validate_problem_performance_result_link
  before insert or update of problem_id, user_id, competition_result_id, attempt_type
  on public.problem_performances
  for each row execute function public.validate_problem_performance_result_link();

create table public.problem_statistic_snapshots (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  population_scope text not null default 'all_valid'
    check (population_scope ~ '^[a-z][a-z0-9_]{1,39}$'),
  status public.problem_difficulty_status not null default 'unrated',
  sample_size integer not null default 0 check (sample_size >= 0),
  median_normalized_performance numeric
    check (median_normalized_performance is null or median_normalized_performance between 0 and 1),
  percentile_10 numeric check (percentile_10 is null or percentile_10 between 0 and 1),
  percentile_25 numeric check (percentile_25 is null or percentile_25 between 0 and 1),
  percentile_75 numeric check (percentile_75 is null or percentile_75 between 0 and 1),
  percentile_90 numeric check (percentile_90 is null or percentile_90 between 0 and 1),
  calculation_version text not null check (char_length(calculation_version) between 1 and 80),
  methodology jsonb not null default '{}'::jsonb check (jsonb_typeof(methodology) = 'object'),
  is_current boolean not null default true,
  calculated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint problem_statistics_sample_consistency check (
    sample_size > 0
    or (
      median_normalized_performance is null
      and percentile_10 is null
      and percentile_25 is null
      and percentile_75 is null
      and percentile_90 is null
    )
  ),
  constraint problem_statistics_percentile_order check (
    (percentile_10 is null or percentile_25 is null or percentile_10 <= percentile_25)
    and (percentile_25 is null or median_normalized_performance is null or percentile_25 <= median_normalized_performance)
    and (median_normalized_performance is null or percentile_75 is null or median_normalized_performance <= percentile_75)
    and (percentile_75 is null or percentile_90 is null or percentile_75 <= percentile_90)
  )
);

create unique index problem_statistics_current_scope_unique_idx
  on public.problem_statistic_snapshots(problem_id, population_scope)
  where is_current;
create index problem_statistics_history_idx
  on public.problem_statistic_snapshots(problem_id, population_scope, calculated_at desc);

alter table public.problems enable row level security;
alter table public.problem_performances enable row level security;
alter table public.problem_statistic_snapshots enable row level security;

create policy "problems published read"
  on public.problems for select
  using (published or public.is_admin());
create policy "problems admin insert"
  on public.problems for insert to authenticated
  with check (public.is_admin());
create policy "problems admin update"
  on public.problems for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "problems admin delete"
  on public.problems for delete to authenticated
  using (public.is_admin());

create policy "problem performances official or self read"
  on public.problem_performances for select
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or (
      attempt_type = 'official'
      and exists (
        select 1 from public.problems
        where id = problem_performances.problem_id and published
      )
    )
  );
create policy "problem performances practice self insert"
  on public.problem_performances for insert to authenticated
  with check (
    public.is_admin()
    or (user_id = (select auth.uid()) and attempt_type = 'practice' and competition_result_id is null)
  );
create policy "problem performances practice self update"
  on public.problem_performances for update to authenticated
  using (public.is_admin() or (user_id = (select auth.uid()) and attempt_type = 'practice'))
  with check (
    public.is_admin()
    or (user_id = (select auth.uid()) and attempt_type = 'practice' and competition_result_id is null)
  );
create policy "problem performances practice self delete"
  on public.problem_performances for delete to authenticated
  using (public.is_admin() or (user_id = (select auth.uid()) and attempt_type = 'practice'));

create policy "problem statistics published read"
  on public.problem_statistic_snapshots for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.problems
      where id = problem_statistic_snapshots.problem_id and published
    )
  );
create policy "problem statistics admin insert"
  on public.problem_statistic_snapshots for insert to authenticated
  with check (public.is_admin());
create policy "problem statistics admin update"
  on public.problem_statistic_snapshots for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "problem statistics admin delete"
  on public.problem_statistic_snapshots for delete to authenticated
  using (public.is_admin());

revoke all on table public.problems, public.problem_performances, public.problem_statistic_snapshots
  from anon, authenticated;
grant select on table public.problems, public.problem_statistic_snapshots to anon, authenticated;
grant insert, update, delete on table public.problems, public.problem_statistic_snapshots to authenticated;
grant select on table public.problem_performances to anon, authenticated;
grant insert, update, delete on table public.problem_performances to authenticated;

create trigger set_problems_updated_at
  before update on public.problems
  for each row execute function public.set_updated_at();
create trigger set_problem_performances_updated_at
  before update on public.problem_performances
  for each row execute function public.set_updated_at();
create trigger set_problem_statistic_snapshots_updated_at
  before update on public.problem_statistic_snapshots
  for each row execute function public.set_updated_at();

comment on column public.problem_performances.normalized_performance is
  'Direction-adjusted value from 0 to 1 where higher always means better; normalization does not define a rating algorithm.';
comment on table public.problem_statistic_snapshots is
  'Versioned aggregate inputs for future difficulty/rating work; calculation_version identifies external methodology.';
