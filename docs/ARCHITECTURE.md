# WakaPoint architecture

React 19 and TypeScript run in a Vite static frontend. `App.tsx` owns public landing routes and the authenticated account boundary; `WorkspaceApp.tsx` owns hash-routed dispatch tools. Domain extraction, persistence normalization and export utilities are separate from components.

## Data flow

Email/Google → Supabase Auth SDK session → validated onboarding metadata → workspace → local redaction/extraction → map review → optional authenticated Edge Function → filtered NIPOST response → reviewed export/library.

`src/lib/supabase.ts` creates one SDK client per public configuration. Auth, REST storage and gateway calls use the same persisted/refreshable session. Google uses PKCE and returns to the root application URL; email uses OTP verification. The SDK handles code exchange and session changes. Raw callbacks/errors and credentials are not displayed in the product.

## Storage and authorization

`public.saved_addresses` is keyed by record UUID and authenticated owner UUID. Select/insert/update/delete RLS policies require `auth.uid() = user_id`; the library RPC is `SECURITY INVOKER`. Full-library saves are atomic but concurrent stale tabs can overwrite newer content.

Address input/results remain in memory until saved to the cloud or exported. There is no demo bypass or local library fallback. Theme preferences use the device key `wakapoint.theme.v1` and account metadata `wakapoint_theme`. Onboarding and tutorial metadata are allowlisted through `readPreferences`; user-editable metadata is never used for authorization. Async preference writes follow the SDK auth observer instead of assigning captured sessions. Test Vite servers use separate dependency caches to preserve the live preview.

The gateway verifies user tokens via Supabase Auth, validates postcode actions and origin, applies per-user/hashed-IP database rate counters, calls NIPOST with a server secret, allowlists output fields, and caches filtered valid lookups for one hour. Private cache/rate tables have no direct browser grants. Local tests exercise the handler with injected dependencies; hosted SQL and service behaviour need separate verification.

## Configuration and deployment

Client: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Server: Supabase-supplied URL/service-role values plus `NIPOST_API_KEY` and `WAKAPOINT_ALLOWED_ORIGINS`. Google client secrets and email delivery configuration are set in provider dashboards.

Build once with public values and serve `dist/` from a static host. Workspace routes use hash navigation. Configure exact root callback URLs in Supabase Auth, apply `supabase/sql/schema.sql`, and deploy `wakapoint-gateway` separately with JWT verification enabled. No hosted resource is provisioned by the frontend build.
