# KAIZ Learning Tree

The public `/learn` route is an open curriculum map, not a course or progress tracker.
It has two equally discoverable tracks: Coding & AI (51 topics) and Mathematics
(34 topics). All 85 topic destinations exist; their learning materials are empty.
No account, database table, migration or external service is required by Learning.

## Catalogue and navigation

`lib/learning/curriculum.ts` owns the typed outline. Each node has an explicit stable
ID, slug, title, description, kind, track, parent, ordered children, recommended
prerequisites and resources. Parents, tracks and sibling order are derived once
from the nested outline, so they cannot drift from separately maintained child lists.
IDs and slugs initially match, but topic routes resolve slugs independently of IDs.

Python and C++ are parallel paths. Algorithmic data structures live in Algorithms;
language-specific collections and memory belong to Programming. Transformers,
Gradient Descent and Ensemble Methods each have a canonical topic; related areas
recommend or reference those concepts instead of creating duplicate lessons.
Stages suggest an order without adding extra parent relationships. Recommendations
do not lock any topic, and their links do not draw crossing edges through the map.

`/learn/[slug]` renders a topic, its breadcrumbs, inherited/topic recommendations,
adjacent sibling topics and a roadmap return link. Unknown or non-topic slugs
return 404. All canonical topic pages are generated at build time.

Roadmap state lives in `track`, `open` and `topic` query parameters. Only catalogue
IDs for the selected track are accepted. Opening a nested group opens its ancestors;
closing one prunes its descendants. Closing a selected path does not reopen it.
Native history updates integrate with Next's search params, with no server round
trip for disclosures. Back/forward navigation restores the URL state.

Topic links carry an internal `from` context. Returning preserves other open
branches, reveals the current topic and anchors its active path. A scoped effect
restores hash scrolling and keyboard focus after client-rendered nodes exist.
Direct topic
visits, breadcrumbs, recommendations and adjacent navigation use a canonical
return path. External return destinations are never accepted.

## Adding actual materials

Keep existing IDs stable and slugs unique. Add topics through `topics()` under
the appropriate group. Reference real catalogue IDs for recommended foundations.
Run the integrity tests when adding/reordering nodes or stages.

Each topic's `resources` accepts `{ id, title, kind, href }`, where `kind` is
`article`, `video` or `exercise`. A topic entry is
`[id, title, description, prerequisites?, resources?]`. Supply reviewed materials
in the optional fifth field, using `[]` in the fourth if no prerequisites apply.
Only HTTP(S) links render; titles are normal React text, not arbitrary HTML.
The detail page already renders resource links when resources are present and
otherwise shows the intentional empty state. Do not add invented links, lessons,
completion percentages, achievements or progress.

The outline is separate from presentation; a future CMS can provide the same
typed node shape without replacing the tree. No CMS or storage layer is introduced
here. Learning uses the application's current English UI; localized curriculum
strings can be added when the existing localization system has page-level routing.

## Interaction and styling

`components/learning/` owns the tree, recursive branch disclosure, context-aware
return link and locally scoped CSS. Existing KAIZ tokens, Geist fonts, Lucide icons
and light/dark themes are reused. No shared global styles or navigation changed.

CSS connectors follow their layout containers; no graph engine, absolute SVG
geometry or scroll-time measurement is used. Desktop branches spread into lanes;
mobile uses connected vertical rails while keeping both main tracks visible.
All major areas branch from a shared track rail, rather than forming a chain of
apparent prerequisites. Stage numbers are a suggested reading order only.
Root landmarks, track destinations, area disclosures, path/subcategory headers
and pill-shaped topic links have distinct visual hierarchy. Topic counts describe
the catalogue, never completion. Python and C++ retain parallel desktop lanes.
Topic lists adapt to their own branch width with a CSS container query. Wide
branches use two connected columns; narrow branches and phones retain one column
to keep long labels readable, regardless of their depth in the curriculum.
The narrower desktop guide appears only after choosing a track, identifies the
selected topic's area and shows the last explored topic from the current URL.
Expansion uses a grid-height transition, with brief node/line entry animations.
Node entrance is opacity-only, so connections do not detach from moving nodes.
Reduced motion disables feature transitions and animations. Closed groups are
inert and excluded from accessibility navigation. Native buttons expose
`aria-expanded`/`aria-controls`; links, skip navigation and visible focus rings
remain keyboard-accessible. Font sizes are relative for text enlargement.
Server-rendered buttons remain disabled until hydration attaches their handlers;
the roadmap exposes this brief initialization with `aria-busy`. Native topic links
remain valid destinations. Topic pages reuse the same landmarks and interactive
surfaces, with honest coming-soon copy and optional foundation recommendations.

## Verification

```sh
node --test tests/*.test.mjs
npm run typecheck
npm run lint
npx --no-install next build --webpack
```

Browser regression is opt-in and requires an existing Playwright installation
and Chrome. It installs nothing and allows only a localhost application URL:

```sh
KAIZ_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
  node tests/learning-roadmap.browser.mjs
```

The default URL is `http://localhost:3100`; override with `KAIZ_LEARNING_URL`.
Use the dev server's announced hostname: Next's development origin policy can
block resources when substituting `127.0.0.1` for `localhost`. No configuration
change is needed. Final browser checks also run against the optimized build.
Screenshots default to `/tmp/kaiz-learning-browser`, outside the repository.
The regression checks keyboard/focus, disclosure state, back/forward, all 85
topic routes, active paths, recommendations, empty states, reduced motion,
text enlargement, touch targets and light/dark layouts at 375/768/1024/1440.
It measures connector endpoints, checks rapid expansion/collapse and contextual
navigation, and captures both tree and topic-page layouts at every width/theme.
Presentation tests cover initialization, context and real descendant counts.
It also blocks unexpected non-local browser requests.

At 200% root text size on a 375px viewport, Learning's content bounds pass but the
existing shared site header overflows. The browser check reports this explicitly;
it does not hide it or alter the shared header. Normal-size page layouts pass at
all four tested widths. Screen-reader output has not been manually audited.

For Learning-only local builds and runtime checks, disable configured Supabase
clients using **process-only** empty overrides for `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Do not edit `.env.local`, use hosted credentials, or run database tests for this
static feature. Application code, proxy and existing Auth behavior remain unchanged.

Team scope and implementation checkpoints: [Issue #19](https://github.com/kaizpro/kaiz/issues/19).
Commit, push, PR, merge and deployment are separate approval steps.
