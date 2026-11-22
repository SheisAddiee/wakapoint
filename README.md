# WakaPoint

A way forward for every address. WakaPoint turns informal Nigerian delivery descriptions into structured dispatch context, with a monochrome map workspace and an optional official NIPOST postcode bridge. Built for the NIPOST programme.

## Run locally

Use Node.js 22.12+ and npm. Node.js 24 LTS is recommended.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The public landing page leads to signup or sign-in. Email verification codes and Google sign-in require Supabase configuration; all workspace routes require an authenticated account.

## What works

- Public landing page, mobile signup, sign-in, verification-code entry, session restoration, sign-out, three-step onboarding and a skippable guided tutorial.
- Persistent light/dark themes on the landing page, account screens and workspace.
- Adapted React Bits text reveals, feature spotlights, satellite ornament and signup/action buttons, plus an airplane theme sweep with immediate keyboard/reduced-motion alternatives. See [component notices](THIRD_PARTY_NOTICES.md).
- On-device rule extraction of localities, landmarks, building identifiers, units and ordered delivery cues.
- Interactive map with approximate locality centres, reviewed delivery pins and a connection message when street tiles are unavailable.
- Batch processing of up to 100 addresses, filters, pagination, reviewed CSV/JSON exports and spreadsheet formula protection.
- Saved-address search, deletion and undo; authenticated accounts use a private Supabase library.
- Postcode format checks, authenticated official search/lookup, recipient-match confirmation and linking a verified code to dispatch output.
- A reusable React checkout field, integration examples and a contact-redaction playground.

Local extraction is a deterministic rule-based extractor, not a trained AI model or verified building geocoder. Coverage measures extracted context groups, not accuracy. Bundled coordinates are locality centres; a dispatcher-confirmed pin is not official geospatial verification. No postcode is generated from a narrative address.

## Supabase and NIPOST setup

Copy the root [.env.example](.env.example) to `.env.local` and set the Supabase project URL and **publishable** key. Restart Vite. These are public application values; no credential form appears in the product.

Follow [supabase/README.md](supabase/README.md) to enable email codes and Google, configure redirect URLs, apply [supabase/sql/schema.sql](supabase/sql/schema.sql), and deploy the gateway with its server-side NIPOST secret. Configure the email template to send `{{ .Token }}` for code entry. Google client secrets and NIPOST keys belong in provider settings and Edge Function secrets, never in `VITE_` variables.

The repository contains integration code and SQL. It does not provision a hosted project or install live credentials. Real email delivery, Google consent, cloud row-level security and live NIPOST calls require operator configuration and hosted verification.

## Checks and deployment

```sh
npm run lint
npm test
npm run test:e2e
npm run build
npm run preview
```

`lint` runs TypeScript checking. Unit tests cover address extraction, redaction, persistence normalization and gateway boundaries. Browser tests cover signup/onboarding and dispatch workflows; Supabase and upstream responses are mocked. The default browser is installed Microsoft Edge; other environments can change the Playwright channel or install Chromium and remove the channel setting. Tests use separate local ports 4173 and 4174 with synthetic public configuration.

Deploy the generated `dist/` directory to a static host. Authentication redirects return to the application root with a PKCE code; configure the exact origin/path in Supabase Auth's redirect allowlist. Hash-based workspace routes need no server rewrites. Set public configuration before building. Deploy the Supabase function separately and allow the production origin in `WAKAPOINT_ALLOWED_ORIGINS`.

## Privacy and operating scope

Raw address text stays in the current form. Contact patterns are filtered before structured output, persistence and export, and human review remains required. Filtering is not a guarantee that every personal detail was found and does not establish NDPA compliance. Account email/profile data is handled by Supabase Auth. Onboarding preferences are user-editable metadata used only for interface defaults, never authorization.

The workspace starts empty, with zero metrics and no sample loaders. Signed-in cloud records are restricted to their owner through RLS. When cloud storage is unavailable, input and extracted results remain available for review/export; saving requires restoring the cloud connection. No local library fallback is used. Device theme preferences use localStorage; onboarding, tutorial and account theme preferences use Supabase Auth metadata. Concurrent tabs use library replacement semantics and can overwrite stale changes; multi-dispatcher collaboration is outside this submission's scope.

Local logs, caches, previews, secrets and `codex-session.md` are excluded by `.gitignore`; source, tests, SQL, documentation, environment templates, the concept note and npm lockfile are included.

See [product scope](docs/PRD.md), [architecture](docs/ARCHITECTURE.md), [design system](docs/DESIGN_SYSTEM.md), [research](docs/RESEARCH.md) and [implementation status](docs/IMPLEMENTATION_PLAN.md).
