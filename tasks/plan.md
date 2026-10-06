# Problem Archive Activation

Scope and task checkpoints are tracked in [GitHub issue #9](https://github.com/kaizpro/kaiz/issues/9).
Base: `462d4bc`; branch: `feature/problem-archive-workflows`.

## Implementation order

1. Test validation and mutation boundaries, then implement admin problem management.
2. Test owner-only mutations, then implement inline practice entry and paginated history.
3. Verify local runtime/RLS, document workflows, and review the complete diff.

Reuse the existing session client, `requireAdmin`, Zod, and KAIZ form primitives.
Never accept identity, review, normalization, provenance, or official fields from practice input.
Use existing database hardening as the final enforcement layer; do not alter historical migrations.
Problem/competition foreign-key errors must be explicit, never silently detach evidence.
Forms use visible labels, focused validation errors, disabled pending controls, and inline success feedback.
Practice times are explicitly entered in UTC to avoid implicit server/browser timezone conversion.

## Verification and exclusions

Run npm ci, typecheck, ESLint, Node regression tests, webpack production build, and localhost-only UI/RLS checks.
No hosted Supabase, Auth edits, algorithms, synchronization, new dependencies, commit, or push.
The implementation request approves this scope; merge/deployment remain separate human decisions.
