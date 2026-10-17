# Source-backed competition publication review — 2026-10-17

Refs #21. This is a review package, NOT permission to import or publish.
PR #22 assets and validators are retained. The new manifest replaces neither the
existing five production competitions nor their UUIDs/slugs. No production writes.

## Prepared inventory

`content/competitions/2026-10-17/publication-manifest.json` contains the exact 15
requested targets, not two replacement editions disguised as Kazakhstan records.
13 have metadata drafts; the two AI Olymp Kazakhstan editions remain held.

| Edition | Results prepared | Missing / caveat |
| --- | --- | --- |
| IOAI 2024 | 3 selected Scientific Round entries | Remaining Scientific and Practical coverage |
| IOAI 2025 | 284 Individual, 10 Team Challenge Final, 16 GAITE | Full coverage of these named public tables only |
| IOAI 2026 | 440 Individual, 26 GA I TE | Full coverage of these named public tables only; current Astana edition |
| APOAI 2026 | 6 selected individual entries | Rest of table; June 13 competition day, not June 13–20 |
| EUROAI 2026 | 4 members + 2 remote entries | Rest of both divisions; remote rank stays null |
| Winter IAIO 2026 | 3 selected Final entries, Round 1/2 components | Remaining table; components are not separate qualifier/final rankings |
| AI Olymp Kazakhstan 2025 | 38 screenshot rows transcribed privately | Event identity, dates, source finality, spelling review and redistribution approval |
| AI Olymp Kazakhstan 2026 | 39 spreadsheet rows reviewed privately | Organizer authority, exact stage/finality and redistribution approval; qualification source |
| FAIO 2025 | 4 selected Final rows with five original problem scores | Remaining standings |
| FAIO 2026 | No native rows prepared in this package | Public qualifier source exists; Final October 27–28 has not happened |
| NEOAI 2025 | Metadata only | Official aggregate standings, not late Kaggle submissions |
| NEOAI 2026 | Existing metadata retained | Official aggregate standings and organizer/location caveat |
| USA–NA–AIO 2025 | Metadata only | Official edition-specific standings |
| Poland II OAI 2025 | 3 Stage I, 3 Stage II, 5 Final selected entries | Full qualifier/final coverage; Polish award classes are not inferred Gold/Silver |
| Romania ONIA 2026 | National-stage metadata | Separate grades 9–10 / 11–12 datasets, exact ranks and awards |

The public review manifest has **14 sets / 809 rows across eight editions**:
five complete source tables (776 rows) and nine partial sets (33 rows).
It reuses the previous 14-set/49-row research rather than presenting that sample as
complete standings. Existing metadata provenance remains dated to its original
review; the HTTP reachability sidecar is not a fresh field-by-field verification.

## Original values and provenance

IOAI official HTML splits 2025 tables by medal bands; the parser joins continuation
tables without dropping their first data row. Stage headings remain separate.
Original component strings, decimal commas, totals, ranks, ties, names and actual
award labels are retained. Empty awards stay null. No medal thresholds are inferred.
IOAI component sums reconcile with the published totals. Countries/regions/team
labels are preserved as original presentation text, not guessed citizenship codes.
FAIO/IAIO selected component strings are retained from the existing reviewed sidecar.
Partial-row provenance never pretends the selected-row position is an official rank
or source row number. Stable participant IDs are hashes of stage/name/source region.

Each stage and row identifies its official source. Source verification and KAIZ
publication approval are separate. All publication approvals are pending; all sets
remain `published: false`. No user-account linking is inferred from display names.

## Kazakhstan quarantine

The newly supplied screenshot has 38 visible rows, tied rank 36, three red rows and
matching remote + day 1 + day 2 totals. All red rows are retained. The bottom legend
includes “Вне конкурса”; color alone is not assigned as a medal or disqualification.
There is no event title/year/date on the image. The government retrospective names
40 finalists, so screenshot completeness against the event roster is unverified.
One city spelling remains flagged for comparison to the original export.

The anonymous 2026 workbook export contains one tab `leaderboard_final`, 39 ranked
rows, 16 repeated ranks, and three named task columns. All totals reconcile. No
award column or separate qualification tab was present. The official CPFED/Nitro
second-round page corroborates two task titles, but does not establish that the
user-supplied workbook is an authorized public final publication. The user reports
organizer distribution/team selection; that is not independent redistribution proof.

Both transcriptions and original binary sources remain in a restricted local review
directory outside Git. No student rows from these sources are committed or published.
The old empty screenshot template remains as historical template; it is not used
to claim that the newly supplied image is still missing.

Source fingerprints (not private data):

- Screenshot SHA-256: `e05219f58a99a58d722c359bd7ae6d387987312f661d5035cb210892b05b35ea`
- 2026 workbook SHA-256: `4725716b700a43e9b8ae6708a2513159b4d232f34bf77a05a7888b8bfdf4cb7f`

## Reproducible review

```text
node scripts/content/prepare-official-ioai.mjs
node scripts/content/check-publication-sources.mjs
node scripts/content/publication-preview.mjs
node --test tests/content-import.test.mjs
```

The first command regenerates the tracked review candidate from two allowlisted
public organizer pages; inspect the Git diff before accepting any source change.
The preview has no network/database credentials/apply mode and reuses the existing
strict import validator. The current preview is valid with 8 potential new metadata
records, 2 review-only patches, 3 unchanged records, 14 draft sets and 809 draft rows.
The snapshot is older than this package, so approval remains blocked until refreshed.
An identical reviewed snapshot replays as a no-op; changed rows become conflicts.

Opt-in `tests/content-publication.postgres.mjs` requires an installed disposable
PostgreSQL 17 runtime and the exact PR #24 presentation migration file. It verifies
all 809 names/ranks/score strings/awards/component fields, replay without duplication,
the five baseline competition records unchanged, and anonymous/member draft access.
Only a disposable local database is used, never a connection URL or hosted account.

## Owner approval checklist / exact production procedure

1. Review metadata dates/scope/organizers against the linked originals. Preserve the
   existing five UUIDs, including review-only metadata proposals; do not silently update.
2. Resolve publication permission and identify approved stage IDs explicitly. Keep
   both Kazakhstan sources excluded until organizer confirmation and spelling review.
3. Refresh an admin-complete, read-only production inventory (drafts included). Run
   the manifest preview and review every conflict/change. Reconcile expected counts.
4. Release PR #24 only after separately approving its exact presentation migration
   `202610120001_competition_presentation.sql`. This package needs no new migration.
   Do not bundle personal-practice migrations or run a generic migration push.
5. Through the normal authenticated admin workflow, create only approved missing
   metadata, then **draft** result sets, then their source-backed rows. Use the adapter
   forms plus matching `standingsPresentation` fields. Retain stable participant IDs,
   original columns, source and row provenance; do not bypass RLS with ad-hoc SQL.
   Per-row provenance is retained in the versioned review manifest keyed by the
   stable participant ID; the existing admin form does not edit raw row metadata.
6. Compare draft counts and sample rows (first/middle/last, ties/zero/missing/awards)
   to the source. Re-run preview against the saved inventory to ensure no duplicates.
7. Obtain the owner's explicit per-stage publication authorization, then publish
   those stages only. Check anonymous/member visibility and that other drafts stay hidden.
8. QA Results stage selection, participant search/award filters/paging/mobile scrolling,
   source attribution and verified task links. Stop on discrepancies; never overwrite
   existing source-backed rows automatically or fill unavailable finals with qualifiers.

This task performs none of those production write/release steps. Native Kazakhstan
2025/2026 public-page journeys remain **BLOCKED**, not mocked PASS.
