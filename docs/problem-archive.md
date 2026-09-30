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

- Official rows are public, administrator-managed evidence. They may reference a `competition_results` row. A database trigger verifies that the problem, result and user belong to the same competition context.
- Practice rows are owner-scoped. An authenticated user may manage only their own practice rows and cannot convert them to official rows or attach them to competition results.

The existing competition results model remains authoritative for published event standings. The optional foreign key gives an official per-problem measurement traceability to a standing without adding problem columns to `competition_results` or changing its publication workflow.

The best upsolving result is derived from valid practice rows ordered by normalized performance. It is not stored over the official result and does not overwrite it.

## Normalized performance

`normalized_performance` is direction-adjusted: `1` is better than `0` regardless of whether the raw metric is maximized or minimized. It may be null when a trustworthy normalization is not available.

No formula is prescribed in this milestone. The producer of normalized values must be identified through source provenance or a later versioned calculation process. Raw scores remain the source-faithful record.

## Statistics

`problem_statistic_snapshots` keeps immutable-in-concept, versioned aggregate observations. A current snapshot is selected per problem and population scope. It includes:

- sample size;
- median normalized performance;
- 10th, 25th, 75th and 90th percentile thresholds;
- unrated/provisional/rated state;
- calculation version, methodology metadata and calculation timestamp.

Only one current snapshot may exist for a `(problem, population_scope)` pair. Historical snapshots remain available by marking the previous row non-current. Statistics are administrator/backend managed; this milestone does not calculate them in database triggers.

This structure leaves Milestone 4 free to introduce versioned Practice Rating, Competitive Rating, population-derived difficulty, or an IRT-like model without rewriting raw attempts.

## Access boundaries

- Published problems and their current statistics are publicly readable.
- Draft problems and all problem/statistics mutations are administrator-only.
- Official performances are publicly readable and administrator-managed.
- Practice performances are readable and writable only by their owner (and administrators).
- Anonymous and member clients cannot publish problems, manufacture official evidence, or write aggregate statistics.

## Application routes

- `/problems` lists published problems and filters by search, difficulty state and metric direction.
- `/problems/[slug]` shows statement/source metadata, metric semantics, the current statistics snapshot, official performances and the signed-in user's separate best practice performance.
- Competition detail pages show their published archive problems and link back to each problem detail.

## Deferred work

- administrative problem/result ingestion UI;
- external provider adapters and scheduled synchronization;
- a practice submission or manual-entry workflow;
- normalization and statistics calculation jobs;
- minimum-sample rules and the final difficulty/rating algorithms;
- team-level per-problem performances and anonymous/external participant matching;
- statement asset storage, rendering full Markdown, and licensing workflows.
