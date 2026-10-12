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
- **Done:** merged and release verification is complete; the linked Issue is closed.

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

Every integration into `main` requires a pull request. Use `Refs #123` while production verification or manual configuration remains outstanding; close the Issue only after those acceptance criteria pass. Closing syntax such as `Closes #123` is appropriate only when no post-merge work remains. Document ownership and scope, checks, shared/hot files, migrations or configuration changes, and relevant conflicts or dependencies. Move the Issue or Project item to **PR Review** when the PR opens.

Before merge:

- dependency installation, TypeScript, ESLint, fast auth/archive tests, and the production build must pass;
- required GitHub CI must pass once configured;
- the latest `main` must be accounted for; and
- review conversations must be resolved.

The `CI` workflow runs on PRs targeting `main`, pushes to `main`, and manual dispatch. Its required check keeps the name `TypeScript, ESLint, and build`. It uses Node.js 24 and `npm ci`, with read-only repository permissions and no production credentials. The fast regression command is:

```bash
node --test tests/auth.test.mjs tests/problem-performances.test.mjs tests/problem-workflows.test.mjs
```

These tests isolate provider/database responses; they do not prove hosted SMTP or RLS behavior. Docker/local Supabase checks (`tests/problem-workflows.local.mjs` and `supabase/tests/problem_archive_security.test.sql`) stay outside routine PR CI and must run outside production when database behavior changes.

Do not bypass failing CI. A post-merge CI run is additional verification, not a deployment gate: Vercel can start automatically when `main` changes.

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

Follow the production release checklist below before closing the Issue or moving it to **Done**. Delete the merged task branch when safe. Fetch and pull latest `main` before starting the next task.

## Production release checklist

Tima / `Zhunussov` owns merges and production releases. Ali and Bekzhan contribute through reviewed task PRs; they do not independently change production Vercel, Supabase, DNS, or environment values. This is a team responsibility policy, not proof that dashboard access restrictions are configured.

### Before Tima merges

- [ ] Latest `main` is accounted for, required GitHub CI passes, another developer has approved the latest reviewable changes, and review conversations are resolved.
- [ ] PR describes migration filenames/order (or explicitly says none), backward compatibility, rollback approach, and every **PRODUCTION ACTION REQUIRED**.
- [ ] Preview QA uses an isolated test Supabase project and Preview-scoped values, never production writes. Follow [production auth guidance](production-auth.md) for redirects/email QA and [archive guidance](problem-archive.md) for archive/database checks.
- [ ] Required dashboard/configuration work is confirmed by Tima; record outcomes without secret values. Do not merge app code with unmet production prerequisites.

### If migrations are required, before app release

- [ ] Test the exact unchanged migrations on local/test Supabase, including relevant RLS/permission checks.
- [ ] Confirm hosted project identity, applied migration history, chronological dependencies, a reviewed dry run, and a recovery/backup plan. Stop for unexpected/destructive statements.
- [ ] With explicit release-owner approval, apply only intended pending migrations in chronological order; never reset production or edit applied migrations.
- [ ] Verify hosted migration history, schema, grants, RLS/publication boundaries, and preservation of existing data before merging app code that requires the new schema.

Automatic Vercel Production deployment means migration-before-release usually means migration-before-merge. Only backward-compatible additive changes may precede the old app; incompatible changes require a separately coordinated rollout, not a routine merge. Do not assume the build applies database migrations.

### After merge

- [ ] Confirm GitHub CI on `main` passes and Vercel **Production** is **Ready** for the intended commit; confirm `https://kaizpro.com` serves it.
- [ ] Smoke-check homepage, competitions/detail, discussions, problems/detail, and a public profile; verify affected routes and empty/error states.
- [ ] Verify signup/email confirmation, Google sign-in, login/logout/session behavior, and recovery/password update as relevant; never put credentials or recovery links in the Issue.
- [ ] Verify anonymous/member/admin boundaries, protected actions, and owner-only data for affected features. Do not weaken RLS or use real production data as disposable QA fixtures.
- [ ] Record release/QA evidence and remaining actions in the Issue. Mark **Done** and close it only when all acceptance criteria, including manual configuration, are complete. A failed release stays open/blocked while Tima coordinates recovery.
