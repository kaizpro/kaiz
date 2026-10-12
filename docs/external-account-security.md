# External-account trust boundary

## Column contract

`external_accounts` stores user-provided links, not proof that a member controls
the named account. The database enforces this distinction even for direct Data
API requests that bypass the profile form.

| Column | Control |
| --- | --- |
| `external_username` | Member may create/edit their own link. |
| `user_id` | Member must use their authenticated identity on insert; immutable on member update. |
| `provider` | Member chooses an existing provider enum on insert; immutable on member update. |
| `id` | Server generates member-insert identity; immutable on member update. |
| `created_at` | Server records member-insert time; immutable on member update. |
| `updated_at` | Server records member-write time, ignoring supplied timestamps. |
| `external_user_id` | Trusted provider/backend or administrator only. |
| `metadata` | Trusted provenance/verification metadata; not member-editable. |
| `verified_at` | Trusted verification timestamp; not member-editable. |

Members insert with null `external_user_id`/`verified_at` and empty `{}` metadata.
Any protected-field change is rejected with SQLSTATE `42501`, including a request
combining a legitimate username edit with forged trust fields. An unchanged
username preserves existing trust. Changing a username clears verification,
provider identity and metadata, preventing trust from transferring to another
account. Owners may still unlink/delete and relink; relinking starts unverified.

## Database enforcement decision

Migration `202610070001_external_account_security.sql` installs a `BEFORE
INSERT OR UPDATE`, `SECURITY INVOKER` trigger with an empty search path. It runs
before the existing timestamp trigger. The update allowlist rejects changes to
any column except the username and server-derived update time; insert validation
covers the current schema. Future columns require explicit insert-path review.

Column write grants alone cannot distinguish members from administrators, who
share the `authenticated` SQL role. The trigger uses the existing stored-profile
`is_admin()` check and the actual trusted SQL roles (`postgres`, `supabase_admin`,
`service_role`), not provider metadata or a client role claim. Direct execution of
the trigger function is revoked from public, anonymous and authenticated roles.

Existing RLS and read/DML grants are unchanged: anonymous users cannot write;
other members cannot update/delete an owner's link. Administrators retain trusted
operations **on their own rows**, not new cross-owner access. Cross-owner provider
verification remains a trusted backend/service-role operation. There is currently
no external-account administrative application write path. Private metadata and
provider IDs remain excluded from anonymous/authenticated SELECT grants.
The pre-existing `TRUNCATE` and `TRIGGER` grants are revoked from public,
anonymous/authenticated roles. Truncation bypasses RLS/row triggers; trigger
privileges allow replacing the guard with a publicly executable timestamp-only
function. Neither operation is part of profile editing. Administrators sharing
`authenticated` also lose these DDL privileges; trusted SQL backend roles retain
their existing maintenance privileges. See the [PostgreSQL trigger privilege
requirements](https://www.postgresql.org/docs/17/sql-createtrigger.html).

The existing onboarding/settings action sends only `user_id`, `provider` and
`external_username`, with conflict keys `user_id,provider`. It needs no application
change. Defaults applied before an upsert do not overwrite existing trust when
the username is unchanged, because the action updates only these three columns.

## Local verification

Use the existing local Supabase stack; never substitute a hosted project/DB URL:

```sh
npx --no-install supabase db reset --local
npx --no-install supabase db lint --local --level error
npx --no-install supabase test db --local
node tests/external-accounts.local.mjs
```

Reset erases the local development database. SQL fixtures run in a rolled-back
transaction. The opt-in application test loads the real profile-save action and
uses the local Data API: both link providers, unchanged/changed trusted upserts,
mixed-field forgery rejection, identity preservation, unlink and relink. It reads
local CLI status without dotenv, refuses non-loopback Supabase URLs/requests and
removes only its temporary users. It does not replace the SQL RLS regression
suite or run automatically without a local database.

## Production action required — Tima / Zhunussov only

- Apply `202610070001_external_account_security.sql` through the owner's approved
  migration process **before any application release containing this change**.
  All six preceding migrations must already be applied. The migration is
  compatible with the current profile action, so no coordinated app cutover is
  needed; this PR has no application-code changes.
- It adds a function/trigger and revokes client TRUNCATE/TRIGGER and direct function
  execution. It does not delete, backfill or rewrite existing rows or change RLS/read grants.
- Existing trust is preserved, **not retrospectively proven legitimate**. The
  owner must assess historical verification/provenance using independent provider
  evidence. Do not treat populated trust fields alone as proof of verification.
- Read-only verification: inspect `pg_trigger` for enabled
  `a_protect_external_account_fields` on `public.external_accounts`; inspect
  `pg_get_functiondef('public.protect_external_account_fields()'::regprocedure)`
  for the guard; confirm `pg_proc.prosecdef` is false and its search path is empty;
  inspect `pg_policies` for unchanged self-only writes; confirm
  `has_function_privilege('authenticated',
  'public.protect_external_account_fields()', 'EXECUTE')` is false, and
  `has_column_privilege('authenticated', 'public.external_accounts', 'metadata',
  'SELECT')` / the same check for `external_user_id` are false.
  Confirm `has_table_privilege('anon', 'public.external_accounts', 'TRUNCATE')`
  and the same check for `authenticated` are false; repeat both for `TRIGGER`.
- Verify profile/settings reads normally. Execute forgery/write regression tests
  on an isolated local/staging database, **not against production**. Any production
  write QA or historical data correction requires separate owner authorization.
- Rolling back application code does not require removing the guard. Do not drop
  it to fix a frontend issue: that reopens the vulnerability. Correct a migration
  defect with a reviewed follow-up migration, not an edited historical migration.

This task performs no hosted migration, production QA write or deployment.
