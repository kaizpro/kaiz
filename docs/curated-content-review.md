# Kazakhstan-first content review — PR #22

Research checked 2026-10-12. Continuation of Issue #21 on `feature/competition-results-population`; no new issue/branch/PR, hosted writes, merge or deployment. The subsequent [competition experience implementation](competition-experience.md) adds UI/presentation support and one unapplied additive migration; the research-only statements below describe the original curation pass.

## Selection and limits

The inventory retains **all 15 requested targets**, including Kazakhstan holds. **13 have source-backed scoped metadata drafts**, including the five already in KAIZ. Two proposed replacements complete a **15-edition review batch (10 new + 5 existing)**: IAIO 2024 and USA–NA–AIO 2026. These replacements require explicit human approval; they do not replace the ongoing research priority of Kazakhstan AI Olymp 2025/2026.

| Target | Scope / dates | Organizer and status |
| --- | --- | --- |
| IOAI 2024 | Dedicated retrospective event, Aug 9–15; Burgas | LERAI Foundation. General regulations' Aug 8 range retained as scope caveat; no compromise date. |
| IOAI 2025 | Aug 2–9; Beijing | BNDS + ITCCC co-host proposal; existing UUID retained. |
| IOAI 2026 | Aug 2–8; Astana | CPFED; existing metadata retained. |
| APOAI 2026 | June 13 only; distributed hybrid | NOAI China; existing title/eligibility proposal retained. |
| EUROAI 2026 | July 14–19; Cluj-Napoca | Existing organizer governance label needs confirmation, not silently replaced. CEOAI alias, no duplicate. |
| Winter IAIO 2026 | Feb 23–27; Ljubljana | IRCAI at Jožef Stefan Institute. |
| AI Olymp Kazakhstan 2025 | Two-day Astana final; exact range unresolved | CPFED + DSML.KZ verified by organizer/government. **Hold**. |
| AI Olymp Kazakhstan 2026 | Two-day Astana final; exact full range unresolved | CPFED platform confirms April 12 second round, not full final. **Hold**. |
| FAIO 2025 | Sept 28 qualification through Oct 30–31 final; Almaty | FAIO archive and directly linked final spreadsheet; organizer label uses Fizmat AI Olympiad itself. |
| FAIO 2026 | Sept 20 qualification through Oct 27–28 final contest; Almaty | Fizmat. Oct 26–30 is arrival/departure programme. Future final results unavailable. |
| NEOAI 2025 | May 6–11; Russia + online | Central University + AI Alliance, official IOAI retrospective. Russia is not every participant's location. |
| NEOAI 2026 | May 3–4 dedicated edition; distributed hybrid | Existing organizing-country/organizer caveat retained; indexed official page, direct fetch previously inaccessible. |
| USA–NA–AIO 2025 | Round 2 only, April 27, MIT/Cambridge | USAAIO. Other stages not represented by this date. |
| Poland OAI 2025 (II OAI) | Feb 17 qualification through June 2 final | Fundacja Edukacji i Rozwoju Sztucznej Inteligencji; regional April 26–27, final May 30–June 2 Wrocław. |
| Romania ONIA 2026 | National programme April 17–20, Bucharest; contest April 18 | UPIR under Ministry aegis; local/county and team-selection stages separate. |

The two proposed replacements are already sourced in the previous research: IAIO 2024 (Riyadh, Sept 8–12, IRCAI/ICAIRE) and USA–NA–AIO 2026 Round 2 (April 4–6 programme, actual contests April 4–5, Harvard/MIT). BWKI, IOAI 2027 and other future editions are now in `secondary-backlog.json`, outside the active entry queue. Never invent another edition to satisfy a count.

## Results and original scoring

`ready-batch.json` contains **14 partial draft sets / 49 rows**: retained IOAI 2025/2026, APOAI and EUROAI selections, plus IOAI 2024 Scientific (3), FAIO 2025 Final (4), IAIO 2026 Final (3), and Polish I/II/final stages (3/3/5). IOAI 2025 individual adds three publicly published Kazakhstan rows. Every set title declares selected coverage and links the full source; no full-standings claim.

`stage-catalog.json` gives each stage its exact observed label, official URL (null if unknown), availability, verification status, original scoring fields and mapping limits. Missing labels/headers are not filled from guesses. It is research, **not** an executable import file. Original FAIO problem 1–5 and IAIO Round 1/2 selected values are retained there. Existing PostgreSQL stores one row score: extra fields remain provenance/source links, not invented totals or new columns.

- IOAI 2024 Practical has separate jury/peer voting dimensions: link only, no synthetic total.
- Polish final explicitly publishes tied ranks 15 and award classes `Laureaci I/II stopnia`; these are not translated into gold/silver medals. Qualification lists publish scores without numbered ranks: rank remains null/unranked, not inferred from order or tied 400s.
- FAIO 2026 organizer page publishes qualification results after a September 22 jury decision, 410 teams. Its FINAL badge means **invited to final**, not final scores. The organizer explicitly describes exclusions; color is never evidence. Captains are not invented team names. Full qualification table remains linked.
- ONIA grades 9–10 and 11–12 must remain independent sections. National/county scoring formulas differ; no copied rows until the full section tables are reviewed.
- NEOAI 2025/2026 aggregate official final standings are not verified. Late-submission/task/practice leaderboards are not replacements. USA 2025 official standings source remains missing.

## AI Olymp Kazakhstan 2025 — screenshot pending

The screenshot **has not been supplied or read**. The user reports 38 finalists and stage-specific columns; neither the rows nor exact headers are independently verified. `templates/ai-olymp-kazakhstan-2025.json` has separate Qualification/Final templates, empty rows/header arrays and `importAllowed: false`. It is deliberately not valid ready-batch input.

Obtain the full-resolution screenshot or organizer export and provenance. Record exact headers and stage labels first, retain each scoring component, and reconcile all 38 reported rows. **Do not interpret red-colored rows as exclusions**. Resolve unknown awards/ranks/status from explicit organizer evidence, not colors or ordering. No placeholder contestants, school/contact data or automatic profile matching.

## AI Olymp Kazakhstan 2026 — public sheet, provenance hold

Supplied URL: https://docs.google.com/spreadsheets/d/15ONxNRz7HBSHZigr6Fb0fteYC9SzR1YhMbYsWJTgvrw/edit?gid=132773358

Unauthenticated CSV export returned HTTP 200 without a token or cookies. The tab is `leaderboard_final`, self-labelled **Final Scores AI Olymp Final 2026**, with **39** numeric-rank rows (not the user-reported 38 for the separate 2025 screenshot). Headers are `Rank`, `Username`, `First Name`, `Last Name`, `Total Score`, `Zhuldyzzhan's Detective Agency`, `Forgotten labels`, `Jimmy and Aibek brotherhood`. All observed totals equal their three task components; multiple tied ranks exist.

This verifies accessibility and the sheet's own label, **not** organizer ownership or final publication approval. No organizer-controlled backlink/sign-off, publication date, awards or delegation column was independently established. The institutional report confirms a two-day final; the April 12 platform page confirms a second round. Neither links this sheet or fixes its full date range. Do not equate them automatically.

The source is `needs_review`, its official URL remains null in the stage catalog, and **zero Kazakhstan 2026 participant rows are in the ready batch**. Request CPFED/DSML organizer confirmation of sheet identity, exact stage/date scope and final/post-appeal status before promotion. Qualification needs its own source; never duplicate final scores into it.

## Human approval checklist

- [ ] Tima approves all 13 requested scoped drafts, caveats and the two proposed replacements (or resolves Kazakhstan holds first).
- [ ] Fresh complete admin inventory includes every private draft and published set; rerun the unchanged preview and resolve aliases/duplicates.
- [ ] Confirm current FAIO final programme and no new closed registration links; competition creation is immediately public even when unverified.
- [ ] Ali compares every selected row, source spelling, tie, award and total; partial labels remain explicit.
- [ ] Original score components and stage labels are retained; no qualification/final conflation or recalculated ranks.
- [ ] Kazakhstan 2025 screenshot supplied, all headers/38 reported rows reconciled independently; no color-based exclusions.
- [ ] Kazakhstan 2026 organizer confirms source, stage, dates and publication; public access alone is insufficient.
- [ ] Bekzhan checks official task links/reuse terms; no copied copyrighted statements/datasets.
- [ ] Only after separate approval: authenticated admin metadata entry, unpublished result entry, reconciliation, then explicit publication and anonymous/member/admin QA. **Not executed by this PR**.

Run the existing preview command in [content operations](content-operations.md). Pending templates, catalog and secondary backlog are never passed as trusted import batches. No validator, RLS or publication boundary is weakened.
