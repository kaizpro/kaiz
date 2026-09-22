-- KAIZ initial schema. Apply through the Supabase CLI; never from application runtime.
create extension if not exists pgcrypto;

create type public.app_role as enum ('member','moderator','admin');
create type public.competition_status as enum ('upcoming','active','completed');
create type public.competition_format as enum ('online','offline','hybrid');
create type public.external_provider as enum ('kaggle','github');
create type public.friendship_status as enum ('pending','accepted','declined','blocked');
create type public.member_role as enum ('owner','member');
create type public.notification_type as enum ('friend_request','comment','reply','deadline','achievement','team_invitation','rating_update');

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 2 and 60),
  avatar_path text,
  bio text check (char_length(bio) <= 300),
  city text, school text, grade smallint check (grade between 5 and 13),
  graduation_year smallint check (graduation_year between 2020 and 2040),
  website text, rating integer not null default 1200 check (rating >= 0),
  country text not null default 'Kazakhstan', skills text[] not null default '{}',
  role public.app_role not null default 'member',
  competitions_completed integer not null default 0 check (competitions_completed >= 0),
  follower_count integer not null default 0 check (follower_count >= 0),
  kz_rank integer, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index profiles_rating_idx on public.profiles (rating desc);
create index profiles_location_idx on public.profiles (country, city);
create index profiles_school_idx on public.profiles (school) where school is not null;

create table public.external_accounts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  provider public.external_provider not null, external_username text not null,
  external_user_id text, metadata jsonb not null default '{}', verified_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, provider)
);
create index external_accounts_provider_username_idx on public.external_accounts(provider, external_username);

create table public.competitions (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  logo_path text, description text not null, organizer text not null, official_website text, registration_url text,
  start_date timestamptz not null, end_date timestamptz not null, registration_deadline timestamptz,
  city text, country text not null default 'Kazakhstan', format public.competition_format not null,
  eligibility text, tags text[] not null default '{}', category text not null,
  verified boolean not null default false, status public.competition_status not null default 'upcoming', participant_count integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(end_date >= start_date)
);
create index competitions_status_start_idx on public.competitions(status, start_date);
create index competitions_category_idx on public.competitions(category);
create index competitions_tags_idx on public.competitions using gin(tags);

create table public.competition_participants (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(), status text not null default 'registered',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(competition_id,user_id)
);
create index competition_participants_user_idx on public.competition_participants(user_id, joined_at desc);

create table public.competition_results (
  id uuid primary key default gen_random_uuid(), competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, rank integer check(rank > 0), score numeric,
  external_reference text, verified boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(competition_id,user_id)
);
create index competition_results_rank_idx on public.competition_results(competition_id, rank);

create table public.challenges (
  id uuid primary key default gen_random_uuid(), competition_id uuid references public.competitions(id) on delete set null,
  title text not null, slug text not null unique, description text not null, rules text, dataset_info text, evaluation_metric text,
  start_date timestamptz not null, end_date timestamptz not null, provider text, external_competition_id text, external_url text,
  status public.competition_status not null default 'upcoming', created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(end_date >= start_date)
);
create index challenges_status_idx on public.challenges(status,start_date);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  external_username text, joined_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key(challenge_id,user_id)
);

create table public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(), challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null, external_username text not null, rank integer not null check(rank > 0),
  score numeric, raw_data jsonb not null default '{}', synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(challenge_id,external_username)
);
create index leaderboard_entries_challenge_rank_idx on public.leaderboard_entries(challenge_id,rank);

create table public.rating_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  competition_id uuid references public.competitions(id) on delete set null, old_rating integer not null, new_rating integer not null,
  change integer generated always as (new_rating-old_rating) stored, algorithm_version text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index rating_history_user_created_idx on public.rating_history(user_id,created_at desc);

create table public.posts (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade,
  competition_id uuid references public.competitions(id) on delete cascade, challenge_id uuid references public.challenges(id) on delete cascade,
  title text not null, slug text not null unique, body_markdown text not null, category text not null, score integer not null default 0,
  is_locked boolean not null default false, is_removed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index posts_category_created_idx on public.posts(category,created_at desc);
create index posts_competition_idx on public.posts(competition_id) where competition_id is not null;

create table public.comments (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade, parent_id uuid references public.comments(id) on delete cascade,
  body_markdown text not null, score integer not null default 0, is_removed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index comments_post_created_idx on public.comments(post_id,created_at);

create table public.votes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade, value smallint not null check(value in(-1,1)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((post_id is not null)::int + (comment_id is not null)::int = 1), unique(user_id,post_id), unique(user_id,comment_id)
);
create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade, post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(user_id,post_id)
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(), requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade, status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(requester_id<>addressee_id), unique(requester_id,addressee_id)
);
create index friendships_addressee_status_idx on public.friendships(addressee_id,status);
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade, followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(follower_id<>followed_id), primary key(follower_id,followed_id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, description text, avatar_path text,
  owner_id uuid not null references public.profiles(id) on delete cascade, looking_for_members boolean not null default false,
  skills_wanted text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member', joined_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(team_id,user_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(), key text not null unique, name text not null, description text not null, icon text,
  criteria jsonb not null default '{}', points integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade, achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(), source_type text, source_id uuid, metadata jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(user_id,achievement_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null, subject_type text, subject_id uuid, summary text not null, metadata jsonb not null default '{}', public boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index activities_user_created_idx on public.activities(user_id,created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null, type public.notification_type not null, title text not null, body text,
  href text, read_at timestamptz, metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications(user_id,created_at desc) where read_at is null;

create table public.conversations (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(conversation_id,user_id)
);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),split_part(new.email,'@',1))); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
create function public.is_conversation_member(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.conversation_members where conversation_id=target and user_id=(select auth.uid()));
$$;

do $$ declare t text; begin
  foreach t in array array['profiles','external_accounts','competitions','competition_participants','competition_results','challenges','challenge_participants','leaderboard_entries','rating_history','posts','comments','votes','bookmarks','friendships','follows','teams','team_members','achievements','user_achievements','activities','notifications','conversations','conversation_members']
  loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;

create policy "profiles public read" on public.profiles for select using(true);
create policy "profiles self update" on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
revoke update on public.profiles from authenticated;
grant update(username,display_name,avatar_path,bio,city,school,grade,graduation_year,website,country,skills,updated_at) on public.profiles to authenticated;

create policy "external accounts public read" on public.external_accounts for select using(true);
create policy "external accounts self insert" on public.external_accounts for insert to authenticated with check(user_id=(select auth.uid()));
create policy "external accounts self update" on public.external_accounts for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "external accounts self delete" on public.external_accounts for delete to authenticated using(user_id=(select auth.uid()));

create policy "competitions public read" on public.competitions for select using(true);
create policy "competitions admin insert" on public.competitions for insert to authenticated with check(public.is_admin());
create policy "competitions admin update" on public.competitions for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "competitions admin delete" on public.competitions for delete to authenticated using(public.is_admin());

create policy "participants public read" on public.competition_participants for select using(true);
create policy "participants self join" on public.competition_participants for insert to authenticated with check(user_id=(select auth.uid()));
create policy "participants self leave" on public.competition_participants for delete to authenticated using(user_id=(select auth.uid()));
create policy "results public read" on public.competition_results for select using(verified or public.is_admin());
create policy "challenges public read" on public.challenges for select using(true);
create policy "challenge participants public read" on public.challenge_participants for select using(true);
create policy "challenge participants self join" on public.challenge_participants for insert to authenticated with check(user_id=(select auth.uid()));
create policy "challenge participants self leave" on public.challenge_participants for delete to authenticated using(user_id=(select auth.uid()));
create policy "leaderboards public read" on public.leaderboard_entries for select using(true);
create policy "ratings public read" on public.rating_history for select using(true);
create policy "achievements public read" on public.achievements for select using(true);
create policy "user achievements public read" on public.user_achievements for select using(true);
create policy "public activities read" on public.activities for select using(public or user_id=(select auth.uid()));

create policy "posts public read" on public.posts for select using(not is_removed or author_id=(select auth.uid()) or public.is_admin());
create policy "posts self insert" on public.posts for insert to authenticated with check(author_id=(select auth.uid()));
create policy "posts self update" on public.posts for update to authenticated using(author_id=(select auth.uid()) or public.is_admin()) with check(author_id=(select auth.uid()) or public.is_admin());
create policy "posts self delete" on public.posts for delete to authenticated using(author_id=(select auth.uid()) or public.is_admin());
revoke update on public.posts from authenticated;
grant update(title,body_markdown,category,updated_at) on public.posts to authenticated;
create policy "comments public read" on public.comments for select using(not is_removed or author_id=(select auth.uid()) or public.is_admin());
create policy "comments self insert" on public.comments for insert to authenticated with check(author_id=(select auth.uid()));
create policy "comments self update" on public.comments for update to authenticated using(author_id=(select auth.uid()) or public.is_admin()) with check(author_id=(select auth.uid()) or public.is_admin());
create policy "comments self delete" on public.comments for delete to authenticated using(author_id=(select auth.uid()) or public.is_admin());
revoke update on public.comments from authenticated;
grant update(body_markdown,updated_at) on public.comments to authenticated;
create policy "votes self read" on public.votes for select to authenticated using(user_id=(select auth.uid()));
create policy "votes self insert" on public.votes for insert to authenticated with check(user_id=(select auth.uid()));
create policy "votes self update" on public.votes for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "votes self delete" on public.votes for delete to authenticated using(user_id=(select auth.uid()));
create policy "bookmarks self manage" on public.bookmarks for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create policy "follows public read" on public.follows for select using(true);
create policy "follows self manage" on public.follows for all to authenticated using(follower_id=(select auth.uid())) with check(follower_id=(select auth.uid()));
create policy "friendships members read" on public.friendships for select to authenticated using(requester_id=(select auth.uid()) or addressee_id=(select auth.uid()));
create policy "friendships request" on public.friendships for insert to authenticated with check(requester_id=(select auth.uid()));
create policy "friendships addressee responds" on public.friendships for update to authenticated using(addressee_id=(select auth.uid())) with check(addressee_id=(select auth.uid()) and status in('accepted','declined','blocked'));
create policy "friendships requester blocks" on public.friendships for update to authenticated using(requester_id=(select auth.uid())) with check(requester_id=(select auth.uid()) and status='blocked');
create policy "friendships members delete" on public.friendships for delete to authenticated using(requester_id=(select auth.uid()) or addressee_id=(select auth.uid()));
create policy "teams public read" on public.teams for select using(true);
create policy "teams owner manage" on public.teams for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "team members public read" on public.team_members for select using(true);

create policy "notifications self read" on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy "notifications self update" on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "conversation members read" on public.conversations for select to authenticated using(public.is_conversation_member(id));
create policy "conversation membership read" on public.conversation_members for select to authenticated using(public.is_conversation_member(conversation_id));

-- Apply updated_at consistently.
do $$ declare t text; begin
  foreach t in array array['profiles','external_accounts','competitions','competition_participants','competition_results','challenges','challenge_participants','leaderboard_entries','rating_history','posts','comments','votes','bookmarks','friendships','follows','teams','team_members','achievements','user_achievements','activities','notifications','conversations','conversation_members']
  loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t); end loop;
end $$;

-- Avatar storage is public-read, owner-write by first path segment: avatars/<user-id>/file.ext.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "avatars public read" on storage.objects for select using(bucket_id='avatars');
create policy "avatars owner insert" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "avatars owner update" on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "avatars owner delete" on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Only backend jobs/service role may write ratings, verified results, achievements, activities, and notifications.
revoke insert,update,delete on public.rating_history, public.competition_results, public.leaderboard_entries, public.user_achievements, public.activities, public.notifications from authenticated;
