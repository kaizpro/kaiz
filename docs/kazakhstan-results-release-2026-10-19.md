# Kazakhstan-first standings release preparation — October 19, 2026

Preparation/testing only. **No production import, publication, migration, merge,
deployment or configuration change was performed.** Refs #21.

## Current production and accepted code

- Main / successful Production deployment: `c063ffb779fdf66486cbd2d2d2b74fde87b89b69`.
- #44 award wrapping and #45 metadata preparation are both merged and deployed.
- Hosted project identity verified: `oolaemebhoytzuussigu`, KAIZ platform.
- Nine migrations, ending in `202610150001_learning_progress`; presentation
  `202610120001` is already applied. Do not repeat it or apply 16/17.
- Fresh admin-complete, transaction-read-only inventory: 5 competitions,
  0 result sets, 0 rows, 0 published sets/rows. Eight profiles/Auth users,
  four learning-progress records, two posts and one comment.
- Before/after competition, profile, learning-progress, post and comment
  fingerprints and all counts match. Existing production users were not copied.

Evidence: `content/competitions/2026-10-19/kazakhstan-release-verification.json`.

## Separate release batches

| Batch | Exact scope | Status |
| --- | --- | --- |
| A: approved metadata inventory | 8 additions, preserve existing 5, no standings | Valid dry run; still needs explicit production execution approval |
| B: Kazakhstan parent templates | 2025 and 2026, 2 additional metadata records | Held: owner-reported dates and original final-version verification |
| C: Kazakhstan draft standings | 2 sets, 38 + 39 = 77 rows | Native draft forms prepared outside Git; parent records absent; no executable production queue |
| D: public Kazakhstan standings | Same two reviewed sets / 77 rows, not new duplicate sets | Held until original-version checks, draft reconciliation and separate publication approval |
| E: other non-IOAI samples | 8 partial sets / 30 rows | No sets cleared; redistribution authorization not established |

Batch A is the existing, unchanged `metadata-batch.json`: IOAI 2024 **metadata
only**, Winter IAIO 2026, FAIO 2025, FAIO 2026, NEOAI 2025, USA–NA–AIO 2025
(Round 2 scope), Poland II OAI 2025 and Romania ONIA 2026.
Its latest dry run is **8 create_competition, 5 skip, 0 update, 0 result writes**.
Dates, identities and official URLs retain #45's reviewed scopes. NEOAI's Russia
mapping describes organizer/host context, not every participant's location.

Kazakhstan templates are in `kazakhstan-metadata-review.json`, deliberately
separate from A. Do not silently turn eight approved additions into ten.
After A there would be 13 competitions; after a separately cleared B, 15.
Neither competition creation nor `verified=false` makes metadata private.

## Permission and original-source checks

`kazakhstan-permission-review.json` records the release owner's October 19
attestation and clarification: KAIZ may display the supplied Kazakhstan participant
names/results with attribution. **This permission is confirmed**, not still missing.
No independent organizer permission document was reviewed and no production
execution permission is implied. The original 2026 document must not be linked or
shared publicly without separate permission. Public attribution uses the event
reports below and explicitly identifies them as context, not the score originals.

### Kazakhstan 2025

- [Official event report](https://www.gov.kz/org/maidd/press/news/details/989919)
  and [general partner report](https://astanahub.com/en/article/v-astane-zavershilas-pervaia-respublikanskaia-olimpiada-po-iskusstvennomu-intellektu-ai-olymp)
  corroborate the first national edition, Astana IT University and CPFED/DSML.KZ.
- Owner-reported event programme: **May 3–5, 2025**. A May 5/6 article dateline
  is not independent proof of the entire programme. Finality/identity must still
  be documented against the organizer original; the screenshot itself has no
  event title/year/date.
- All **38** supplied rows retained. Independent visual comparison matched all
  names, ranks and score cells and 37 city cells, **303 cells** in total. One
  city spelling remains flagged; its private transcription is preserved, not
  silently corrected. Every remote + day 1 + day 2 sum reconciles.
- Red rows at ranks 8, 12 and 15 remain ranked entries. Tied rank 36 occurs twice;
  missing rank 37 is not generated. No medal/exclusion is inferred from color.
- Stage is intended **Final standings (includes remote stage)**. Original score
  columns: `Баллы за remote stage`, `Баллы за первый день`, `Баллы за второй день`,
  and total `Сумма Баллов`. The remote component is not an independent qualification
  table. No separate qualification source was supplied.

### Kazakhstan 2026

- [Official event report](https://www.gov.kz/org/astana/press/news/details/1199320)
  corroborates the second edition and two-day final at Astana IT University.
  The [official Second Round platform](https://judge.nitro-ai.org/competitions/cpfed/ai-olymp-2026-second-round)
  corroborates April 12 only; it must not be relabelled as a complete final ranking.
- Owner-reported programme **April 10–13, 2026**, competition days April 11–12.
  Original programme/final-version confirmation remains open, as explicitly
  acknowledged in the owner's clarification.
- All **39** rows / **328** header-and-data cells match the archived workbook,
  its earlier private transcription and a fresh anonymous export. Three-task
  totals reconcile. Sixteen rows repeat an earlier rank. Original names, source
  usernames, scores and ties are retained; source usernames are not linked to
  KAIZ accounts. No award column exists, so awards stay null.
- Intended stage: **Final standings**, source tab `leaderboard_final`. Columns:
  `Username`, `First Name`, `Last Name`, `Total Score`,
  `Zhuldyzzhan's Detective Agency`, `Forgotten labels`,
  `Jimmy and Aibek brotherhood`. Display combines the original first/last names,
  retains source username separately and preserves all three task labels/values.
  No qualification dataset is invented.

Both source reports mention 40 finalists, while the supplied tables have 38/39.
All supplied rows are prepared, but full-roster completeness is **not** established.
Both draft titles visibly say **partial supplied table** and the UI discloses
selected entries, rather than falsely claiming full official standings.

Original image/workbook and all 77 derived participant rows remain in the existing
restricted local content-review directory, outside Git. Only hashes/counts,
permission scope, metadata templates and non-personal QA evidence are committed.
Do not attach original documents, private contacts or participant dumps to a PR.

### Private link remediation

The old research inventory, stage catalogue and review document contained the
private 2026 Sheet URL. This change removes it from current files, leaves the
stage's supplied URL null, and uses the public report only as clearly labelled
event context. The 809-row publication manifest and original scores are unchanged.
**This does not erase prior commits or PR diffs.** No history rewrite or document
sharing-setting change was authorized or performed. Removing a current link does
not revoke an old publicly readable document URL.

## Other standings and IOAI exclusion

| Non-IOAI partial sample | Rows | Publication clearance |
| --- | ---: | --- |
| APOAI 2026 Individual | 6 | Held |
| EUROAI 2026 Member / Remote | 4 / 2 | Held |
| Winter IAIO 2026 Final | 3 | Held |
| FAIO 2025 Final | 4 | Held |
| Poland II OAI 2025 I / II / Final | 3 / 3 / 5 | Held |

Fresh official source requests succeeded. Earlier name/score containment checks
remain supporting evidence, not a new complete transcription. No native
redistribution grant was established. EUROAI registration terms §10.2 describe
publication by the organizer/host/accredited organizations, not an established
KAIZ grant. A task-repository licence does not automatically cover its separate
results sheet. Keep all eight samples as explicitly partial drafts; none is cleared.

The original nine partial samples also contain **IOAI 2024 Scientific, 3 rows**.
It is excluded from this non-IOAI release. Also exclude all five complete named
IOAI 2025/2026 tables: **284 + 10 + 16 + 440 + 26 = 776 rows**.
Thus **six IOAI sets / 779 rows** are out of scope, not deleted. Their prepared
data and official links remain intact. Production currently has no result rows to
expose; isolated guest/member checks confirm unpublished data stays invisible.

## Validation and browser evidence

- Reuses the existing strict content planner, result schemas, publication model,
  admin authorization and RLS. New adapter has no network, credential or apply path.
- Fresh production dry run correctly **rejects** the Kazakhstan standings because
  both competition parents are absent. It produces no entry queue. Do not replace
  missing real metadata with fabricated dates to make that check pass.
- Synthetic-inventory rehearsal validates all 77 forms, 2 draft sets, complete
  no-op replay and conflict rejection. Passing validation does not clear provenance.
- Disposable PG17 on exactly the nine production migrations: 8 metadata additions,
  replay adds 0, transaction rollback, presentation round-trip, existing-five
  preservation, anonymous reads and member mutation denial pass.
- Existing approved Free isolated Supabase project `venniccblkybvfbxyhug`: real
  disposable Auth admin/member sessions, 13 labelled QA metadata copies plus 2 explicitly
  synthetic Kazakhstan shells, 77 real source rows round-trip; duplicate key
  denial `23505`; failed multi-row request rolls back; replay does not duplicate.
  Service credentials were used only for disposable-account bootstrap/cleanup;
  content writes used authenticated admin sessions and actual RLS.
- Guest/member draft reads return zero; member publication update affects zero
  rows, forged insert/anonymous write denied `42501`; published QA-only rows are
  readable, separate private control stays hidden. Member browser admin route denied.
- Local Next app connected only to that QA project: **8 Kazakhstan detail views,
  308 rendered row checks**, Overview/Results/Tasks, original columns, ranks/ties,
  search, public-report attribution, mobile/desktop, light/dark, keyboard scrolling
  and no document overflow. No award selector is fabricated when no awards exist.
  Qualification tabs are absent because no qualification rows exist. Both tables
  fit one 50-row page; paging/award filters are separately exercised by existing
  actual-component fixtures, not invented extra Kazakhstan contestants.
- Existing component coverage: 60 edition / 56 stage views / 108 task links pass;
  #44 wrapping fix now passes all 8 desktop/mobile/theme/100–200% text cases.
- All isolated competition/result records and both disposable Auth accounts were
  removed; final inventory is zero competitions/sets/rows/users.
- Production guest GET/HEAD-only smoke: 16 route / 10 existing competition views,
  filters and honest Results/Tasks empty states pass. Kazakhstan pages were tested
  locally, **not claimed to exist in production**. Production preservation includes
  the four real learning records. No authenticated production mutation was tested.
- TypeScript, ESLint, **222** regressions, production build and diff check pass.
  Two early QA harness runs stopped on an incorrectly constructed atomicity test
  (mismatched payload keys, then ranked-without-rank fixture), cleaned up and were
  corrected without changing application/schema/security behavior. Final run passes.

The QA project has later practice migrations from prior work. It is not proof
that production has 16/17; the exact-nine-migration PG check separately establishes
the required metadata/presentation schema. No hosted migration was run here.

## Staged owner checklist — future actions only

1. Review/approve this preparation PR. No application code or migrations changed.
2. Clear the organizer-original identity/final-version and reported-date checks
   for each Kazakhstan source hash separately. Keep all rows, ties and null awards.
   Confirm the one city spelling or explicitly retain its review note. No need to
   authorize sharing the private Sheet to authorize native KAIZ standings.
3. Review backup risk before granting any production-write authority. The encrypted
   October 14 backup and metadata checksums still match, but the backup is outdated.
   Full restore remains **unverified**, including the managed Vault dependency.
   Archive integrity is not demonstrated recovery. A fresh backup or explicit risk
   decision is a separate owner step, not silently performed here.
4. Separately authorize Batch A, refresh an admin-complete read-only inventory,
   stop on duplicate/alias/drift, create only the eight missing approved editions
   through normal authenticated admin forms. Record actual UUIDs; preserve the five.
5. After B is cleared and separately authorized, create only the two missing
   Kazakhstan metadata parents. Re-inventory before retrying uncertain responses.
6. Separately authorize C: create two **unpublished** sets using actual parent UUIDs;
   inventory all admin-visible drafts first. Preserve each real set UUID and stable
   source-row identifiers; add exactly 38/39 original rows with native score fields.
   No account linking, inferred medals or remote-as-qualifier transformation.
7. Read back every field, total, tie, count and source note. Confirm guests/members
   still cannot read drafts or publish. Check replay inventory before any retry.
8. Only after explicit publication approval, publish those two exact reviewed set
   UUIDs, not duplicate copies. Expected public outcome: 2 sets / 77 rows, no IOAI
   rows and no other partial samples. Verify native pages as guest/member/admin,
   search, original columns/medals-as-empty, source links, partial label, mobile,
   themes, keyboard and existing profile/Auth/learning/discussion routes.
9. Compare protected production counts/fingerprints; stop on any discrepancy.

Admin operations are individually committed, not an atomic bulk import. There is
no natural unique stage key; use one operator and saved UUID checkpoints. Publication
and child verification updates are separate requests. On partial/uncertain failure,
stop, read back state and reconcile. Do not blindly retry, overwrite verified rows,
delete genuine content or assume automatic rollback/recovery.

**Decision:** metadata A is ready for owner review/execution approval. Kazakhstan
native forms and isolated security/UI tests are ready for review, but production
publication is **NO-GO pending organizer-original final-version/date verification**.
Other non-IOAI native publication is held for rights clearance. No new migration
is required; IOAI publication remains a separate rights decision.
