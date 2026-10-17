# Final content, roadmaps and design sprint — October 15, 2026

Owner: Zhunussov. Issue #28. Branch `codex/content-design-launch`.

## Baseline and release boundaries

- Main inspected: `508997ecdf293c3102493cea16974b1d2dc13320`, including merged #27. #22 content infrastructure is already merged. #24 remains open at `7529b333cf6846c355828bcac34d300c29c6d3f0`.
- Hosted migration history: 202609200001, 202609210001, 202609210002, 202609220001, 202609300001, 202610040001, **202610070001**. Read-only metadata confirms the enabled external-account guard and RLS.
- No presentation columns assumed. `202610120001_competition_presentation.sql` belongs to #24 and remains unapplied. This sprint has **no migration dependency** and changes no applied migration, Auth flow, RLS, import validator or protected write action.
- Production GETs for home, competitions, problems, Learn, /start, login and the existing public test profile returned 200. The deployed homepage already has Pathfinder wording. This is route evidence, not a guarantee of the deployed dependency version or current authenticated session behavior.
- Hosted read-only complete inventory confirms **5 competitions, 0 result sets, 0 result rows, 0 problems**. No production record, publication flag, migration, setting or deployment changed.

## Reviewable implementation slices

1. Learning/navigation: Learn-last six-item navigation, first-class `/roadmaps` and compatible `/start` aliases, source-ordered beginner guide, shared ResourceCard, `/learn/topics` source coverage, 85-topic tree retained.
2. Practice/standings: dedicated external contest cards and filters separate from individual published task cards; `/leaderboards` reuses the **existing** CompetitionLeaderboard and result DTO/query. Only published **official** sets enter this directory, including for an admin viewer. `/leaderboard` redirects to it; no global rating engine.
3. Evidence/content: both source workbooks, coverage matrix, availability review, fresh complete content snapshot and dry-run, source/missing-data/approval checklist, future private-notebook design.

One integration PR separates the atomic product/test change from release/content evidence. Keeping linked navigation destinations together avoids dead links or a stacked release. No modified file overlaps #24's current file list; its result/table/detail implementation is not recreated or cherry-picked. Its table is reused unchanged. The separate task-score-column feature remains deferred to that schema-controlled release.

Minimal shared styling changes fix actual 200%-text failures: wrapping header/section headings, flexible competition rows and card grids, long-word wrapping, contained discussion categories, bounded loading skeletons, and an enlarged-text-safe disabled profile action. Light accent #00789C improves small-link contrast on #F5F7F9 to approximately 4.69:1; dark #18C8FF is unchanged. No Google button/auth security change.

## Educational sources

See [complete coverage and provenance](learning-source-coverage.md). All tabs read: A/Topics, A/Problems, B/Лист1. Extracted **64 topics in 10 groups**, 27 practice links, all 100 populated beginner-plan cells and 44 hyperlink occurrences. Coverage: **19 direct, 38 broader, 7 missing** canonical topic matches. None is labelled a completed hosted lesson.

Source B's parallel lanes and order are retained, not replaced with a generic syllabus: Python → NumPy → Pandas → first ML → Micrograd/AI Course → later PyTorch/CV/NLP. Original maths sections and later CV/NLP appendix stay accessible. No fake progress or medal-authority claim.

All **61 unique workbook/legacy-archive URLs** inspected by unauthenticated GET: 50 returned 200, 3 returned 404, 8 Stepik endpoints returned 502. A 200 can still be a login redirect (Yandex and three Kaggle invitations), browser challenge (Khan Academy), or title-only application shell (Kaggle). Do not equate HTTP success with full task access or current enrollment. Invitation URLs are withheld from tracked files; no join/terms acceptance occurred. Availability is a dated observation, not permanent availability.

## Practice and official results

Prepared **28 external source entries**: source A's 27 plus the FAIO archive; 22 have a usable public landing/login destination, 3 invitations are held with no public URL, and 3 404 entries are disabled. Seven NEOAI child competition pages retain their parent association. Neither named Kaggle tasks nor whole contests are fabricated as individual `problems` rows. Objectives, metrics and datasets remain unfilled where not visible. Publisher/source difficulty wording is explicit; editorial topic suggestions are not DB topic relationships.

Individual published archive cards preserve original metric/direction, actual statistics and existing detail/attempt paths. Current production has no such tasks; only unit fixtures exercise nonempty cards. Current private self-reports remain unchanged. [Notebook architecture](private-notebooks-future.md) is future-only; no upload button or bucket is introduced.

Official standings use the existing source-labelled table and preserve ties, zero, null, team and display-score semantics. Olympiad/edition/stage selection and participant/country/award filtering operate on real published result data, not static draft results. Production currently shows an honest empty state and curated original result links. Nonempty data paths and draft/provisional denial are covered by isolated unit tests, not claimed as production row publication. Original component scores remain in source/stage research until the separately gated presentation model is available.

## Competition content and holds

The existing #22 inventory retains all **15 requested targets**, with **13 source-backed metadata drafts and 2 Kazakhstan holds**. The separate 15-edition import-review batch includes two previously proposed replacements (IAIO 2024, USA–NA–AIO 2026), **not silently approved replacements** for Kazakhstan. See [curated review](curated-content-review.md) for each edition's names/dates/organizer/scope, eligibility, stages and related official sources. Use graceful identity placeholders; no unlicensed logo is added.

October 15 complete snapshot and exact offline preview are in `content/competitions/2026-10-15/`. Result: **10 create proposals, 2 metadata reviews, 3 skips, 14 partial draft result sets / 49 rows, writes=0**. `approvalReady=false` is intentional: the original source/batch verification date is October 12, not refreshed merely by reaching a URL. Do not reset dates to bypass validation. Repeated previews are not imports.

All 27 existing batch source URLs were checked for reachability/title: 26 HTTP 200, one initial IOAI 2026 results timeout. An independent official-page read then succeeded and confirmed separate individual/GAITE sections and original task columns. ONIA archive and press release were read again: Bucharest national programme April 17–20 and contest April 18 are distinct from May's Timișoara selection camp; a headline about Timișoara is not a national-stage location change. NEOAI dedicated page confirms May 3–4 and distributed participation. These spot checks do **not** re-certify every proposed row.

Required before exact content entry approval:

- [ ] Refresh field-by-field official checks and each selected standing row; rerun validators against a fresh complete inventory. Approve the precise create/update/draft/publication list separately.
- [ ] Resolve IOAI 2024 retrospective vs general-regulations date scope; approve the chosen scope, not a guessed compromise.
- [ ] Review IOAI 2025 co-host metadata and APOAI dedicated-edition naming/eligibility; preserve June 13 only.
- [ ] Confirm EUROAI organizer governance label; do not create a duplicate CEOAI record.
- [ ] Preserve NEOAI Russia/Central University as an imperfect organizing-country/single-organizer mapping for distributed participation, **not all participants' location**; city remains null. No aggregate final standings verified.
- [ ] Supply the **AI Olymp Kazakhstan 2025 full-resolution screenshot/export** and provenance. It has not been read here. Reported 38 rows are not transcribed or excluded by red coloring. Existing locked import template remains appropriate.
- [ ] For Kazakhstan 2026 retain the prior source's **Final** label and 39 observed rows, not Qualification. Organizer provenance/publication permission and complete event-date scope remain unconfirmed; no rows are published.
- [ ] Keep FAIO 2026 final results unavailable before the event; its qualification FINAL marker means invitation, not final score. Keep ONIA grade sections and Polish award/ranking categories separate.
- [ ] Public canonical links are needed for three invitation resources; account-authorized statement/metric/license review is needed before creating any individual database tasks.
- [ ] No automatic profile linking, standings recalculation, invented scores, source timestamp substitution, or publication based only on color.

## Verification and owner release gates

- Local results: **173/173 regression tests PASS**; TypeScript, zero-warning ESLint, optimized production build and diff check PASS. Existing tree browser suite PASS for all **85 topic routes**, keyboard/focus/disclosures, back/forward/context restoration, reduced motion, theme/viewport layouts and real 200% topic text. Existing Pathfinder browser suite PASS at 375/768/1024/1440 in both themes. Final extended browser matrix **PASS: 15 routes × 5 widths × 2 themes × 2 text sizes = 300 views**, plus GET filters, keyboard/active menus, full anonymous journey, aliases, missing-level 404 and anonymous admin protection. No whole-page horizontal overflow remains in that matrix, including observed loading states. Screenshots were visually inspected for desktop/light and mobile/dark/enlarged text. Normal-size MIT resource and roadmap layouts are readable; no duplicate footer was observed.
- TypeScript, lint, regression suites, optimized build, diff check and browser evidence must all be green on the final commit before owner review. `tests/content-design.browser.mjs` is localhost-only and uses an already installed Playwright; no new dependency. It checks 360/375/768/1024/1440, dark/light and 100/200% root text, filters, active keyboard navigation, aliases, 404 and anonymous admin redirects.
- Disposable PostgreSQL **17.7**, fresh synthetic fixtures, all seven main migrations: **45 archive + 53 external-account assertions PASS**. The standalone runtime uses assert-only pgTAP-compatible helpers and minimal Auth/Storage dependencies, not a full managed-Supabase service or backup restore. Production was never a test target.
- Production dependency audit reports **zero findings**. The full audit still reports **five high-severity development-only ESLint/glob/braces-chain findings**; no unsafe downgrade or forced dependency fix was attempted. This is not a full penetration test. Development-tool triage and hosted account/dashboard/manual auth settings still need normal owner release review.
- Real authenticated signup/confirmation/Google/recovery/profile/session/member/admin browser QA is not repeated by this anonymous UI sprint. Existing production content remains unchanged. Full backup restoration remains unverified; archive integrity is not recovery certification.
- A teammate must review the PR and CI must pass. Owner separately authorizes merge/deployment and any exact content entry/publication. Do not merge #24, deploy schema-dependent presentation code, or apply 202610120001 as part of this work.

**Launch checkpoint:** reviewable preparation, not a production launch. NO-GO for declaring the full requested populated beta complete while review/deployment/content approvals and source/publication gaps remain.
