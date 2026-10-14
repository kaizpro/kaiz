# KAIZ v0.1 — AI Olympiad Pathfinder

Evidence checked 2026-10-14. Owner: Zhunussov. Target: October 18.
[Issue #26](https://github.com/kaizpro/kaiz/issues/26).
Branch: `codex/v0-1-pathfinder-launch`, based on main
`b82d44b21a71c0b1f44784e39449dd9bb8a0d1b5` (merged PR #22).
This is an implementation/review checkpoint, **not a public-launch approval**.

## Smallest useful product

- Homepage: Start Your AI Olympiad Journey; choose a level, explore Learn/practice,
  genuine hosted competition editions and actual recent discussions. Starter
  question ideas are explicitly suggestions, not fabricated activity.
- `/start`: three editorial starting points, open without an account.
- `/start/beginner`: Python, essential maths, small algorithms, initial ML.
- `/start/intermediate`: NumPy/pandas, preparation, classical models, validation.
- `/start/advanced`: evaluation, neural-network training, experiments, upsolving.
- Each path has four ordered goals, canonical Learn links, original publisher
  resources, self-check milestones, external practice and actual listed editions.
  No saved completion, credentials, ratings or external AI inference.
- Topic pages connect back to relevant paths, published problems and community
  questions. Category-based competition/problem suggestions are **editorial**,
  not invented database topic relationships or official competition syllabuses.
- Competition pages retain organizer links, eligibility, published-set visibility,
  related problems/discussions. IOAI 2025/2026, APOAI 2026 and EUROAI 2026 also
  link official results sources, distinguishing stages and source-only coverage.
- NEOAI 2026 aggregate final standings remain unverified. Task/practice/late
  leaderboards are not substituted. Unknown editions say the link is not yet
  curated, rather than claiming results do not exist.
- Empty problem archives link original MIT exercises, scikit-learn examples and
  IOAI 2024 tasks/solutions. These are **not** KAIZ scored submissions. Beginner
  MIT exercises are explicitly optional university-level reading.
- Existing authentication, profiles, discussions and admin workflows are reused.
  Google button, auth behavior, global styles, RLS and migrations are unchanged.
  Legacy challenge/global-leaderboard routes remain outside the v0.1 core nav;
  no future ecosystem feature is newly implemented or claimed complete.

Structured content lives in `lib/learning/journeys.ts`, `resources.ts` and
`practice-sources.ts`; UI and live data reads remain separate. All 85 Learn
destinations remain canonical. Reviewed resource links attach to selected topics;
others retain honest coming-soon states. A backend outage does not replace live
competitions/posts with mock records or remove the static learning path.

## Production/current-main audit

Read-only production HTTP checks returned 200 for `/`, `/learn`, `/competitions`,
`/problems`, `/discussions`, `/auth/login` and `/u/timatema` before implementation.
Deployed homepage lacked a roadmap entry and emphasized future competitive
features. Learn had all 85 topic routes but no resources. No DB Learn-topic
relationship exists; no such relationship is assumed here.

Hosted read-only inventory on October 14: **5 genuine competitions, 0 result
sets (including drafts), 0 published problems**. Auth/discussion/profile rows
were not changed. Thus an internal published problem detail/attempt journey
and imported leaderboard cannot honestly be demonstrated using today's data;
external original exercises/results links are the working fallback.

PR #24 remains separate and untouched. Its presentation fields require
`202610120001_competition_presentation.sql`; this sprint does not read those
columns, cherry-pick schema-dependent UI or require a roadmap migration.

## Exact content preview — no writes

Reuse PR #22's unchanged source-backed
`content/competitions/2026-10-12/ready-batch.json` and stage catalog/review report.
Fresh read-only complete metadata inventory:
`content/competitions/2026-10-14/admin-snapshot.json`.
It contains only the five public genuine competition records and no private
user data; result sets were confirmed absent, not inferred from anonymous reads.
Deterministic output: `content/competitions/2026-10-14/dry-run-preview.json`.

```sh
node scripts/content/preview.mjs content/competitions/2026-10-12/ready-batch.json content/competitions/2026-10-14/admin-snapshot.json --dry-run
```

Validation: valid, 0 errors, **writes: 0, approvalReady: false**. The October 12
research batch and October 14 inventory dates differ; the existing freshness
guard is preserved. Do not relabel old source checks to bypass it. Recheck
sources/rows and refresh the full admin inventory together before approval.

| Proposed action | Exact scope |
| --- | --- |
| 10 new editions | IOAI 2024; FAIO 2025/2026; Winter IAIO 2026; NEOAI 2025; USA–NA–AIO 2025 Round 2; Poland II OAI 2025; Romania ONIA 2026; IAIO 2024; USA–NA–AIO 2026 Round 2 |
| 3 unchanged editions | IOAI 2026, NEOAI 2026, EUROAI 2026 |
| 2 metadata reviews only | APOAI 2026 title/eligibility; IOAI 2025 organizer (BNDS + ITCCC proposal) |
| 14 new draft sets / 49 rows | All selected/partial coverage, all `published=false`, original source/stage labels, no inferred rankings or automatic profile associations |
| 15-edition total | 5 existing + 10 proposed, not 15 new records |

IOAI 2025 individual/team/GAITE, IOAI 2026 individual/GAITE, APOAI 2026,
EUROAI member/remote, IOAI 2024 Scientific, FAIO 2025 Final, Polish qualification/
regional/final and IAIO 2026 are distinct proposed sets. Full details and exact
row forms are in the preview; source scoring components remain in the original
stage catalog, not invented database columns.

**Approval checklist:** owner approves the 10 editions and two replacement
proposals (IAIO 2024/USA 2026), date scopes and the two metadata changes; teammate
compares every selected row/tie/award with the original source; refresh checks
and inventory; approve metadata entry separately from unpublished result entry;
reconcile before explicitly approving publication. Competition creation is
immediately public even if unverified. No hosted import/publication occurred.

Kazakhstan AI Olymp 2025: screenshot not supplied/read; 38 reported participants
and stage headers require independent transcription/provenance. Existing empty
import templates remain on hold; red colors do not imply exclusions.
Kazakhstan AI Olymp 2026: public sheet's self-label/access and 39 rows do not
prove organizer publication. Exact stage/date range and CPFED/DSML provenance
remain on hold; neither Kazakhstan dataset is in the executable batch.
FAIO 2026 qualifier invitations are not final standings. NEOAI's Russia/Central
University mapping has a distributed-participation/organizer caveat; Russia is
not every participant's location and no city is invented. Details:
[curated review and missing-source checklist](curated-content-review.md).

## Security gate — NO-GO until remedied

Hosted history still records six migrations: `202609200001`, `202609210001`,
`202609210002`, `202609220001`, `202609300001`, `202610040001`.
Read-only catalog checks confirm `external_accounts` RLS enabled but the trusted
field guard absent; authenticated INSERT can set `verified_at`, UPDATE can set
`metadata`/`external_user_id`, and TRUNCATE/TRIGGER privileges remain granted.
This exposes member-owned trusted-field forgery through direct Data API writes,
even if the UI submits only usernames. **No exploit/write was run on production.**
TRUNCATE/TRIGGER are SQL-role privileges, not a claim that REST exposes arbitrary
SQL. They must nevertheless be revoked as part of the reviewed guard.

Minimum DB fix is already reviewed/merged in main:
`202610070001_external_account_security.sql`. It installs the guard/revokes
dangerous grants without rewriting rows, works with the current profile action
and does not require new app code. Only the owner may separately authorize its
production application and post-migration verification. Historical populated
trust fields still need independent provenance assessment. See
[security contract and exact verification](external-account-security.md).
No migration was modified or applied. Presentation migration stays separately
gated with PR #24; neither pending migration is applied by this sprint.

Next is patched from 16.3.6 to **16.3.8**, matching eslint-config-next 16.3.8.
The prior high-impact image SSRF advisory is relevant to the configured remote
image allowlist; do not dismiss it as unused. Official patched-version evidence:
[GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4).
`npm audit --omit=dev` reports **0** on the new lockfile. Production's old build
is not thereby patched; reviewed merge/deployment is still separately required.

Full dependency audit still reports 5 high findings in the **development-only**
braces/micromatch/fast-glob/Next ESLint chain. No patched braces release was
available in [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
There is no public request path passing user globs into this tooling. Treat
untrusted contributor build input with care; do not use `npm audit fix --force`
to downgrade Next's lint configuration or claim these findings disappeared.
No major upgrade, dependency override or new dependency is introduced.

## Verification and remaining manual QA

- `npm ci`, TypeScript, ESLint and optimized production build: pass.
- 167 regression tests: pass (auth, problem permissions/scoring,
  results, import validation, Learning and new pathfinder components).
- New tests cover real topic IDs, resources, no simulated progress, prototype-safe
  lookups, real-record-only suggestions and honest empty/error/source states.
- Learning browser regression: 85 topic routes, keyboard/focus/disclosures,
  history, return context, reduced motion, target sizes, connectors; dark/light
  at 375/768/1024/1440. Topic-to-roadmap targets fixed to 44px minimum.
- Pathfinder browser: homepage -> level -> all three roadmaps -> Learn topic ->
  empty archive/original tasks -> genuine IOAI 2026 -> official results link ->
  community; public profile and auth form GETs, anonymous admin redirect,
  unknown level 404, one footer, no horizontal overflow at normal text size.
- All **23 distinct** new publisher/practice/official-results URLs returned HTTP
  200 on October 14. HTTP success is availability evidence, not permission to
  republish datasets or a substitute for content review.
- Browser requests are loopback-only, anonymous and read-only. Screenshots stay
  outside Git. No credentials, new users, email sends, posts or attempts created.
- Both browser suites passed against the development server and optimized
  production build. The new journey suite explicitly waits for genuine hosted
  competition recommendations before capture, not just loading placeholders.
- Existing shared header still overflows at 375px with 200% root font size;
  Learning itself fits. Normal-size mobile/desktop passes. Existing profile has
  nested main landmarks. These accessibility follow-ups are recorded, not hidden
  by suppressing errors or broad redesign. Screen reader audit remains manual.

Provider-backed auth tests use isolated responses, not real production login.
Before promoting signup: owner manually verifies email signup/confirmation,
Google login/callback, recovery, logout/session, persisted profile and member/admin
permissions against an approved staging/production test account after the DB
security fix. Do not ask for credentials in chat or call historic QA current.
Live published task/detail submission QA waits for approved genuine task content;
unit permission tests are not proof of hosted write paths. Confirm SMTP/OAuth/
redirect configuration in dashboards without disclosing secrets.

## Release decisions

Implemented locally, ready for teammate review subject to CI; not merged,
not deployed, no production writes/imports/publication. CI now includes the
Learning/pathfinder suite alongside existing tests. Keep PR #24 separate.
Request a teammate (not self) review; do not bypass main protection.

Owner gates: approve/remediate the external-account vulnerability and verify it;
review/merge this PR and deploy the patched runtime only with separate approval;
run the manual auth/role QA; approve content entry/publication independently.
Accurate external-source links allow initial useful discovery without waiting
for complete imported standings. Missing Kazakhstan sources remain explicit holds.
Public beta readiness: **NO-GO** while the trusted-field issue remains reachable.

Additional backup infrastructure is intentionally paused by owner decision.
Existing encrypted backup integrity is verified, but full restoration is not;
no claim of complete managed-Supabase/Vault recovery is made. No backup procedure,
production setting, migration, merge or deployment was performed by this sprint.
