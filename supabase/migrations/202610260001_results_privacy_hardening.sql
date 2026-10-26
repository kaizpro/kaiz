-- Reviewed release gate: apply only with separate production authorization.
-- Depends on results foundation + presentation (202609210002, 202610120001),
-- NOT on personal/external practice migrations. No stored data is rewritten.
begin;

-- RLS protects rows, not columns. Remove table AND pre-existing column grants;
-- PUBLIC/inherited table SELECT must not silently override this allowlist.
revoke select on public.competition_result_sets, public.competition_results from public, anon, authenticated;
do $$
declare t text; cols text;
begin
  foreach t in array array['competition_result_sets','competition_results'] loop
    select string_agg(quote_ident(attname), ', ') into cols
    from pg_attribute where attrelid=format('public.%I',t)::regclass and attnum>0 and not attisdropped;
    execute format('revoke select (%s) on public.%I from public, anon, authenticated',cols,t);
  end loop;
end;
$$;

grant select (id,competition_id,name,status,source,source_label,source_url,published,
  fetched_at,imported_at,verified_at,created_at,updated_at,presentation)
  on public.competition_result_sets to anon, authenticated;
grant select (id,competition_id,result_set_id,user_id,team_id,rank,score,score_display,
  verified,participant_type,participant_name,country_code,award,result_status,
  external_participant_id,created_at,updated_at,presentation)
  on public.competition_results to anon, authenticated;

-- Abort atomically if an unexpected inherited grant would defeat the restriction.
do $$
begin
  if exists (
    select 1 from (values ('anon'),('authenticated')) r(role_name)
    cross join (values ('competition_result_sets','created_by'),('competition_result_sets','updated_by'),
      ('competition_results','created_by'),('competition_results','updated_by'),
      ('competition_results','metadata'),('competition_results','external_reference')) c(table_name,column_name)
    where has_column_privilege(r.role_name,format('public.%I',c.table_name),c.column_name,'SELECT')
  ) then raise exception 'Inherited results audit SELECT privilege remains; inspect grants before release'; end if;
end;
$$;

-- Admins use the same authenticated database role as members. This narrowly
-- shaped READ-ONLY accessor is the sole elevated audit read, not a public view
-- or a composite table-row return. Never accept a caller-supplied actor/role.
create function public.get_competition_result_audits(p_competition_id uuid)
returns table(entity text,id uuid,created_by uuid,updated_by uuid,metadata jsonb,external_reference text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator required' using errcode='42501';
  end if;
  return query
    select 'set'::text,s.id,s.created_by,s.updated_by,null::jsonb,null::text
    from public.competition_result_sets s where s.competition_id=p_competition_id
    union all
    select 'row'::text,r.id,r.created_by,r.updated_by,r.metadata,r.external_reference
    from public.competition_results r where r.competition_id=p_competition_id;
end;
$$;
revoke all on function public.get_competition_result_audits(uuid) from public, anon, authenticated;
grant execute on function public.get_competition_result_audits(uuid) to authenticated;

-- No elevated publication privilege: caller's authenticated role/RLS applies,
-- plus an explicit admin check. All targets are validated/locked before UPDATE.
create function public.set_competition_results_publication(
  p_competition_id uuid,p_result_set_ids uuid[],p_published boolean)
returns table(id uuid,published boolean)
language plpgsql security invoker set search_path = '' as $$
declare target uuid; found_count integer:=0;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator required' using errcode='42501';
  end if;
  if p_competition_id is null or p_published is null or p_result_set_ids is null
    or coalesce(array_ndims(p_result_set_ids),0)<>1 or cardinality(p_result_set_ids) not between 1 and 50
    or array_position(p_result_set_ids,null) is not null
    or (select count(distinct x) from unnest(p_result_set_ids) x)<>cardinality(p_result_set_ids) then
    raise exception 'Provide 1-50 distinct result-set UUIDs and a publication boolean' using errcode='22023';
  end if;
  for target in select s.id from public.competition_result_sets s
    where s.competition_id=p_competition_id and s.id=any(p_result_set_ids) order by s.id for update
  loop found_count:=found_count+1; end loop;
  if found_count<>cardinality(p_result_set_ids) then
    raise exception 'Result set missing or outside selected competition' using errcode='P0002';
  end if;
  update public.competition_result_sets s set published=p_published
    where s.competition_id=p_competition_id and s.id=any(p_result_set_ids)
      and s.published is distinct from p_published;
  -- The existing updated_at trigger runs for changed sets only. Attribution,
  -- verified_at and ALL participant fields/rows are deliberately untouched.
  return query select s.id,s.published from public.competition_result_sets s
    where s.competition_id=p_competition_id and s.id=any(p_result_set_ids) order by s.id;
end;
$$;
revoke all on function public.set_competition_results_publication(uuid,uuid[],boolean) from public, anon, authenticated;
grant execute on function public.set_competition_results_publication(uuid,uuid[],boolean) to authenticated;

notify pgrst, 'reload schema';
commit;
