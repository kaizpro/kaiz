# KAIZ architecture

## Folder boundaries

- `app/`: App Router pages, metadata, route handlers and server actions.
- `components/ui/`: shadcn-style primitives. Product components live beside feature folders.
- `lib/data/`: database reads. UI does not query Supabase directly.
- `lib/validation/`: shared Zod schemas used at server mutation boundaries.
- `lib/supabase/`: cookie-aware browser/server clients and environment checks.
- `supabase/migrations/`: versioned PostgreSQL schema, indexes, triggers and RLS.

## Security boundaries

The publishable key (or legacy anon key) is safe for browser use because authorization is enforced by PostgreSQL RLS. The service-role key is server-only and reserved for future trusted synchronization and award/rating jobs; Milestone 1 does not require one. Admin routes call `requireAdmin()` server-side and their writes are independently checked by RLS through `is_admin()`.

Users may update only approved profile columns; SQL grants prevent changing `role`, `rating`, ranking counters, or completion counts even when an update passes the ownership policy. Ratings, achievements, activities and notifications are read-only to authenticated clients. Published competition result sets and entries are publicly readable; all result-set and result-entry writes require the admin database role and are also guarded by `requireAdmin()` in server actions.

Discussion reads are public. Authenticated post, reply, and vote actions derive identity from the cookie-backed session; client-supplied author IDs are never trusted. RLS restricts content edits to the owner, column grants exclude moderation fields, and the `(user_id, post_id)` vote uniqueness constraint prevents duplicate upvotes. Owner deletion and administrator moderation run through narrow security-definer functions. Moderation functions additionally require `is_admin()` and record the moderator and optional reason.

Public competition/profile reads, self-owned profile writes, protected anonymous writes and authenticated admin competition CRUD have been verified against the linked hosted Supabase project. A separate member account verified cross-user ownership boundaries and denial of competition, result, rating, achievement and protected external-account writes. The temporary competition, result set and four result rows were removed after verification, and their absence was checked by exact hosted IDs.

## Milestone 1 backend state

- `202609200001_initial_schema.sql` defines the normalized schema, indexes, triggers, grants, RLS policies and avatar bucket.
- `202609210001_milestone1_hardening.sql` hardens profile creation and limits public external-account columns.
- `202609210002_competition_results_foundation.sql` adds normalized result sets and result entries, audit fields, publication controls, indexes, triggers, grants and admin-only write policies.
- `202609220001_discussions_milestone.sql` hardens posts, one-level comments and upvotes with content constraints, ownership policies, narrow grants, tombstone/moderation functions, derived counts, and query-path indexes.
- All four migrations are applied remotely and the linked schema passes the Supabase database linter.
- Email confirmation is enabled. Password recovery uses the Supabase recovery email, exchanges the callback code for a cookie-backed session, and requires that session before accepting a new password. Recovery, password replacement, rejection of the old password and a fresh login with the new password were verified end to end.
- Admin competition mutations validate input with Zod, record `created_by`, and require both server authorization and database authorization.
- Manual result-set/result mutations validate input with Zod and require the same independent server and RLS admin boundaries. Provider-neutral contracts live in `lib/results/provider.ts`; no remote provider synchronization is implemented.
- No mock authentication, service-role browser key or application-side password storage is used.

## Discussion model

- `posts`: topic title/body, stable category, optional competition reference, score, reply count, edit timestamp, and deletion/moderation audit state.
- `comments`: one-level replies with author, body, edit timestamp, and deletion/moderation audit state. `parent_id` is constrained to `null` for this milestone.
- `votes`: upvote-only records. One active vote per user/post is enforced by the existing unique constraint; post score is refreshed by a database trigger.

The allowed categories are `general`, `ai-ml`, `olympiads`, `resources`, and `help`. A post may also reference a visible competition, allowing it to appear in both the global feed and the relevant competition page.

The global feed loads 10 posts per page. Latest ordering is `created_at desc, id desc`; Top ordering is `score desc, created_at desc, id desc`. Indexes support created-time and score ordering, author activity, competition-linked feeds, comment-author reads, and vote lookups. Reply counts and scores are trigger-maintained so list rendering does not count child rows repeatedly.

React renders discussion text without raw HTML. Server actions validate trimmed input with Zod and re-check authentication/authorization. Deletion uses content-erasing tombstones: author deletions retain `Post deleted by author` or `Reply deleted by author`, while moderator removals retain neutral moderator tombstones and audit fields. Other users' replies are never cascade-deleted by an owner action. Direct Data API hard deletes for posts/comments are not granted.

Hosted QA verified member/admin ownership, author-spoof rejection, anonymous boundaries, reply ownership, duplicate-vote prevention, vote toggling, competition linkage, deterministic filters/sorts/pagination, moderation auditing, empty states, and narrow mobile layouts. Temporary QA discussion rows and cascaded votes/replies were removed by exact IDs after verification.

## Milestones

1. Foundation, Supabase schema/RLS, auth, onboarding, profiles, homepage, competition directory/detail, admin competition CRUD.
2. Discussions: global and competition-linked topics, one-level replies, upvotes, owner tombstones, moderation, pagination, and profile/homepage integration. Complete. Bookmarks and nested replies remain future work.
3. Challenges, external provider adapters, Kaggle synchronization and the platform-wide leaderboard. The provider-neutral result contract and per-competition leaderboards are already established as a foundation.
4. Versioned rating service, achievements and activity feed.
5. Follows, friendships, teams and notifications. Messaging stays schema-only until separately scheduled.

Reports, bans, a dedicated moderator-role system, friends, direct messages, teams, and notifications are explicitly future work and are not implied by the current discussion tables or UI.
