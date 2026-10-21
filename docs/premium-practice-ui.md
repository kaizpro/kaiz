# Practice presentation slice — #54

Stacked on PR #55 (`codex/premium-learning-ui`), dependent on #53. Independent sibling of PR #56. Merge #53 then #55; retarget this PR to main and rerun checks before owner-approved release. No migration is added by this UI change.

## Student experience

- Shared Practice Archive hero, visible search/source/type/access and expandable difficulty/topic/competition filters. Active advanced filters open automatically; GET parameters/filter semantics are preserved.
- One semantic full-card internal link per entry, readable source/type/access/difficulty, visible real private individual-task status/latest score, and separate native source disclosures. No nested controls, external-navigation overlay or duplicated View/Solve buttons in each card.
- Source detail title and main Solve on Source action use only the existing safe destination. Held/unavailable links remain inactive. Related contests use internal cards. Full account/provenance/access/reproduction notes remain in a disclosure; collections cannot be marked solved as one task.
- Individual-task title, Solve on Source and Record practice are prominent. Existing statement-permission checks, statuses, score forms, official/practice separation and private history are retained. Guest Record practice now has an actual `#practice` sign-in destination (also addressed independently by #42).

## PR #42 integration contract

This branch does not copy the source tracking DAL/actions/RPC/migration from #42. Collection status/scores remain unavailable on this base, not simulated or claimed live. Individual tracking requires the already-existing personal-practice schema; existing missing-schema errors remain visible. #42 requires migration 16 before 17, separately authorized; this UI task applies none.

Overlapping files to resolve explicitly when #42 is integrated: `app/problems/page.tsx`, individual/source detail pages, `components/learning/archive-list.tsx` and personal-practice tests. Preserve #42's `getOwnSourcePractice`/aggregate fetch, `sources` prop and owner-scoped source state, source-specific finished/participated labels, `SourcePractice` component and optional task/notes/history. Adapt these into the new access/status slot and source page below the primary action. Keep its source-record CTA for unavailable destinations only after the infrastructure is included. Never reuse individual Solved semantics for collections. Preserve server validations, missing-table handling and all security assertions. The common guest anchor fix should occur only once.

No #42 branch/worktree, migration, RLS, production data, Auth/Vercel settings, source inventory or publication manifest is changed. No private Sheet links or invented tasks/results added.

## Checks

TypeScript, lint, production build and 267 application tests pass, including existing private task/metric/owner tests and new one-internal-link/source-preservation assertions. Longer actual-route guest matrix and real isolated Auth/private-practice checks are recorded in the PR after completion. The shared slice's fresh PostgreSQL suite verifies all 198 assertions on the ten existing canonical migrations; this slice does not alter SQL.
