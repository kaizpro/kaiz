# Private individual-task progress

Issue #35, separate P1 slice from Issue #34 / PR #36. Related to existing
Problem Archive (#9). This is only the explicitly authorized status/score subset
of future #32; no notebook uploads, execution, ratings or official verification.

## Model and counting

`problem_performances` remains the sole score/attempt history. Its existing
owner CRUD, timestamps, reviewed-record protection and metric-direction-aware
best score remain. `problem_progress` adds only a unique owner/task explicit
Attempted or Solved self-report, not another score or counter table.

An existing practice attempt means attempted; a positive or zero score never
implies solved. Solved always requires an explicit self-report. Clear removes
only the manual status. Recorded attempts still imply attempted; remove eligible
attempts through existing CRUD as well to become truly unattempted. Reviewed
evidence remains protected. Opening a task/collection never writes progress.

The security-invoker/barrier `own_problem_practice` view combines these existing
attempts and manual statuses, restricted to the current user and published
individual tasks. Latest score means latest **valid attempt time**, not best
score or a cross-metric ranking. Ties use stable attempt ID. There is at most one
summary row per task; attempted totals include solved tasks, and the Attempted
filter means attempted but not solved. Unpublishing hides the task from public
archive/personal totals without deleting its private history. Dashboard recent
activity is bounded to 20 tasks, with exact task/attempt counts. Full existing
attempt history stays on each task rather than duplicating it on the dashboard.

Archive rows use a small amber/teal side accent, readable status and a labelled
self-reported latest score. External contests/collections never receive these
controls or individual-task status. Anonymous browsing shows no fictional private
state. Missing schema/failed reads hide personal counters/status/filter, explain
the failure and never infer zero/unattempted. Status and score saves invalidate
detail/archive/dashboard only after confirmed writes. Other sessions reconcile
on refresh; no optimistic persistent mirror or live cross-device subscription.

## Scores

HTML, server and DB boundaries enforce finite values and known ranges. Accuracy,
F1 and AUC default to 0–1; explicitly named percent/% variants use 0–100. RMSE,
MSE, MAE, log loss and Points are nonnegative. Other task metrics can legitimately
be signed; do not silently turn every metric into a percentage. Direction stays
source-defined; zero RMSE is not judge-verified completion.

Source-backed optional `problems.source_provenance.score_bounds` numeric `min`
and/or `max` override defaults (e.g. Points maximum 100). Only existing trusted
problem administrators/import procedures may set this provenance; members cannot.
Record limits only when verified from the actual task source, not an illustrative
score or reference_score. No real task metadata is populated by this feature.
Malformed bounds fail closed. Reference score is never used as a maximum.
New score writes/time changes are checked by an invoker DB trigger, including
direct REST writes, task association, published state and future-time rejection.
Existing stored rows are not rewritten/rescaled/deleted by the migration.

## Privacy change — explicit review required

Migration `202610160001_personal_problem_progress.sql` adds owner-only status
RLS, column grants, user-derived invoker RPC, server-derived timestamps, a private
invoker/barrier view and score validation. It does not alter old migration files.

The older archive migration intentionally allowed authenticated administrators to
read and moderate other users' private practice. This release narrows that using
an additional **restrictive** policy: authenticated admins are still only owners
for private practice, while existing official-result administration/publication
policies remain. New status has no admin exception. Operational PostgreSQL/
service-role recovery access remains privileged and must never reach the client.
Other-user practice moderation now requires separately authorized operational
access rather than end-user admin browsing. Bekjj should review this deliberate
boundary change. No production policy has been changed in implementation.

Public profile/leaderboard APIs do not query private status, attempts or view.
Application actions reverify Auth and IDs; SQL derives ownership and rejects
forged trusted fields even when the app is bypassed. Self-reports do not affect
learning XP, competitive rating, official results or judged achievements.

## Tests and release

`personal-practice.test.mjs` joins existing CI regressions. Native PostgreSQL
`learning-progress.postgres.mjs` applies every existing migration in sorted filename
order to a fresh disposable database before running every `supabase/tests/*.test.sql`
suite against the current schema. Archive assertions now require zero cross-owner
practice reads/updates even for admins; official-result management and protection
of previously reviewed practice remain tested. The private-practice suite covers
owner/member/admin/anonymous status and score privacy, forged fields, published
boundaries, known score ranges, replay, undo and distinct-task counts.

PR #42 must retain this migration-before-assertions ordering when it updates from
main. Its existing migration 17 follows migration 16, and its external-source SQL
suite is discovered automatically. Do not restore its staged privacy/external
exclusions or copy migration 17 into this standalone runner fix. PR #48 uses the
same 40 registry identities and needs no runner-specific application change.

`personal-practice.supabase.mjs` is opt-in real managed Supabase Auth/REST/browser
QA, hard-locked to the existing approved isolated Free project and localhost:3106.
Use the same `KAIZ_QA_SUPABASE_URL`, `KAIZ_QA_ANON_KEY`, `KAIZ_QA_SERVICE_KEY`,
`KAIZ_LEARNING_URL`, `KAIZ_PLAYWRIGHT_MODULE` environment inputs as Release A QA.
The service key provisions/cleans synthetic fixtures only; actual RLS checks use
real member/admin/anonymous clients. Real browser forms test status, existing
score create/edit/delete, archive filters/styles, refresh/new session, private
dashboard counts, 375px 200% text and both themes. Three disposable test users
include an authenticated admin; no production users are copied. This suite is
not an SMTP delivery test or a physical second-device test.

P0 progress/light UI and this PR are independent from the same main; keep P0
review/release unblocked. Safest combined release order: separately authorize and
verify ONLY `202610150001_learning_progress.sql`, review/merge P0, then separately
authorize and verify ONLY `202610160001_personal_problem_progress.sql` before
review/merge P1. P1 schema itself depends on the existing archive schema, not
learning or competition presentation. QA uses a frozen explicit allowlist; never
run a generic production push that includes `202610120001_competition_presentation.sql`.
Recheck project identity, history, hashes, backup recovery limitations and exact
pending-file dry run before any owner-approved production change. No apply,
merge, deploy, import or Vercel production settings change is authorized here.

Post-apply gates: status RLS/grants/invoker/view metadata, owner/admin privacy,
official published/draft boundaries, counts and existing Auth/profile/competition/
result preservation, then authenticated browser QA. Stop on a failure; inspect
transaction/history before retrying. UI rollback preserves private data and the
tighter owner boundary; do not drop user tables or restore broad admin access.

Verification checkpoint (2026-10-16): TypeScript, ESLint, 190 unit/regression
tests, optimized QA build and diff/credential-pattern checks passed. Native
PostgreSQL 17.7 passed 171 assertions (123 preserved + 48 new), registry
reconciliation and cross-connection learning retry/undo. Real hosted QA passed
three actual Auth users (including authenticated admin), three synthetic tasks,
score CRUD, explicit status/undo/replay, archive filters, refresh/new-session
persistence, dashboard reconciliation and anonymous/member/admin isolation.
375px/200% checks exposed and fixed existing score/time field intrinsic-width
overflow; rerun passed both themes. All three users and tasks were removed.
Managed Auth audit events may retain synthetic QA events. Production unchanged.
