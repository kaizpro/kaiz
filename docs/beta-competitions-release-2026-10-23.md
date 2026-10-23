# First beta: competition content release checkpoint

Owner: Zhunussov. Refs #62, #21. Checked October 23, 2026 (Asia/Qyzylorda).

## Production — no writes performed

Main and Vercel Ready Production are both `a05f0c669fbd3ebaa051dd7b06603a676394766f`.
#41, #45, #49, #59 and #61 were merged into **main**, and their merge commits are
reachable from this baseline. This branch starts from that main, not an old stacked
UI branch. #42 remains open and is not a release dependency.

Read-only management API inspection verified project `oolaemebhoytzuussigu`,
PostgreSQL 17.6, nine migrations, five competitions, zero result sets (including
drafts), zero result rows, ten Auth users, ten profiles, two discussions and five
learning-progress records. Personal problem progress (16) and external practice
(17) are absent. No migration, Auth setting, deployment or production record was
changed. No new competition or standings are live because of this PR.

`content/competitions/2026-10-23/production-checkpoint.json` contains safe counts,
fingerprints, policies, grants and migration versions. The fresh admin-complete
snapshot is separate from the old October 19 evidence. Exact public metadata of
all five existing editions matches that old snapshot. User data is not exported.

## Implemented, not yet deployed

- All 15 edition guides are consumed by the real competition detail page **only
  after the corresponding PostgreSQL competition exists**. No fake listings,
  database fallback, new importer, schema or permission bypass.
- Compact, attributed, population-scoped statistics. Unknown numbers are omitted.
  The grid responds to text size as well as viewport width, preventing mid-word
  caption wrapping at mobile 200% text zoom (covered by a browser assertion).
  The former `0 registered` (not an event participation statistic) is replaced by
  the actual number of published KAIZ result sets. Participation is shown only
  from cited organizer/government evidence.
- Concise About, expandable original description/structure/sources. View Results
  and Explore Tasks switch internal panels and move keyboard focus to the panel's
  navigation button. Existing premium hero, media, cards and shared styles remain.
- Results lead with a clear external official-results action. Empty native
  standings are compact and honest. Existing authorized native standings retain
  original scores, ranks, awards, filtering, pagination and stage selection.
- All 27 legacy task URLs are retained, plus 18 independently identified task
  URLs (six IOAI 2025, six IOAI 2026, six EUROAI). In total: 45 usable source URLs,
  23 individual tasks and 22 collections; four unavailable placeholders remain
  explicitly unavailable. Collections are not treated as individual problems.
- Individual source detail pages show title, edition, stage/day and access, without
  copying statements. No second progress tracker. Personal practice is unavailable
  for these sources; existing owner-private practice stays unchanged. Public task
  discovery does not require migrations 16/17 or #42.
- No changes to public Learn, root layout, header, proxy, Auth, RLS, XP or learning
  IDs. The public guide contains no participant names, copied scores, private
  Sheet URLs, invitation tokens or restricted source originals.

Guide data: `content/competitions/edition-guides.json`. Its strict schema records
source/date/method/population/unit for every numeric claim and rejects unsafe
URLs, restricted Google document links, impossible counts and duplicate task IDs.
The legacy results manifests (809 rows) remain unchanged and are **not imported
by this code**. Runtime never imports those named-results manifests.

## Fifteen-edition matrix

All rows have sourced edition metadata/eligibility/format in the existing
manifests. Eight missing editions are approval candidates, not live records.
Kazakhstan dates and final-version evidence remain held. No native standings
are published for any edition. External links do not grant redistribution rights.
G/S/B below always belongs to the exact stated population; HM is separate.

| Edition | Live | Metadata / population | Verified G/S/B; rates | Official results | Official tasks and access |
| --- | --- | --- | --- | --- | --- |
| IOAI 2024 | No | Ready; Scientific Round **41 teams**, not individual entrants | 4/7/10; 9.8/17.1/24.4%; medal rate 51.2% | [Scientific / Practical](https://ioai-official.org/bulgaria-2024/results/) | [Official collections](https://ioai-official.org/2024-tasks/), public materials |
| IOAI 2025 | Yes | Preserve; **284 Individual table contestants** | 24/47/71; 8.5/16.5/25%; medal rate 50% | [Individual / Team Challenge Final / GAITE](https://ioai-official.org/china-2025/results-2025/) | [Individual: six tasks](https://github.com/IOAI-official/IOAI-2025/tree/main/Individual-Contest), [At-home](https://github.com/IOAI-official/IOAI-2025/tree/main/At-Home-Round), [GAITE](https://github.com/IOAI-official/IOAI-2025/tree/main/GAITE-Contest); public materials |
| IOAI 2026 | Yes | Preserve; **440 Individual table contestants** | 37/73/110; 8.4/16.6/25%; medal rate 50% | [Individual / GA I TE](https://ioai-official.org/republic-of-kazakhstan/results-2026/) | [Individual: six tasks](https://github.com/IOAI-official/IOAI-2026/tree/main/Individual-Contest), [At-home](https://github.com/IOAI-official/IOAI-2026/tree/main/At-Home-Round), [GAITE](https://github.com/IOAI-official/IOAI-2026/tree/main/GAITE-Contest); public materials |
| APOAI 2026 | Yes | Preserve; June 13 only; **128 contestants** | 10/22/33; 7.8/17.2/25.8%; medal rate 50.8%; HM 36 | [Official edition/results](https://www.apoai.org/apoai2026) | Official task link not verified; no Solve button |
| EUROAI 2026 | Yes | Preserve; Member **56**, Remote **16**, Guest **22**, separate divisions | Member 6/9/13; Remote 1/4/6; Guest 1/9/2. Rates scoped per division in guide; no aggregate event medal rate | [Three divisions](https://euroai-official.org/2026/results/) | [Day 1](https://judge.nitro-ai.org/competitions/ceoai/ceoai-2026-day-1), [Day 2](https://judge.nitro-ai.org/competitions/ceoai/ceoai-2026-day-2); six identified tasks, invitation/account |
| Winter IAIO 2026 | No | Ready; **95 final-results contestants**, not host-report 98 attendees | 9/15/24; 9.5/15.8/25.3%; medal rate 50.5%; HM 14 | [Official final result](https://iaio-official.org/results2026/) | Specific task collection not verified; Zindi host link alone is not an edition task |
| FAIO 2025 | No | Ready; qualifier September 28, final October 30–31; team denominator not verified | Not verified; no inferred medals | [Organizer archive links final standings](https://www.faio.kz/2025/) | [Qualifier and final day collections](https://github.com/BeksultanSagyndyk/faio-tasks/tree/main/faio-2025); public materials |
| FAIO 2026 | No | Ready; season September 20–October 28; final rounds October 27–28, wider arrival/departure programme October 26–30 | Not yet awarded; published maximum award quotas are not actual medal counts | [Qualification only](https://www.faio.kz/results/) | Final task collection not verified; final still future |
| NEOAI 2025 | No | Ready; **89 participants**, **4 countries**, official retrospective | Not verified | Aggregate final standings link not verified | [Official linked Kaggle collection](https://www.kaggle.com/competitions/neoai-2025/overview); account |
| NEOAI 2026 | Yes | Preserve; distributed May 3–4; population not verified | Not verified | Aggregate final standings link not verified | [Organizer-linked homework tasks](https://cu.ru/olympiad/events/neoai), three Kaggle tasks; account, not final aggregate rankings |
| USA–NA–AIO 2025 | No | Ready; April 27 Round 2 at MIT; **12 June camp qualifiers**, not total entrants | Not verified | 2025 Hall of Fame ranking link loops to itself; no verified usable ranking | [Round 1](https://forum.beaver-edge.ai/c/ai-olympiads/usa-north-america-ai-olympiad/8), [Round 2](https://forum.beaver-edge.ai/c/ai-olympiads/2025-usa-na-aio-round-2/9); official linked public forum collections |
| Poland II OAI 2025 | No | Ready; February 17–June 2 season; exact competition population omitted | Polish award classes, not invented G/S/B | [Stage I / II / Final](https://www.oai.edu.pl/edycje/ii-oai) | [Official I / II / final folders](https://github.com/OlimpiadaAI/II-OlimpiadaAI); public materials |
| Romania ONIA 2026 | No | Ready; April 17–20 national programme, contest April 18; **159 qualified students**, grade sections 71/88; five guest pupils mentioned separately, not added to a guessed total | Not verified | [Official national stage](https://www.olimpiada-ai.ro/en/rezultate/nationala); other stage links stay distinct | [Local/county grade sections](https://www.olimpiada-ai.ro/en/editii/2026); account. National tasks not relabelled from local/county sources |
| AI Olymp Kazakhstan 2025 | No | Held; owner-reported May 3–5; official report **40 finalists**, supplied image **38 rows** | No G/S/B inference. Official report says 50% awarded; not used to invent individual awards | No public full standings source verified; government report is attribution, not a standings table | Task source not verified |
| AI Olymp Kazakhstan 2026 | No | Held; owner-reported April 10–13, rounds 11–12; official report **40 selected**, workbook **39 rows** | No award column; no invented medals | No public standings document approved; private workbook never linked | Two official Second Round task views, invitation/account; not falsely labelled complete final tasks |

Full original task URLs, stage/day, provenance and access are in the public guide.
No unavailable medal/participant/country statistic is replaced by a fake zero.
IOAI table counts do not establish a country's citizenship roster or the total
event attendance. EUROAI judge registration count 95 is not the 94 result rows.

## Research evidence and unresolved sources

Fresh read-only checks: **80/80 official/source endpoints returned successfully**.
One first-pass EUROAI Day 2 timeout was separately resolved through the official
reader and later fresh link checks. HTTP 200 alone does not prove submission
availability, accurate transcription, finality or redistribution permission.
Only title/link/access metadata is copied for tasks. No external account or
submission was created. No task datasets, notebooks or executable code were run.

IOAI 2025 and 2026 tables were freshly parsed in memory to count scoped rows and
literal awards. No names/scores were saved to the runtime guide. Their 776 named
prepared rows remain excluded from native publication. IOAI 2024 team statistics
come from the organizer retrospective, not from individual medal multiplication.
APOAI and IAIO totals/medals are explicit organizer result-page statements.
EUROAI counts come from exact Status/Medal cells, keeping Member/Remote/Guest apart.

IAIO's results page says 95 contestants; the [host closing report](https://ircai.org/iaio-2026-successfully-concluded-ircai-supports-the-next-generation-of-responsible-ai-professionals/)
says 98 high-school attendees and 24 countries. The guide deliberately uses only
the 95-person **results population** for rates and does not combine the 98 with
those awards or assume all 24 countries are represented in that table.

Kazakhstan [2025 government report](https://www.gov.kz/org/maidd/press/news/details/989919)
and [2026 government report](https://www.gov.kz/org/astana/press/news/details/1199320)
confirm the editions, location and selected/finalist populations, but not the
owner-reported full programme dates or exact supplied post-appeal standings.
The original 38/39-row review remains restricted outside Git. Owner permission for
KAIZ public standings is recorded in #49; it does not resolve file identity,
finality, completeness or permission to share the workbook itself. Red rows and
ties remain preserved; colors never infer medals or exclusions.

Other nine partial sets (33 rows) remain drafts/review candidates, not full
standings. No new redistribution clearance was obtained by this task. Native
publication stays blocked. Public organizer result links are the useful first
beta alternative. Missing usable results: NEOAI 2025/2026, USAAIO 2025 and both
Kazakhstan editions. Missing task collections: APOAI 2026, IAIO 2026, FAIO 2026,
Kazakhstan 2025; ONIA national tasks also remain unverified.

## Exact production approval gates

**A — Ready for separately authorized metadata-only creation, not executed.**

Reuse `content/competitions/2026-10-19/metadata-batch.json` and the existing
`/admin/competitions/new` workflow. Exact inserts:

| Slug | Date scope | Official metadata source |
| --- | --- | --- |
| `ioai-2024` | August 9–15, 2024 | https://ioai-official.org/bulgaria-2024/ |
| `iaio-2026` | February 23–27, 2026 | https://iaio-official.org/olympiad-2026/ |
| `faio-2025` | September 28–October 31, 2025 qualifier/final season | https://www.faio.kz/2025/ |
| `faio-2026` | September 20–October 28, 2026 qualifier/final rounds | https://www.faio.kz/ ; https://www.faio.kz/final/ |
| `neoai-2025` | May 6–11, 2025 | https://ioai-official.org/northern-eurasia-oai-2025/ |
| `usaaio-2025` | April 27, 2025 Round 2 | https://ioai-official.org/the-usa-north-america-ai-olympiad-is-organized-by-the-usa-ai-olympiad-usaaio/ |
| `poland-oai-2025` | February 17–June 2, 2025 season | https://www.oai.edu.pl/edycje/ii-oai |
| `onia-2026` | April 17–20, 2026 national programme | https://www.olimpiada-ai.ro/en/editii/2026 |

Fresh dry run: 8 create, 5 skip, 0 updates, 0 result sets/rows, expected total 13.
No migration required. Existing UUIDs/forms/fingerprints are preserved. Each admin
form is one transaction, not an atomic eight-record transaction. On ambiguous
submission, re-read by slug before any retry; resume from actual UUID checkpoints.
Never delete real additions as an automatic rollback. A concurrent duplicate or
changed candidate stops the planner. Do not change existing five records.

**B — Two Kazakhstan metadata inserts:** held for organizer-original date/source
confirmation and separate owner approval; would bring 13 to 15. No duplicate
identities with the eight-edition batch.

**C — 77 Kazakhstan draft rows:** held for exact stage/final-version/coverage
confirmation and explicit batch authorization. Owner permission alone does not
clear those remaining factual checks. Never bundle with metadata.

**D — Published standings:** requires separate per-result-set authorization after
rights, finality, attribution and draft/public RLS checks. No IOAI native rows.

Before **each** approved batch refresh inventory, migration state, duplicate plan,
counts and recovery-risk review. Existing encrypted October 14 backups had integrity
and independent download checks but are outdated; full database restore and full
managed-Supabase recovery remain unverified. They do not provide a demonstrated
rollback to today's database. No fresh export was performed or implied here.
A/B/C/D are independent approvals, not authorized by approving code or merging it.

## Verification

- TypeScript, ESLint, 300 application regressions and production build pass.
- Fresh disposable PostgreSQL 17.7: 198 SQL security assertions, ten canonical
  migrations, 40 lesson keys, new-connection persistence and retry/undo pass.
- Separate exact nine-migration metadata import test: eight inserts, replay zero,
  failed-transaction rollback, existing-five fingerprints preserved, presentation
  roundtrip, anonymous reads and member mutation denial pass. No result sets created.
- Real isolated Supabase: two members and one admin pass Auth, completion,
  refresh/new-session persistence, XP/undo, twelve concurrent retry attempts,
  owner-only isolation and guest denial. Synthetic accounts removed afterward.
- Learn: all 85 topics plus catalog/root (87 pages) remain static. Build cache
  checks pass HTML/HEAD/query/cookie/RSC and unknown-topic boundary. Configured
  private dashboard stays uncached. Browser tests pass no anonymous Auth calls,
  no tree/filter server requests, no-JS catalog, mobile/themes/motion/200%/keyboard.
- Edition browser matrix: all 15 editions, 60 page journeys and 92 individual
  detail views pass desktop/mobile, both themes, 200% text, keyboard and reduced
  motion. All owned metadata fixtures removed; no named standings created.
  Streamed unknown/collection-as-task routes show the real not-found boundary,
  no Solve link and noindex (Next may already have sent HTTP 200).
- Test harness corrections retained strict checks: expected Next's custom
  not-found heading and all emitted noindex tags, not a default `404` heading or
  exactly one metadata tag. One native-standings run overlapped edition fixtures
  and hit its single-competition empty-filter assumption; final verification runs
  those suites serially, without weakening their assertions.
- Final serial native-standings regression passed 125 published synthetic rows
  and one draft row, anonymous/member/admin publication boundaries, ties, zero/
  missing scores, stage selection, search, awards, pagination and 24 premium
  desktop/mobile/theme views with 200% text, keyboard and reduced motion. The
  synthetic competition, cascading rows and disposable account were removed.
- Current production guest HTTP checks pass all five competitions, Learn, login,
  register/recovery pages, Roadmaps, Discussions and public profile. Signed-in
  browser checks pass all five competition Overview/Results/Tasks and My Learning.
  These verify the **deployed baseline**, not the undeployed guide changes.
- Production Learn/root/topic: CDN `HIT`; catalog `PRERENDER`; no suspended-host
  page. Personalized competition/login pages retain private/no-store responses.
- Vercel's actual Production Functions view, October 23 08:21–14:21 local:
  **288 invocations / six hours, 0% error/timeout**, no Learn routes in either
  function-table page; middleware zero. Encouraging, not a guarantee against future
  abuse or a reset of already-consumed Hobby allowance. No settings changed.

Fresh production signup, Google OAuth, email confirmation and password recovery
must still be exercised by the owner with credentials/email only on the website.
Existing authenticated read access is not a substitute for those end-to-end flows.
Production progress mutations were not authorized and were not performed.

Final read-only inventory after these tests: all migration versions and counts
unchanged; competition/profile/learning/discussion fingerprints equal the initial
checkpoint. No production imports or publication occurred.

## Release decision

**Ready for 30–40-user beta: NO, not yet established.**

Remaining gates: independent code/content review and green CI/Preview, owner
merge/deployment approval, Batch A authorization/readbacks/live QA, separate held
Kazakhstan confirmation/approval and final production Auth smoke tests. Missing
statistics should stay omitted and rights-blocked native standings must stay absent;
those do not justify inventing content or applying practice migrations.

Next owner action: explicitly authorize **Batch A only** (the eight exact metadata
inserts above, five existing records untouched, no standings, no migrations),
acknowledging the outdated/unverified-restore backup limitation. Do not interpret
that as permission to merge, deploy, create Kazakhstan editions or publish results.
