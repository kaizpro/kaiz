# Fifteen-edition content release preparation

Refs #21. Owner: Zhunussov. Reviewed October 19, 2026, Asia/Qyzylorda.
This package does not import, publish, merge, deploy or change production.

## Release decision: split metadata from standings

**A — Metadata candidate:** eight missing verified editions can proceed to owner
review independently of IOAI results republication permission. Five existing
competition UUIDs and all their fields remain unchanged. Two Kazakhstan editions
are held, not replaced with unrelated events to reach fifteen.

**B — Public-source standings:** retain the merged 14-set / 809-row manifest as a
review candidate, unchanged. Every result set remains unpublished. Public viewing,
an official backlink and an owner approving code are not redistribution permission.
No explicit grant covering KAIZ's republication of these named results was identified.
This is a release gate, not a legal determination that factual scores are copyrighted.

**C — Restricted Kazakhstan datasets:** 38 screenshot rows and 39 workbook rows
stay outside Git and every public import batch. Organizer distribution for national
selection does not establish permission to publish students' data publicly.

Merging this PR alone changes **no production listings or results**. It adds a
review package, offline preview and tests, not runtime fallback data.

## Current state, checked rather than assumed

- Main `9709ef8db6fc58d4d18675ada214e66245078e6d`; #24 and #41 merged.
- GitHub-reported Vercel Production deployment at that commit: success.
- #44 award readability and #42 external practice remain open, not merged.
- Correct hosted project `oolaemebhoytzuussigu`: read-only transaction confirmed.
- Nine migrations, including `202610120001_competition_presentation.sql` and
  `202610150001_learning_progress.sql`; personal/external practice 16/17 absent.
- Five competitions: IOAI 2025, IOAI 2026, APOAI 2026, EUROAI 2026, NEOAI 2026.
  Zero result sets/rows, including drafts. All three presentation columns exist.
- RLS remains enabled; published-parent result visibility and admin-only mutations
  remain intact. No policy/grant/schema modification belongs to this release.
- Sanitized inventory and capture timestamp: `production-state.json` and
  `production-snapshot.json` in `content/competitions/2026-10-19/`.

## Exact edition inventory

Names, organizers, country/city, date range, format, eligibility and attribution are
in the existing edition metadata references and generated `metadata-batch.json`.
Ranges are explicitly scoped; arrival dates, multi-stage seasons and competition
days are not silently conflated. No registration URL, city, award or missing date
is invented. New listings retain `verified: false` for the admin's review.

| Edition | Metadata disposition / date scope | Results prepared |
| --- | --- | --- |
| IOAI 2024 | New; Burgas, Bulgaria, August 9–15; LERAI Foundation | Scientific sample, 3 team rows; Practical separate |
| IOAI 2025 | Preserve existing Beijing record | Individual 284, Team Challenge Final 10, GAITE 16 |
| IOAI 2026 | Preserve existing Astana record | Individual 440, GA I TE 26 |
| APOAI 2026 | Preserve; June 13 competition day, distributed hybrid | Individual sample, 6 rows; source has 128 |
| EUROAI 2026 | Preserve; July 14–19 Cluj-Napoca, not 2027 Belgrade | Member sample 4, Remote sample 2; Guest not prepared |
| Winter IAIO 2026 | New; February 23–27 Ljubljana; IRCAI / Jožef Stefan Institute | Final sample 3; source has 95 |
| AI Olymp Kazakhstan 2025 | Hold; exact final dates and screenshot identity unresolved | 38 restricted screenshot rows |
| AI Olymp Kazakhstan 2026 | Hold; Second Round date is not a full final-programme range | 39 restricted, Final-labelled workbook rows |
| FAIO 2025 | New; September 28 qualifier, October 30–31 Almaty final; FAIO | Final team sample 4 |
| FAIO 2026 | New; September 20 qualifier, October 27–28 final; Fizmat | Qualifier source exists; zero native rows; final still future |
| NEOAI 2025 | New; May 6–11 hybrid; Central University / AI Alliance | No audited aggregate standings prepared |
| NEOAI 2026 | Preserve; May 3–4 distributed hybrid | No audited aggregate standings prepared |
| USA–NA–AIO 2025 | New; listing explicitly covers April 27 Round 2 at MIT | No usable edition-specific award table verified |
| Poland II OAI 2025 | New; February 17–June 2 season; FERSI | Stage I 3, Stage II 3, Final 5; all partial |
| Romania ONIA 2026 | New; April 17–20 national programme, contest April 18; UPIR | Grade-section datasets not transcribed |

The eight new IDs are `ioai-2024`, `iaio-2026`, `faio-2025`, `faio-2026`,
`neoai-2025`, `usaaio-2025`, `poland-oai-2025`, `onia-2026`.

NEOAI country/organizer caveat is retained: Russia describes organizer/host context,
not every distributed participant's location. The approved Central University
mapping for 2026 is not a uniquely established canonical international host. No
city is invented. Kaggle is not used as a registration URL.

## Sources, stages and completeness

`release-catalog.json` references exact official sources and the unchanged merged
manifest. It does not duplicate the 809 participant rows into another inventory.

- [IOAI 2024](https://ioai-official.org/bulgaria-2024/): Scientific and Practical
  rounds; Scientific has at-home and on-site tasks, not a fabricated qualifier.
- [IOAI 2025 results](https://ioai-official.org/china-2025/results-2025/) and
  [IOAI 2026 results](https://ioai-official.org/republic-of-kazakhstan/results-2026/):
  five complete **named source tables**, 776 rows; not all event stages or rosters.
- [APOAI 2026](https://www.apoai.org/apoai2026): keep normalized scores, tied ranks,
  blank awards and N/A exactly; the six-row candidate is not full standings.
- [EUROAI 2026](https://euroai-official.org/2026/results/): Member/Remote/Guest are
  divisions, not rounds. Non-member rank blanks stay null; no inferred medal cutoff.
- [Winter IAIO](https://iaio-official.org/olympiad-2026/) and its
  [results](https://iaio-official.org/results2026/): Round 1/2 are final-score
  components, not independent qualification rankings. IAIO is not IOAI.
- [FAIO 2025](https://www.faio.kz/2025/): archive's own translation data confirms
  qualifier/final dates; linked public final sheet is a separate rights source.
  [FAIO 2026](https://www.faio.kz/) / [qualifier](https://www.faio.kz/results/) /
  [final programme](https://www.faio.kz/final/): qualification invitations do not
  become final standings before October 27–28.
- [NEOAI 2025 retrospective](https://ioai-official.org/northern-eurasia-oai-2025/)
  and [2026 organizer](https://cu.ru/olympiad/events/neoai): task leaderboards and
  homework are not verified aggregate final results.
- [USA–NA–AIO 2025 retrospective](https://ioai-official.org/the-usa-north-america-ai-olympiad-is-organized-by-the-usa-ai-olympiad-usaaio/):
  Round 1, Round 2 and June camp are separate. Current Hall of Fame's 2025 award
  link points back to the same page; don't claim a usable ranking export.
- [II OAI](https://www.oai.edu.pl/edycje/ii-oai): Stage I/II score lists do not state
  ranks; selected entries remain unranked. Final award classes stay Polish, not
  inferred Gold/Silver. Three separate samples, not one merged final table.
- [ONIA archive](https://www.olimpiada-ai.ro/en/editii/2026): local, county,
  national and team selection remain separate; grades 9–10 / 11–12 remain separate.

Source checks on October 19 freshly matched **all 776 IOAI cells** against the
unchanged manifest, including Unicode names, totals/components, ties and literal
awards. All nine partial samples (33 rows) passed source-containment checks for
names and published score strings. That lighter partial check is not a fresh
full-table transcription or permission check; reviewed original ranks/awards remain
unchanged. The raw IOAI HTML hashes changed as site markup changed, but parsed
candidate cells did not. Evidence: `ioai-source-verification.json` and
`partial-source-checks.json`.

The partial sets remain: APOAI 6; EUROAI Member 4 / Remote 2; IOAI 2024 Scientific 3;
FAIO 2025 Final 4; Poland I/II/Final 3/3/5; Winter IAIO Final 3.
The prepared qualification score sample is Poland Stage I; Stage II is regional.
Prepared final-labelled sets are IOAI Team Challenge Final, FAIO 2025, Poland Final
and Winter IAIO. No Kazakhstan qualifier/final dataset is publicly prepared.

## Kazakhstan verification and exact confirmation needed

Read original files in their existing restricted directory, without copying them
into Git. Original source hashes match the previous review.

- **2025:** 38 rows, tied rank 36 retained, all remote + day 1 + day 2 totals
  reconcile. All red rows retained. Color is not converted into exclusion,
  disqualification or medal. Image lacks event title/year/date. Government report's
  40 finalists do not establish completeness of this 38-row image; one city spelling
  remains flagged. Original source visually re-inspected, not organizer-certified.
- **2026:** original workbook cells match the private transcription and a fresh
  anonymous export. One `leaderboard_final` tab, 39 rows, three task columns,
  16 repeated-rank rows; totals reconcile; no award column. Self-label “Final” and
  public download access are not proof of organizer authorization or post-appeal
  finality. The independently official Second Round page corroborates two task
  titles, not the workbook's exact stage or public-publication status.

Required organizer confirmation must explicitly identify each event/year/date,
the exact file/tab/version, official stage, post-appeal status, coverage/absences,
name spelling corrections and literal award policy, and authorize KAIZ's public
republication of participant names/ranks/scores/awards with attribution and a
correction/removal contact. Ask for a separate qualification source if one exists.
No passwords, private credentials or general consent inferred from internal sharing.
Only non-personal counts/statuses are committed in `restricted-source-summary.json`.

## Task links and rights

31 task entries: **27 original URLs**, comprising 15 public-material collections,
8 account-required and 4 invitation-required links; **4 explicit unavailable
entries**. All 27 task URLs and their stage/provenance endpoints passed the 52-URL
anonymous link check. HTTP 200 is not proof that a submission can be run, or that
results may be copied. Three initial metadata-source CLI requests timed out;
official pages were independently reviewed through the web reader and subsequent
link-check requests succeeded. Initial failures and later successes both remain
in `source-checks.json`; earlier failures were not silently overwritten.

- IOAI 2024 organizer task collection; IOAI 2025 Individual/At-home/GAITE folders;
  IOAI 2026 Individual/GAITE/At-home folders. IOAI 2026 day/task mapping stays in
  stage notes and the original six-task collection.
- FAIO 2025 qualification / final day 1 / final day 2 folders, linked by FAIO's
  official site. The task repository is Apache-2.0; IOAI 2025/2026 repositories
  identify CC-BY-4.0. These repository licences do **not** license separate results
  pages or FAIO's standings spreadsheet. No full task statement is copied here.
- EUROAI day 1/day 2 and Kazakhstan Second Round's two original Nitro task views
  remain invitation-labelled; no task is mislabelled as a final or national qualifier.
- NEOAI 2025 organizer-linked collection; NEOAI 2026 three homework links, labelled
  practice rather than verified qualifier standings. Kaggle account/rules apply.
- USAAIO 2025 Round 1 and Round 2 partner-forum collections, linked by its official
  Past Problems page; Polish I/II/Final official repository folders; ONIA local and
  county links per grade section. No local/county URL is relabelled national.
- APOAI 2026, Winter IAIO 2026, Kazakhstan 2025 and FAIO 2026 task collections remain
  unavailable. A webinar or last year's tasks is not substituted for an edition.

The existing app supports one `presentation.tasksUrl` per competition, not an
arbitrary stage/day link directory. Five new metadata forms receive a usable
original collection link; the other three new records have none. The full grouped
link catalogue is review material, **not a newly implemented runtime feature**.
Existing five presentation fields are unchanged; adding their links later needs
an explicitly reviewed owner action. No non-working SOLVE placeholder is created.

## Offline preview and controlled future admin procedure

```text
node scripts/content/edition-release-plan.mjs
node scripts/content/preview.mjs content/competitions/2026-10-19/metadata-batch.json content/competitions/2026-10-19/production-snapshot.json --dry-run
node --test tests/edition-release.test.mjs tests/content-import.test.mjs
```

Both previews reuse the existing strict planner. No database client, credentials,
network or apply flag exists in the new composition helper. Exact candidate:
**8 create_competition, 5 skip, 0 updates, 0 result sets/rows/publications**.
An admin-complete snapshot is required; a missing expected existing edition,
changed replay candidate, duplicate identity or unsafe URL fails closed.

Future owner-controlled procedure, NOT performed by this task:

1. Approve exact metadata IDs/forms, independent of standings permission.
2. Refresh the full read-only admin inventory and replay both previews. Stop on
   drift/conflicts; do not reuse an old snapshot as proof of current emptiness.
3. Create only missing approved editions through normal authenticated admin forms.
   Keep a per-edition checkpoint of actual UUID/slug. Respect server Zod and RLS.
4. Re-read after an uncertain response before retrying. Slug uniqueness prevents
   duplicate edition creation; deterministic preview skips identical records and
   rejects changed new-edition candidates. This is not a concurrent bulk upsert API.
5. Confirm eight additions, five existing fingerprints unchanged, 13 total, zero
   result sets/rows, correct Overview/Tasks/Results empty states and mobile access.
6. Stop. Standings need separate organizer/owner per-stage authorization and a
   new full-snapshot dry run. Never bundle 16/17 migrations or results into metadata.

Normal admin requests commit individually, not one all-or-nothing 8-record batch.
Disposable transaction rollback tests prove database behavior, not UI batch
atomicity. Partial completion is resumed by inventory/checkpoints; no automatic
deletion, overwrite or blind retry. Stable external participant IDs and existing
stage adapters remain in the unchanged results package for a later approved release.

Before any later production write, review backup age and recovery risk again:
the previously verified encrypted October 14 backup is outdated; full database
restore remains unverified (managed Vault dependency), not solved by archive hashes.
No new backup export or recovery claim is part of this preparation task.

## Verification and release dependencies

- Dependency installation, TypeScript, ESLint, 217 regression tests and production
  build pass. Existing five high-severity development-tool dependency advisories
  remain; no forced dependency upgrades or unrelated remediation performed.
- Disposable PostgreSQL 17 metadata tests: exact nine-production-migration schema,
  eight additions, no duplicate replay, failed transaction rollback, presentation
  round-trip, existing-five fingerprint preservation, anonymous metadata reads,
  member create/update denial, zero result-set creation.
- Existing 809-row import/replay/name/rank/score/award/component tests pass, with
  27 presentation SQL security assertions and draft visibility boundaries. First
  run overlapped dependency reinstall and failed to resolve Zod; rerun after the
  install completed passed on a fresh disposable cluster. No test bypass added.
- Local actual-component browser QA: 60 edition views, 56 real-source draft-stage
  views, 108 task-link assertions, original scores/ranks/awards/columns, separate
  stages, search/award filters/pagination, mobile/light/dark and unavailable states.
  Fixture previews are not production publication or hosted Auth/RLS evidence.
- **Visual publication gate still open:** current main reproduces award wrapping;
  #44 owns the tested fix. No UI cherry-pick, redesign, merge or duplicate fix here.
- Guest production smoke: 16 route views and 10 competition detail views at
  375/1440px/light, directory hybrid filter, all five Overview/Results/Tasks empty
  journeys, Roadmaps, Learn, login, public profile and Discussions pass. My Learning
  redirects guests to login. No session credentials or non-GET write requests used.
  Final read-only inventory matches the initial history, counts, competition/profile
  fingerprints, RLS, grants and indexes exactly. See `verification.json`.
  Authenticated production mutations were deliberately not repeated.

No new migration is required. Presentation migration 12 is already applied.
PR #42 / personal/external practice migrations 16/17 are unrelated, not prerequisites.
PR #44 should be owner-reviewed/released before native standings publication and
then rechecked with real source labels. Metadata-only content review need not wait
for IOAI permission or #42. No result dataset is authorized for native publication
by this package, regardless of table completeness or repository licences.

## Owner approval checklist

- [ ] Teammate reviews the content-only PR and exact eight metadata forms.
- [ ] Owner separately authorizes the eight-edition admin import and recovery risk.
- [ ] Fresh admin-complete inventory/dry run has zero conflicts and no result writes.
- [ ] Directory filters and edition Overviews retain exact dates/organizers/scope.
- [ ] Results remain honestly empty; no “published results” claim for absent data.
- [ ] Task links keep stage/day/access disclosures and correct original destinations.
- [ ] Existing profiles, guest login, Roadmaps, My Learning and Discussions smoke-check.
- [ ] Before any later standings release: permissions, #44 release and exact stage
  approval, plus guest/member/admin draft/publication checks and a fresh backup review.
