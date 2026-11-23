# WakaPoint architecture

React 19/TypeScript run in a Vite static frontend. App owns the public/account
boundary; WorkspaceApp owns hash-routed dispatch tools. Domain extraction,
persistence normalization and exports remain separate from components.

## Account and data flow

Email code/link or Google PKCE → Supabase Auth → server-checked session → allowlisted
onboarding metadata → local redaction/extraction → map review → optional authenticated
NIPOST gateway → reviewed export/private library.

One SDK client per public configuration shares session refresh across Auth, storage,
notifications and gateway calls. Restored users are checked through auth.getUser()
before opening the private workspace. Anonymous accounts are rejected in the UI,
RLS and gateway. Email token-hash callbacks support another device; Google uses PKCE.
Callback credentials/errors are removed from history. Account aliases preserve intent.

## Storage and authorization

Saved addresses have owner/non-anonymous RLS. The library RPC is security invoker;
invalid payloads and foreign-ID collisions roll back without losing existing records.
Full-library saves are atomic, but concurrent stale tabs can overwrite newer content.

Notifications have account RLS and SELECT/UPDATE(read_at) browser grants only.
Private trigger functions generate welcome/address-insert events with unique keys;
content contains no addresses and repeated upserts do not duplicate notifications.
The UI supports unread counts, paginated history, persistent read state, retry and links.

Input/results stay in memory until save/export. Optional random-email/local-library
previews exist only in unconfigured development. Production has no preview bypass
or cloud-failure local fallback. Allowlisted role/city/tutorial/theme metadata never
grants permissions. Account changes unmount private state and cancel pending updates.

## Integrations

wakapoint-gateway keeps platform JWT verification, checks users through Auth,
validates origins/input, applies private rate counters and allowlists upstream fields.
Modern secret keys use apikey; legacy service-role JWTs remain supported. Missing
NIPOST activation is reported honestly.

wakapoint-auth-email validates Standard Webhooks signatures/timestamps before Resend
calls. Templates cover OTP/link emails, secure email changes and security notices.
Redirects use explicit origins/paths; provider responses are redacted and Resend
idempotency keys prevent duplicate delivery during retries. Payloads/keys are not logged.

## Hosting and status

Public build values: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
Server secrets: RESEND_API_KEY, WAKAPOINT_EMAIL_FROM, SEND_EMAIL_HOOK_SECRET and
NIPOST_API_KEY; optional origin/site settings are in supabase/.env.example.
Google credentials and Auth hook/redirect configuration belong in Supabase settings.

The database and both functions were deployed to twsgnqkxruoqkqwgzjal on
22 November 2026. Remote ownership/rollback checks passed. Google is enabled;
Resend/NIPOST activation and real-user verification remain pending. The Vercel connection
does not expose WakaPoint; its owner must set the public production build variables.
Serve dist with the included Vercel rewrites/headers. Details: ../supabase/README.md.
