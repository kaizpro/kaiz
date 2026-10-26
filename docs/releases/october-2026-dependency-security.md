# October 2026 dependency security and results release checkpoint

## Separate dependency patch

Upgrade the locked Next.js runtime and matching ESLint configuration from 16.3.8
to 16.4.3, and Zod from 4.6.5 to 4.6.6. Pin both application dependencies so a
fresh install cannot select their previously vulnerable versions. React,
Supabase, Auth implementation, styles, database migrations and policies are
unchanged. The generated Next.js agent-guide heading is retained. The SQL CI
workflow also runs for package/lockfile changes, so dependency upgrades exercise
the real disposable database suite rather than silently skipping it.

Assessment against the maintainers' October advisories:

- [Server Actions denial of service (high)](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r):
  KAIZ uses App Router and Server Actions, so the documented prerequisites apply.
  Upgrade is required; do not run exploit/load tests against production.
- [Image optimization / SVG remote code execution (critical)](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw):
  the existing lock already includes sharp 0.35.5, the maintainer's workaround.
  No `next/image` imports or `dangerouslyAllowSVG` configuration were found in
  application sources. This mitigates the finding, not proof that every deployed
  image-API path is unreachable. Patched Next.js requires the fixed sharp range.
- [Cache Components typed-array remote code execution (critical)](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr):
  no `cacheComponents` setting or `use cache` function was found in KAIZ. The
  stated exploit prerequisites were not identified; still upgrade as advised.
- [Zod oversized-collection memory exhaustion (high)](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5):
  the installed version is affected. KAIZ validates untrusted structured input;
  existing string/collection/request limits reduce exposure but are not a
  substitute for the 4.6.6 fix. Not every parser path was demonstrated exploitable.

Verification: clean `npm ci`, typecheck, lint, all 311 application regressions,
all six PostgreSQL suites (255 assertions), configured production build and HTTP
Learn cache/isolation checks pass. The 87 static Learn routes include 85 topic
pages. All 77 frozen original participant rows also round-trip in a separate
loopback PostgreSQL database with only production's nine prerequisites plus the
results-security migration; participant fields and all 15 competitions remain
unchanged. Component browser tests cover 60 edition views, 56 stage views,
108 task links, eight award layouts and four publication-control layouts,
including mobile/light/dark, keyboard, reduced motion and 200% text cases.
`npm audit` reports zero advisories after the patch, including dev dependencies.
This is a point-in-time advisory check, not a guarantee against future findings.

Additional production-build browser checks pass for all 40 lesson pages across
320/375/1280/1440 widths and light/dark themes, with full-row keyboard/pointer
navigation, 200% text and repeated reduced-motion checks. Premium Roadmaps and
Strategist pass 40 further page/theme/viewport checks. A small, non-stress Zod
check confirms oversized bounded arrays fail before visiting their elements.

Real Auth compatibility also passes against the previously approved isolated
Free-plan Supabase QA project and a localhost **production build**: disposable
password login, lesson completion, refresh, sign-out/new-session persistence,
saved XP, undo, replay idempotency, cross-user isolation, anonymous write denial
and guest Learn. Owned disposable fixtures are removed afterward. An earlier
development-server browser attempt stalled; it is not counted as a passing
check or evidence of a production defect. No application/Auth workaround was
introduced. Google OAuth and email delivery still require post-release owner
smoke checks; this test does not send confirmation emails or alter provider
settings. Production's new results-specific API/admin matrix remains a separate
mandatory post-migration gate, not a claim from these learning/Auth tests.

## Actual production state: application deployed before database gate

Read-only checks on October 26 found PR #67 already merged by the owner at
11:09:21 UTC, without any recorded GitHub review. Its merge commit is
`c2a345a19d22f5deefe385b61f54b6524d0cdcb1`. A successful Vercel Production
deployment for that SHA was created at 11:09:57 UTC: main merges currently
trigger Production deployment automatically. No merge/deployment was performed
as part of this dependency preparation. Obtain Bekjj's independent security
review even though the PR has already merged.

Production still has nine migrations, 15 competitions, two **unpublished**
result sets and 77 original rows. The new admin Results page fails to load:
`get_competition_result_audits` returns HTTP 404 / `PGRST202` (function absent
from the API schema). Public competition pages load and anonymous direct,
unfiltered and nested reads return no draft results. These draft boundaries do
not repair the outstanding column-privilege vulnerability after publication.
Do not publish or use admin publication controls before the database gate.

## Recovery gate

The latest full encrypted backup snapshot is October 25, 2026 19:42 UTC
(October 26, 00:42 Asia/Qyzylorda). Local and independently downloaded private
cloud ciphertext checksums and authenticated age decryption were reverified.
However, it contains only 13 competitions and predates both Kazakhstan editions
and all 77 standings rows. It is **not a current Batch B/C recovery point**.

Obtain a fresh consistent full export and verify encryption plus independent
private-copy retrieval/integrity before migration authorization. Do not treat
archive integrity as a successful restore. Full restoration remains unverified;
the earlier disposable restore was blocked by unavailable `supabase_vault`
0.3.1. Managed-project configuration and Storage object bytes are separate
recovery concerns. Never put backups, private sources or credentials in Git.

## Controlled one-file production procedure (NOT executed)

1. Complete independent review and the fresh-backup gate. Re-read project
   identity `oolaemebhoytzuussigu`, history, both draft IDs/counts, all 77 frozen
   rows, policy/constraint definitions and existing-data fingerprints.
2. Freeze canonical Git bytes of
   `202610260001_results_privacy_hardening.sql`, SHA-256
   `9ab7062d86175fd7132a4e258fb8d2d503f3c1e344e86d7ff77999e6278383b4`.
   Prepare an isolated release directory with exactly the nine applied files
   plus this file. Explicitly exclude personal-practice migration 16 and
   external-practice migration 17. There is no dependency on either.
3. CLI 2.117.0 help was inspected. A linked isolated-directory dry run passed
   with exactly this one pending file and Vault updates skipped:

   ```text
   supabase db push --linked --project-ref oolaemebhoytzuussigu --skip-vault --dry-run --workdir <frozen-release-directory>
   ```

   This is a planning check, not remote SQL execution or a backup/approval gate.
4. Request separate explicit owner authorization for this **single migration**.
   Recheck identity, hash, history and the dry run immediately beforehand. Only
   then use the identical frozen-directory command without `--dry-run`.
   Never push the full repository; do not include seed, roles or Vault flags.
5. Require ten migration-history entries, unchanged 15 competitions/two drafts/
   77 rows and unchanged unrelated records/policies/constraints. Check explicit
   public projections; anon/member draft privacy; 42501 for private columns,
   `SELECT *`, nested/whole-row audit reads; and authorized admin audit access.
   Check PostgREST schema refresh and GraphQL visibility if enabled. Normal
   member/admin Auth sessions must be tested without sharing their credentials.
6. Smoke-test the already-deployed admin page, public Results/Overview/Tasks,
   profiles, login, Roadmaps, XP, My Learning and Discussions. A wildcard API
   permission error must never become an error on normal projected KAIZ pages.
   Production publication testing is not authorized: the scoped/idempotent
   publication-only operation was exercised in disposable PostgreSQL, proving
   that only targeted `published` flags plus the existing `updated_at` trigger
   change, not audit attribution or any participant field.
7. Keep the dependency PR separate; review/merge it only with owner approval
   after the database compatibility gate. Expect automatic Production deployment
   when it is merged. Then repeat auth/cache/premium UI smoke checks.
8. Only after the production security checks and row/source/permission review,
   request renewed, exact Batch D publication authorization for the two sets.

The SQL is transactional and contains no participant DML/backfill, RLS-policy
change or destructive data operation. Revoking broad SELECT deliberately breaks
raw wildcard clients, including authenticated admins; the restricted audit RPC
is their replacement. Function creation is **not replay-idempotent**. If the
connection, migration receipt or postcheck is unclear, inspect history, functions,
grants and fingerprints read-only; never blindly rerun or assume the history
receipt and SQL outcome agree. Corrective schema/history work requires separate
approval. Retain strict grants and private drafts on application failure; do not
roll back to broad public reads or reset/restore production without authorization.
