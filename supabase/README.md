# WakaPoint backend

Project: **twsgnqkxruoqkqwgzjal**, eu-west-1, https://twsgnqkxruoqkqwgzjal.supabase.co.

## Deployed on 22 November 2026

- Private saved-address library and atomic save RPC, with owner/non-anonymous RLS.
- Durable account notifications, welcome/address-save triggers, read-only content
  grants, paginated history, unread counts and persistent read status. Notification
  text contains no addresses. Existing record upserts do not duplicate notifications.
- Private postcode rate-limit/cache tables and **wakapoint-gateway** (JWT verified).
- **wakapoint-auth-email**, an Auth webhook using Standard Webhooks signatures.
- Restricted execution of the platform's public rls_auto_enable event trigger.

Remote rolled-back fixture tests passed: ownership, cross-account isolation,
invalid-payload/foreign-ID rollback, notification deduplication/read permissions,
anonymous rejection and private-RPC denial. No fixture accounts remain; no emails
were sent. Local handler tests use synthetic credentials and mock providers.

Google is enabled in the live project; real consent/callback testing is pending.
Resend and NIPOST still require activation below. The connected Vercel account does not expose
the WakaPoint hosting project; its owner must set public build variables.

## Environment setup worksheet

The ignored root **.env.local** contains the working public Supabase URL/key.
The ignored **supabase/.env.local** contains clearly marked REPLACE_ME placeholders
for Resend, NIPOST, the email hook and Google. Replace those locally when available.
Private credentials must never have a VITE_ prefix or enter Git.

In WakaPoint's Vercel Production environment, copy VITE_SUPABASE_URL and
VITE_SUPABASE_PUBLISHABLE_KEY from the root .env.local, and set
VITE_ENABLE_PREVIEW_AUTH=false. Rebuild after editing. Never use a secret/service-role
key as the publishable key. Unconfigured random-email entry is development-only.

Google values in the worksheet must be entered in Supabase Auth > Providers > Google;
putting them in a local file alone does not enable the provider. Supabase provides
SUPABASE_URL and its server secret/service-role environment automatically.

To add the missing names directly to hosted Edge Function Secrets, save a Supabase
personal access token as SUPABASE_ACCESS_TOKEN in the ignored root .env.local and run
**npm run backend:placeholders**. The helper targets only WakaPoint, adds only missing
entries, preserves existing credentials, and never prints token/secret values. The
management token is not uploaded to the runtime. This upload remains pending until
the token is available. Google credentials stay in Auth > Providers > Google.

## Auth redirects and Google

In [Auth URL Configuration](https://supabase.com/dashboard/project/twsgnqkxruoqkqwgzjal/auth/url-configuration), set Site URL to **https://wakapoint.vercel.app/**.
Allow these exact URLs:

~~~text
https://wakapoint.vercel.app/
https://wakapoint.vercel.app/auth/callback
http://localhost:3000/
http://localhost:3000/auth/callback
http://127.0.0.1:3000/
http://127.0.0.1:3000/auth/callback
~~~

In [Google Cloud Console](https://console.cloud.google.com/), configure Google Auth
Platform branding and audience, then create a **Web application** OAuth client.
Authorized JavaScript origins: https://wakapoint.vercel.app and http://localhost:3000.
Authorized redirect URI:

~~~text
https://twsgnqkxruoqkqwgzjal.supabase.co/auth/v1/callback
~~~

Enable Google in [Supabase Auth Providers](https://supabase.com/dashboard/project/twsgnqkxruoqkqwgzjal/auth/providers)
and save the client ID/secret. Add Google test users while the audience is in Testing;
publish for general availability. The frontend checks provider settings and keeps
unavailable Google entry disabled. Gmail addresses can use email codes without OAuth.

Auth is passwordless: email OTP/link or Google, so password reset is not part of the
sign-in flow. The SDK exchanges Google PKCE codes. Email token-hash links support a
second browser/device; the app verifies them through Auth and strips credentials
from browser history. Persisted sessions are checked with auth.getUser() before
opening the workspace. Failed/expired callbacks keep private routes protected.
vercel.json serves /signup, /signin, /login, /dashboard and /auth/callback through the SPA.

## Activate Resend emails

1. Verify a domain you control in [Resend](https://resend.com/domains), adding its DNS
   records. The vercel.app application subdomain is not your owned sending domain.
2. Create a sending API key, preferably restricted to that verified domain.
3. Replace RESEND_API_KEY and WAKAPOINT_EMAIL_FROM in supabase/.env.local. Use a real
   sender on the verified domain. Save both in [Edge Function Secrets](https://supabase.com/dashboard/project/twsgnqkxruoqkqwgzjal/functions/secrets).
4. Prepare a **Send Email** HTTPS hook in [Auth Hooks](https://supabase.com/dashboard/project/twsgnqkxruoqkqwgzjal/auth/hooks) with this URL:

   ~~~text
   https://twsgnqkxruoqkqwgzjal.supabase.co/functions/v1/wakapoint-auth-email
   ~~~

5. Generate its secret and save SEND_EMAIL_HOOK_SECRET in Edge Function Secrets,
   preserving the v1,whsec_ prefix. Enable/save the hook only after all three real
   values are present. Keep Email enabled. An enabled hook replaces SMTP.
6. Set a 6–8 digit OTP and appropriate expiry/rate limits in Auth. The frontend uses
   a 60-second resend cooldown; hosted limits remain authoritative.
7. Test signup delivery to your own account, code entry, links on a second browser,
   resend/expiry, reload, sign-out/re-entry and Resend delivery status before launch.

The hook intentionally uses verify_jwt=false because webhook signatures authenticate
it. It rejects unsigned/tampered/stale/future requests, anonymous users, malformed
payloads and unsafe redirects. Resend idempotency keys remain stable for retries.
Provider errors are redacted; no generic public email endpoint exists. Templates
cover signup/sign-in, invitations, recovery verification, reauthentication, secure
email changes and Auth security notices. Secure email-change hashes are mapped to
the correct current/new recipients. Payloads, codes and keys are not logged.

Until activation, Supabase's default mailer applies with delivery restrictions.
The UI accepts a link or a code. If retaining default SMTP, include both
{{ .Token }} and {{ .ConfirmationURL }} in the Magic Link template.
Real Resend delivery is unverified until domain, secrets and hook setup are complete.

## NIPOST and database reproduction

Replace NIPOST_API_KEY with a real test/live key and set it in Edge Function Secrets.
Dummy keys are not service activation. Default allowed origins are the production
site and local port 3000; WAKAPOINT_ALLOWED_ORIGINS overrides the exact list.
The gateway validates Auth users, rate-limits private counters, allowlists output
and caches only filtered valid postcode responses. Modern server secret keys use
apikey, not a secret-key Bearer header; legacy service-role JWTs remain supported.
NIPOST sandbox/live verification remains pending a real key and entitlement.

For another project apply sql/schema.sql, sql/notifications.sql, sql/security.sql
(if its public.rls_auto_enable function exists), and sql/rls-performance.sql in order.
The notifications creation snapshot runs once; use migrations for subsequent changes.
Hosted changes are recorded in Supabase migration history. Deploy both function
folders with deno.json and their relative dependencies.
sql/smoke-test.sql uses transient fixtures and rolls back on success.

## Operating limits

Libraries hold 100 addresses and save atomically using replacement semantics;
concurrent stale tabs can overwrite newer library content. Notifications persist
with the account, support paginated reads and refresh unread counts on focus,
visibility, each minute while visible, and library changes. Private cache/rate tables
intentionally have RLS without browser policies. Expired cache/counters are pruned
on later requests. Review account deletion, retention, privacy and Auth abuse controls
before launch. Local tests cannot establish live delivery or Google consent.

The available Supabase MCP cannot set Auth configuration or Edge Function secrets.
SQL cannot substitute for those settings. See the setup worksheet above.
