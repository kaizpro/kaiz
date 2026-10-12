# Competition and official-results content operations

This is an **offline, manual-assisted import workflow**, not an automated bulk-write endpoint: structured JSON → existing application validation → duplicate/conflict preview → admin review → explicitly approved entry using the current admin forms → separate publication. No hosted data is seeded/synchronized, no migration is needed, and the script has no apply mode.

## Team ownership

- **Tima:** competition identity, research, final metadata approval and publication.
- **Ali:** official standings, division/stage separation, source-faithful rank/score/award checks and row-count reconciliation.
- **Bekzhan:** official task references, licenses and learning materials. Link originals instead of copying statements/datasets/solutions.

Everyone can prepare a content PR and preview files. Only an authenticated existing database admin can enter/publish content. Local preparation or a snapshot flag does not grant that role. Never share credentials, use service-role keys, bypass RLS/server actions or edit production SQL for this workflow.

## Files and commands

Use JSON shapes in `content/competitions/templates/`; the populated example is `content/competitions/2026-10-12/ready-batch.json`. `inventory.json` contains gaps, source links and held candidates excluded from the ready batch. Form fields reuse current admin names, not a new database model.

```sh
npm ci
node scripts/content/preview.mjs content/competitions/2026-10-12/ready-batch.json content/competitions/2026-10-12/public-snapshot.json
node --test tests/content-import.test.mjs tests/competition-results.test.mjs
```

Dry-run is default (`--dry-run` optional). `--apply` and credential flags are rejected. Only the two named JSON files and fixed repository validation modules are read. There is no `.env` loading, network/database connection, output-file write or evaluation of input as code. The installed TypeScript compiler loads existing Zod validators without a new dependency. Do not supply private participant/contact data or secrets; preview prints approved public form data.

Exit codes: **0** valid preview, not approval; **1** validation/conflict errors; **2** invalid invocation/unreadable JSON. Errors identify record paths; any error suppresses the entire entry queue. Required unknown facts stay in the held inventory, never become guessed defaults.

`approvalReady` is only local consistency with a same-date complete admin inventory. It is not authorization and never causes a write. The checked-in anonymous snapshot has `scope: public`, so approval is deliberately unavailable because RLS hides private drafts. A successful preview alone is not permission to import.

## Fresh inventory and duplicates

Before approved entry, an admin inspects **all** competitions and **all draft/published sets** through `/admin` and `/admin/competitions/[id]/results`. Record a fresh local snapshot using the template, real UUIDs/current form fields and every existing row. Each set needs its `competitionId`, publication status, row IDs/verified flags and original row data. Only after honestly completing this inventory set `scope` to `admin_complete`. Keep private exports outside Git, e.g. `work/private-content/` under the already-ignored `work/` directory.

The preview checks UUID/slug references, set→competition foreign keys, source references, enums, strict calendar dates, actual booleans, score/rank/status consistency, source-label database limits and source URLs without credentials/recovery parameters. It rejects injected role/actor/verification/profile/team IDs. No KAIZ participant account is created or guessed.

- One canonical annual `editionKey`, ending in the declared year. Resolve CEOAI/EUROAI aliases rather than create duplicates; IOAI and IAIO are distinct events.
- Duplicate editions/slugs/title-years, source/title set identities and scoped participant identities are rejected. Use original external IDs only when the organizer supplies them; otherwise compare type/name/delegation conservatively. Homonyms need manual disambiguation, not invented official IDs.
- Identical data skips on re-import. Different competition metadata produces a review-only field list. Different draft/verified results block the queue: no upsert/overwrite. New rows cannot be appended to a published set.
- Alternate URLs/titles/transliterations and incomplete snapshots cannot be fully resolved mechanically. Inspect the entire edition before creation. This manual-assisted tool does not claim atomic/concurrency-safe database idempotence; rerun after entry and never let two admins enter the same batch concurrently.

## How to add one new competition and its official results

1. **Collect official sources.** Verify the edition, not an obsolete announcement/generic homepage. Record URL, extracted fields, checked date, verification status and caveats. Unknown required values belong in research, not the ready batch. Do not collect emails, birthdays, schools or private contestant information.
2. **Fill JSON.** Copy a worked example. Preserve date scope: a round/finale is not a whole season; state the scope in title/description and do not duplicate an annual edition by stage. Competition optional blanks use `""`; row ranks/scores/countries/awards use `null` when missing. Retain names, decimal precision and exact awards. Never infer rank from score or turn N/A into zero/disqualification. Ties are legal; divisions/stages use separate sets.
3. **Validate.** Run against the fresh snapshot; resolve every row-level error. New metadata must have boolean `verified: false`; all prepared result sets must have boolean `published: false`. Do not turn validation failures into invented facts.
4. **Admin review.** Ali reconciles the selection against official tables. Tima explicitly approves the specific file/version, fields and partial scope before entry. Partial titles must retain `selected rows`/`partial` plus a full official-table link. Source-verified is not complete. Unknown organizer publication dates remain null; KAIZ verification timestamps are different.
5. **Approved metadata entry.** Manually sign in as an authorized admin. Use preview routes to create or edit only reviewed fields. **Competition creation is immediately public even when verified=false.** Never save held candidates as placeholders. Do not overwrite an existing row from an old snapshot or recreate its UUID.
6. **Draft results entry.** In `/admin/competitions/[real-id]/results`, check for duplicate sets again; create the set with publication unchecked. Use its real selected UUID for each row. Preview's `ADMIN_MUST_SELECT_THE_REAL_DRAFT_SET` is a reminder, never a UUID to submit. Preserve source labels/links/values, leave linked username blank unless separate verified ownership review exists. External team names do not require KAIZ teams. Do not insert external standings contestants into `competition_participants`, which represents registered KAIZ users. Refresh snapshot/preview after entry: identical rows must skip.
7. **Separate publication and QA.** Reconcile draft counts/values with the approved selection and check teams, ties, null/N/A, zero and awards. Only then explicitly publish. Existing set publication and row verification update in separate requests, not an atomic bulk transaction; stop/reconcile both states on an error. Signed-out users must see published sets only. Check the detail set switcher/source link, directory filters, existing five competitions, and any separately reviewed account/problem links. Never delete/replace previously verified results silently.

Large full leaderboards can remain official links initially. Do not copy task materials or introduce new schema/write tooling without a separate proposal. This task stops before production entry/publication.

## Test boundaries

Offline tests execute actual validators, results actions and public query construction against in-memory boundaries; SQL tests verify the existing migration contract. They cover auth denial before any write, scoped IDs, draft defaults/server-derived trust, malformed inputs, duplicates/idempotence and original rank/score semantics. They are **not a new live production RLS penetration test**. No production DML/account promotion is performed. Live admin/member/anonymous QA remains a later release-owner action after explicit approval.

See [the dated audit](content-population-audit.md) for counts, gaps and release implications.
