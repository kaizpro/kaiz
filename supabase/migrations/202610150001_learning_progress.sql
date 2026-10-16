-- Release A only. Additive, independent of competition presentation / Storage.
-- Snapshot of real roadmap lesson identities; tests reconcile it with course.ts.
create table public.learning_lesson_keys (
  roadmap_id text not null check (roadmap_id in ('beginner','intermediate','advanced')),
  lesson_id text not null check (char_length(lesson_id) between 3 and 160),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (roadmap_id, lesson_id)
);
insert into public.learning_lesson_keys(roadmap_id,lesson_id)
select roadmap_id, module_id || ':' || topic from (values
 ('beginner','python-algebra',array['python-fundamentals','python-control-flow','python-functions','python-collections','algebra']),
 ('beginner','arrays-dataframes',array['numpy','pandas','math-functions']),
 ('beginner','first-baseline',array['ml-fundamentals','supervised-learning','building-baselines','model-evaluation']),
 ('beginner','training-direction',array['neural-networks','backpropagation','pytorch']),
 ('intermediate','numerical-data',array['numpy','pandas','descriptive-statistics']),
 ('intermediate','prepare-data',array['data-processing','data-cleaning','exploratory-analysis','feature-engineering']),
 ('intermediate','classical-model',array['regression','classification','building-baselines','model-evaluation']),
 ('intermediate','validation',array['cross-validation','data-leakage','validation-strategies']),
 ('advanced','evaluation',array['validation-strategies','data-leakage','model-evaluation']),
 ('advanced','representation',array['neural-networks','pytorch','training-regularization']),
 ('advanced','experiments',array['experiment-tracking','hyperparameter-tuning','ensemble-methods']),
 ('advanced','upsolving',array['building-baselines','model-evaluation'])
) as modules(roadmap_id,module_id,topics) cross join lateral unnest(topics) as topic;

create table public.learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id text not null,
  lesson_id text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,roadmap_id,lesson_id),
  foreign key(roadmap_id,lesson_id) references public.learning_lesson_keys(roadmap_id,lesson_id) on delete restrict
);
create index learning_progress_lesson_idx on public.learning_progress(roadmap_id,lesson_id);
create index learning_progress_recent_idx on public.learning_progress(user_id,updated_at desc);
alter table public.learning_lesson_keys enable row level security;
alter table public.learning_progress enable row level security;
create policy "learning lesson registry read" on public.learning_lesson_keys for select to anon, authenticated using (true);
create policy "learning progress owner read" on public.learning_progress for select to authenticated using (user_id = (select auth.uid()));
create policy "learning progress owner insert" on public.learning_progress for insert to authenticated with check (user_id = (select auth.uid()));
create policy "learning progress owner update" on public.learning_progress for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.learning_lesson_keys, public.learning_progress from public, anon, authenticated;
grant select on public.learning_lesson_keys to anon, authenticated;
grant select on public.learning_progress to authenticated;
grant insert(user_id,roadmap_id,lesson_id,completed_at) on public.learning_progress to authenticated;
grant update(completed_at) on public.learning_progress to authenticated;

create function public.guard_learning_progress() returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists(select 1 from public.learning_lesson_keys where roadmap_id = new.roadmap_id and lesson_id = new.lesson_id and active) then
    raise exception using errcode = '22023', message = 'Lesson is not active in this roadmap';
  end if;
  if tg_op = 'UPDATE' then
    if (new.user_id,new.roadmap_id,new.lesson_id) is distinct from (old.user_id,old.roadmap_id,old.lesson_id) then
      raise exception using errcode = '42501', message = 'Learning progress identity is immutable';
    end if;
    new.started_at := old.started_at; new.created_at := old.created_at;
    new.completed_at := case when new.completed_at is null then null else coalesce(old.completed_at,now()) end;
    new.updated_at := case when (new.completed_at is null) = (old.completed_at is null) then old.updated_at else now() end;
  else
    new.started_at := now(); new.created_at := now(); new.updated_at := now();
    new.completed_at := case when new.completed_at is null then null else now() end;
  end if;
  return new;
end;
$$;
create trigger guard_learning_progress before insert or update on public.learning_progress for each row execute function public.guard_learning_progress();
revoke execute on function public.guard_learning_progress() from public,anon,authenticated;

create function public.set_learning_completion(p_roadmap_id text,p_lesson_id text,p_completed boolean)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if p_completed is null then raise exception using errcode = '22023', message = 'Completion must be true or false'; end if;
  insert into public.learning_progress(user_id,roadmap_id,lesson_id,completed_at)
  values ((select auth.uid()),p_roadmap_id,p_lesson_id,case when p_completed then now() else null end)
  on conflict(user_id,roadmap_id,lesson_id) do update set completed_at = excluded.completed_at;
end;
$$;
revoke execute on function public.set_learning_completion(text,text,boolean) from public,anon;
grant execute on function public.set_learning_completion(text,text,boolean) to authenticated;
comment on table public.learning_progress is 'Private explicit self-completion only. XP is derived, not an official rating. Admin JWTs have no cross-owner exception.';
comment on column public.learning_progress.started_at is 'First explicit completion/undo interaction, never an implicit resource click or page view.';
