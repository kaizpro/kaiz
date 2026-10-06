# Production authentication and email delivery

KAIZ uses Supabase Auth with cookie-backed PKCE sessions. Signup, confirmation resend and password recovery return through `/auth/callback`, which accepts either the PKCE `code` flow or the server-verifiable `token_hash` email-template flow. Redirects share a canonical internal-path validator: external/network-path URLs, backslashes, encoded separators, controls, nested encoding and normalization into `//` paths are rejected. Recovery token links always go to `/auth/update-password`. Callback redirects are non-cacheable and do not forward authentication URLs as referrers.

## Current verification boundary

The auth code is tested locally; it is NOT a claim of production readiness. At the start of this task the hosted public Auth settings reported Google disabled and email confirmation enabled. No provider credentials, templates, SMTP settings, DNS, custom domains, billing or hosted schema were changed by this branch. Custom SMTP/sender-domain configuration and the current Supabase subscription are not confirmed. Complete the dashboard setup and the production checklist below before closing the release verification.

No database migration is required for these auth changes. The merged archive migrations are unrelated to this task; do not apply them as part of auth configuration. A release owner must separately coordinate them before deploying current main, which queries archive tables.

## Vercel environment

Configure these variables for the Production environment in Vercel and redeploy after saving them:

- `NEXT_PUBLIC_SITE_URL=https://kaiz-indol.vercel.app`
- `NEXT_PUBLIC_SUPABASE_URL` with the hosted Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the hosted project's publishable browser key

Do not add a Supabase secret or service-role key. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is a legacy alternative to the publishable key.

`NEXT_PUBLIC_SITE_URL` takes priority. Without it, production uses `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL` / `NEXT_PUBLIC_VERCEL_URL`. Preview uses its deployment URL, not the production-domain fallback. `VERCEL`, `VERCEL_ENV` and `NODE_ENV` identify hosted/production contexts. Only unconfigured non-production local development falls back to localhost; unconfigured production fails closed. Hosted origins must be public HTTPS without credentials, paths, query strings or fragments.

Keep Development, Preview and Production environment values separately scoped in Vercel. A preview must use a separate test Supabase project, not write to production Supabase. Set an explicit preview origin if needed and allow that origin only in the test project. An explicit production origin mistakenly assigned to Preview overrides the deployment fallback; the release owner must prevent that misconfiguration. Do not allow arbitrary preview domains in the production project.

## Supabase URL configuration

In Supabase Dashboard, open **Authentication → URL Configuration** and set:

- Site URL: `https://kaiz-indol.vercel.app`
- Redirect URL: `https://kaiz-indol.vercel.app/**`
- Redirect URL: `http://localhost:3000/**`

Keep email confirmation enabled. Do not weaken confirmation or RLS for testing.

## Google OAuth: manual dashboard setup

`Unsupported provider: provider is not enabled` means the Supabase Google provider is disabled. KAIZ already calls `signInWithOAuth({ provider: "google" })` on the cookie-aware server client and supplies the KAIZ callback as `redirectTo`. That client uses PKCE; the application callback exchanges the code and stores the session cookies.

Proceed one manual action at a time. Never paste credentials into chat:

1. Open **Supabase Dashboard → KAIZ project → Authentication → Sign In / Providers → Google**. Copy the displayed **Callback URL (for OAuth)**. It is the Supabase `/auth/v1/callback`, NOT KAIZ `/auth/callback`.
2. In **Google Cloud Console → Google Auth Platform**, select/create the intended project. Configure **Branding** with the real app name/support contact, **Audience** (External where applicable), and **Data Access** with only `openid`, email and profile scopes. While the app is in Testing, explicitly add the QA Google accounts as test users. Do not invent a domain or broaden scopes.
3. Open **Clients → Create client → Web application**. Authorized JavaScript origins: `https://kaiz-indol.vercel.app` and `http://localhost:3000`. Authorized redirect URI: the exact Supabase callback copied in step 1. Do not put the KAIZ callback in this Google field.
4. Copy the Client ID and Client Secret directly into **Supabase → Google provider**, enable the provider, and save. The human enters the Client Secret himself; neither value belongs in repository files/public frontend variables.
5. Verify Supabase's KAIZ redirect allowlist above, then complete the Google QA cases below. Before general launch, review the Google app publishing/brand-verification requirements; a Testing-only audience is not public-user readiness.

The existing auth.users trigger creates one profile keyed by the user UUID and derives the display name from provider metadata. OAuth success goes through `/onboarding`, which redirects completed users to their public profile. Google/provider account linking behavior must be verified with the intended test users; never manually merge/delete real accounts to make QA pass.

## Email templates

The existing callback continues to accept Supabase's PKCE `code` redirects. For an SSR-safe token-hash flow, update the authentication templates in **Authentication → Email Templates**.

Confirm signup button URL:

```text
{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=signup
```

Reset password button URL:

```text
{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery
```

KAIZ always supplies a redirect URL that already contains `?next=...`, so the template appends parameters with `&`. In an HTML `href`, use `&amp;` between parameters. Preserve the existing template body and change the button/link target only; no unrelated branding redesign is required. After saving, inspect the received link privately and verify its callback origin. Never paste a complete authentication link into chat or logs.

The application does not currently expose an email-change UI. Leave unused templates alone. If an email-change workflow is later enabled, its callback supports `type=email_change`; use `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email_change` only when that workflow explicitly supplies the KAIZ callback URL. Keep Supabase secure email-change confirmation enabled. Do not mistake generic callback support for an implemented/tested email-change feature.

Disable provider click/open tracking for Auth messages; link rewriting and mail-scanner consumption of one-time links need to be checked during QA. Expired or consumed links show a neutral callback error and users can request another confirmation at `/auth/resend-confirmation` or another password-reset email. Resend respects Supabase rate limits; there is no automatic retry loop.

## Resend custom SMTP

Custom SMTP is required for a public production launch. Supabase's built-in sender is a best-effort development service, is restricted to authorized project-team addresses, and is limited to two Auth emails per hour.

Recommended setup:

1. In Resend, add a sending domain that KAIZ controls and complete its DNS verification.
2. Create a restricted Resend API key for transactional Auth email.
3. In Supabase Dashboard, open **Authentication → Emails → SMTP Settings** and enable custom SMTP.
4. Enter the values directly in the dashboards; never place the API key in this repository or a `NEXT_PUBLIC_` variable:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: the Resend API key
   - Sender email: a verified address on the sending domain
   - Sender name: `KAIZ`
5. Review **Authentication → Rate Limits** after SMTP is enabled. Size the email limit for the expected launch volume and add abuse controls before increasing it materially.
6. Send one confirmation and one recovery message to addresses on different mailbox providers. Check Supabase Auth logs plus Resend delivery, bounce, and suppression status.

Use `KAIZ <no-reply@auth.<owned-domain>>` only after that subdomain is verified. No owned domain has been established by this task. If none is available, stop for the human to choose/acquire one; never buy it automatically. Add only the SPF/MX and DKIM records displayed by Resend for the chosen sending subdomain, preserving existing DNS records. Review a suitable DMARC policy and alignment with the domain owner; do not assume DNS values or immediately enforce a policy that could break other senders. API/SMTP secrets go directly into the dashboards, not `.env` files. The Resend integration sends through Supabase; no Resend frontend SDK or public API key is needed.

## Custom frontend domain migration (not activated)

After the human selects an owned domain, the release owner attaches it in **Vercel → Project → Settings → Domains**, and the human applies the exact DNS records Vercel displays. After HTTPS is valid, set Production `NEXT_PUBLIC_SITE_URL` to the selected origin; update Supabase Site URL and add the new callback allowlist. Add the new frontend origin to the Google Web client's Authorized JavaScript origins. The Google redirect URI stays the Supabase callback unless the Supabase domain changes too.

Retain `http://localhost:3000/**` and the existing Vercel origin during transition. Deploy/retest every flow on the new domain before redirecting traffic or removing old production redirects. Existing origin-specific sessions/cookies may require users to sign in again. Do not change the local `.env.local` to the production origin. No custom frontend domain is selected/attached by this branch.

## Optional branded Supabase domain (not activated)

Supabase custom domains are a paid add-on on a paid plan; current project eligibility/subscription is not verified. Check **Supabase organization → Billing** and **Project → Settings → General → Custom Domains** privately before approval. No purchase, upgrade or activation is authorized by this code change.

As checked on 2026-10-06, the published add-on price is $0.0137/hour (approximately $10/month), in addition to the paid plan and other usage. Re-check the actual dashboard quote before authorizing anything: [official custom-domain billing](https://supabase.com/docs/guides/platform/manage-your-usage/custom-domains).

After explicit approval, use a selected subdomain such as `auth.<owned-domain>` or `api.<owned-domain>`. This is one custom project domain for Supabase services, not a separate Auth-only service. Its CNAME points to the project's default Supabase hostname; domain verification also requires the exact `_acme-challenge` TXT record(s) supplied by Supabase. Do not invent their values or reuse email-domain records. A separate email-sending subdomain avoids confusing SMTP DNS and the Supabase CNAME.

BEFORE activation, add `https://<chosen-supabase-host>/auth/v1/callback` to Google's Authorized redirect URIs, retaining the original Supabase callback during transition. Activation changes the OAuth callback advertised by Supabase. Follow the dashboard verification/SSL steps, then update/redeploy the chosen Supabase URL configuration deliberately and retest sessions, password emails and Google OAuth. Domain changes can alter client storage/cookie names; verify migration behavior rather than assuming existing sessions survive. Keep the old API hostname until verified.

References: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google), [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Resend SMTP](https://resend.com/docs/send-with-supabase-smtp), [Supabase custom domains](https://supabase.com/docs/guides/platform/custom-domains), [Vercel URL variables](https://vercel.com/docs/environment-variables/system-environment-variables).

## Production verification checklist

1. Once configuration AND the auth branch deployment are approved, register a human-controlled fresh test account on the production domain. Do not reuse real user credentials or delete users automatically.
2. Confirm that the email link starts at the production callback and lands on `/onboarding` with an authenticated session.
3. Sign out and request password recovery.
4. Confirm that the recovery link lands on `/auth/update-password` with a valid recovery session.
5. Change the password, verify the old password is rejected, and verify the new password signs in.
6. Confirm localhost signup and recovery still work with the local redirect allow-list entry.
7. Check that no secrets or full authentication links were written to logs.
8. Request a confirmation resend; verify a new email is delivered and its link confirms the account. Test expired/invalid links and rate-limit responses without sending bursts.
9. Sign in with Google: consent → Supabase callback → KAIZ callback → onboarding/public profile. Confirm a new Google user has exactly one profile; a returning Google user retains their identity and profile. Verify any intended existing-email linking without modifying real accounts.
10. Test safe internal `next` paths and reject external, network-path, backslash, encoded-separator/control and normalized-double-slash targets. Verify recovery with a missing/wrong next value still opens password update.
11. Check delivery through more than one mailbox provider plus Supabase/Resend logs, spam/bounce/suppression states, logout and fresh login. Do not mark a sent API response as inbox delivery.

## Local code verification

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`, and `node --test tests/auth.test.mjs tests/problem-performances.test.mjs`. Auth tests execute the real validators/actions/callback with isolated provider responses; they do not replace real Supabase Auth or verify production delivery. Record CI and production QA separately. Until signup, confirmation, recovery and Google have actually passed on production, public-user readiness is **NO**.
