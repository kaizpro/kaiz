# Public Learn invocation incident — 2026-10-22

## Evidence and cause

The owner reported 1,334,777 invocations in usage and approximately 709K
production invocations over twelve hours. Read-only Vercel inspection independently
confirmed the concentration: a later rolling six-hour Functions view showed about
624K invocations, with `/learn/[slug]` about 334K and `/learn` about 289K. CDN
Observability showed **0% cached** for both routes. Counts are rounded, rolling,
and collected at different instants; do not sum them as a frozen billing export.

Anonymous production GETs to `/learn` and `/learn/python-fundamentals` returned
200, `Cache-Control: private, no-store, ...` and `X-Vercel-Cache: MISS`.
`/robots.txt` and `/sitemap.xml` returned 404 with the same uncached behavior.

Production was Ready at `13f287a7bb44a25ecea1eb9c59d65ddf0c73551d`, from
`codex/premium-learning-ui`; fetched `main` was `8d4d23e`. The root layout,
header, Proxy and Learn files were identical between those revisions. This is
not evidence of a new rendering regression in the latest visual changes:
the shared cookie-reading header and broad auth Proxy are longstanding.

The public curriculum is local data. Nevertheless, root `SiteHeader` called
`getCurrentProfile`, which called server Supabase Auth through `cookies()`.
That request-time API made the entire route dynamic. `generateStaticParams`
alone did not make topic pages static. A baseline production build **with
Supabase configured** confirmed all three Learn routes were `ƒ` dynamic.
Unconfigured builds had concealed this deployment-specific behavior.

The Proxy matched Learn before the route/cache lookup. `/learn/topics` also
awaited server `searchParams` to filter local content. The tree already used
native history and `prefetch={false}` for its 85 topic nodes; no tree polling or
request loop was found. Other catalog/header links could still prefetch dynamic
destinations. Missing crawler metadata left no canonical inventory or guidance
against query-state permutations. We have not established the exact request
query/prefetch distribution: the detailed Paths view is upgrade-gated and shows
sample data, which must **not** be treated as KAIZ telemetry.

## Bot evidence

The actual CDN **Bot Name** view (not its gated sample Paths tab) showed roughly
587K `googleother`, 42K `meta-externalagent`, 3.9K `amazonbot` and 1K `googlebot`
requests in a rolling six-hour window. Blue verification badges were visible
for those crawlers. This is Vercel's verification, not an independent IP/DNS
audit performed by KAIZ. A network owner such as Google LLC alone would not
prove bot identity. The dominant Google label was **GoogleOther, not Googlebot**.

References:

- [Vercel bot verification badges](https://vercel.com/changelog/view-and-query-bot-verification-data-in-vercel-observability)
- [Google crawler verification](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests)
- [Proxy execution before cache](https://vercel.com/docs/routing-middleware)
- [CDN cache behavior](https://vercel.com/docs/caching/cdn-cache)

No Firewall rules, production settings, credentials, database records or billing
plan were changed during this investigation.

## Fix and security boundaries

- Render a neutral **Account** link in shared header HTML. Resolve its small
  account-control island in the browser using the existing Supabase client and
  `getUser`; fetch only that user's username under existing RLS. Errors remain
  neutral. No `/api/me`, polling, server-rendered identity or public-cache user
  variant is introduced. Without JS the Account link still reaches the protected
  dashboard/login flow. Normal protected pages/actions retain server Auth checks.
- Explicit `dynamic = "error"` on public Learn pages rejects a future accidental
  request-time dependency at build time. All 85 known topic slugs are generated;
  `dynamicParams = false` prevents arbitrary on-demand topic generation.
- Build-time static content is appropriate: it changes through reviewed Git
  releases, not per request. No ISR timer, private data caching or global cache
  override is needed. Content updates require a new build.
- Exclude only public `/learn` paths and the two static metadata endpoints from
  the Proxy matcher itself. Protected routes still match. Server Actions cannot
  rely on Proxy authorization; existing logout and learning actions retain their
  own session checks and are tested.
- Filter the public source catalog locally with native history/back/forward.
  The same HTML contains all 64 entries for no-JS access; no server query variants.
- Disable dense Learn links, account links, the logo and navigation prefetch from
  Learn, including dynamic destinations with loading boundaries.
- Add build-time robots/sitemap and canonical Learn URLs, without a database scan
  or private URLs. Robots query guidance is advisory, not access control. No
  blanket Learn/Search crawler ban is added.

Learning lesson IDs, completion/undo, XP, data access, RLS and migrations are
unchanged. Account UI hydration is not authorization. Auth callbacks, recovery,
admin, profiles, dashboard and actual learning mutations keep server checks.

## Verification and reproduction

Run the normal TypeScript, ESLint and application regressions, then:

```sh
npm run build
node --test tests/learn-cache.test.mjs
node tests/learn-cache.build.mjs
```

Build with browser-public Supabase variables present. CI deliberately uses
non-credential placeholders to activate the configured Auth code path; no real
keys or user data are needed. The build test starts its own loopback server,
checks all 87 Learn pages, HEAD/RSC/query/cookie requests, static metadata,
unknown-slug 404 and an uncached unauthenticated dashboard redirect. It does not
make production requests. Expected build labels are `○ /learn`, `○ /learn/topics`
and `●` for every topic. Learn entries must have static compute, no timed
revalidation and unknown-slug fallback disabled in the prerender manifest.

Opt-in `tests/learn-cache.browser.mjs` checks desktop/mobile, light/dark,
reduced motion, keyboard links, 200% text, no-JS catalog, no guest Supabase calls,
and no server requests for tree/filter/history interactions. It uses only
localhost. Existing `tests/skill-atlas.supabase.mjs` adds real authenticated
static-page header/cache and logout checks to its completion, new-session,
concurrent retry, XP/undo and ordinary/admin cross-user isolation tests. It is
hard-locked to the approved isolated QA project and cleans its synthetic users.
Never point these fixtures at production. SQL tests use disposable PostgreSQL.

## Release and mitigation

This change is a PR, not an applied production repair. Owner/reviewer must
approve the release. Production currently includes stacked UI commits not on
`main`; do not replace that deployment with an older `main` and accidentally
lose those UI changes. Integrate the reviewed cache fix with the intended
production revision using the normal reviewed release process.

After an owner-authorized release:

1. Confirm Vercel build output classifies Learn as static, including configured
   environments. Check guest and real signed-in HTML and RSC without logging
   cookies/tokens. Public responses must contain no user identity or `Set-Cookie`.
2. Verify CDN cache hits on repeat requests to root/topic/catalog and query
   variants. Proxy must not match Learn. This local test cannot substitute for
   post-release Vercel CDN evidence.
3. Smoke login, public Learn header, My Learning, one completion/undo and logout;
   ensure private dashboard/action responses remain private and uncached.
4. Check robots/sitemap/canonical links, and compare equal-duration production
   invocation/cache windows. Review matched functions, bot classification,
   method, RSC/prefetch and query cardinality in available logs without exporting
   personal request data.

Normal public Learn GET/HEAD/RSC traffic should no longer execute page rendering
or this auth Proxy on each request. At the owner-reported mix, the two Learn
routes account for about **99%** of twelve-hour invocations (702K/709K), so this
targets the dominant avoidable workload. This is an opportunity estimate, not a
guaranteed billing reduction: other routes, POST/Server Actions, malicious
requests, CDN transfer and platform accounting remain. A fresh deployment does
not erase consumed quota or guarantee that Vercel will resume an exhausted plan.

For immediate containment before release, the owner may separately authorize a
narrow crawl/Firewall policy for confirmed excessive non-search crawlers on
Learn. Inspect verified identities and legitimate access first; do not block
Google/Meta ASNs wholesale, disable Auth, blindly challenge Search crawlers,
or buy an upgrade. This task does not authorize that policy change.

Rollback is the previous reviewed application deployment, which restores the
invocation cost too. No database rollback or migration is involved.
