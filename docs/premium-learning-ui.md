# Premium learning presentation — #54

This slice is stacked on PR #53 (`471b9d3`), not a replacement for it. Merge #53 first, then retarget this PR to main. Do not merge into the dependency branch accidentally.

## Scope

- Server-rendered shared PageHero, original decorative SVG motifs and truthful EmptyState. Scoped CSS primitives for action links, cards, filters, metadata, tabs and badges; no new dependency or global stylesheet changes.
- Roadmaps uses the shared hero, three full-surface semantic links, distinct icons, curriculum/module counts and existing actual saved-progress/XP/action calculation. Guests receive no fictional progress bars or saved-state claims.
- Header spacing/focus only. All seven destinations and existing measured mobile-menu behavior remain. Issue #46 remains Bekjj's; no replacement of Button/Card/motion infrastructure or modification of his workspace.
- Strategist's existing large hero, paths, options and Coming soon routes are intentionally retained as the reference rather than redesigned again.

## Preservation

No educational data, lesson IDs, content/resources, course projection, completion actions, XP formulas, dashboard, Auth, Supabase utilities, practice tracking, migrations or production settings changed. PR #42 is not included; private external tracking stays a separate release dependency.

## Verification

TypeScript, ESLint, production build, 265 existing application regressions and the expanded ten-test classic-roadmap suite pass. All 198 SQL assertions pass on fresh disposable PostgreSQL 17.7 / ten canonical migrations. The local production-build visual suite passes 40 route/viewport/theme checks at 320/768/1280/1440/1920px, including 200% root text, keyboard focus and reduced-motion hover. Screenshots are local ignored guest-only evidence. Remaining longer browser/Auth runs are recorded in the PR after completion; these visual checks are not a claim of new production or backend integration.

No merge, production deployment, import/publication or hosted migration is authorized by this work.
