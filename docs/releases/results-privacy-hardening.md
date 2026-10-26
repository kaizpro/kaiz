# Results privacy and publication release gate

Issue #66. Code-only preparation, based on main `06c562b66814b86cdb27cab56a9535add913bf5a`.
**No production migration, publication, deployment or merge is authorized by this PR.**

## Verified incident / scope

Read-only hosted inspection on October 26, 2026 confirmed 15 competitions, two
unpublished sets, 77 rows and nine applied migrations. Both tables have RLS, but
their relation ACLs grant SELECT to anon/authenticated. Those roles have no
inherited role memberships. RLS permits published sets and rows with published
parents; it cannot hide columns. Explicit audit requests, table wildcards,
nested selections and whole-row JSON could therefore expose audit attribution
after publication, even though the website's projections omit it.

Affected: `competition_result_sets.created_by/updated_by` and
`competition_results.created_by/updated_by/metadata/external_reference`.
The raw metadata/reference columns are reserved for private operational/source
information. Current production row metadata is empty and no restricted Sheet
links were found. No exposure was induced to test this in production.

The hosted audit found no results-dependent public views or row-returning
results RPCs. Its only two results-referencing routines are non-callable trigger
functions (`protect_practice_performance_fields` and
`validate_problem_performance_result_link`). Existing result/set updated-at
triggers are retained. Public profile nested results already use explicit
rank/score/verification projections; competition details and leaderboards also
use explicit projections, not table wildcards.

## Design

New migration: `202610260001_results_privacy_hardening.sql`.

- Revoke table-wide SELECT and all pre-existing SELECT column grants from
  PUBLIC, anon and authenticated. Grant an explicit allowlist matching the
  existing public result contracts. A transactional guard aborts if inherited
  privileges still permit private-column SELECT. No role membership or RLS
  policy is changed. New future columns are not automatically public.
- `select=*`, explicit private columns and whole-row JSON fail with 42501,
  including for admin callers using the authenticated role. This is the
  intentional new raw-table contract, not a successful response with redacted
  or nulled audit data. Existing KAIZ public/admin table projections work.
- Public columns retain IDs, competition/set/user/team links, names, original
  scores/display scores, rank/ties, awards, status/verification, country,
  approved public source attribution, display presentation, and the timestamps
  already consumed by the public loader. Presentation/source_url are public
  display fields: never put private originals, credentials or contact details
  there. Private operational information belongs in the protected raw fields.
- Admin audit access uses `get_competition_result_audits(uuid)`, an explicit
  read-only projection with a fixed empty search_path, qualified objects and a
  mandatory authenticated `is_admin()` check before reading. Its elevated read
  is necessary because admins and members share the authenticated database role.
  PUBLIC/anon EXECUTE is revoked; ordinary authenticated users are rejected.
  It never returns a complete table-row composite. The protected admin page
  displays audit attribution in an expandable section, not in public results.
- No new public/definer view exists and no service-role key is added. SQL column
  denial also applies to nested SQL/whole-row reads; frontend omission is not
  the security boundary. Raw PostgREST clients must name allowed columns.

This follows the [Supabase column-level security contract](https://supabase.com/docs/guides/database/postgres/column-level-security)
and the [PostgreSQL function security guidance](https://www.postgresql.org/docs/17/sql-createfunction.html).

## Publication-only operation

`set_competition_results_publication(competition UUID, result-set UUID[], boolean)`
is SECURITY INVOKER, not a privileged definer RPC. It is executable only by the
authenticated role, checks the current Auth subject and `is_admin()`, and retains
normal table grants/RLS. It accepts 1–50 distinct, non-null IDs, validates all
parents, locks targets in deterministic order, and fails atomically if a target
is missing or belongs to another competition. It updates only `published` for
changed selected sets. Repeating the same state performs no UPDATE.

The existing set `updated_at` trigger runs when state actually changes. It is
not bypassed. `created_by`, `updated_by`, `verified_at` and **every participant
field** remain unchanged. Publication does not make a participant's separate
`verified` field true. Official stage/source classification remains source-faithful.

The server action independently requires an admin, validates UUIDs and strict
boolean strings, scopes the parent competition, validates returned target IDs,
and does not retry a failed/uncertain operation. Cache invalidation is scoped to
the affected competition/admin page. The publication form submits IDs/state
only. Metadata forms no longer publish: creates are drafts, edits preserve state,
forged publication input is rejected, and bulk participant synchronization is
removed. Normal intentional admin participant editing remains available.

## Tests and limits

- Native disposable PostgreSQL 17.7: full canonical migrations and all six SQL
  suites, 255 assertions including 57 new checks. Tests cover anon/member/admin,
  drafts, explicit/wildcard/nested/whole-row denial, protected audit accessor,
  publication denial, mixed-parent atomic failure, replay without trigger
  invocation, scoped withdrawal, 38/39 synthetic rows and 3/5/15 synthetic medals.
- Additional private loopback-only test imports the frozen original 77 rows,
  applies only production's nine prerequisites plus this new migration (not
  personal practice), and checks every full participant row and all 15 edition
  rows before/after migration and publication. Public original names, scores,
  ranks/ties, awards and original score presentation match in memory. No named
  originals, private URLs, user credentials or row logs are committed.
- 310 application tests cover Auth/authorization, learning/XP, admin actions,
  original source/award integrity and public loader projections. TypeScript,
  ESLint, production build and diff checks pass.
- Component browser QA: 60 edition views, 56 stage views, 108 task-link checks;
  eight award-layout cases (desktop/mobile, light/dark, 200% text); four new
  publication-control views with keyboard/reduced motion, exact payload and
  separate metadata form. The older edition fixture now bundles CSS modules
  alongside built global CSS so it actually tests current premium components.
- Configured production build + HTTP cache regression: all 87 static Learn
  routes (85 topics), cookie/query/RSC isolation and uncached private dashboard
  pass. No shared public layout, Auth, XP or premium style was changed.
- A focused CI workflow executes the canonical SQL suite against a fresh local
  embedded database without dotenv loading or hosted credentials.

These are real PostgreSQL privileges/RLS tests and real component-browser
interactions, **not a running isolated GoTrue/PostgREST/GraphQL service test** or
a deployed preview Auth session. Hosted post-migration API checks and an admin
browser smoke test remain mandatory. Do not claim production privacy is fixed
by a passing local test or PR merge alone.

## Exact production rollout — separate approvals required

1. Independent review (Bekjj/Ali) of the final commit, CI/Preview checks and owner
   acceptance of the explicit-column API contract. Do not publish while the old
   admin handler remains deployed.
2. Obtain a fresh encrypted consistent full database backup containing Batch B/C,
   independently retrieve/checksum/decrypt its private second copy. Existing
   integrity evidence is not a demonstrated restore; full database/Vault/project
   recovery is still unverified. Never upload plaintext or keys.
3. Request approval for **only** `202610260001_results_privacy_hardening.sql`.
   Freeze canonical Git bytes with SHA-256, verify current hosted identity/history,
   and create an isolated release directory containing the nine applied files
   plus this file. Exclude `202610160001_personal_problem_progress.sql` and
   `202610170001_external_source_practice.sql`. This migration depends on results
   foundation and presentation only; do not use a full-repository db push.
4. Verify exact installed CLI help, link and zero-write dry run: the new security
   file must be the sole pending migration. Stop on inherited-grant guard failure,
   identity/hash/history mismatch or any uncertain outcome. Its transaction must
   commit completely or roll back; inspect read-only rather than retry blindly.
5. Apply only after explicit owner authorization. Expect ten recorded migrations,
   still 15 competitions, two draft sets/77 unchanged rows, zero published sets.
   Verify grants, unchanged RLS/constraints/data, admin audit RPC, and draft privacy.
6. Repeat a real production anonymous/member Data API audit **before renewed
   Batch D authorization**: explicit approved projections work, private columns
   and wildcards fail with 42501, nested audits cannot be retrieved, drafts stay
   hidden, ordinary users cannot call either admin operation. Inspect schema-cache
   refresh and GraphQL visibility if enabled. No test publication is permitted.
7. Owner separately approves merge/application deployment after the database gate.
   Old public readers remain compatible with the migration, but the new admin
   page/RPC requires it first. Until deployment, do not use old publication controls.
   Smoke-test admin metadata/audit access and public competition/profile routes;
   leave production publication untouched.
8. Revalidate sources/rows/permissions/backup and request renewed Batch D approval
   for the exact two sets and 77 rows. Only then execute publication and public QA.

If application release fails, retain the stricter database grants and keep drafts
unpublished. Do not restore broad reads as a rollback. An application rollback
must not re-enable use of the old publication handler. Backup restoration or any
corrective schema change requires separate approval; never reset production.
