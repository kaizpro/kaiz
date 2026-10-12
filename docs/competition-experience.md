# Competition Pages 2.0 — Issue #23

Branch: `feature/competition-pages-v2`. This is a separate follow-up to merged PR #22; its curated research remains intact.

## Implemented, not deployed

Existing `competitions` rows remain editions with stable UUIDs and `/competitions/[slug]` URLs. Optional `presentation.seriesSlug` groups a series and `year` labels the edition. Related editions are queried from PostgreSQL, not populated from local research files. This is a logical series/edition model, not a new normalized series table or automatic edition backfill.

The page has Overview / Results / Tasks navigation, a separate named result-stage switcher, official source links, and published archive tasks or an official tasks link. Empty results and tasks are explicit. Missing expected stages are configured by administrators; the UI never guesses a final from a qualifier. Native buttons provide keyboard access, pressed state and associated panels. Panels wrap and tables scroll horizontally on narrow screens. Existing theme tokens support dark/light mode.

Media fields support reviewed public HTTPS logo/hero references, neutral identity placeholders and failed-image fallback. No publisher logos were copied or licensed by this change; no made-up logos. Optional hero media is decorative and omitted when absent. Browser-loaded external media uses no referrer; there is no new arbitrary-URL server image optimizer.

## Migration required before running new database-backed pages

`202610120001_competition_presentation.sql` adds an object-shaped, size-bounded JSONB `presentation` column to each of `competitions`, `competition_result_sets`, and `competition_results`. Defaults are empty objects. No existing rows, tables, RLS policies, grants, credentials or applied migration files are changed. Existing admin-only writes and published-set-only reads continue to govern these fields.

**This migration has not been applied locally or to hosted Supabase.** The public/admin result queries now select the new column. A release owner must review migration ordering, apply it through the normal migration workflow, and perform real database/browser QA before deployment. Static migration contract tests are not a database execution or live RLS test. No production seeding, deployment or publication was performed.

The migration follows `202610070001_external_account_security.sql` and depends on the existing competition/results foundation. Object and 16,000-byte checks constrain the three new columns. Existing table-level SELECT/DML grants cover them, with unchanged RLS restricting writes to administrators and result reads to published parents (or administrators). No new index is required for correctness; existing edition date/result foreign-key indexes remain intact. Series lookup uses JSON containment; assess a matching index if the directory grows materially. Defaults preserve old application inserts and reads; applying the migration first does not require changing existing presentation data.

Exact production release order (release owner only, not performed in this task):

1. Review and merge the PR; keep automatic application deployment paused until the database prerequisite is satisfied.
2. Compare hosted migration history with merged main and dry-run the normal Supabase migration procedure. Resolve any earlier missing migrations separately before this migration.
3. Apply `202610120001_competition_presentation.sql` **before deploying the new application**. Never reset the hosted database or seed this research batch.
4. Verify migration history, column defaults/checks, unchanged grants/RLS, published/draft visibility and the five existing competition records.
5. Deploy the reviewed application version and run desktop/mobile, dark/light and anonymous/member/admin browser QA.
6. Consider content entry/publication only through a separately approved workflow after the Kazakhstan source holds and media permissions are resolved.

Local database execution requires Docker/PostgreSQL, neither available in this workspace. Static schema/publication contracts are tested; actual migration execution and live RLS remain a release gate, not a claimed pass.

## Presentation fields in the existing admin workflow

Optional JSON textareas are validated server-side with strict Zod schemas. Missing input preserves older callers; explicit `{}` clears presentation data. Unknown fields, duplicate columns, unsafe URLs and oversized JSON are rejected. These inputs do not grant publication, verification or user linking rights.

Edition example:

```json
{"seriesSlug":"ai-olymp","year":2026,"expectedStages":[{"name":"Qualification","availability":"NOT_FOUND"},{"name":"Final","availability":"NOT_FOUND"}]}
```

These are planned navigation labels, not evidence that a stage's source is verified. Never save incomplete competition metadata merely to make this example visible.

Result set example:

```json
{"stageLabel":"Final","availability":"OFFICIAL_STAGE_RESULTS","coverage":"partial","displayOrder":2,"columns":[{"key":"day_1","label":"First Day Score"},{"key":"day_2","label":"Second Day Score"}],"notes":"Selected reviewed rows, not full standings."}
```

Result row example (schema illustration, not contestant seed data):

```json
{"scores":{"day_1":"0.000","day_2":null}}
```

Original strings, decimal commas, nulls and zeros are preserved. Totals and ranks are never recalculated in the UI. Optional public city/school/team/comments are supported; no private contact data. Source fidelity and permission to publish personal participant data still require human review.

Availability classifications are `FULL_OFFICIAL_STANDINGS`, `OFFICIAL_STAGE_RESULTS`, `OFFICIAL_WINNERS_ONLY`, `SECONDARY_RESULTS_ONLY`, `NOT_FOUND`, and `NOT_YET_PUBLISHED`. Availability describes the source/stage; `coverage` separately describes the locally prepared selection. Partial/unknown coverage is explicitly labelled, even for an official source. Unclassified legacy sets are marked completeness unverified. A classification never changes the `published` flag.

## Curated content and Kazakhstan holds

`presentation-draft.json` lists **all 15 requested targets** in priority order, without silently replacing Kazakhstan targets. It is a review companion, not executable import input. Thirteen have scoped metadata; AI Olymp Kazakhstan 2025/2026 remain held for unresolved full final dates/source verification. Optional series/media/stage data for existing five records also remains review-only; those UUIDs and hosted metadata were not changed.

The existing ready batch remains 15 metadata drafts (13 requested + 2 explicitly proposed replacements), 14 partial unpublished result sets, and 49 rows. No rows have been imported. The replacements are not approved by preparing this file. New edition forms carry series/year metadata; every prepared set carries exact stage label, source classification and partial coverage. Seven existing FAIO/IAIO selected rows now include their verified original task/round score strings in import-ready `presentation.scores`, with matching declared columns. No additional participant rows were invented.

The offline preview still has no apply mode. It additionally rejects mismatched coverage/stage labels and undeclared score fields. Content can enter the database only through the authenticated admin workflow after separate approval; publication is a separate action.

**AI Olymp 2025:** the screenshot is not attached/read. The updated pending template records the eight user-described columns and marks them unverified; qualification/final row arrays remain empty and import is disabled. Red color never excludes a participant. Supply a full-resolution image/export and organizer provenance; reconcile all 38 user-reported participants independently before entry.

**AI Olymp 2026:** the supplied public sheet has 39 observed rows and three task components, but public access/self-labelled final does not establish organizer ownership, post-appeal publication or exact edition dates. The official source status remains held, no participant rows imported/copied into the ready batch. Obtain CPFED/DSML confirmation; qualification needs its own distinct source. See the [curated review](curated-content-review.md) for the exact spreadsheet URL and checks.

## Review / release checklist

- [ ] Review the additive migration against the release database and current main migration order; apply only through the authorized release workflow.
- [ ] Supply/verify Kazakhstan sources and approve metadata/date scope independently; do not fill missing facts with defaults.
- [ ] Approve exact 15-target selection or the two proposed replacements explicitly.
- [ ] Review media provenance/reuse rights; placeholders are acceptable without assets.
- [ ] Reconcile original score columns, ties, awards and partial coverage against sources.
- [ ] Refresh a complete admin snapshot; preview still reports zero writes and does not authorize import.
- [ ] After separate approval, enter unpublished drafts, reconcile them, then explicitly publish.
- [ ] Real browser QA after migration: desktop/mobile, dark/light, keyboard navigation, related editions, qualifier/final switching, winners-only labels, empty/failed media, missing tasks/results, no horizontal page overflow.
- [ ] Anonymous/member/admin QA: only published results public; non-admin writes denied; draft contents remain inaccessible.

Local automated checks include real validators/server-action boundaries, offline duplicate/import regression tests, rendered results smoke tests and static migration checks. Browser click/visual QA and migration execution are not claimed by those tests.

## Finalization verification — 2026-10-12

- `npm ci`, TypeScript, ESLint, all 165 regression tests (including 51 competition/results/content tests), production build and whitespace checks passed.
- Offline preview: valid, zero errors, zero writes, approval still required. Fifteen review targets, 14 partial sets and 49 rows remain preserved; no content was imported or published.
- Computer-use browser QA used the isolated KAIZ production build on port 3100 because port 3000 serves another project. The directory read the existing five hosted competitions; mobile/dark and desktop/light DOM checks found no horizontal page overflow. Existing detail URLs resolve their metadata but correctly fail the new result query until the migration exists. Therefore detail-section/stage clicks, failed-media fallback and live draft-visibility/browser QA remain unverified release gates, not browser passes. Rendering/security regression tests cover their server structure and query boundaries.
- Local database execution/live RLS could not run without Docker/PostgreSQL. No hosted migration or production content write was attempted.
- Dependency audit reports six high-severity advisories in the existing Next.js/tooling dependency graph. No unrelated dependency versions or lockfile changes were made; the release owner must review these separately before public release.
