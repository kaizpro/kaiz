# Solve-first private practice (Issue #40)

## Release boundary

Branch `codex/40-external-practice` extends the merged #37/#39 implementation.
All 31 editorial source entries retain internal pages, including held/unavailable
links. Accessible originals get SOLVE; inaccessible originals get Record practice.
Access/legal/provenance notes remain in a collapsed Source details disclosure.

No source is inserted as a fake public problem. `source_practice` stores only an
owner's manual practiced/finished status and a stable editorial reference. Attempt
history stays in `problem_performances`: optional numeric score, original metric,
explicit/unspecified direction, notes, date, and optional private child-task title
and HTTPS link. Solved applies only to a named child task, not the collection.
These records do not grant Learning XP, medals, competitive ratings or verification.
Standalone uncatalogued tasks can be recorded privately under a catalogued parent;
an independent public task-creation feature is intentionally not introduced.

Archive rows and My Learning read real owner-scoped summaries. Errors retain an
unavailable/unknown state, not fabricated zero progress. Manual status undo keeps
history; clearing status and deleting all attempts returns a source to Not started.

## Database and security

New additive migration: `202610170001_external_source_practice.sql`.
It requires `202610160001_personal_problem_progress.sql` first. It does not depend
on `202610120001_competition_presentation.sql`. Existing migrations are unchanged.
The two alternative attempt targets are enforced by checks and a composite
owner/target foreign key. Official linkage, normalization, provenance, identity and
review status remain protected. The existing restrictive owner policy also applies
to signed-in admins. Operational service/database roles remain privileged.

URLs are validated, rendered as escaped React text/attributes, and never fetched
by the server. Known fractional/percentage/error/points metrics have explicit
numeric bounds; unknown metrics have no invented maximum or direction. Notes and
task links are private, not official statements. Database catalog IDs are private,
untrusted references; app actions require the real editorial allowlist.

## Verification

- 202 regression tests; TypeScript, ESLint and production build passed locally.
- Disposable PostgreSQL 17.7: 271 assertions, including 52 external-source checks
  and all 48 existing private-practice assertions repeated after the extension.
- Real isolated Supabase project: `KAIZ Release A QA`, never production.
- Real Auth browser tests: create/edit/delete, validation retaining form values,
  refresh/logout/new-session persistence, archive and dashboard synchronization,
  member/admin cross-owner denial, guest denial, 375px/200% text in both themes.
- Existing individual-practice browser suite passed after the source-page update.
- Existing real learning suite passed: completion, XP/undo/idempotency, dashboard,
  refresh/logout/new-session persistence, cross-user and guest RLS boundaries.
- All disposable accounts/tasks are cleaned up by the test suites.

The SQL runner is opt-in with a disposable local PostgreSQL runtime. Hosted browser
tests require separately injected QA-only credentials; they never load `.env` and
assert the exact approved isolated project and local application origin.

## Production gate

At the 2026-10-17 read-only check production still had eight migrations, including
learning progress but not personal problem progress or competition presentation.
Production had five competitions, zero result sets and zero published problems.
Merging #37/#39 did not apply their database dependency.

Before this code is released, obtain separate owner authorization for migration 16
then 17 using frozen single-purpose release directories and a reviewed dry run.
Do not run a generic repository-wide migration push. Presentation 12 is a separate
PR #24 release decision. This work applied only 12 and 17 to the isolated QA project;
no production migration, merge, deployment, content import or publication occurred.
