# KAIZ team workflow

This workflow keeps `main` stable while multiple developers and Codex sessions work in parallel.

## Stable branch

- `main` is the protected, deployable branch. Never develop or push directly to it.
- Every change reaches `main` through a reviewed pull request with passing CI.
- Do not force-push or delete `main`.

## Start new work

Before creating a task branch, synchronize local `main`:

```bash
git switch main
git pull origin main
git switch -c <type>/<short-task-name>
```

Use one branch for one task and one pull request. Branch names use lowercase, hyphenated descriptions:

- `feature/*` for product capabilities
- `fix/*` for defects
- `chore/*` for tooling, dependencies, and repository maintenance
- `docs/*` for documentation-only changes

Do not reuse a merged branch for new work.

## Pull requests

1. Keep the branch focused and avoid unrelated formatting or refactors.
2. Sync the latest `origin/main` before requesting final review. Resolve conflicts on the task branch, never on `main`.
3. Complete the pull request template, including shared-file, database, environment, and verification sections.
4. Wait for CI and required review to pass.
5. Merge through GitHub using the repository's approved merge method. Never bypass protection or push a merge directly to `main`.

Draft pull requests are encouraged when coordination is useful but the work is not ready to merge.

## Conflicts and parallel work

- Announce ownership of a task and its branch before editing shared areas.
- Prefer small pull requests and coordinate sequencing when two tasks touch the same hot-zone file.
- Fetch before resolving conflicts. Read both sides and preserve both intended behaviors; do not accept one side wholesale without checking it.
- Run all affected checks again after conflict resolution.
- Do not rewrite another developer's branch, discard their changes, or force-push a shared branch without their explicit agreement.

Common hot zones include:

- `package.json` and `package-lock.json`
- `app/layout.tsx`, `app/globals.css`, and `proxy.ts`
- shared components under `components/ui/`
- shared contracts and clients under `lib/`
- `.github/` workflows and templates
- `supabase/config.toml` and `supabase/migrations/`

## Database migrations

- Use a new, uniquely timestamped migration for every schema change.
- Never edit, rename, reorder, or delete a migration that has been applied to a shared or production project.
- Keep migrations backward-compatible where practical and document destructive or data-changing operations in the pull request.
- Coordinate migration timestamps and deployment order with anyone else changing the schema.
- Test migrations against a non-production environment first. Application code that depends on a migration must state the required rollout order.

## Supabase environments

- Production Supabase is owned by the designated project owner or release owner. A task branch, preview deployment, or Codex session must not mutate production.
- Production schema pushes, provider changes, Auth settings, RLS changes, data corrections, and role grants require explicit owner approval and a documented rollout.
- Developers use their approved local or shared development project for testing. Never copy production secrets or user data into a task environment.

## Vercel deployments and environment variables

- Pull requests may use Vercel Preview deployments for review and manual QA.
- Preview deployments must use preview-safe environment values and must not write to production Supabase.
- Production deployment is sourced only from protected `main` after review and passing CI.
- Production environment-variable changes are made only by the designated project or release owner and are recorded in the pull request or release notes.

## Secrets

- Never commit secrets, credentials, tokens, `.env.local`, or service-role keys.
- Store local values only in ignored environment files and use the team's approved secret storage for hosted environments.
- Browser variables prefixed with `NEXT_PUBLIC_` must contain public values only. Supabase secret/service-role keys must never use that prefix or enter client code.
- Do not paste secrets into issues, pull requests, screenshots, terminal logs, CI output, or Codex prompts.
- If a secret is exposed, stop using it, notify the project owner, and rotate it immediately; deleting it from a later commit is not sufficient.

## Local verification

Run the same checks as CI before marking a pull request ready:

```bash
npm run typecheck
npm run lint
npm run build
```

