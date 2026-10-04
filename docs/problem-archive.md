# Problem Archive architecture

## Scope

Milestone 3 establishes a source-faithful problem catalogue and the data needed for later practice and competitive rating work. It does not define a rating formula, estimate population difficulty, import external submissions, or provide a submission runner.

The archive treats AI olympiad performance as a measurement rather than a solved/unsolved flag. Every problem records its original metric and whether higher or lower values are better. A normalized performance may be stored alongside the raw score, but normalization is explicitly not a rating.

## Data model

### `problems`

A problem may belong to one `competitions` row or remain an independent archive item. The table stores:

- stable title, slug, optional event code, summary and statement;
- category and tags;
- metric name, metric direction and an optional source-defined reference score;
- `unrated`, `provisional`, or `rated` difficulty state and an optional difficulty value;
- provider, source label/URL, external identifier and structured provenance metadata;
- publication state and event ordering.

The source fields describe where the record came from. `source_provenance` can preserve import checksums, upstream versions, licensing notes, or other provider-specific evidence without promoting those fields into the core model.

### `problem_performances`

Each row is one observed performance by a KAIZ profile. It stores the source metric's raw score, an optional normalized performance in `[0, 1]`, status, attempt timestamp and provenance.

`attempt_type` is deliberately either `official` or `practice`:

- Official rows are administrator-managed evidence. Public reads require a published problem AND a linked result in a published `competition_result_sets` row. Unlinked records (including records detached by a result deletion) are admin-only. Even the participant cannot bypass draft official publication.
- Practice rows are owner-scoped self-reports. An authenticated owner can create an unnormalized `valid` attempt and edit its raw score/attempt time or delete it while it remains an unreviewed self-report. `valid` means eligible for comparison, not verified or trusted. Members cannot turn practice into official evidence or attach it to competition results.

Only administrators or trusted database/backend roles control status, normalization, provider/external identity and provenance. An invoker trigger enforces these boundaries for direct API writes, not just UI actions. Once an attempt is invalidated/disqualified, normalized, or carries provider/provenance evidence, only an administrator/backend can edit or delete it. Owners may record a new self-report but cannot restore or overwrite reviewed evidence. Member audit identity and recording timestamps are server-derived; members cannot attribute a write to an administrator.

The trigger-derived `linked_competition_id` and composite foreign keys enforce the problem/result competition and result participant context on child AND parent writes, including concurrent changes. Incompatible parent edits fail. Existing profile/competition cascades and result deletion detachment remain supported; detached official records become admin-only. Existing inconsistent linked data causes migration validation to fail rather than being silently accepted.

The existing competition results model remains authoritative for published event standings. The optional foreign key gives an official per-problem measurement traceability to a standing without adding problem columns to `competition_results` or changing its publication workflow.

The best upsolving result is derived from valid practice rows: normalized performance descending with explicit NULLS LAST, then raw score descending for higher-is-better or ascending for lower-is-better, then newest attempt and stable ID ascending. Any available normalized value (including zero) takes precedence over unnormalized self-reports. When all normalized values are null, this selects the true best raw score. The UI labels the raw score of a normalized best attempt separately from an unnormalized best raw score. Practice never overwrites official results.

## Normalized performance

`normalized_performance` is direction-adjusted: `1` is better than `0` regardless of whether the raw metric is maximized or minimized. It may be null when a trustworthy normalization is not available.

No formula is prescribed in this milestone. Administrators/backend producers must record the normalization methodology and identity in provenance. Owners cannot claim that provenance themselves. Raw self-reports are not independently verified. Historical values written before the hardening migration are not retroactively authenticated; an administrator must review them before treating them as trusted evidence.

## Statistics

`problem_statistic_snapshots` keeps immutable-in-concept, versioned aggregate observations. A current snapshot is selected per problem and population scope. It includes:

- sample size;
- median normalized performance;
- 10th, 25th, 75th and 90th percentile thresholds;
- unrated/provisional/rated state;
- calculation version, methodology metadata and calculation timestamp.

Only one current snapshot may exist for a `(problem, population_scope)` pair. Historical snapshots remain available by marking the previous row non-current. Statistics are administrator/backend managed; this milestone does not calculate them in database triggers.

RLS makes **all snapshots and scopes of a published problem** publicly readable, including historical rows and methodology. The application displays only the current `all_valid` snapshot. Draft problem snapshots are admin-only. Producers must publish only approved aggregate data/metadata and must not put private draft-result evidence or sensitive participant data in public snapshots. Publishing a problem exposes its snapshot history as well as the current row.

This structure leaves Milestone 4 free to introduce versioned Practice Rating, Competitive Rating, population-derived difficulty, or an IRT-like model without rewriting raw attempts.

## Access boundaries

- Published problems and their snapshot history/scopes are publicly readable; the UI selects current `all_valid` statistics.
- Draft problems and all problem/statistics mutations are administrator-only.
- Official performances require both problem and linked standings publication for public reads; all official mutations and unlinked/draft reads are administrator-only.
- Practice is readable by its owner and administrators. Owners can manage plain self-reports; reviewed/trusted fields and reviewed rows are admin/backend-controlled.
- Anonymous and member clients cannot publish problems, manufacture official evidence, or write aggregate statistics.

## Application routes

- `/problems` lists published problems and filters by search, difficulty state and metric direction.
- `/problems/[slug]` shows statement/source metadata, metric semantics, the current statistics snapshot, official performances and the signed-in user's separate best practice performance.
- Competition detail pages show their published archive problems and link back to each problem detail.

Lists have stable ID tie-breaks. Official rows are observations, not numbered ranks (ties and missing normalization do not imply a standings rank). Full archive/competition pagination is deferred; those lists remain subject to the Supabase response limit. The official list is limited to ten records by the detail page.

## Migration and verification order

Apply **all database migrations in timestamp order before deploying application code** that queries these tables. This includes `202609300001_problem_archive_foundation.sql` and the new `202610040001_problem_archive_integration_hardening.sql`. Do not edit an already-shared/applied migration. Run a fresh LOCAL reset and security checks first. Hosted migrations require the designated project owner's separate approval; application builds do not prove that hosted schema is ready.

On a machine with Docker and the repository's installed Supabase CLI, from an isolated local checkout with no hosted link:

```sh
npx --no-install supabase start
npx --no-install supabase db reset --local
npx --no-install supabase db lint --local --level error
npx --no-install supabase test db
node --test tests/problem-performances.test.mjs
```

The pgTAP security suite uses transactional local fixtures and rolls them back. It covers anon/owner/other-member/admin reads/writes, trusted-field spoofing, reviewed-attempt protection, standings withdrawal, incompatible parent changes and existing delete cascades. The dependency-free Node test command uses the existing TypeScript and Supabase query-builder packages with in-memory responses: it checks query ordering, not database RLS. Never run these fixtures against hosted Supabase; do not use `--linked`, `db push`, or hosted environment files for these checks.

## Deferred work

- administrative problem/result ingestion UI;
- external provider adapters and scheduled synchronization;
- a practice submission or manual-entry workflow;
- normalization and statistics calculation jobs;
- minimum-sample rules and the final difficulty/rating algorithms;
- team-level per-problem performances and anonymous/external participant matching;
- statement asset storage, rendering full Markdown, and licensing workflows.
