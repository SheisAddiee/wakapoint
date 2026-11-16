# WakaPoint Supabase integration

Application users never enter service credentials. Configure the application once, using environment variables and server-side secrets.

1. Create or select a Supabase project. Run [sql/schema.sql](sql/schema.sql) in its SQL editor. It creates the website address library with owner-based row-level security, an atomic save RPC, and private gateway rate-limit/cache tables.
2. Enable **anonymous sign-ins** under Supabase Auth. The frontend creates an authenticated, device-specific session when cloud storage or the postcode bridge is first used. Supabase Auth rate limits apply; configure CAPTCHA protection for a public production launch. These sessions are tied to this browser and do not provide cross-device account recovery.
3. Copy the project URL and **publishable** key into the application's `.env.local`, using the names in the root `.env.example`. Never put a NIPOST key or service-role key in a `VITE_` variable. Restart Vite after changing configuration.
4. Deploy `functions/wakapoint-gateway/index.ts` as `wakapoint-gateway`. Keep JWT verification enabled. The function additionally verifies the token through Supabase Auth; a publishable key by itself cannot authorize a request.
5. In Edge Function secrets, set `NIPOST_API_KEY` and `WAKAPOINT_ALLOWED_ORIGINS`. Origins must exactly match the preview/production origin, including protocol and port. See [.env.example](.env.example). Supabase supplies its own server environment values.
6. Open the Postcode bridge and verify `FC-01-A01-KP-27` with a test key. A test key uses NIPOST's curated public sandbox, not the live database. Level 1 verifies existence; level 3 requires appropriate upstream access and consumes credits with a live key.

The gateway exposes `POST` actions `lookup`, `search` and `health`. It accepts a verified Supabase user JWT, validates inputs, enforces database-backed per-user and hashed-IP rate limits, filters upstream output to address fields, and caches valid lookups for one hour. It never logs request bodies or upstream secrets, or returns owner/occupant fields. Cache keys include a hash of the upstream key to isolate test/live datasets and key rotations. Error responses are fixed messages rather than upstream payloads.

The `search` action follows NIPOST's segment-aware autocomplete contract. Suggestions may be partial prefixes, not complete postcodes. They are composed only from the entered prefix and official segment suggestions; no postcode is invented from a narrative address.

Data retention: rate counters expire after two minutes on subsequent requests; cached postcode payloads expire after one hour and are pruned on subsequent writes. Saved addresses persist until their authenticated owner deletes them. Anonymous Auth account lifecycle/retention must be configured by the operator. The frontend filters contact patterns before persistence; review remains necessary. These controls do not establish legal compliance.

This folder is deployable integration code, not a provisioned Supabase project. No SQL or function has been applied to a live account as part of this local delivery.
