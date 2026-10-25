# Kazakhstan organizer-backed release: B / C / D

Prepared 2026-10-25. Preparation is **not production execution authorization**.
Use the existing premium competition pages, admin forms and strict content planner.
No migration, IOAI publication, new ingestion system or production-user changes.

## Evidence and scope

The release owner, Zhunussov, confirms that the exact 2025 image and 2026 workbook
came directly from official organizers, were used for national camp selection and
medal awards, and may be displayed on KAIZ as participant names, scores and ranks.
These originals are primary sources. A further public PDF is not required.
This owner attestation is recorded in `content/competitions/2026-10-25/organizer-evidence.json`;
it is not a claim that an independent legal permission document was reviewed.
Restricted originals, named-row batches and the reviewed medal alias join stay
outside Git. Permission to display standings does not authorize sharing the private
2026 workbook or its sharing URL.

Public attribution:

- [2025 organizer recap](https://dsml.kz/ru/news/d6e58068-8ad0-4f7e-b536-51fa8389b0d9)
- [2025 organizer qualification tasks / solutions](https://dsml.kz/articles/ai-olympiad-qualification-results)
- [2026 federation recap](https://cpfed.kz/en/news/ai-olymp-2026)
- [2026 organizer awards and task links](https://dsml.kz/ru/news/87047a67-d53a-409e-9ed5-eb32341485d7)

### 2025

All 38 supplied rows, including red-highlighted rows, are retained. Rank 36 appears
twice; do not renumber. Preserve remote-stage, first-day, second-day and total
scores. The organizer reports 40 finalists: the table is the authoritative provided
version, **not a reconstructed complete 40-person roster**. No two missing entries
are invented and no medals are inferred from colour or rank.

One city transcription remains uncertain. Preserve it verbatim and retain the
verification note internally. The organizer qualification article corroborates
the associated school spelling, not a canonical city name.

Astana IT University / Astana is supported by the official partner report.
May 3–5 remains the owner's reported programme window, not independently verified
contest dates. The metadata candidate explicitly discloses this limitation and
remains `verified=false`. Batch B approval must accept this precise caveat or supply
a corrected organizer date range. Do not infer dates from the May 5 recap timestamp.
The public qualification task collection is available; exact final task URLs remain
unverified and are not fabricated. No qualification standings are imported.

### 2026

All 39 `leaderboard_final` entries, original names, ranks/ties and three task-score
columns are retained. Forty students qualified; do not invent a 40th entry or claim
that every qualifier appears in the provided standings.

April **11–12, 2026** are the verified competition rounds at Astana IT University.
Do not carry forward the previously reported April 10–13 programme as contest dates.
The organizer lists 3 Gold, 5 Silver and 15 Bronze recipients. All 23 award names have
unique, explicit original-name matches, including transliteration and name-order
differences. Matching is not based on rank. The other 16 supplied entries have no
invented award. Public medal rates, where shown, use the expressly labelled 39-row
provided-table population, not all 40 qualifiers.

Tasks, linked from the organizer announcement:

| Round | Date | Source task |
| --- | --- | --- |
| First | April 11 | [Jimmy and Aibek brotherhood](https://judge.nitro-ai.org/competitions/cpfed/ai-olymp-2026-first-round/1/view) |
| Second | April 12 | [Zhuldyzzhan's Detective Agency](https://judge.nitro-ai.org/competitions/cpfed/ai-olymp-2026-second-round/1/view) |
| Second | April 12 | [Forgotten labels](https://judge.nitro-ai.org/competitions/cpfed/ai-olymp-2026-second-round/2/view) |

Statements are readable publicly; competition participation/submission requires
account/invitation. KAIZ links and attributes them, without copying statements or
bypassing access restrictions. Existing task IDs `source-1` and `source-2` stay stable.
The 2026 aggregate workbook is one Final result set, not separate inferred standings
for each task/round.

## Three separate execution gates

Before each gate: confirm production project `oolaemebhoytzuussigu`, get a fresh
admin-complete read-only inventory, check all draft/published sets, freeze candidate
hashes, review backup limitations and obtain exact owner authorization. Do not run
an importer from a stale inventory. Stop on any conflict or uncertain write outcome;
inspect read-only by slug, UUID and stable source-row ID before planning a resume.

### Batch B — metadata only

Candidate: `content/competitions/2026-10-25/metadata-batch.json`.

- Exactly `ai-olymp-kazakhstan-2025` and `ai-olymp-kazakhstan-2026`.
- Expected inventory: 13 -> 15 competitions; all original 13 UUIDs and fingerprints unchanged.
- No result sets/rows, no publication and no changes to users or existing competitions.
- Use existing authenticated admin creation workflow; save and read back each UUID
  and every field. Replay is inventory-and-skip, never an automatic conflicting update.
- Any slug/edition alias conflict stops the batch. Verify both public pages and
  honest Results empty states. New source-guide content needs its own reviewed code release;
  this preparation does not merge or deploy it.

### Batch C — unpublished drafts only

Only after B's exact parent UUIDs are verified and a separate owner approval:

- `ai-olymp-kazakhstan-2025-final`: 38 rows, `Final standings (includes remote stage)`.
- `ai-olymp-kazakhstan-2026-final`: 39 rows, `Final standings`.
- Both titles explicitly say partial supplied table; `coverage=partial`,
  `published=false`, `source=organizer_provided`.
- Reuse `scripts/content/kazakhstan-results-plan.mjs` and
  `scripts/content/plan.ts`; private originals and the reviewed exact-name award
  mapping are inputs outside Git. Never use fuzzy name matching or medal thresholds.
- Stable row IDs remain `kz-2025-image-row-N` / `kz-2026-final-row-N`.
  No automatic KAIZ account links, score repairs or rank recomputation.
- Read back all 77 rows, original score fields, ties, awards, source URLs and notes.
  Identical replay skips; conflicting drafts/verified rows stop without overwriting.
- Admin can inspect drafts; anonymous and ordinary members must see neither sets
  nor rows. No special admin access to private learning/practice data is introduced.
- A failed individual database request is atomic; multiple admin requests are not
  one transaction. Do not claim all-or-nothing import across requests. On partial
  failure, stop, inventory saved UUIDs and reconcile; no blind retry or bulk deletion.

### Batch D — publication only

Only after C readback / RLS / browser QA and separate owner approval of the exact
two set UUIDs and hashes. Publish those two sets only; verify anonymous access to
77 authorized rows and continued denial for any other drafts. IOAI and all unrelated
standings remain untouched. If discrepancies appear, stop and request an exact
remediation authorization; do not silently edit or delete published results.

## Recovery risk

The October 14 age-encrypted full dump and security metadata retain their recorded
SHA-256 checksums. Independent Google Drive retrieval was verified at backup time.
That snapshot has only 5 competitions / 7 Auth users / six migrations and predates
recent changes. A PostgreSQL 17.7 restore attempt **failed atomically** because
`supabase_vault` 0.3.1 was unavailable. Full database or managed-Supabase recovery is
not demonstrated. The October 25 metadata-only checkpoint predates Batch A and is
not a fresh full backup. Recheck integrity, seek a current secure backup where
available, and explicitly disclose/accept the residual risk before each production
write. This preparation exports no production backup and changes no settings.

## QA and release checklist

- Strict offline B dry run: exactly two creates against 13 existing editions;
  zero standings actions. C rehearsal: two drafts / 77 rows conditional on B UUIDs.
- Original hashes, all legible 2025 cells, all 2026 workbook cells, totals, red rows,
  tied ranks and all 23 exact medal mappings checked without exposing private files.
- Isolated Supabase only: authenticated admin import/readback/replay, failed-request
  atomicity, anonymous/member draft denial, member publication denial, QA-only
  published rows and a hidden draft control. Remove owned QA fixtures afterward.
- All 15 pages: Overview / Results / Tasks, desktop/mobile, light/dark,
  reduced motion, keyboard and 200% text sizing. Verify source links and no private
  workbook links. Native Kazakhstan row-by-row checks, search and award filters;
  shared larger synthetic standings exercise pagination beyond 50 rows.
- Real isolated Auth / progress / XP / undo / owner-only RLS regression tests.
- TypeScript, ESLint, application regressions, canonical disposable SQL suite,
  production build, static Learn cache/browser checks and diff check.
- After an authorized release, repeat production page checks and preservation
  fingerprints. A passing isolated test is not a claim of production publication.

Historical October 19 held manifests remain historical evidence. The dated October
25 authority record supersedes their source-finality hold, not their original files.
