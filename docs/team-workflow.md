# KAIZ team workflow

This workflow keeps `main` stable while three developers and their Codex sessions work in parallel.

## Source of truth

GitHub is the source of truth for task ownership and status, branches, pull requests, review state, and merge state. ChatGPT and Codex sessions are working tools, not coordination records. Verify current Issues, assignees, Project status, branches, and pull requests in GitHub before assuming what another developer owns.

Do not create mutable coordination files such as `who-is-working.md`; current work belongs in GitHub.

## Task lifecycle

The normal Project flow is:

`Backlog → Ready → In Progress → PR Review → Done`

- **Backlog:** captured but not yet prepared or assigned.
- **Ready:** scoped, actionable, and clear of known blockers.
- **In Progress:** assigned and actively being implemented on a task branch.
- **Blocked:** waiting on another developer, a decision, credential, shared file, migration, or unresolved conflict. Record the blocker on the Issue.
- **PR Review:** a pull request is open and awaiting CI, review, revisions, or merge.
- **Done:** merged and verified; the linked Issue is closed.

## Issues and ownership

Create a GitHub Issue before implementing any meaningful task. It should state the objective, owner, scope, acceptance criteria, dependencies, shared/hot files, and out-of-scope areas.

The Issue assignee is the authoritative primary owner. Other developers must not silently duplicate that scope; collaboration and handoffs are coordinated in the Issue or pull request.

Current major ownership is:

- Developer A / `Zhunussov`: Auth
- Developer B / `alimendeke-maker`: Problem Archive
- Developer C / `bekjj`: Team Infrastructure

Future Issues may change this mapping, but current work remains within these boundaries until GitHub records a handoff.

## Starting work

Before starting a task:

1. Inspect open Issues and pull requests.
2. Check the GitHub Project and confirm no Issue already owns the scope.
3. Confirm dependencies and shared/hot files.
4. Assign the Issue and move it to **In Progress**.
5. Synchronize local `main` and create a dedicated task branch:

```bash
git switch main
git pull origin main
git switch -c <type>/<short-description>
```

Never develop or push directly on `main`. Use one task per branch and keep branches short-lived. Supported prefixes are `feature/`, `fix/`, `chore/`, and `docs/`; an Issue number may be included, such as `feature/123-problem-statistics`.

## Pull requests and CI

Every integration into `main` requires a pull request. Link its Issue with GitHub closing syntax where applicable, for example `Closes #123` or `Fixes #123`. Document ownership and scope, checks, shared/hot files, migrations or configuration changes, and relevant conflicts or dependencies. Move the Issue or Project item to **PR Review** when the PR opens.

Before merge:

- dependency installation, TypeScript, ESLint, and the production build must pass;
- required GitHub CI must pass once configured;
- the latest `main` must be accounted for; and
- review conversations must be resolved.

Do not bypass failing CI without explicit team discussion.

## Shared and hot files

Common hot areas include `package.json`, `package-lock.json`, shared application configuration, central layout and navigation, shared Supabase utilities, database schema and migrations, GitHub workflows, and environment configuration.

When a task requires a hot-file change:

1. Check active Issues and pull requests for another owner.
2. Record the required change in the relevant Issue or PR.
3. Coordinate ownership before editing.
4. Keep the change minimal and exclude unrelated work.
5. Re-check latest `main` before merge.

If two tasks require incompatible edits, stop the conflicting portion and resolve ownership and merge order through GitHub.

## Semantic conflicts

A clean textual merge does not prove the work is compatible. Semantic conflicts include duplicate implementations, an API change another branch depends on, migrations touching the same schema area, or independent edits to a shared component.

When overlap is discovered:

1. Stop expanding the overlapping change.
2. Comment on the relevant Issue or PR and identify the owner.
3. Agree on merge order and let one branch own the shared implementation.
4. Update the dependent branch after the owner branch merges.

Do not duplicate or guess how to reconcile another developer's implementation.

## Database migrations

Migrations are shared/hot work:

- inspect active migration work before creating one;
- never edit another developer's already-shared or applied migration;
- create a new uniquely timestamped migration for a follow-up;
- avoid independent changes to the same schema area;
- record dependencies and merge order in the Issue and PR; and
- never modify production data during normal feature work without explicit coordination.

Test migrations outside production first. Production Supabase changes, Auth/provider settings, data corrections, and role grants require explicit project-owner approval.

## Vercel and secrets

Pull requests may use Vercel Preview with preview-safe environment values; previews must not write to production Supabase. Production deploys come only from protected `main`, and production environment changes belong to the designated release owner.

Never commit or paste credentials, tokens, `.env.local`, service-role keys, or private user data into code, Issues, PRs, logs, screenshots, or Codex prompts. `NEXT_PUBLIC_` variables may contain public values only. Notify the project owner and rotate any exposed secret immediately.

## Merge readiness

Before requesting merge:

1. Fetch current remote state and inspect latest `main` and active PRs.
2. Account for latest `main` and resolve textual and semantic conflicts.
3. Run required checks and verify GitHub CI.
4. Obtain review and resolve every review conversation.

Nobody pushes directly to `main`.

## After merge

Move the Issue or Project item to **Done**, let closing syntax close the Issue where possible, and delete the merged task branch when safe. Fetch and pull latest `main` before starting the next task.
