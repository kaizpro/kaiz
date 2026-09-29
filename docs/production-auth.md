# Production authentication and email delivery

KAIZ uses Supabase Auth with cookie-backed PKCE sessions. Signup and password recovery both return through `/auth/callback`, which accepts the PKCE `code` flow and the server-verifiable `token_hash` email-template flow. Redirect destinations are restricted to local application paths.

## Vercel environment

Configure these variables for the Production environment in Vercel and redeploy after saving them:

- `NEXT_PUBLIC_SITE_URL=https://kaiz-indol.vercel.app`
- `NEXT_PUBLIC_SUPABASE_URL` with the hosted Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the hosted project's publishable browser key

Do not add a Supabase secret or service-role key. The code falls back to Vercel's deployment URL variables if `NEXT_PUBLIC_SITE_URL` is absent, but the explicit canonical URL remains required for predictable production email links.

## Supabase URL configuration

In Supabase Dashboard, open **Authentication → URL Configuration** and set:

- Site URL: `https://kaiz-indol.vercel.app`
- Redirect URL: `https://kaiz-indol.vercel.app/**`
- Redirect URL: `http://localhost:3000/**`

Keep email confirmation enabled. Do not weaken confirmation or RLS for testing.

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

KAIZ always supplies a redirect URL that already contains `?next=...`, so the template appends parameters with `&`. Disable link tracking in the email provider because rewritten authentication links can become invalid.

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

## Production verification checklist

1. Register a fresh test account on the production domain.
2. Confirm that the email link starts at the production callback and lands on `/onboarding` with an authenticated session.
3. Sign out and request password recovery.
4. Confirm that the recovery link lands on `/auth/update-password` with a valid recovery session.
5. Change the password, verify the old password is rejected, and verify the new password signs in.
6. Confirm localhost signup and recovery still work with the local redirect allow-list entry.
7. Check that no secrets or full authentication links were written to logs.
