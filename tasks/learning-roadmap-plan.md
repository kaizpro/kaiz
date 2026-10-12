# KAIZ Learning Tree

Owner: Bekjj. [Issue #19](https://github.com/kaizpro/kaiz/issues/19).
Branch: `feature/learning-roadmap-tree`; base: `d47c5b9`.
This feature-specific plan preserves the historical Archive plan in `tasks/plan.md`.

## Design contract

- Upgrade `/learn`; keep existing navigation, typography, color tokens and themes.
- Central root, equal Coding & AI / Mathematics fork, connected expanding subtrees.
- Suggested learning stages are guidance, never locks. Python and C++ are parallel.
- Keep shared prerequisites as recommendations; one canonical topic per shared concept.
- Typed static catalogue; actual materials stay empty, with no invented progress.
- URL-backed selection and expansion, topic routes, breadcrumbs and roadmap return.
- Locally scoped CSS connectors follow layout, including mobile; no graph dependency.
- Native buttons/links, inert collapsed content, focus rings and reduced motion.

## Verification order

1. Failing catalogue/navigation tests, then data and URL helpers.
2. Responsive tree and topic pages, with incremental type/lint checks.
3. Real browser interactions, light/dark screenshots at 375/768/1024/1440,
   keyboard and reduced-motion checks, all topic routes, existing regressions,
   webpack build, mutation check and complete feature review.
4. Document future content extension and report readiness without committing.

## Boundaries

No shared globals/layout/navigation, package changes, Auth, migrations, hosted
Supabase, production configuration, commit, push, PR, merge or deployment.
The GitHub issue is the authoritative task/status record.

## Verification checkpoint

TypeScript, ESLint, 110 Node tests, webpack build and diff check pass.
Optimized localhost browser regression passes 85 topic routes and 16 light/dark
viewport layouts, including keyboard focus restoration and reduced motion.
The collapse regression rejects an inverted pruning condition (mutation check).
Learning text-enlargement bounds pass; the existing shared-header limitation
is recorded in `docs/learning-roadmap.md`. No screen-reader certification claimed.
Feature diff reviewed; changes remain unstaged and uncommitted for human review.
