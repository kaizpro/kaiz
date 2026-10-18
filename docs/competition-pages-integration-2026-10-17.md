# Competition Pages 2.0 integration — PR #24

Refs #23. Integrated `origin/main` at
`33f1b1b3875eac52e613654a3c4f1878751a6730` on the existing
`feature/competition-pages-v2` branch. No parallel competition implementation.
The detail-page conflict retains both staged Overview / Results / Tasks and main's
preparation links, official-source fallback and current learning/profile/discussion
behavior. The shared main landmark is not duplicated inside the detail page.

## Standings

- Original source, availability and full/partial labels remain above native tables.
- Stages have separate panels; an absent Final never receives Qualification rows.
- Participant/region search, exact source-award filter, 50-row pages and honest
  no-match state; no sorting/re-ranking or score-based inferred medals.
- Original rank, name, total first, with all score columns horizontally accessible.
  The scrolling region is keyboard-focusable and labelled. Null and zero differ.
- Source-defined individual/team distinctions, city/school/team notes and awards
  remain escaped text. Task sources get a prominent Solve link and access caveat.
- Public reads explicitly select published result sets and still rely on RLS.

## Verification

TypeScript, ESLint, 207 regression tests, optimized production build and diff check
passed locally. Real isolated hosted Supabase + browser QA used one synthetic event
with 125 published rows and a private draft row. It verified anonymous/member/admin
publication boundaries, member write denial, stage selection/missing Final state,
search/award filters, pagination, ties, zero/missing values, keyboard scrolling,
375/1440px light/dark layout and the task source link. The synthetic event, rows and
disposable account were removed and row removal checked. No production access.

## Release gate

The existing migration `202610120001_competition_presentation.sql` is unchanged.
Canonical Git SHA-256:
`c5ef2f4c99b692e2a1bd080692f22647ca6253ae27454499c18afc153539be59`.
Its only schema change is bounded JSON presentation columns on competitions,
result sets and rows. No data rewrite, grant or RLS policy alteration.

Owner approval is required before applying that exact migration to production and
before merging/deploying this PR. Use a frozen migration-only directory, not a
generic full-repository push. Existing production already contains migration 15;
12 is independently additive but must be explicitly targeted as a retrodated file.
Production's missing personal-practice migration 16 belongs to the separate merged
#37 dependency, and external-source practice 17 belongs to Issue #40. Never bundle
either implicitly into this release.

Content publication is separate (Issue #21). The 809-row manifest is review-only;
the two Kazakhstan datasets remain private/held. Production currently has no result
sets or individual problems, so this PR does not create standings merely by merging.
Prepare draft content, verify sources/permission and obtain explicit publication
approval before making any actual native result rows public.
