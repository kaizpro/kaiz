# Temporary Kazakhstan results PDF release

This change prepares two external PDF link slots. It does not publish files,
standings, or database rows. Both Supabase result sets must stay unpublished.
There is no PDF, named participant data, original workbook, or private source URL
in this PR. The exports are prepared privately outside Git for owner review.

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
6. After separate release-owner approval, configure only the corresponding
   server-side variable in the intended deployment environment:
   - `KAIZ_KAZAKHSTAN_2025_RESULTS_PDF_URL`
   - `KAIZ_KAZAKHSTAN_2026_RESULTS_PDF_URL`
   Both are empty by default. Invalid/missing values render an honest unavailable
   state, with no placeholder URL. Vercel environment changes require a separately
   approved deployment to take effect; this PR does not change hosting settings.
7. Review and merge/deploy this PR only through the normal owner-approved workflow.
   Check both competition Results tabs anonymously on that deployment, including
   keyboard focus, mobile, light/dark and 200% text. Native standings must still
   show unpublished/empty status; the PDF link is a separate external export.

Viewer access prevents editing the hosted copy, not copying or redistribution.
Public readers may download, copy, screenshot or reshare it. Inspect the hosting
account's public owner/display information and use an appropriate KAIZ account.
Google states that a shared file's owner name and email are visible; prefer a
KAIZ-controlled publishing account, not a personal account whose identity must
remain private. See [Google's file-sharing guidance](https://support.google.com/drive/answer/2494822?hl=en).
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

- Owner review and explicit PDF publication/upload authorization.
- Actual separately hosted public PDF URLs; none are invented in source.
- Independent anonymous access and downloaded-checksum verification after hosting.
- PR approval and separately authorized configuration/deployment.
- The outstanding results-privacy migration and native Batch D publication remain
  separate release gates; these PDF links do not resolve admin PGRST202.
