# Competition presentation slice — #54

Stacked on `codex/premium-learning-ui` / PR #55, itself dependent on #53. After dependencies merge, retarget to latest main and rerun checks. No merge into dependency branches without owner approval.

## Changes

Shared illustrated heroes and 44px filter/action controls on Competitions and Official Leaderboards. Full-link edition cards retain database titles/dates/locations/organizers/status/format/verification without inferred metadata. Detail hero, section buttons, task cards and Dates & details sidebar align with the same visual language. The unavailable participant directory remains accessible in a disclosure instead of a large empty panel.

All query selection, result stages, original ranks/ties/medals/scores/columns, attribution, publication controls, search/pagination and discussion links are unchanged. Removed stale copy that said presentation columns required a future release; available columns still follow their actual source data. No new data, import, publication, migration, dependency or production change.

## Verification

TypeScript, ESLint, regular and isolated-QA production builds pass. Existing regression suite passes, plus focused real-value edition-link/filter/empty-state regression checks. Actual isolated Supabase native standings checks pass with 125 synthetic published rows and one draft: ties, zero/missing scores, stage switch, empty stage, keyboard, mobile/light/dark, search, awards and pagination. Anonymous/member/admin publication boundaries pass; synthetic competition/user removed. Award component browser matrix passes eight cases including 200% computed text and keyboard horizontal scrolling. Expanded route matrix and final run evidence are recorded in the PR.

Production is never used for fixtures. QA is hard-locked to `venniccblkybvfbxyhug` and localhost; service credentials only create/remove disposable fixtures. Normal app requests retain the anonymous or authenticated client and RLS.
