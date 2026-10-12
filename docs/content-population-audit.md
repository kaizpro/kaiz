# Competition/results population audit — 2026-10-12

Starting main: `22f69d1bc4234c48c94d50e3c90765f900b711e5` (PR #14 merged). Issue #21; branch `feature/competition-results-population`. Preparation only: no hosted writes, production changes, auth/RLS changes, migrations, deployment or merge.

## Architecture and security boundaries

`competitions` supports description, organizer, official/registration URLs, dates/deadline, location, online/offline/hybrid, eligibility, category/tags, verified/temporal status, and unique slug. It has **no publication flag**: unverified competitions remain public. There are no separate rules/tasks columns; keep provenance/reference links in the inventory and use only approved existing content fields. Never misuse registration URLs for standings/tasks.

`competition_result_sets` supports multiple official/provisional sets per competition, source identifier/label/URL, publication and fetched/imported/verified timestamps. `competition_results` supports external individual/team display names, optional KAIZ links, delegation code, nullable score + display text, nullable rank, ranked/unranked/disqualified status and award. Tied ranks are allowed. Composite FK enforces the correct competition/set pair; partial unique indexes constrain linked users/external IDs within a set. Names are not globally unique. No organizer-publication-date column exists; retain that fact in provenance instead of conflating it with import timestamps.

`competition_participants` is KAIZ registered participation, not the list of official external contestants. `problems.competition_id` and official attempt/result references already exist; no problem/account/team links are created by this work. The provider interface exists but no external standings synchronization worker is connected.

All competition/results write actions call `requireAdmin` first; validated Supabase identity/profile role determines authorization. Result actors/trust are server-derived. Existing grants + RLS expose published sets/rows to anonymous/member users, drafts to admins, and writes only to admins. Official-set publication and row verification use separate requests, so errors must be reconciled. Current admin forms already provide set/row CRUD and separate publication; no replacement schema is needed.

## Hosted public inventory — read-only

Anonymous SELECT returned **5 competitions, 0 publicly visible result sets/rows, and 0 publicly visible problems**, with no query errors. Thus public tables/reads exist but no published content was visible. This does **not** prove there are no private drafts/unpublished problems. Authenticated production DML/full-admin inventory were deliberately not performed. Public rows are captured in `public-snapshot.json`, without keys/private profile data.

| Existing edition | Current core metadata | Official source / remaining gap |
| --- | --- | --- |
| IOAI 2025 | Beijing, China; Aug 2–9; BNDS; offline/completed | [Individual, final-team and GAITE standings](https://ioai-official.org/china-2025/results-2025/). [Press release](https://ioai-official.org/2025-press-release-1/) names ITCCC co-host; review-only expansion prepared. |
| IOAI 2026 | Astana, Kazakhstan; Aug 2–8; CPFED; offline/completed | [Individual/GAITE standings](https://ioai-official.org/republic-of-kazakhstan/results-2026/). Current Astana record is already correct; obsolete Abu Dhabi announcement excluded. |
| NEOAI 2026 | May 3–4; hybrid/completed; unknown city | [Official indexed edition page](https://cu.ru/olympiad/events/neoai) confirms dates/format; direct fetch timed out. May 2–8 is a broader Russian selection window. No final official standings verified. Russia/Central University remain imperfect organizing-country/single-organizer mappings for distributed participation, not all participants' location. |
| APOAI 2026 | June 13 only; China; hybrid; NOAI China | [Official edition/standings](https://www.apoai.org/apoai2026). Official hyphenated name and selected-delegation eligibility proposed. No individual registration; tentative release date is not actual publication evidence. |
| EUROAI 2026 | July 14–19; Cluj-Napoca, Romania; offline/completed | [2026 results](https://euroai-official.org/2026/results/) distinguish Member ranks and Remote/Guest blanks. Homepage now leads with 2027. CEOAI is an alias, not another record. Existing organizer governance label retained for review, not asserted as freshly confirmed. |

All five contain required form fields; none has complete references/results coverage in KAIZ. Closed-event registration links/deadlines stay absent when unknown. `inventory.json` records rules/tasks/archives and field-level gaps. NEOAI practice problems are not final standings; APOAI syllabus is not a task archive.

## Prepared batch

**17 official-source-backed candidate editions beyond the existing five: 10 ready for admin review, 7 held.** Ready means source-backed required fields and explicit date scope, not approved publication.

- Ready: IOAI 2027; IAIO 2024 / Winter IAIO 2026; USA–North America AI Olympiad 2025 / 2026 (Round 2) / 2027 (Round 1); Bundeswettbewerb Künstliche Intelligenz 2023 / 2024 / 2025 (finale only) / 2026 (whole project season).
- Held: IOAI 2024 (arrival-date discrepancy); IAIO 2027 (format/organizer); EUROAI 2027 (organizer); Kazakhstan AI Olymp 2025 (two-day date range), 2026 (full finals scope versus one platform round); UKAIO 2027 (format/scope); BWKI 2022 (historical organizer). Do not invent IAIO/APOAI 2025 or duplicate CEOAI 2026 to meet counts.
- Two metadata proposals: IOAI 2025 co-host; APOAI 2026 official title/eligibility. No automatic replacement of existing rows.

**8 partial draft result sets, 25 prepared public participant/team rows:** IOAI 2025 individual (3), team final (3), GAITE (2); IOAI 2026 individual (3), GAITE (2); APOAI individual (6); EUROAI Member (4), Remote (2). No rows are imported into production. All titles declare selected-row coverage and link full official tables. Other tracks/Guest rows remain official links, not claimed imports.

Preserve actual ties, numeric zero, ranked N/A, null/unranked remote ranks, team names and exact awards. Decimal commas become numeric points while original display remains. Source name order is retained; no speculative cross-event/profile matches. Publication dates remain unknown/null. Only public names/delegation facts are prepared; no emails, birthdays, schools or private data. A Kaggle ranking is not final official standings without organizer verification.

## Verification and release implications

No app/dependency/schema changes. The CI change adds only the two new offline suites to the quality job, with no additional permissions. Run install/typecheck/lint, auth/archive/content/results/learning regressions, build and diff check. In-memory action/SQL-contract tests are not fresh live RLS tests; no production writes were used to test them.

Local verification: clean-lockfile `npm ci` completed; TypeScript, ESLint (zero warnings), production build and diff check passed. All **149** tests passed across auth, archive, learning, content and results suites; **35** belong to the new content/results coverage. The worked batch preview passed with zero errors and `writes: 0`; `approvalReady: false` correctly reflects the public-only snapshot.

The latest-main lockfile reported **six high-severity dependency audit findings**, including Next.js and the ESLint glob/braces chain. They pre-exist this content work. No forced fix/downgrade was attempted. [Next.js advisory](https://github.com/advisories/GHSA-3w37-wq28-93x7), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Passing content CI does not establish release security; Tima must triage/update affected dependencies in a separate owned release/security change before deployment.

## Later production action required

No migration/deployment is required for these offline preparation files. Actually populating KAIZ requires a separately approved batch, fresh complete admin inventory, normal authenticated metadata/draft-row entry, reconciliation and explicit publication using [content operations](content-operations.md). Then manually verify public visibility, filters, set switcher, source links, teams/awards/ties/null/zero, existing records and member/admin restrictions. This task does not execute those steps, merge or deploy.
