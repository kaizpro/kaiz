# Competition release checkpoint — 2026-10-13

Owner: Tima / Zhunussov. Issue #23, PR #24, branch `feature/competition-pages-v2`.

**NOT AUTHORIZED FOR PRODUCTION RELEASE.** This checkpoint records safe verification, not permission to migrate, merge, deploy, import or publish. Main remains `b82d44b21a71c0b1f44784e39449dd9bb8a0d1b5`; no newer main integration was needed. PR #24 is open, with no submitted review at audit time. An independent authorized reviewer is still needed; the existing reviewer request is not an approval. Repository rulesets returned an empty list and the legacy protection endpoint was unavailable; do not infer guaranteed protection from that response.

## Hosted state — read-only

Authenticated CLI migration history and a `BEGIN TRANSACTION READ ONLY` metadata query confirmed PostgreSQL **17.6**, six recorded migrations through `202610040001`, no presentation columns, five genuine competition rows, zero result sets and zero participant result rows. RLS remains enabled on competitions/results, archive, discussion and external-account tables inspected. Published-parent-only results reads and administrator-only results writes remain the intended policies.

Pending in chronological order:

1. `202610070001_external_account_security.sql` — already merged into main, but absent from hosted history. Protects trusted external-account fields; revokes client TRUNCATE/TRIGGER and direct guard execution. No production rows are backfilled/deleted.
2. `202610120001_competition_presentation.sql` — new additive migration in PR #24. Adds bounded object JSONB columns to competitions, result sets and result rows. Empty defaults, no backfill, no RLS/grant changes.

The hosted **zero-write CLI dry run succeeded** and proposed exactly these two files. Do not silently skip the earlier security migration or apply it without Tima approving the exact pending batch. No applied migration files were edited.

The current production deployment recorded by GitHub targets main `b82d44b…`; its successful Production status was checked separately. That is the pre-#24 application, not Competition Pages 2.0. Vercel deploys must follow the database gate; a merge can trigger automatic production deployment. Project production branch/domain settings still require release-owner confirmation before merge.

## Real PostgreSQL execution evidence

All **eight unchanged migration files executed chronologically on native PostgreSQL 17.7**, isolated on loopback port 55439. The same PostgreSQL major version as hosted was used. No hosted rows or production credentials were copied into the cluster.

Executed pgTAP suites:

| Suite | Assertions passed |
| --- | ---: |
| Competition presentation | 27 |
| External account security | 53 |
| Problem archive security | 45 |
| Total | 125 |

Before the presentation migration, legacy-shaped competitions and published/draft result fixtures were inserted locally. After extension, original fields/score strings were unchanged, old insert shapes remained valid, empty defaults appeared, and table ACLs plus all public RLS policy definitions were unchanged. SQL tests exercised real anon/authenticated/admin/service roles, owner/non-owner boundaries, private drafts, withdrawal of publication, immutable trust fields, linked archive evidence, column checks and 16,000-byte limits. Transactional fixtures roll back. The native server is stopped afterward; ignored local cluster files are retained for recovery, not broadly deleted.

Limit: this is real PostgreSQL execution using minimal Supabase database schema/role dependencies, **not a running GoTrue, PostgREST or Storage service**. It does not certify full Supabase service behavior or authenticated deployed browser flows. Existing opt-in full-local-Supabase JS tests cannot run without Docker. Real hosted permission read-back and authenticated post-release QA are still required.

Reproduce without changing application dependencies (Windows workspace):

```text
npm install --prefix work/release-postgres --no-audit --no-fund embedded-postgres@17.7.0-beta.16 esbuild@0.25.12
node scripts/testing/prepare-postgres-pgtap.mjs
node tests/competition-presentation.postgres.mjs
```

The setup helper installs [upstream pgTAP 1.3.3 SQL](https://github.com/theory/pgtap/tree/v1.3.3) with a pinned SHA-256 into the ignored native runtime. [Embedded PostgreSQL](https://github.com/leinelissen/embedded-postgres) supplies native binaries; its package wrapper version label does not replace the server's verified `SHOW server_version` evidence. The harness has no dotenv loading, hosted URL option, Auth tokens or service-role key.

## Browser and code checks

`npm ci`, typecheck, ESLint, 165 regression tests, production build and diff checks passed. SQL execution is additional to those 165 tests; it is opt-in and not claimed as executed by the existing GitHub CI job.

Computer-use QA:

- Existing production directory lists five records; an Upcoming filter returns zero with the correct empty state. All five existing detail URLs return HTTP 200 without the error view; IOAI 2026 detail and its official link/empty states were inspected in the browser. Anonymous `/admin` redirects to login. No credential entry or production writes occurred.
- A **local component fixture**, not a new application route, uses existing source-backed draft rows. Overview/Results/Tasks buttons, distinct individual/team stages, stage selection after changing datasets, flexible FAIO/IAIO score strings, missing results/tasks, and failed-media fallback worked.
- Mobile/dark at 390×844 and desktop/light at 1280×900 showed no horizontal page overflow; wide tables scroll internally. Screenshots retained in ignored `work/release-qa/`.
- Full Next.js → Supabase service → authenticated browser QA, related-edition database navigation, official-task links and post-release private-draft visibility remain mandatory. Do not confuse fixture rendering with a deployed or published dataset.

To open the isolated component fixture after a production build:

```text
node tests/competition-pages.fixture-server.mjs
```

It listens on `127.0.0.1:3111`, serves no database/Auth/write endpoint, and is not included in application routing. Native PostgreSQL and browser-fixture dependencies stay under ignored `work/`; `package.json` and the root lockfile remain unchanged.

## Content comparison and holds

Five existing slugs: `ioai-2025`, `ioai-2026`, `apoai-2026`, `euroai-2026`, `neoai-2026`. All retained unchanged.

Eight new **priority metadata drafts**: `ioai-2024`, `faio-2025`, `faio-2026`, `iaio-2026` (Winter IAIO), `neoai-2025`, `usaaio-2025`, `poland-oai-2025`, `onia-2026`.

Two additional proposed replacements: `iaio-2024`, `usaaio-2026`; neither is approved merely by preparing it. AI Olymp Kazakhstan 2025/2026 remain in the complete fifteen-target review inventory but are held, so there are thirteen scoped priority metadata records, not fifteen approved imports.

The existing IOAI 2025 organizer differs from the curated draft (BNDS versus BNDS and ITCCC); preserve the existing row and seek explicit field-level approval for any correction. Other existing-row metadata/presentation changes require their own preview/reconciliation, not a destructive replacement.

Prepared: **14 partial source-backed unpublished sets / 49 rows**. Hosted/published: **0 sets / 0 rows**. Offline validation still reports valid, zero errors, zero writes and approvalReady=false against the existing public snapshot; that snapshot is not a complete admin export and cannot authorize an import.

2026-10-13 official-page recheck confirmed the IOAI 2024 August 9–15 retrospective, IOAI 2025 edition/date page, IOAI 2026/APOAI edition sources, EUROAI's distinct 2026/2027 references, Winter IAIO's final/results identity, FAIO 2026 September 20 qualification and October 27–28 final, Poland's II OAI archive and NEOAI/USAAIO regional references. ONIA and Central University's pages were not retrievable by the web reader in this pass; previous research is retained, but freshness is not newly certified. Dedicated source links remain in the curated inventory. No results were fabricated, expanded or relabelled.

- AI Olymp 2025: actual screenshot not available here. Obtain the full-resolution image/export and organizer provenance; preserve all 38 user-reported rows including red rows. No transcription is claimed.
- AI Olymp 2026: prior public-sheet examination observed 39 rows labelled final. Organizer/post-appeal publication remains unconfirmed; no official import/publication is authorized. The sheet has not been freshly transcribed in this pass.
- No licensed organizer logo/hero was obtained. All reviewed targets retain placeholders pending reuse permission; public image availability alone is not a licence. Decorative media does not block release.
- FAIO 2026 final standings are not yet published; missing NEOAI aggregate/USA results and ONIA grade/stage sources remain explicit in the existing stage catalog.

## Importer scope — separate follow-up after #24 release

Existing tooling validates and previews only; no bulk apply mode exists. Building a transaction-safe admin importer requires application endpoints and likely a separately reviewed migration/RPC, so it must not be mixed into PR #24. Follow the user's sequencing: after #24 is safely released, continue existing content Issue #21 (or reuse a matching importer issue), branch from updated main and open a reviewed follow-up PR.

Minimum implementation contract:

1. Authenticate administrator server-side; reuse strict dataset/Zod validation and bounded inputs. Never accept client-supplied actors or service-role credentials.
2. Read a complete current admin snapshot, match UUID/slug and source/stage/participant identities; report field-level conflicts and ambiguous same-name rows, never guess ownership.
3. Return a zero-write preview with dataset and snapshot fingerprints, individual errors, create/skip/conflict counts and every result-set row count. Competition metadata approval is separate because competition rows are immediately public.
4. Require explicit approval for that exact preview. Revalidate authorization, fingerprints and conflicts immediately before writes; stale previews must fail closed.
5. Serialize operations per target and make each approved batch transactional through a reviewed admin-guarded mechanism. Add only missing reviewed rows, preserve existing rows, skip identical rows, and reject conflicting edits atomically. Repeating the same approved batch must not duplicate entries.
6. Import result sets unpublished; reconcile read-back against source, then require independent explicit publication approval. Never auto-publish or infer final standings from qualifiers.

No new importer issue/branch/PR or implementation was started before the prerequisite release. None of the prepared metadata/results is authorized for hosted entry by this checkpoint.

## Security assessment — unresolved before inviting users

`npm audit` reports six high-severity packages; no force fix/downgrade or unrelated dependency edit was performed. Next.js **16.3.6** has runtime advisories; patch versions **16.3.8+** are identified by the vendor advisories. Handle remediation in a separately scoped reviewed dependency change, then rerun build/tests/audit before public invitations.

- [Image-optimizer SSRF](https://github.com/advisories/GHSA-cjq9-62q9-8jv4): this app configures remote patterns for Supabase and GitHub. No `next/image` usage was found and new competition media loads directly in the browser, but the optimizer configuration exists; do not dismiss the runtime advisory as dev-only. Assess the endpoint/deployment and patch rather than actively exploit production.
- [Draft-mode cache disclosure](https://github.com/advisories/GHSA-3w37-wq28-93x7): no `use cache`/Draft Mode usage found. Conditional exposure is narrower, not a blanket certification.
- Metadata image `dynamicParams` disclosure: no dedicated metadata-image route found. Dev-server MCP disclosure is a development risk; production builds are not the dev server.
- SSG/ISR cache-poisoning advisories require deployment/cache assessment. Competition pages are dynamic, but static learning routes exist and Vercel-specific mitigation must not be assumed.
- `braces`, `micromatch`, `fast-glob`, `@next/eslint-plugin-next` and `eslint-config-next` are tooling/transitive findings. The braces issue propagates to several audit entries; six packages do not mean six independent exploits. No runtime import of those lint packages was found. Update coherently rather than accepting npm's proposed incompatible downgrade.
- Hosted external-account guard migration is missing: trusted link-field forgery remains a concrete pending protection. Apply only after explicit approval and verify denial afterward.
- Broad initial competition TRUNCATE/TRIGGER grants are visible in catalog metadata; RLS does not govern those privilege classes. PostgREST does not expose arbitrary SQL, and dependent-table privileges constrain TRUNCATE, so catalog grants alone do not prove a reachable remote exploit. Review separately; no production privilege mutation or exploit attempt was performed here.

## Approval and recovery

Tima must explicitly approve the **two-file production migration batch**, separately from merge/deploy and content publication. Before application release, obtain independent PR approval and confirm the Vercel main→production/domain settings. Existing secrets must be entered only in dashboards/secure flows if required.

Approved release order:

1. Confirm a recoverable Supabase backup/PITR or release-owner snapshot, migration hashes and current hosted ledger. Do not assume backup availability on the current plan.
2. Re-run zero-write dry run, then apply only the two approved pending migrations in chronological order. Stop on unexpected drift/extra pending migrations; never use hosted reset.
3. Read back ledger, columns/checks, trusted-field denial, RLS/grants and five existing records. Keep old app running while validating.
4. Once independently reviewed and explicitly approved, merge PR #24 normally; let the configured Vercel automatic pipeline deploy. Do not bypass reviews or manually deploy unnecessarily.
5. Confirm Production Ready, domain routing, full app/browser/service/member/admin QA. Remediate/resolve reachable high findings before user invitations.
6. Implement/review the separate importer; obtain exact metadata/draft-import approval, reconcile, then obtain separate publication approval.

Recovery: if migration execution fails, inspect its transaction/ledger before retrying; never stamp it applied blindly. If new app fails, roll back the Vercel application version while retaining additive columns/defaults and the security guard. Do not drop presentation columns (would destroy newly entered metadata) or remove the guard as a rollback shortcut. Restore production from an approved backup only under a separately coordinated incident procedure; preserve post-checkpoint user writes and reconcile them.
