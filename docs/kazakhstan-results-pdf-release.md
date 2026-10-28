# Temporary Kazakhstan results PDF release

This change links two owner-authorized, separately published Google Drive PDF
copies. It does not publish Supabase standings or database rows. Both Supabase
result sets must stay unpublished.
There is no PDF, named participant data, original workbook, or private source URL
in this PR. The approved exports and verification artifacts remain outside Git;
only their intentionally public viewer URLs are included in source.

The Results link is labelled **Organizer-provided results — KAIZ PDF copy**.
The Kazakhstan source heading and attribution explicitly identify a KAIZ copy
hosted on Google Drive, not a file hosted on the organizer's website.

## Approved export scope

| Edition | Coverage | Included fields | Awards |
| --- | --- | --- | --- |
| AI Olymp Kazakhstan 2025 | 38 recorded / 40 announced finalists | Original rank, name, remote-stage score, day 1 score, day 2 score, total | None inferred |
| AI Olymp Kazakhstan 2026 | 39 recorded / 40 qualifiers | Original rank, name, three original task scores, total | Only the 23 confirmed assignments: 3 Gold, 5 Silver, 15 Bronze |

Keep all entries and ties, including the 2025 red-highlighted rows. Do not infer
missing finalists. The PDFs are KAIZ exports of organizer-provided standings,
not newly issued organizer documents. No competition dates are asserted.
City, source usernames, source identifiers, audit fields, private links and
document metadata are excluded. Original score-column labels are retained.

## Verified public copies

The owner reviewed the exact exports, authorized their publication and use of
the existing Drive account, and explicitly accepted possible owner name/email
visibility. Only these two files were uploaded into a separate results-only
folder; only these two files received Anyone with the link / Viewer access.
The folder, backups and originals were not shared.

- [2025 PDF](https://drive.google.com/file/d/16wh5iwhsvbkHTS5viTS1JpJ-yB7vfP5C/view):
  38 entries / 2 pages; SHA-256 `5ea5ddae63312b9b4e0e6672fa69bb310b5c2cfc992bfc1ff279086e1ac62ccd`.
- [2026 PDF](https://drive.google.com/file/d/1-qrntPtloG19JLBVGmhwPZJqzqvkPqU6/view):
  39 entries / 2 pages; SHA-256 `f84b91ef95d61d6418b730855d772d702edecc4c480c581b9ba0ff890a8dbe54`.

Each actual Drive file was independently opened in a fresh, cookie-free browser
context. Its title/year, two-page preview and coverage were checked, then the
entire PDF was downloaded anonymously. Both downloaded files match the approved
local bytes and hashes exactly. This validates the complete frozen table, not
just a thumbnail or successful HTTP response. The account owner identity was
inspected; it is not presented as the official organizer's hosting account.

## Publication gate and hosting plan

1. Obtain **separate explicit owner authorization to publish these exact two
   reviewed PDF files**, identified by their private verification-report checksums.
   Prior permission to display results does not authorize this upload/sharing step.
2. Use a separate KAIZ-controlled Google Drive destination, e.g. a new results-only
   folder. **Never use or change sharing on KAIZ-Backups**, a recovery-key folder,
   original organizer workbook, or any folder containing private source files.
3. Upload only the two approved PDFs. Set each individual PDF to **Anyone with
   the link / Viewer**, never Editor. Do not share an entire private folder.
   Do not upload source JSON, workbooks, screenshots, review reports or recovery files.
4. Use canonical `https://drive.google.com/file/d/<PDF_FILE_ID>/view` links. Confirm
   the file is actually a PDF, not an original workbook or similarly named file.
   The application permits only this file-view shape, not spreadsheet/folder/edit
   URLs, credentials, fragments, arbitrary hosts or resource-key/token parameters.
5. Open each exact link in a clean anonymous browser session. It must display
   without login, access requests or a resource key. Download that public PDF and
   compare its SHA-256 with the owner-approved local file. Recheck all pages,
   coverage, scores, ties and 2026 medal assignments. A valid URL shape alone is
   **not** evidence of permission, PDF type or successful anonymous access.
6. This PR supplies the verified public URLs as reviewed defaults, so no
   production environment/configuration changes are needed. Optional server-only
   overrides remain available for separately authorized replacement/withdrawal:
   - `KAIZ_KAZAKHSTAN_2025_RESULTS_PDF_URL`
   - `KAIZ_KAZAKHSTAN_2026_RESULTS_PDF_URL`
   An unset variable uses the reviewed default. An explicit empty or invalid
   value disables that edition's link; it does not silently fall back. The empty
   examples intentionally disable the links if copied into a local environment.
   No placeholder URLs are rendered. Any later Vercel environment change requires
   separate approval/deployment; this task did not change hosting settings.
7. Review and merge/deploy this PR only through the normal owner-approved workflow.
   Check both competition Results tabs anonymously on that deployment, including
   keyboard focus, mobile, light/dark and 200% text. Native standings must still
   show unpublished/empty status; the PDF link is a separate external export.

Viewer access prevents editing the hosted copy, not copying or redistribution.
Public readers may download, copy, screenshot or reshare it. Inspect the hosting
account's public owner/display information and use an appropriate KAIZ account.
Google states that a shared file's owner name and email are visible; prefer a
KAIZ-controlled publishing account, or obtain explicit informed owner permission
to use another account. That informed permission was obtained for this release.
See [Google's file-sharing guidance](https://support.google.com/drive/answer/2494822?hl=en).
Do not describe this as revocable confidentiality or protection of published names.

## Security and rollback

No migrations, RLS, Auth, audit fields, participant rows, publication RPCs or
production configuration changes are required. Existing public-column result
queries continue to require `published=true`; the two draft UUIDs are untouched.
PDF link configuration is read only on the existing dynamic competition pages,
not the shared layout or static Learn routes. There is no proxy/download endpoint,
server-side URL fetch, or request-controlled redirect.

To withdraw a published PDF later, owner approval is required to remove its link
configuration and restrict that individual Drive file. Removing only the KAIZ
link does not revoke Drive access or copies already downloaded. Do not repair
any issue by publishing Supabase drafts or weakening database authorization.

## Remaining release requirements

- PDF review, publication authorization, actual Viewer URLs and independent
  anonymous full-download checksum verification: complete.
- PR approval and separately authorized merge/production deployment: pending.
- After release, verify both live competition Results links resolve to the exact
  year/PDF above, while native standings stay unpublished. Until PR #69 is merged
  and deployed, live KAIZ does not receive the new links. No old code redeployment.
- The outstanding results-privacy migration and native Batch D publication remain
  separate release gates; these PDF links do not resolve admin PGRST202.
