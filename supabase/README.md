# WakaPoint Supabase integration

Application users never enter service credentials. Configure the application once, using environment variables and server-side secrets.

1. Create or select a Supabase project. Run [sql/schema.sql](sql/schema.sql) in its SQL editor. It creates the website address library with owner-based row-level security, an atomic save RPC, and private gateway rate-limit/cache tables.
2. Enable **email sign-in** under Supabase Auth. The account screen uses `signInWithOtp` to create/sign in users, then `verifyOtp` to verify their email. Under **Email Templates > Magic Link**, include `{{ .Token }}`; see the template below. Configure custom SMTP for reliable delivery to your users. The demo is separate and never creates an anonymous cloud account.
3. Copy the project URL and **publishable** key into the application's `.env.local`, using the names in the root `.env.example`. Never put a NIPOST key or service-role key in a `VITE_` variable. Restart Vite after changing configuration.
4. Deploy `functions/wakapoint-gateway/index.ts` as `wakapoint-gateway`. Keep JWT verification enabled. The function additionally verifies the token through Supabase Auth; a publishable key by itself cannot authorize a request.
5. In Edge Function secrets, set `NIPOST_API_KEY` and `WAKAPOINT_ALLOWED_ORIGINS`. Origins must exactly match the preview/production origin, including protocol and port. See [.env.example](.env.example). Supabase supplies its own server environment values.
6. Open the Postcode bridge and verify `FC-01-A01-KP-27` with a test key. A test key uses NIPOST's curated public sandbox, not the live database. Level 1 verifies existence; level 3 requires appropriate upstream access and consumes credits with a live key.

## Keys and configuration

| Value | Where to obtain it | Where to configure it | Purpose |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project settings, API | Root `.env.local` / frontend hosting environment | Auth, private library and gateway URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase project settings, API keys; starts with `sb_publishable_` | Root `.env.local` / frontend hosting environment | Public browser access; RLS still protects records |
| `NIPOST_API_KEY` | NIPOST developer account; `nipost_test_` or `nipost_live_` | Supabase Edge Function secrets | Official search and postcode validation |
| `WAKAPOINT_ALLOWED_ORIGINS` | Your app's development/production origins | Supabase Edge Function secrets | Gateway origin allowlist |
| Google OAuth client ID and secret | Google Cloud > Google Auth Platform > Clients, Web application | Supabase Auth > Providers > Google | Google signup/sign-in |
| SMTP host, port, username, password/API credential and sender email | Your email delivery provider | Supabase Auth > Email > SMTP settings | Deliver verification codes to real users |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supplied automatically to hosted Edge Functions | Server runtime only | Auth verification, private cache and rate-limit RPCs |

No service-role key is needed in the frontend. No map, Gemini/OpenAI or payment API key is used. The OTP template, database SQL, provider enablement and redirect URLs are also required; keys alone do not activate every service.

## Email-code template

Use this under **Auth > Email Templates > Magic Link**. The default template sends a clickable link instead of the code the UI requests.

```html
<h2>Your WakaPoint sign-in code</h2>
<p>Enter this code in WakaPoint to continue:</p>
<p style="font-size:24px;letter-spacing:4px"><strong>{{ .Token }}</strong></p>
<p>If you did not request this email, you can ignore it.</p>
```

The frontend supports 6–8 digit codes; use an OTP length in that range in Supabase's email settings. Resend follows the default 60-second cooldown. Configure email sender/rate limits according to your provider and account's settings.

## Google and redirect setup

1. Create a Google **Web application** OAuth client. Configure consent screen/audience and the standard `openid`, email and profile scopes.
2. Set Google **Authorized redirect URI** to `https://YOUR_PROJECT.supabase.co/auth/v1/callback` (copy the exact value from Supabase's Google provider page). Set authorized JavaScript origins to your app origin.
3. Add the client ID and secret in **Supabase Auth > Providers > Google** and enable it.
4. Set **Auth > URL Configuration > Site URL** to your deployed app. Add exact root callback URLs to the redirect allowlist: `http://localhost:3000/`, `http://127.0.0.1:3000/` for local previews and `https://YOUR_APP_DOMAIN/` for production.
5. The SDK uses PKCE, exchanges the returned `?code=...` automatically and restores the session. The frontend removes callback parameters from the URL. A denied/failed callback returns an actionable account error.

Onboarding role/city/first-task preferences are stored under `user_metadata.wakapoint`. These values are interface preferences only; they never grant permissions. Signed-in saved addresses are owned by `auth.uid()` and can be reopened on another signed-in device. Signing out clears this browser's Auth session without deleting cloud records.

The gateway exposes `POST` actions `lookup`, `search` and `health`. It accepts a verified Supabase user JWT, validates inputs, enforces database-backed per-user and hashed-IP rate limits, filters upstream output to address fields, and caches valid lookups for one hour. It never logs request bodies or upstream secrets, or returns owner/occupant fields. Cache keys include a hash of the upstream key to isolate test/live datasets and key rotations. Error responses are fixed messages rather than upstream payloads.

The `search` action follows NIPOST's segment-aware autocomplete contract. Suggestions may be partial prefixes, not complete postcodes. They are composed only from the entered prefix and official segment suggestions; no postcode is invented from a narrative address.

Data retention: rate counters expire after two minutes on subsequent requests; cached postcode payloads expire after one hour and are pruned on subsequent writes. Saved addresses persist until their authenticated owner deletes them. Auth account lifecycle/retention must be configured by the operator. The frontend filters contact patterns before persistence; review remains necessary. These controls do not establish legal compliance.

This folder is deployable integration code, not a provisioned Supabase project. No SQL or function has been applied to a live account as part of this local delivery.

## Hosted verification after setup

- Request an email code, verify it, finish onboarding, reload and sign out/sign in again.
- Sign in with Google and check the deployed callback.
- Save an address; confirm another account cannot read or update it through the Data API.
- Verify the official sandbox postcode through the deployed gateway, confirm the recipient match and export it.
- Check allowed/disallowed origins, invalid tokens, upstream key errors and rate-limit responses.

Local browser tests mock Auth and upstream data; they do not prove email delivery, Google consent or deployed RLS. For a public launch, finish your privacy/account lifecycle policy and configure Supabase's Auth rate/abuse controls.
