# Restore approved premium UI while retaining the Learn cache fix

Issue #60. This is an application-only integration hotfix; no database,
production setting, merge or deployment is performed by this preparation.

## Verified release graph

| PR | Merged into | Merge commit |
| --- | --- | --- |
| #53 | main | 8d4d23e95695e9c0788ad9568daa724f967b214a |
| #55 | codex/classic-roadmaps | d476fc91fe5e37d35837c48795d0c187109e69d9 |
| #56 | codex/premium-learning-ui | 3c9345b426dfd3a79a333be11974021de2c2a557 |
| #57 | codex/premium-learning-ui | 13f287a7bb44a25ecea1eb9c59d65ddf0c73551d |
| #59 | main | 28e730107799ec5884ad68ac4b7d5dda760d9757 |

The production deployment after #59 is successful at `28e7301`, matching main.
The previous successful production deployment was `13f287a`, promoted from the
premium stack. #55 merged **after** #53, into the now-already-merged dependency
branch. GitHub's merged label therefore did not mean its content was in main.
#56/#57 continued that stack outside main. This is missing integration, not a
stale production deployment or a #59 change deleting premium UI from main.

Anonymous production checks confirmed absent premium hero markup on Roadmaps,
Competitions and Practice Archive. Learn's topic response already had Vercel
cache HIT after #59. Preserve that fix rather than roll production back.

## Scope and source fidelity

The reviewed presentation delta `8d4d23e..13f287a` contains 29 files, no migrations,
dependencies, learning content, stable lesson IDs, data-access or Auth changes.
Restore those exact approved files onto current main. A normalized-content
comparison verifies 28 files match the approved version exactly. The sole
adaptation is `components/main-nav.tsx`: premium spacing/appearance combines with
the existing #59 Learn-only prefetch wrapper. No old cookie-reading header is
copied back. Existing #59 authenticated QA additions are retained.

Restored: shared decorative SVG PageHero and scoped design primitives; Roadmaps
hero, three full-card links and truthful saved progress/XP; Competitions cards,
detail sections and Official Leaderboards; Practice Archive cards, filters,
individual/source detail actions and anchor offset; roomy navigation.

Strategist's hero/options/Coming soon pages, root layout and global stylesheet
were identical in the approved premium stack and current main. They require no
replacement. Existing educational material, progress, XP and private tracking
remain unchanged. Historical `docs/premium-*-ui.md` describe the original stacked
work; do not repeat their obsolete branch-merging sequence for this release.

## Required verification

- TypeScript, ESLint, all application regressions and configured production build.
- Full disposable PostgreSQL suite; no hosted migrations.
- Existing #59 matcher, 87 static Learn pages, HEAD/RSC/query/cookie/HTML privacy,
  unknown-slug 404 and private-dashboard cache tests.
- A new integrated regression checks premium navigation spacing and Learn-only
  prefetch protection together; existing shared-header privacy tests remain.
- Approved premium browser matrices and screenshots: Roadmaps/Strategist,
  Competitions/Leaderboards and Practice, mobile/desktop, light/dark, keyboard,
  reduced motion and 200% text.
- Real isolated Supabase Auth, completion/undo/XP/new-session persistence,
  member/admin cross-user privacy, draft result visibility and private practice.
  Fixtures are hard-locked to the approved QA project, synthetic and cleaned up.

## Owner-controlled release

Review this focused hotfix **against main**, not a dependency branch. Merge only
after independent approval and green CI/Preview. Do not deploy the old premium
commit by itself: it lacks #59. After an authorized release, verify the production
revision includes both premium presentation and the Learn fix, inspect premium
pages and real progress, then confirm repeated Learn requests still hit Vercel's
cache without Set-Cookie or account information in shared HTML. No migration,
import, Auth configuration or Firewall change is required.

## Local verification record

- TypeScript, ESLint, configured production build and diff check: PASS.
- 296 application regressions, including the combined UI/prefetch guard: PASS.
- 198 SQL assertions on fresh disposable PostgreSQL 17.7 / ten canonical
  migrations, forty lesson keys and new-session/concurrent/undo checks: PASS.
- All 87 public Learn pages: static compute, local cache HIT, no private HTML or
  session cookies; HEAD/RSC/query variants, guest and real signed-in checks: PASS.
- Premium route matrices: 40 learning/Strategist views, 248 source-page views,
  24 competition/leaderboard views and 16 practice-anchor cases: PASS.
- Real isolated Auth/progress/XP/undo/new sessions and private-practice
  persistence/score CRUD, guest/member/admin isolation: PASS. Synthetic fixtures
  removed. No production access by fixture runners.
- Saved reference comparison: 14/16 Roadmaps/Strategist screenshots and 12/12
  competition screenshots have identical SHA-256; desktop Roadmaps is identical.
  Practice matched 8/12 exactly. Remaining mobile captures have small text/scroll
  raster differences, not missing components, clipping or overflow; visual
  inspection and the 200%/keyboard/reduced-motion assertions passed. Screenshots
  stay local and ignored, not production content or repository assets.
