# KAIZ

Production-oriented foundation for Kazakhstan's competitive AI/ML community, built with Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn-style primitives and Supabase.

## Current implementation status

Milestone 1, the competition-results foundation, and Milestone 2 discussions are functionally complete and have been verified against a linked hosted Supabase project. The implemented scope includes:

- email/password registration, email confirmation, login, logout and an end-to-end verified password recovery flow;
- profile onboarding, unique usernames, persistent profile editing and public `/u/[username]` pages;
- a PostgreSQL-backed competition directory with status, category and format filters, detail pages, loading, empty, error and not-found states;
- clearly separated competition format and location presentation across homepage, directory and detail views;
- normalized competition result sets and entries with public competition leaderboards and an admin-managed manual results workflow;
- global and competition-linked discussions with one-level replies, upvote-only voting, ownership controls, moderation, tombstones, deterministic pagination, and profile/homepage integration;
- server-authorized admin routes and competition create, read, update and delete workflows;
- responsive light/dark application shell, homepage and Milestone 1 public routes;
- PostgreSQL schema, indexes, triggers, grants, storage bucket and Row Level Security policies.

The hosted admin CRUD workflow was verified with one explicitly temporary QA competition. Its create, public read, filtered read, update and delete operations were confirmed against the hosted database, including creator attribution and an optional null registration deadline. A published official QA result set was also exercised with individual, team, tied, profile-linked and nullable/unranked result cases. Result-set and entry create/read/update/delete behavior, public rendering and RLS were verified. The temporary competition was then deleted and the database cascade was checked by exact IDs; no QA competition, result-set or result rows remain.

The platform-wide leaderboard, challenge, rating, achievement, friend, direct-message, team and notification schemas or placeholders do not imply that those later product milestones are implemented; only per-competition result leaderboards and the discussion community are part of the current foundation. Reports, bans, and a separate moderator-role system are also future work.

## Local setup

1. Create a hosted Supabase project.
2. In **Project Settings → API**, copy the Project URL and publishable key into a local `.env.local` based on `.env.example`. A legacy anon key also works. Do not use a secret or service-role key.
3. In **Authentication → URL Configuration**, set the local Site URL to `http://localhost:3000` and add `http://localhost:3000/**` to Redirect URLs.
4. In **Authentication → Providers → Email**, enable Email and Confirm email. Keep anonymous sign-ins disabled and set the minimum password length to at least 8.
5. Authenticate and link the project without sharing credentials:

   ```powershell
   .\scripts\supabase.ps1 login
   .\scripts\supabase.ps1 link --project-ref <project-ref>
   .\scripts\supabase.ps1 db push --dry-run
   .\scripts\supabase.ps1 db push
   ```

6. Install dependencies with `npm install`, then run `npm run dev`.
7. After registering and verifying the intended administrator, promote that profile from the Supabase SQL Editor using its auth user UUID:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = '<auth-user-uuid>';
   ```

The ordered migrations are:

- `supabase/migrations/202609200001_initial_schema.sql`
- `supabase/migrations/202609210001_milestone1_hardening.sql`
- `supabase/migrations/202609210002_competition_results_foundation.sql`
- `supabase/migrations/202609220001_discussions_milestone.sql`

All four migrations have been applied to the linked hosted project. Local and remote migration history match, and `supabase db lint --linked` reports no schema errors.

## Verified security boundaries

- Admin pages use the server-side `requireAdmin()` guard; competition mutations are also protected independently by RLS through `is_admin()`.
- Anonymous competition reads succeed, while anonymous competition inserts are rejected.
- Users can update only their own approved profile columns. Column grants exclude role, rating, ranking and competition counters.
- Authenticated clients cannot directly write rating history, verified results, leaderboard entries, achievements, activities or notifications.
- Published competition result sets and their entries are publicly readable. Result-set and result-entry inserts, updates and deletes require both an authenticated database role and the admin-only RLS predicate; the server actions independently call `requireAdmin()`.
- Discussion posts and replies are publicly readable. Authenticated writes derive the author from the session, ownership is enforced by RLS and column grants, votes are self-owned upvotes with a database uniqueness constraint, and moderation is available only through audited admin RPCs.
- External account provider metadata is not exposed through the public Data API.
- The public `avatars` bucket enforces owner-scoped writes under `avatars/<user-id>/...`.
- Redirect targets are restricted to local application paths, and profile/competition links accept only HTTP or HTTPS URLs.

Self-owned profile behavior and admin CRUD were exercised with the hosted backend. A separate authenticated member account was used for a cross-user RLS regression pass: own-profile updates succeeded, while another profile, protected profile columns, competitions, result sets, results, ratings, achievements and protected external-account metadata remained non-writable. The member was also denied access to `/admin`.

## Discussion architecture

Milestone 2 hardens the existing normalized `posts`, `comments`, and `votes` tables rather than introducing duplicate discussion entities:

- `posts` stores global or competition-linked topics. Categories are the stable values `general`, `ai-ml`, `olympiads`, `resources`, and `help`; `competition_id` is optional.
- `comments` stores one-level replies only. Nested reply trees are intentionally outside this milestone.
- `votes` stores upvotes. A unique database constraint prevents more than one active vote by the same user on the same post, and a trigger derives each post's score from stored votes.
- A trigger maintains `reply_count`, avoiding per-row count queries in the feed. Feed reads fetch author and optional competition metadata in bounded queries rather than issuing one query per card.

`/discussions` supports category filters, `Latest` and `Top` sorts, and page-number pagination at 10 posts per page. Latest ordering uses `created_at desc, id desc`; Top uses `score desc, created_at desc, id desc`, so both remain deterministic. Competition detail pages show recent linked posts, public profiles show recent authored posts, and the homepage shows recent community threads.

Posts and replies render as plain text through React, with trimmed Zod-validated length limits and no raw HTML execution. Owners may edit only their own active content. Owner deletion and administrator moderation erase the original title/body and retain a tombstone row so reply history does not break. Moderator removals record the acting profile and an optional reason. Direct hard deletes are not granted through the Data API.

The hosted QA pass covered admin/member post creation, owner edits, author-spoof rejection, cross-owner denial, anonymous read/write boundaries, reply create/edit/delete, cross-owner reply protection, vote uniqueness and toggle removal, competition linkage, filters, deterministic sorting/pagination, moderation audit fields, and narrow mobile layouts. All temporary discussion posts, replies, and votes were removed afterward by exact IDs; the five genuine competition records remain unchanged.

## Competition results architecture

Competition standings are not stored on `competitions`. The reusable model has two layers:

- `competition_result_sets` describes one publication of standings for a competition: official or provisional status, provider/source, publication state, optional source label/URL and import/fetch/verification timestamps.
- `competition_results` stores entries belonging to a result set. Entries support individuals or teams, optional KAIZ profile association, external participants, nullable scores and display scores, country codes, awards, ties, and ranked, unranked or disqualified states.

Public competition pages read only published result sets. An official set is labeled **Official results**; a provisional set is labeled **Live / provisional** and is never presented as live merely because rows exist. Competitions without a published set show an explicit no-results state and never fabricate standings.

Administrators manage results from `/admin/competitions/[id]/results`. The intended workflow is:

1. Create a draft result set and identify its source.
2. Add or edit individual/team result rows; a KAIZ username is optional.
3. Review the standings and source metadata.
4. Publish the set when it is ready for public display.

`lib/results/provider.ts` defines the provider-neutral result snapshot and entry contract. Manual entry is implemented now. `official_import`, `kaiz`, and `kaggle` are source identifiers the model can represent, but no remote synchronization is implemented. A future Kaggle adapter can implement `CompetitionResultProvider` without changing the core tables or leaderboard UI. Kaggle credentials, authentication, scraping, polling and synchronization remain future work.

## Optional integrations

- Google OAuth is supported by the authentication code but requires Google and Supabase provider configuration.
- The avatar storage bucket and policies are ready; an avatar upload UI is not implemented yet.
- Five genuine competition listings are currently maintained through the authenticated admin workflow.
- The NEOAI 2026 listing uses `Central University` and `Russia` from the available official material, but this remains a documented data-quality limitation: participation was internationally distributed, the material does not establish one canonical host/organizer as cleanly as the other listings, and no city is asserted.

## Future milestones

Friends, direct messages, teams, notifications, reports, bans, and a dedicated moderator-role system are not implemented. Challenge/provider synchronization, Kaggle integration, the platform-wide leaderboard, rating changes, and achievement expansion also remain future milestones.

## Required before public beta

- Configure production Site URL, allowed redirects, environment variables and authentication email templates.
- Repeat the verified password-recovery test after production-domain and production-email configuration is complete.
- Review backups, monitoring, abuse controls, rate limits and production email deliverability.
- Decide which verified accounts should retain the `admin` role.

The final quality gates pass against the linked hosted project: `supabase db lint --linked`, `npm run typecheck`, `npm run lint` and `npm run build`.

Google login is optional for the initial email/password verification pass. To enable it, create a Google Web OAuth client, add the Supabase callback URL shown on the Supabase Google provider page to Google Authorized redirect URIs, add `http://localhost:3000` as an Authorized JavaScript origin, then enter the Google client ID and secret in **Authentication → Providers → Google**. Do not put the Google client secret in `.env.local`.

Never expose a Supabase secret/service-role key to browser code or variables prefixed with `NEXT_PUBLIC_`. Milestone 1 does not require one.
