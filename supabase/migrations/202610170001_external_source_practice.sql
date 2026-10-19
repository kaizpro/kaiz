-- Depends on 202610160001. Private source targets extend existing attempt history;
-- they are NOT public problems, official results, medals, ratings or Learning XP.
create table public.source_practice (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 catalog_id text not null check(char_length(catalog_id) between 2 and 160 and catalog_id ~ '^[a-z0-9][a-z0-9:_-]+$'),
 status text check(status in ('practiced','finished')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,catalog_id), unique(id,user_id)
);
create index source_practice_owner_updated_idx on public.source_practice(user_id,updated_at desc);
alter table public.source_practice enable row level security;
create policy "source practice owner read" on public.source_practice for select to authenticated using(user_id=(select auth.uid()));
create policy "source practice owner insert" on public.source_practice for insert to authenticated with check(user_id=(select auth.uid()));
create policy "source practice owner update" on public.source_practice for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "source practice owner delete" on public.source_practice for delete to authenticated using(user_id=(select auth.uid()));
revoke all on public.source_practice from public,anon,authenticated;
grant select,delete on public.source_practice to authenticated;
grant insert(user_id,catalog_id,status) on public.source_practice to authenticated;
grant update(status) on public.source_practice to authenticated;

create function public.guard_source_practice() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' and (new.id is distinct from old.id or new.user_id is distinct from old.user_id or new.catalog_id is distinct from old.catalog_id) then
  raise exception using errcode='42501',message='Source practice identities are immutable';
 end if;
 if tg_op='INSERT' then new.created_at:=now();new.updated_at:=now();
 else new.created_at:=old.created_at;new.updated_at:=case when new.status is distinct from old.status then now() else old.updated_at end;end if;
 return new;
end;$$;
create trigger guard_source_practice before insert or update on public.source_practice for each row execute function public.guard_source_practice();
revoke execute on function public.guard_source_practice() from public,anon,authenticated;

alter table public.problem_performances
 alter column problem_id drop not null, alter column raw_score drop not null,
 add column source_practice_id uuid,
 add column practice_notes text check(practice_notes is null or char_length(practice_notes)<=2000),
 add column practice_metric text check(practice_metric is null or char_length(trim(practice_metric)) between 1 and 80),
 add column practice_direction public.problem_metric_direction,
 add column practice_outcome text check(practice_outcome in ('practiced','participated','finished','solved')),
 add column practice_task_title text check(practice_task_title is null or char_length(trim(practice_task_title)) between 2 and 180),
 add column practice_task_url text check(practice_task_url is null or (char_length(practice_task_url)<=2000 and practice_task_url ~ '^https://[^/@?#[:space:]]+(/|$)' and practice_task_url !~* '^https://(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.|\[)' and practice_task_url !~* '[?&][^=]*(token|password|secret|code|key)[^=]*=')),
 add constraint problem_performances_source_owner_fkey foreign key(source_practice_id,user_id) references public.source_practice(id,user_id) on delete cascade,
 add constraint problem_performances_private_notes_check check(practice_notes is null or attempt_type='practice'),
 add constraint problem_performances_target_check check(
  (problem_id is not null and source_practice_id is null and raw_score is not null and practice_metric is null and practice_direction is null and practice_outcome is null and practice_task_title is null and practice_task_url is null)
  or (problem_id is null and source_practice_id is not null and attempt_type='practice' and competition_result_id is null and linked_competition_id is null and normalized_performance is null and source_provider is null and source_external_id is null and source_provenance='{}'::jsonb and (raw_score is null or practice_metric is not null) and (practice_task_url is null or practice_task_title is not null) and (practice_outcome is distinct from 'solved' or practice_task_title is not null))
 );
create index problem_performances_source_practice_idx on public.problem_performances(source_practice_id,user_id,attempted_at desc,id) where source_practice_id is not null;

-- Preserve the existing trusted-field boundary and extend ONLY the private-edit
-- allowlist. Identity, official linkage, normalization and provenance stay trusted.
create or replace function public.protect_practice_performance_fields() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user in ('postgres','supabase_admin','service_role') or public.is_admin() then
  if tg_op='DELETE' then return old;end if;return new;
 end if;
 if tg_op='INSERT' then
  if new.attempt_type<>'practice' or new.user_id is distinct from (select auth.uid()) or new.competition_result_id is not null or new.linked_competition_id is not null
   or new.status is distinct from 'valid'::public.problem_performance_status or new.normalized_performance is not null or new.source_provider is not null or new.source_external_id is not null or new.source_provenance is distinct from '{}'::jsonb
   or (new.created_by is not null and new.created_by is distinct from (select auth.uid())) or (new.updated_by is not null and new.updated_by is distinct from (select auth.uid())) then
   raise exception using errcode='42501',message='Members may only create untrusted self-reported practice attempts';
  end if;
  new.created_by:=(select auth.uid());new.updated_by:=(select auth.uid());new.created_at:=now();new.updated_at:=now();new.recorded_at:=now();return new;
 end if;
 if old.attempt_type<>'practice' or old.user_id is distinct from (select auth.uid()) or old.status<>'valid' or old.normalized_performance is not null or old.source_provider is not null or old.source_external_id is not null or old.source_provenance<>'{}'::jsonb then
  raise exception using errcode='42501',message='Only administrators may modify reviewed practice attempts';
 end if;
 if tg_op='DELETE' then return old;end if;
 if (to_jsonb(new)-array['raw_score','attempted_at','practice_notes','practice_metric','practice_direction','practice_outcome','practice_task_title','practice_task_url','updated_at','updated_by'])
  is distinct from (to_jsonb(old)-array['raw_score','attempted_at','practice_notes','practice_metric','practice_direction','practice_outcome','practice_task_title','practice_task_url','updated_at','updated_by'])
  or (new.updated_by is distinct from old.updated_by and new.updated_by is distinct from (select auth.uid())) then
  raise exception using errcode='42501',message='Members may only edit private score, time and practice notes';
 end if;
 new.updated_by:=(select auth.uid());new.updated_at:=now();return new;
end;$$;

create or replace function public.validate_private_practice_score() returns trigger language plpgsql set search_path='' as $$
declare task public.problems;bounds numeric[];
begin
 if new.attempt_type<>'practice' then return new;end if;
 if new.source_practice_id is not null then
  if not exists(select 1 from public.source_practice where id=new.source_practice_id and user_id=new.user_id) then
   raise exception using errcode='42501',message='Source practice is not owned by this user';end if;
  bounds:=public.practice_score_range(coalesce(new.practice_metric,''),'{}'::jsonb);
 else
  select * into task from public.problems where id=new.problem_id and published;
  if not found then raise exception using errcode='22023',message='Task must be published';end if;
  bounds:=public.practice_score_range(task.metric_name,task.source_provenance);
 end if;
 if new.raw_score in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) or new.raw_score<bounds[1] or new.raw_score>bounds[2] or new.attempted_at>now() then
  raise exception using errcode='22023',message='Score or time is outside task limits';end if;
 return new;
end;$$;
-- Metric edits must be revalidated too, not only score edits.
create trigger c_validate_source_practice_score before update of practice_metric on public.problem_performances for each row execute function public.validate_private_practice_score();

create function public.ensure_source_practice(p_catalog_id text,p_status text default null) returns uuid
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
 if (select auth.uid()) is null then raise exception using errcode='42501',message='Authentication required';end if;
 if p_status is not null and p_status not in ('practiced','finished') then raise exception using errcode='22023',message='Invalid source practice status';end if;
 insert into public.source_practice(user_id,catalog_id,status) values((select auth.uid()),p_catalog_id,p_status)
 on conflict(user_id,catalog_id) do update set status=case when p_status is null then source_practice.status else excluded.status end
 returning id into target;return target;
end;$$;
revoke execute on function public.ensure_source_practice(text,text) from public,anon;
grant execute on function public.ensure_source_practice(text,text) to authenticated;

create view public.own_source_practice with(security_invoker=true,security_barrier=true) as
select s.user_id,s.id,s.catalog_id,coalesce(s.status,case when a.id is not null then 'practiced' end) as status,
 a.raw_score as latest_score,a.practice_metric as metric,a.practice_direction as direction,a.attempted_at as last_practiced_at,
 greatest(s.updated_at,a.updated_at) as updated_at
from public.source_practice s left join lateral (
 select id,raw_score,practice_metric,practice_direction,attempted_at,updated_at from public.problem_performances
 where source_practice_id=s.id and user_id=(select auth.uid()) and attempt_type='practice' and status='valid'
 order by attempted_at desc,id asc limit 1
) a on true where s.user_id=(select auth.uid()) and (s.status is not null or a.id is not null);
revoke all on public.own_source_practice from public,anon,authenticated;
grant select on public.own_source_practice to authenticated;
comment on table public.source_practice is 'Owner-private self-reported collection status; catalog IDs are untrusted private references, resolved against the editorial allowlist by the application. Not public tasks.';
comment on column public.problem_performances.source_practice_id is 'Private external-source target; reuses attempt history, never official standings. Optional per-attempt task title/link is owner-private, never fetched by the server.';
