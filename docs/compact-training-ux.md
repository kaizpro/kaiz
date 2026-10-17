# Compact training UX

Follow-up to Issue #28 and merged PR #29, based on main
`73a66e31ac2f463d8d5651058da4ecc7d3251fe3` (2026-10-15).

## Presentation and boundaries

- Resource, topic and roadmap presentation uses compact rows, small actions and
  native disclosures. Provenance, access restrictions, unavailable resources and
  source-specific labels remain available without dominating the initial view.
- Roadmaps retains its top-level navigation entry; Learn remains last. The
  existing 85-topic Learning Tree and beginner source plan are preserved.
- `/problems` has one archive and one GET filter form. A pure view-model adapter
  combines **published** internal problems with the 28 existing external catalog
  entries and three original publisher collections. In the absence of database
  tasks, there are 31 external items, not 31 invented KAIZ problems.
- Source, type, difficulty, topic/tag, competition and availability filters apply
  to the combined list. Existing query aliases remain supported. External items
  never become database rows, private attempts or simulated submissions.
- Competition directory and official leaderboard presentation reuse existing
  reads, publication filtering, original scores, ties and the shared result table.
  No source research, import manifest or content JSON is changed.

## Competition content and PR #24 dependency

The existing 15-target research inventory is **not** a claim that 15 editions or
their results have been published. Existing missing-source, verification and
human-approval gates remain unchanged. In particular, the AI Olymp Kazakhstan
2025 screenshot is still needed and the 2026 source provenance/publication hold
is not resolved by this redesign.

The previous hosted snapshot recorded five competitions and no published result
sets or problems. This task did not access production to refresh that snapshot,
import competitions or publish results.

PR #24 owns competition detail, shared result-table changes and the presentation
migration/stage-score functionality. Those files are not edited here. Overview,
Results, Tasks and detailed stage-score presentation must be reviewed with that
release; this PR does not claim to finish its outstanding work.

## Verification

- `npm ci`, TypeScript, ESLint, all eight regression suites (176 tests), optimized
  production build and `git diff --check`.
- `tests/compact-ux.browser.mjs`: 12 routes at 360/375/768/1024/1440px, dark/light,
  100%/200% root text size (240 views); no whole-page overflow or runtime errors.
  Checks unified filtering, source disclosures, keyboard navigation, active
  Roadmaps navigation, Learn-last order and single-footer coverage.
- Existing `tests/learning-roadmap.browser.mjs`: 85-topic route coverage,
  keyboard/focus, reduced motion, theme/mobile and text enlargement checks.
- Browser QA uses an optimized localhost build with public Supabase environment
  values explicitly empty in the process, without modifying environment files.
  Requests are restricted to local GET/HEAD. Empty backend states are genuine;
  populated internal archive and standings cases use isolated regression-test
  fixtures, not production rows. This is **not** fresh hosted Auth/RLS testing.
- Local browser screenshots stay in ignored `work/compact-ux/`, not in Git.

The dependency installation reported five existing high-severity development
tooling advisories. No dependency or lockfile changes were made; this task does
not claim to remediate those advisories.

## Release and coordination

No migrations, dependencies, Auth/RLS/security configuration, production writes,
deployment settings or environment-file changes are required by this PR.
Normal reviewed PR integration and post-merge release QA remain with Tima.
Rollback is a normal revert of this presentation PR; no data rollback is needed.

Issue assignment and ownership were verified on GitHub. The existing GitHub
authorization cannot access the Project board; a teammate must set Issue #28 and
this follow-up PR to the appropriate review status manually. The Issue remains
open because content/publication and production verification are separate gates.
