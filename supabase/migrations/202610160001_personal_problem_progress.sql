-- Private self-reported task status only. Scores/history remain in
-- problem_performances; this does not publish results or award ratings/XP.
create table public.problem_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  status text not null check (status in ('attempted','solved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,problem_id)
);
create index problem_progress_user_updated_idx on public.problem_progress(user_id,updated_at desc);
alter table public.problem_progress enable row level security;
create policy "problem progress owner read" on public.problem_progress for select to authenticated using(user_id=(select auth.uid()));
create policy "problem progress owner insert" on public.problem_progress for insert to authenticated with check(user_id=(select auth.uid()));
create policy "problem progress owner update" on public.problem_progress for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "problem progress owner delete" on public.problem_progress for delete to authenticated using(user_id=(select auth.uid()));
revoke all on public.problem_progress from public,anon,authenticated;
grant select,delete on public.problem_progress to authenticated;
grant insert(user_id,problem_id,status) on public.problem_progress to authenticated;
grant update(status) on public.problem_progress to authenticated;

create function public.guard_problem_progress() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.user_id is distinct from old.user_id or new.problem_id is distinct from old.problem_id) then
    raise exception using errcode='42501',message='Task progress identities are immutable';
  end if;
  if not exists(select 1 from public.problems where id=new.problem_id and published) then
    raise exception using errcode='22023',message='Task must be published';
  end if;
  if tg_op='INSERT' then new.created_at:=now();new.updated_at:=now();
  else new.created_at:=old.created_at;new.updated_at:=case when new.status is distinct from old.status then now() else old.updated_at end;
  end if;
  return new;
end;$$;
create trigger guard_problem_progress before insert or update on public.problem_progress for each row execute function public.guard_problem_progress();
revoke execute on function public.guard_problem_progress() from public,anon,authenticated;

create function public.set_problem_status(p_problem_id uuid,p_status text) returns void
language plpgsql security invoker set search_path='' as $$
begin
  if (select auth.uid()) is null then raise exception using errcode='42501',message='Authentication required';end if;
  if p_status is null then
    delete from public.problem_progress where user_id=(select auth.uid()) and problem_id=p_problem_id;
  elsif p_status in ('attempted','solved') then
    insert into public.problem_progress(user_id,problem_id,status) values((select auth.uid()),p_problem_id,p_status)
    on conflict(user_id,problem_id) do update set status=excluded.status;
  else raise exception using errcode='22023',message='Invalid self-reported status';
  end if;
end;$$;
revoke execute on function public.set_problem_status(uuid,text) from public,anon;
grant execute on function public.set_problem_status(uuid,text) to authenticated;

-- Narrow the old intentional admin moderation exception: authenticated admins
-- retain official-result management, but cannot access another owner's practice.
-- Privileged operational DB/service roles remain outside end-user RLS.
create policy "private practice owner boundary" on public.problem_performances
  as restrictive for all to authenticated
  using(attempt_type<>'practice' or user_id=(select auth.uid()))
  with check(attempt_type<>'practice' or user_id=(select auth.uid()));

-- A reference_score is NOT a maximum. Optional source-backed score_bounds in
-- admin-managed problem provenance override metric defaults. Never infer solved.
create function public.practice_score_range(p_metric text,p_provenance jsonb) returns numeric[]
language plpgsql immutable set search_path='' as $$
declare m text:=lower(trim(p_metric));b jsonb:=p_provenance->'score_bounds';lo numeric;hi numeric;
begin
  if m ~ '^(accuracy|f1([ _-]?(score|macro|micro|weighted))?|auc|roc[ _-]?auc)([ ]*\(%\)|[ ]*%|[ ]+percent)?$' then
    lo:=0;hi:=case when m ~ '%|percent' then 100 else 1 end;
  elsif m in ('rmse','root mean squared error','mse','mae','log loss','logloss','point','points') then lo:=0;
  end if;
  if b is not null then
    if jsonb_typeof(b)<>'object' or (b ? 'min' and jsonb_typeof(b->'min')<>'number') or (b ? 'max' and jsonb_typeof(b->'max')<>'number') then
      raise exception using errcode='22023',message='Invalid task score bounds';
    end if;
    if b ? 'min' then lo:=(b->>'min')::numeric;end if;
    if b ? 'max' then hi:=(b->>'max')::numeric;end if;
  end if;
  if lo>hi then raise exception using errcode='22023',message='Invalid task score bounds';end if;
  return array[lo,hi];
end;$$;
revoke execute on function public.practice_score_range(text,jsonb) from public,anon;
grant execute on function public.practice_score_range(text,jsonb) to authenticated;

create function public.validate_private_practice_score() returns trigger
language plpgsql set search_path='' as $$
declare task public.problems;bounds numeric[];
begin
  if new.attempt_type<>'practice' then return new;end if;
  select * into task from public.problems where id=new.problem_id and published;
  if not found then raise exception using errcode='22023',message='Task must be published';end if;
  bounds:=public.practice_score_range(task.metric_name,task.source_provenance);
  if new.raw_score in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
    or new.raw_score<bounds[1] or new.raw_score>bounds[2]
    or new.attempted_at>now() then
    raise exception using errcode='22023',message='Score or time is outside task limits';
  end if;
  return new;
end;$$;
create trigger b_validate_private_practice_score before insert or update of raw_score,attempted_at,problem_id,attempt_type
  on public.problem_performances for each row execute function public.validate_private_practice_score();
revoke execute on function public.validate_private_practice_score() from public,anon,authenticated;

create view public.own_problem_practice with (security_invoker=true,security_barrier=true) as
with mine as (
  select problem_id from public.problem_progress where user_id=(select auth.uid())
  union select problem_id from public.problem_performances where user_id=(select auth.uid()) and attempt_type='practice'
)
select (select auth.uid()) as user_id,p.id as problem_id,p.title,p.slug,p.metric_name,p.metric_direction,
  coalesce(s.status,'attempted') as status,a.raw_score as latest_score,a.attempted_at as latest_attempt_at,
  greatest(s.updated_at,a.updated_at) as updated_at
from mine join public.problems p on p.id=mine.problem_id
left join public.problem_progress s on s.problem_id=p.id and s.user_id=(select auth.uid())
left join lateral (
  select raw_score,attempted_at,updated_at from public.problem_performances
  where problem_id=p.id and user_id=(select auth.uid()) and attempt_type='practice' and status='valid'
  order by attempted_at desc,id asc limit 1
) a on true where p.published;
revoke all on public.own_problem_practice from public,anon,authenticated;
grant select on public.own_problem_practice to authenticated;
comment on table public.problem_progress is 'Owner-private explicit self-reported status, not judge verification. Scores remain in problem_performances.';
comment on view public.own_problem_practice is 'Owner-only published individual tasks: any recorded practice means attempted; solved is explicit only. Latest valid score is chronological, not best.';
