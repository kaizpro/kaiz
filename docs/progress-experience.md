# Consistent learning progress and light-first theme

Issue #34, follow-up to merged PR #33. No production changes are authorized by
this implementation or its QA. Practice status/score work is tracked separately
in Issue #35; notebook storage remains deferred.

## Production diagnosis — 2026-10-16

Read-only inspection found Production successfully deployed at main
`94987d72af76e452a35ee3175b73966cb16e3472`, but the database has seven migrations
through `202610070001_external_account_security.sql`. The learning progress
table, lesson registry and completion RPC are absent. PostgREST returns
`PGRST205`. This is **missing schema, not zero saved progress**. Five genuine
competitions remain present. Production progress is BLOCKED until the separately
approved learning migration is applied. No production Auth/session failure is
inferred from this schema evidence; private deployment logs were not retrieved.

## One progress model

Directory, detail, module, lesson and My Learning use `courseProgress` over the
authenticated owner's server-loaded `learning_progress`. Totals derive from the
current curriculum, not illustrative numbers. Completed roadmap-context lessons
earn 10 XP once; the same topic in another module is a distinct curriculum lesson,
not another unique topic. Duplicate records/replays never multiply XP. Undo
reduces count/XP. Active roadmaps have some but not all lessons completed.

Start means no saved completed lessons, Continue opens the first incomplete
lesson, and Review opens the completed roadmap. Viewing a page never writes a
started/completed record. Module disclosures remain keyboard-native. Lesson
completion is placed before materials, with a checkmark/undo and next lesson.
Updates wait for server confirmation; there is no optimistic counter requiring
rollback. Uncertain writes tell the student to reload before retrying. A successful
mutation invalidates both roadmap aliases, directory, lesson and dashboard.
Other devices see the committed state on their next read/refresh, not live push.

Guests see curriculum sizes and a sign-in explanation, never fictional saved
percentages. Successful authenticated empty reads show Start/0. Failures hide all
completion counters/bars/XP and show one retry per page. Diagnostic logs allowlist
provider codes and operation only, not raw provider text, IDs, URLs or sessions.

## Theme

The existing next-themes provider now defaults to light. Its pre-hydration script
and light root CSS prevent a dark first-visit flash, even with a dark OS. Saved
explicit dark/light (and existing system preference) remain respected. No forced
theme, preference-reset script, new dependency or global style rewrite.

## Verification

Unit/regression: `node --test tests/*.test.mjs`; CI registers the additional
`progress-experience.test.mjs`. Existing native PostgreSQL and managed QA suites
remain distinct. Real managed-service test uses only the approved isolated Free
QA project and localhost:3106, disposable synthetic users/tasks, real login forms
and Supabase sessions. It checks directory/detail/dashboard consistency, next
lesson, completed Review, refresh/logout/login/new browser session, replay and
undo, cross-user/guest RLS, mobile 200% text and first-visit/saved theme.

Optional `KAIZ_QA_READ_FAULT_HELPER` points to a trusted local operator helper
accepting DenyRead/RestoreRead. In the approved isolated project only, revoke the
existing authenticated SELECT on learning_progress, verify one unavailable state
with no fake zero, then restore exactly that SELECT in a finally block and test
Retry. Never point this helper or the suite at production. The repository does
not include operator credentials. This fault-injection check is additional to
real persistence checks, not a replacement. No simulated authentication is used.

## Controlled release — owner approval REQUIRED

1. Confirm production identity, current history, migration hash, backup/recovery
   evidence and exact one-file dry run. Archive integrity does not demonstrate
   full recovery. Present remaining recovery risk to the release owner.
2. Separately approve ONLY `202610150001_learning_progress.sql`. Use an isolated
   frozen migration workdir with the existing applied seven files plus this one;
   explicitly exclude `202610120001_competition_presentation.sql`. Verify the
   pending list is exactly the learning file before execution. Never use a
   generic root migration push or rename existing versions. The current CLI
   production link is not used by QA.
3. After authorized application, verify exact history, 40 registry keys, table,
   invoker RPC, owner-only RLS, column/function grants, preserved Auth/profile/
   competition counts and authenticated completion/undo. Stop on any failure;
   inspect committed state rather than retry blindly.
4. Teammate review and owner merge of the progress UX PR, then deployment QA.
   The already-deployed PR #33 needs the same schema prerequisite now; this UI
   PR alone cannot repair a missing production table. No new P0 migration.
5. Practice tracking's separately reviewed additive migration and code release
   follow independently. PR #24 and its earlier-dated presentation migration
   remain separate; later backfill must explicitly reconcile older-version
   history, never silently include it.

Rollback application UI by reverting its PR. Preserve additive progress schema
and user records. No production apply/merge/deploy is performed by these steps
until the owner explicitly authorizes that separate operation.
