# Kazakhstan + FAIO beta checkpoint — October 23, 2026

Owner: Zhunussov. Refs #62, #21. Preparation only; **zero production writes**.
This is a narrow follow-up to merged #63, not another design or ingestion system.
The earlier October 19/23 evidence remains historical and is not overwritten.

## LIVE versus READY versus BLOCKED

Production main/deployment: `8759e7cdb62bf68b6b59f2e7b9a2aa220d8de4c5`.
#63 is merged; GitHub reports its Production deployment successful. No submitted
GitHub review was recorded for #63. #42 remains open and is not required here.

Read-only project identity `oolaemebhoytzuussigu` verified. Nine migrations,
five competitions, zero result sets (including drafts), zero result rows,
ten Auth users, ten profiles, two discussions and five learning rows.
The five existing editions are IOAI 2025/2026, APOAI 2026, EUROAI 2026 and NEOAI 2026.
**None of the four priority editions is LIVE in PostgreSQL yet.** Merging code did
not insert metadata. Guide rendering still requires a real competition record;
there is no fake database fallback. No migration is required for these batches.

| Edition | Metadata | Participants | Awards | Results | Tasks |
| --- | --- | --- | --- | --- | --- |
| Kazakhstan 2025 | BLOCKED for exact programme; reported May 3–5, Astana IT University | Government reports 40 finalists; supplied image has 38 rows, not an interchangeable denominator | G/S/B unverified; no colors/rank inference | 38-row transcription verified; final identity/version blocked | Official 2025 task source not verified |
| Kazakhstan 2026 | BLOCKED for organizer programme; reported April 10–13, rounds 11–12, Astana | Government reports 40 selected; workbook has 39 rows | No award column; no inferred medals | 39-row transcription verified; definitive final version blocked | Two real CPFED Second Round tasks, invitation/account required |
| FAIO 2025 | READY in revised Batch A; September 28 qualifier, October 30–31 final, Almaty | 47 ranked **teams** in the organizer-linked final table, not 47 students | No explicit award column; no inferred medals/rates | Full external final table available; native rights NOT ESTABLISHED | Three official repository collections: qualifier, final Day 1/2 |
| FAIO 2026 | READY in revised A; September 20 qualifier, October 27–28 contest at **SDU University, Kaskelen** | 578 entering teams/28 countries; separate post-jury ranking 410 teams/25 countries | Final still future; maximum award quotas are not medals | External qualification only; no final results | No verified 2026 task collection; no fabricated Solve URL |

Unknown values stay omitted, not zero. No medal percentage is calculated from an
unverified award category, a team/student mismatch or a different population.
The FAIO 2026 press report says approximately 1,500 students; this is deliberately
not stored as an exact participant count. The results page separately describes
63 invited teams; an invitation is not proof of final attendance.

## Primary source recheck

- [Kazakhstan 2025 government retrospective](https://www.gov.kz/org/maidd/press/news/details/989919):
  event identity, CPFED/DSML.KZ organizers, Astana IT University, 40 finalists and
  two five-hour rounds. It does **not** identify the uncaptioned screenshot or
  establish a May 3–5 organizer programme. Its reported half receiving medals does
  not identify the individual award classes.
- [Kazakhstan 2026 government retrospective](https://www.gov.kz/org/astana/press/news/details/1199320):
  second edition, Astana IT University and 40 selected students. No definitive
  workbook version or exact full programme is established by this announcement.
- [CPFED Second Round](https://judge.nitro-ai.org/competitions/cpfed/ai-olymp-2026-second-round):
  April 12 task-platform stage. Zhuldyzzhan's Detective Agency and Forgotten labels
  retain individual source routes and invitation restrictions. Do not call this a
  complete qualification/final standings source.
- [FAIO 2025 official archive](https://www.faio.kz/2025/): prominently links its
  public final Google table. Fresh in-memory parsing found ranks 1–47, five
  original `problem 1` through `problem 5` columns and `total`, no award column.
  Names were not copied into this PR. The public archive is the outbound results
  destination; no private Kazakhstan Sheet link is added. Public access alone
  does not establish permission for native named-results republication.
- [FAIO official task repository](https://github.com/BeksultanSagyndyk/faio-tasks/tree/main/faio-2025):
  qualifier, Day 1 and Day 2 remain **collections**, not single solved problems.
  Current repository contains 2024/2025, not a verified 2026 task collection.
- [FAIO 2026 qualifying report](https://www.faio.kz/press/faio-2026-qualifying.html):
  explicitly expands FAIO as Fizmat AI Olympiad and identifies the National School
  of Physics and Math as organizer. Four-hour/five-task qualifier; teams of 1–3.
  Body and boilerplate disagree on grades 8–12 versus 9–12; no exact eligibility
  range is invented. Current edition rules control entry.
- [FAIO post-jury qualification results](https://www.faio.kz/results/):
  all 410 DATA records counted; 25 country labels, five task scores, totals match
  within displayed rounding. This is the **qualifier's final ranking**, not the
  olympiad final. 578 entrants and 410 ranked teams are separate source scopes;
  the unexplained difference is not assigned a guessed reason.
- [FAIO final programme](https://www.faio.kz/final/) and current homepage body:
  **SDU University, Kaskelen**, October 27–28 two five-hour rounds; October 26
  arrival, 29 closing, 30 departure. Old headings/press still say Almaty.
  The specific updated venue body controls the candidate; programme remains
  preliminary and must be rechecked immediately before import.

A discovered Kazakhstan 2025 Kaggle "afterparty" link is not promoted to an
official original final task without edition/organizer verification. No copied
statements, guessed exercise URLs or new practice tracking are introduced.

## Restricted Kazakhstan evidence

Original image/workbook, transcriptions and the 77-row prepared draft batch remain
outside Git in the private local review directory. The sanitized checkpoint
contains hashes, counts and mismatch coordinates only, not participant cells.

- 2025: original image visually reinspected, 303 legible cells independently
  compared with zero mismatches; 38 rows, arithmetic correct, tied rank 36 twice,
  red ranks 8/12/15 retained. Two city accents (`Ekibastūz`) preserved, not silently
  normalized. One other city remains uncertain; organizer clarification required.
  The image has no event title/year/dates. A heading "final place" is not proof of
  edition identity, post-appeal status or completeness.
- 2026: original XLSX imported read-only; all 328 cells in the 41×8 used range
  match the archived transcription. 39 participant rows, three original scoring
  columns plus Total Score, correct arithmetic, 16 rows repeat an earlier rank.
  A `leaderboard_final` name and Final title are not organizer version evidence.
- Owner permission covers KAIZ display of names/results for both editions.
  **No permission to expose the private 2026 source document is recorded.** Public
  government links can corroborate the event but must not masquerade as original
  score tables. Native sets remain unpublished until finality, exact stage,
  coverage, city and programme evidence are resolved.

## Exact separately authorized operations

### A — revised eight-edition metadata batch, READY for owner authorization

Frozen candidate reference:
`content/competitions/2026-10-23-priority/metadata-batch-reference.json`.
It pins the existing inputs and canonical JSON SHA-256, avoiding a duplicate
904-line edition manifest; the offline planner reconstructs the exact forms.
Reuses the existing validator/planner and `/admin/competitions/new` workflow.
The October 19 batch is historical; **do not execute its obsolete FAIO venue**.
The only source correction is unimported FAIO 2026 city/description, Almaty →
SDU University, Kaskelen. Date scope and existing identifiers are unchanged.

Create exactly: `ioai-2024`, `iaio-2026`, `faio-2025`, `faio-2026`, `neoai-2025`,
`usaaio-2025`, `poland-oai-2025`, `onia-2026`.
Expected: **8 creates, 5 unchanged, 13 total, zero result sets/rows**.
No IOAI participant standings, Kazakhstan records or user mutations are included.

Offline reconstruction (no connection/apply mode):
`node scripts/content/priority-edition-plan.mjs <fresh-admin-complete-snapshot>`.
Compare the generated `candidateSha256` to the frozen reference and stop on drift.

Before execution refresh identity, all hidden/public metadata, migration history,
UUIDs, counts, fingerprints and source pages; obtain explicit A-only approval
including the venue correction and backup limitation. Submit exact forms using
the authenticated admin workflow. Read back each slug and every saved field,
record its UUID, then verify directory/filter/detail tabs as guest and member.
Each form is independently transactional, not an atomic eight-record release.
On ambiguity **read first, never blindly resubmit**; duplicate or conflicting
existing records stop the batch. Never auto-delete real additions as rollback.

### B — two Kazakhstan metadata editions, BLOCKED / not authorized

Reuse the existing two held metadata candidates. Distinct slugs
`ai-olymp-kazakhstan-2025` / `ai-olymp-kazakhstan-2026`, not duplicates of A.
Obtain organizer-original programme dates and source identity, then separate B
approval. Expected 13→15 total. No standings bundled into metadata.

### C — 77 restricted rows as drafts, BLOCKED / not authorized

Reuse `scripts/content/kazakhstan-results-plan.mjs` and the outside-Git batch:
38 + 39 rows, distinct year/stage sets, original scores/ties, null unknown awards,
no invented qualification. Clear factual holds first. Obtain C-only approval.
Fresh inventory/readback/checkpoint per set; all `published=false`. Verify anon
and member cannot see drafts, and only admin can edit/publish. No private source
document URL. No IOAI rows or other partial sets enter this batch.

### D — publish cleared Kazakhstan sets, BLOCKED / not authorized

Separate explicit per-set approval after draft reconciliation, provenance,
publication scope and RLS verification. Use existing admin publication control.
Read back actual publication flags; verify all 38/39 rows, ties, scores, search,
filters, pagination and both themes/mobile. Keep everything else unpublished.

Before **each** A/B/C/D: review backups. October 14 encrypted local/private Drive
archives passed integrity and independent-download checks but predate changes.
**Full database restoration and managed-Supabase recovery remain unverified.**
No demonstrated recovery to today's database exists. This task did not export a
new backup or imply that encryption/integrity is a restore test.

## Verification and beta sign-off

Focused changes are public guide data, an offline venue overlay, tests and this
checkpoint. Screenshot review also exposed the existing fixed four-column summary
breaking captions into letter strips at 200% text. Its grid now responds to text
size using the same auto-fit minimum as the existing statistics; all 15 pages have
a caption-height browser assertion. No redesign, migration, RLS/Auth change or
shared layout change.
Preserve #59: static Learn, safe CDN caching, browser-only account controls,
private/no-store personalized state, proxy exclusions and prefetch controls.

Fresh Vercel Production observation October 23, 10:23–16:23 local: **356 function
invocations / six hours, 0% error/timeout**; neither Learn route appears across
both function-table pages; middleware zero. This is live observed usage, not a
guarantee against future abuse or a claim that consumed Hobby allowance reset.

Existing signed-in production profile renders. The owner reported **"no errors"**
after the requested fresh signup/email-confirmation and Google-login checks on
KAIZ. This is owner-reported production Auth verification, not an automated
end-to-end result. No credentials, email tokens or production settings were
collected/changed. Isolated real-Auth testing independently verifies application
session/progress/RLS behavior, not production email-provider delivery.

Fresh validation: TypeScript, ESLint, 303 application tests and production build
pass. Disposable PostgreSQL 17.7 passes 198 SQL security assertions; the separate
nine-migration metadata test passes eight inserts, zero replay additions,
failed-transaction rollback, existing-five fingerprint preservation and member
mutation denial. Real isolated Supabase passes two ordinary accounts plus admin,
completion/refresh/new-session persistence, XP/undo, twelve concurrent retries,
owner-only isolation and guest denial; all three accounts were removed.
The 15-guide browser matrix passes 60 journeys and 92 individual task views at
375/1440px, light/dark, keyboard, reduced motion and 200% text. All owned
competition fixtures were removed. Source check: 80/81 endpoints reachable;
the NEOAI organizer URL timed out, not evidence of a broken four-edition source.
HTTP reachability is not submission availability, finality or reuse permission.
Native standings regression also passes 125 published synthetic rows plus one
draft, anon/member/admin boundaries, search/awards/pagination, tied/zero/missing
scores and 24 responsive/theme views. Its competition, rows and disposable user
were removed. Learn browser/cache tests pass all 87 static pages, anonymous
no-Auth/no-filter-server-requests, HTML/HEAD/query/cookie/RSC, and private dashboard
no-cache. No private state is introduced into public HTML.

Final production read-only checkpoint: still nine migrations, five competitions,
zero sets/rows. Competition, learning and discussion fingerprints are unchanged.
Auth/profile counts increased from ten to eleven during the owner's reported
Auth test. A separate hash of profiles created before the initial checkpoint
matches exactly: existing profiles were preserved. No user details were logged.

No production import, publication, migration, merge, deployment or setting change
has been performed. A useful source-linked FAIO release can proceed through A;
Kazakhstan final-version evidence remains a real blocker, not a reason to invent
missing facts. Next owner action: **authorize revised Batch A only**, explicitly
accepting the Kaskelen correction and the outdated/unverified-restore limitation.
