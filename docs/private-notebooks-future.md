# Private practice notebooks — future design, not implemented

The existing `problem_performances` practice path is a private, owner-scoped self-report. It supports scores/history and best-practice selection; it does not upload, execute or reopen notebooks. A self-report is not a verified platform result. Preserve the current trust guard, publication rules and official/practice separation described in [the archive architecture](problem-archive.md).

## Minimal future implementation

- A new migration and separately approved storage setup, not edits to applied migrations. Private bucket, e.g. `practice-notebooks`, with no anonymous/public read URLs. Object paths must start with the authenticated user's UUID; enforce owner checks for SELECT/INSERT/UPDATE/DELETE in Storage RLS, not only in the application. Bucket privacy alone is insufficient.
- A small owner-owned notebook metadata table linked to a practice attempt and problem, with storage object ID/path, byte count, SHA-256, original safe filename, timestamps and validation version. Protect all reads/writes with `auth.uid() = user_id`; reject cross-owner attempt links using a constraint/trigger. Official results and trusted provenance are never user-editable.
- Validate server-side `.ipynb` JSON with a versioned Zod schema for nbformat 4, bounded cells, strings and nesting. Initial explicit size cap such as 10 MiB requires product approval; enforce both storage and upload limits. Strip/reject dangerous filenames, oversized embedded outputs and unexpected binary content. Do not trust extensions or MIME alone.
- Treat notebook cells/outputs as untrusted executable content. Never execute code or render raw HTML/JavaScript outputs in KAIZ. Prefer attachment download with safe content disposition; warn users to review notebooks before executing them. Scan where practical, but do not represent scanning as code safety.
- Save sensitive data only after informed user action. Warn about API keys, tokens and personal datasets in notebook cells/outputs. Avoid logging contents or uploading to external AI services.
- Upload through an authenticated server flow or narrowly scoped signed upload URL with owner checks and expiry. Downloads use freshly authorized, short-lived signed URLs; never persist/share signed URLs in public cards or logs. Prevent cross-user enumeration and cache leakage.
- Record last attempt/last score separately from best attempt; do not replace the current best-practice semantics. Scores remain labelled self-reported unless an approved trusted verifier supplies independent provenance. Notebook files do not prove a score.
- Define versioning, retention, quota, replacement and orphan cleanup before release. Do not delete the previous valid notebook until the new upload and metadata commit succeed. Public cards must not leak private attempt timestamps, scores or object paths.
- Owner/non-owner/anonymous/admin tests cover object and metadata paths, signed-link expiry, invalid notebooks and failed replacement. Test on isolated Supabase, not by adding production fixtures. Back up object bytes separately from database metadata.

No bucket, migration, upload button, notebook execution or production change is introduced by this sprint.
