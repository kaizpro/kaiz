-- KAIZ Milestone 2: public discussions, one-level replies, upvotes and moderation.
-- Existing dormant posts/comments/votes tables are hardened in place so all
-- prior data is preserved. User and moderator deletion use content-erasing
-- tombstones; hard deletes are not granted through the Data API.

alter table public.posts
  alter column author_id drop not null,
  drop constraint posts_author_id_fkey,
  add constraint posts_author_id_fkey
    foreign key (author_id) references public.profiles(id) on delete set null,
  add column reply_count integer not null default 0 check (reply_count >= 0),
  add column edited_at timestamptz,
  add column deleted_at timestamptz,
  add column deletion_kind text check (deletion_kind in ('author', 'moderator')),
  add column removed_by uuid references public.profiles(id) on delete set null,
  add column removal_reason text check (removal_reason is null or char_length(removal_reason) <= 300),
  add constraint posts_title_length check (char_length(trim(title)) between 4 and 140),
  add constraint posts_body_length check (char_length(trim(body_markdown)) between 1 and 12000),
  add constraint posts_category_allowed check (category in ('general', 'ai-ml', 'olympiads', 'resources', 'help')),
  add constraint posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  add constraint posts_deletion_consistency check (
    (is_removed and deleted_at is not null and deletion_kind is not null)
    or (not is_removed and deleted_at is null and deletion_kind is null and removed_by is null and removal_reason is null)
  );

alter table public.comments
  alter column author_id drop not null,
  drop constraint comments_author_id_fkey,
  add constraint comments_author_id_fkey
    foreign key (author_id) references public.profiles(id) on delete set null,
  add column edited_at timestamptz,
  add column deleted_at timestamptz,
  add column deletion_kind text check (deletion_kind in ('author', 'moderator')),
  add column removed_by uuid references public.profiles(id) on delete set null,
  add column removal_reason text check (removal_reason is null or char_length(removal_reason) <= 300),
  add constraint comments_body_length check (char_length(trim(body_markdown)) between 1 and 6000),
  add constraint comments_one_level_only check (parent_id is null),
  add constraint comments_deletion_consistency check (
    (is_removed and deleted_at is not null and deletion_kind is not null)
    or (not is_removed and deleted_at is null and deletion_kind is null and removed_by is null and removal_reason is null)
  );

create index posts_created_idx on public.posts(created_at desc, id desc);
create index posts_score_created_idx on public.posts(score desc, created_at desc, id desc);
create index posts_author_created_idx on public.posts(author_id, created_at desc) where author_id is not null;
create index posts_competition_created_idx on public.posts(competition_id, created_at desc, id desc) where competition_id is not null;
create index comments_author_created_idx on public.comments(author_id, created_at desc) where author_id is not null;
create index votes_post_user_idx on public.votes(post_id, user_id) where post_id is not null;

create or replace function public.mark_post_edited()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.title, new.body_markdown, new.category, new.competition_id)
    is distinct from
    (old.title, old.body_markdown, old.category, old.competition_id)
  then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.mark_comment_edited()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body_markdown is distinct from old.body_markdown then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger mark_posts_edited
  before update on public.posts
  for each row execute function public.mark_post_edited();

create trigger mark_comments_edited
  before update on public.comments
  for each row execute function public.mark_comment_edited();

create or replace function public.refresh_discussion_post_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_post_id uuid;
begin
  target_post_id := coalesce(new.post_id, old.post_id);
  if target_post_id is not null then
    update public.posts
    set score = (
      select count(*)::integer
      from public.votes
      where post_id = target_post_id and value = 1
    )
    where id = target_post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger refresh_post_score_after_vote
  after insert or update or delete on public.votes
  for each row execute function public.refresh_discussion_post_score();

create or replace function public.refresh_discussion_reply_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_post_id uuid;
begin
  target_post_id := coalesce(new.post_id, old.post_id);
  update public.posts
  set reply_count = (
    select count(*)::integer
    from public.comments
    where post_id = target_post_id
  )
  where id = target_post_id;
  return coalesce(new, old);
end;
$$;

create trigger refresh_reply_count_after_comment
  after insert or delete on public.comments
  for each row execute function public.refresh_discussion_reply_count();

update public.posts as post
set
  score = (select count(*)::integer from public.votes where post_id = post.id and value = 1),
  reply_count = (select count(*)::integer from public.comments where post_id = post.id);

create or replace function public.delete_discussion_post(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_author uuid;
  target_removed boolean;
  admin_actor boolean;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select author_id, is_removed into target_author, target_removed from public.posts where id = target_post_id for update;
  if not found then raise exception 'Discussion not found' using errcode = 'P0002'; end if;
  if target_removed then return; end if;
  admin_actor := public.is_admin();
  if target_author is distinct from (select auth.uid()) and not admin_actor then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.posts set
    title = case when target_author = (select auth.uid()) then 'Post deleted by author' else 'Post removed by moderator' end,
    body_markdown = '[Content unavailable]',
    is_removed = true,
    deleted_at = now(),
    deletion_kind = case when target_author = (select auth.uid()) then 'author' else 'moderator' end,
    removed_by = case when target_author = (select auth.uid()) then null else (select auth.uid()) end,
    removal_reason = null
  where id = target_post_id;
end;
$$;

create or replace function public.moderate_discussion_post(target_post_id uuid, reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if reason is not null and char_length(trim(reason)) > 300 then raise exception 'Reason is too long'; end if;
  if not exists(select 1 from public.posts where id = target_post_id) then raise exception 'Discussion not found' using errcode = 'P0002'; end if;
  update public.posts set
    title = 'Post removed by moderator',
    body_markdown = '[Content unavailable]',
    is_removed = true,
    deleted_at = now(),
    deletion_kind = 'moderator',
    removed_by = (select auth.uid()),
    removal_reason = nullif(trim(reason), '')
  where id = target_post_id and not is_removed;
end;
$$;

create or replace function public.delete_discussion_reply(target_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_author uuid;
  target_removed boolean;
  admin_actor boolean;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select author_id, is_removed into target_author, target_removed from public.comments where id = target_comment_id for update;
  if not found then raise exception 'Reply not found' using errcode = 'P0002'; end if;
  if target_removed then return; end if;
  admin_actor := public.is_admin();
  if target_author is distinct from (select auth.uid()) and not admin_actor then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.comments set
    body_markdown = case when target_author = (select auth.uid()) then 'Reply deleted by author' else 'Reply removed by moderator' end,
    is_removed = true,
    deleted_at = now(),
    deletion_kind = case when target_author = (select auth.uid()) then 'author' else 'moderator' end,
    removed_by = case when target_author = (select auth.uid()) then null else (select auth.uid()) end,
    removal_reason = null
  where id = target_comment_id;
end;
$$;

create or replace function public.moderate_discussion_reply(target_comment_id uuid, reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if reason is not null and char_length(trim(reason)) > 300 then raise exception 'Reason is too long'; end if;
  if not exists(select 1 from public.comments where id = target_comment_id) then raise exception 'Reply not found' using errcode = 'P0002'; end if;
  update public.comments set
    body_markdown = 'Reply removed by moderator',
    is_removed = true,
    deleted_at = now(),
    deletion_kind = 'moderator',
    removed_by = (select auth.uid()),
    removal_reason = nullif(trim(reason), '')
  where id = target_comment_id and not is_removed;
end;
$$;

drop policy "posts public read" on public.posts;
drop policy "posts self insert" on public.posts;
drop policy "posts self update" on public.posts;
drop policy "posts self delete" on public.posts;
drop policy "comments public read" on public.comments;
drop policy "comments self insert" on public.comments;
drop policy "comments self update" on public.comments;
drop policy "comments self delete" on public.comments;
drop policy "votes self read" on public.votes;
drop policy "votes self insert" on public.votes;
drop policy "votes self update" on public.votes;
drop policy "votes self delete" on public.votes;

create policy "posts public read" on public.posts for select using (true);
create policy "posts member insert" on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()) and not is_removed);
create policy "posts owner content update" on public.posts for update to authenticated
  using (author_id = (select auth.uid()) and not is_removed)
  with check (author_id = (select auth.uid()) and not is_removed);

create policy "comments public read" on public.comments for select using (true);
create policy "comments member insert" on public.comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and parent_id is null
    and exists(select 1 from public.posts where id = post_id and not is_removed and not is_locked)
  );
create policy "comments owner content update" on public.comments for update to authenticated
  using (author_id = (select auth.uid()) and not is_removed)
  with check (author_id = (select auth.uid()) and not is_removed);

create policy "votes self read" on public.votes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "votes post upvote insert" on public.votes for insert to authenticated
  with check (
    user_id = (select auth.uid()) and post_id is not null and comment_id is null and value = 1
    and exists(select 1 from public.posts where id = post_id and not is_removed)
  );
create policy "votes self delete" on public.votes for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.posts, public.comments, public.votes from anon, authenticated;
grant select on table public.posts, public.comments to anon, authenticated;
grant insert(author_id, competition_id, title, slug, body_markdown, category) on public.posts to authenticated;
grant update(title, body_markdown, category, competition_id) on public.posts to authenticated;
grant insert(post_id, author_id, body_markdown) on public.comments to authenticated;
grant update(body_markdown) on public.comments to authenticated;
grant select on table public.votes to authenticated;
grant insert(user_id, post_id, value) on public.votes to authenticated;
grant delete on table public.votes to authenticated;

revoke execute on function public.delete_discussion_post(uuid) from public, anon;
revoke execute on function public.moderate_discussion_post(uuid, text) from public, anon;
revoke execute on function public.delete_discussion_reply(uuid) from public, anon;
revoke execute on function public.moderate_discussion_reply(uuid, text) from public, anon;
grant execute on function public.delete_discussion_post(uuid) to authenticated;
grant execute on function public.moderate_discussion_post(uuid, text) to authenticated;
grant execute on function public.delete_discussion_reply(uuid) to authenticated;
grant execute on function public.moderate_discussion_reply(uuid, text) to authenticated;

revoke execute on function public.mark_post_edited() from public, anon, authenticated;
revoke execute on function public.mark_comment_edited() from public, anon, authenticated;
revoke execute on function public.refresh_discussion_post_score() from public, anon, authenticated;
revoke execute on function public.refresh_discussion_reply_count() from public, anon, authenticated;
