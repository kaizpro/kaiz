# Release A — course roadmaps and private learning progress

Issue #31, based on merged #30 / main `5fc4f42`. No Learning Tree replacement,
new fabricated course content, external-click completion or competitive rating.

## Curriculum and data

`lib/learning/course.ts` derives 12 numbered modules and 40 ordered lessons from
the existing three journeys and canonical topics. Module keys are explicit and
stable, not hashes of names or ordinal positions. Lesson keys combine module and
topic IDs. Repeated study of a topic in different roadmap/module contexts is a
distinct lesson; XP means **10 per completed roadmap lesson**, not unique topics
across the entire Learning Tree. Original beginner spreadsheet materials remain.

The additive migration `202610150001_learning_progress.sql` installs:

- Public read-only `learning_lesson_keys`, seeded with the actual 40 identities.
- Owner-only `learning_progress`, keyed by user/roadmap/lesson, with an Auth FK
  and registry FK. No authenticated admin exception, counter, rating or XP field.
- A security-invoker completion RPC deriving the current user. A trigger derives
  timestamps, preserves idempotent completion time and validates active keys.
  Clients cannot rewrite identities/timestamps or add registry entries.

Counts, percentages, module completion and Learning XP are calculated from saved
records intersected with the **current** curriculum. Undo removes the lesson's
contribution. Retired/unrecognized records remain historical, never inflate the
current denominator or XP. Rename display titles freely; never recycle IDs.
Curriculum membership changes need a new reviewed additive registry migration;
retire obsolete keys rather than deleting referenced rows. Registry reconciliation
is part of the SQL test. `started_at` means first explicit completion interaction,
not a resource view; no page renders write data.

## Application boundaries

- `/roadmaps/[level]` and compatible `/start/[level]`: compact collapsible modules,
  numbered lessons, server-loaded summaries, explicit complete/undo controls.
- `/roadmaps/[level]/lessons/[lesson]`: existing topic materials, original module
  objectives/self-check, canonical Learning Tree link and explicit completion.
- `/dashboard`: authenticated owner's progress, most recently saved roadmap,
  Continue Learning, total Learning XP and existing private practice history.
- The existing header has a small signed-in My learning link. Main navigation,
  Learn-last order, profiles, OAuth and Auth security logic stay unchanged.

Guest browsing has no fictional progress bar/XP and explains cross-device saving.
Database failures show unknown/unavailable state, not a successful save or an
empty account. No optimistic completion or local-only account mirror is used.
DAL reads are user-scoped and not globally cached. Private results are not added
to public profiles, public leaderboards, source collections or marketing pages.
Existing practice uses `problem_performances`, not a second attempt model.

## Verification and limits

Run `npm ci`, typecheck, lint, `node --test tests/*.test.mjs`, build and diff check.
The existing CI learning step includes `learning-progress.test.mjs`.

Native database test:

```powershell
$env:KAIZ_EMBEDDED_POSTGRES_MODULE = '<installed embedded-postgres entry point>'
node tests/learning-progress.postgres.mjs
```

It starts a fresh disposable loopback PostgreSQL instance with a random in-memory
test password; never reads `.env` or accepts a hosted URL. Applies repository
migrations to minimal Auth/Storage schema dependencies, reconciles all lesson
keys, runs archive/external-account/progress permission assertions and checks
committed persistence through a second connection, concurrent retry idempotency
and cross-session undo. The assertion shim is not
pgTAP and does not emulate GoTrue, PostgREST or Storage services.

`tests/learning-progress.browser.mjs` tests actual localhost guest routes at
375/1440px, both themes, 100/200% root text size, keyboard disclosures, 40 lesson
routes, unknown lessons and the dashboard login gate. Backend values are empty
only in QA process environment. The existing compact 240-view browser suite is
retained. Authenticated component state is unit-tested; **a real Supabase
login/completion/refresh/logout-login/cross-device browser flow is a separate
pre-release gate**, not claimed by local SQL/component tests.

Interruption recovery verification (2026-10-15): all 40 actual lesson routes
passed after fixing single decoding of encoded stable lesson IDs. Roadmap →
lesson → refresh → roadmap navigation passed in both themes at mobile/desktop
sizes and 100/200% root text. Native PostgreSQL 17.7 passed 123 SQL assertions
(archive 45, external-account security 53, progress 25), all 8 branch migrations,
40-key registry reconciliation and the multi-connection persistence/retry/undo
checks. Authenticated component/action/DAL tests cover real-state calculations,
checkmarks, errors, identity validation and owner-scoped private practice reads;
these fixtures do not constitute authenticated browser persistence verification.
Clean install, TypeScript, ESLint, 185 regression tests and optimized build
passed. Existing browser regressions passed 240 compact route/layout views and
85 Learning Tree routes. Dependency files are unchanged: the production-only
audit found zero vulnerabilities, while the full tree retained five existing
high development-tooling advisories (the ESLint/fast-glob/micromatch/braces chain).
Do not interpret an unchanged development advisory as a newly introduced feature
regression or apply a breaking automatic dependency upgrade in this task.
The original pathfinder smoke suite additionally passed at 375/768/1024/1440px
in both themes using a separate local server with existing public competition
and profile records via anonymous reads. It requires that public data (unlike
backend-disabled layout QA); requests are restricted to GET/HEAD, with no login,
submissions, fixture inserts or production mutations.

## Controlled deployment

No hosted migration, data write, merge, deployment or content import is part of
implementation. The pending competition-presentation migration in PR #24 is not
an application/schema dependency of A. Never run a generic push that silently
includes unrelated pending migrations. Tima must inspect actual hosted history,
review the exact single-file migration/dry run and approve its controlled apply
before merging code into automatic production deployment. Old app remains
compatible with the additive schema.

First verify on an isolated Supabase project: registry/RPC grants, anonymous and
other-user/admin denial, real saved completion/undo, new sessions/devices, 10-XP
idempotency, schema cache and private dashboard. Then follow normal owner release
approval and production read-back. Source publication and PR #24 stay separate.

Rollback: revert application PR; retain additive tables and saved progress. Do
not drop user progress during a UI rollback. Release B notebook infrastructure
is separate and must never delay or add Storage prerequisites to A.
