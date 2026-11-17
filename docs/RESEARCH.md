# WakaPoint: research and delivery brief

Reviewed on 16 November 2026, before implementation.

## Product

The root concept note describes a Nigerian narrative-address resolver, spatial matching and a privacy-preserving NIPOST bridge. The user has named it **WakaPoint**, selected dispatch teams as the primary audience, requested an aesthetic black-and-grey geospatial workspace, and authorized a frontend plus Supabase gateway. Submission is next week.

## Account flow update: 17 November 2026

The user requested signup/onboarding inspired by Claude's mobile composition, with WakaPoint's dark palette, email and Google. [Claude's login guidance](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account) confirms the email/Google entry pattern. The visual translation uses a centred wordmark, restrained serif heading, stacked full-width controls and a short privacy note.

[Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless) uses `signInWithOtp` and `verifyOtp`; the Magic Link template must include `{{ .Token }}` to send the code. [Google integration](https://supabase.com/docs/guides/auth/social-login/auth-google) requires an OAuth Web client in the provider dashboard and allowed app callback URLs. The client uses the pinned official SDK and PKCE, with shared Auth/gateway/storage sessions. Current [Edge Function authentication](https://supabase.com/docs/guides/functions/auth) documents keeping `verify_jwt = true` for authenticated user calls; the gateway also verifies tokens through Auth.

The Supabase changelog was checked for relevant breaking changes. No hosted project was provisioned; operator setup and hosted verification remain separate from local code/browser tests.

## Official programme findings

- [Selection criteria](https://pitch.postcode.gov.ng/#selection): working solution, meaningful official API use, practical value and execution each carry 25%. Responsible data handling is a pass/fail requirement. Presentations are five minutes with five minutes of questions. This is an adoption showcase; the page says there is no prize money.
- [Authentication](https://docs.postcode.gov.ng/authentication): all API endpoints require a key. Test and live datasets differ. Test calls use public sandbox places. Secret NIPOST keys belong on the server.
- [Publishable keys](https://docs.postcode.gov.ng/widget/publishable-keys): a direct frontend integration is possible with an origin-restricted publishable key, but geometry and owner information are unavailable at that level. The user's preference is a Supabase server-side gateway.
- [Postcode structure](https://docs.postcode.gov.ng/concepts/postcode-format): state, LGA, district, area, unit. The segments contain 11 alphanumeric characters, despite documentation calling it 12. Validate the segment grammar rather than an inconsistent character count. Syntax validation alone does not establish existence.
- [Lookup levels](https://docs.postcode.gov.ng/concepts/lookup-levels): level 1 checks validity; level 3 supplies administrative address and building use, with access/credit requirements. Never manufacture a postcode from an address.
- [Supabase secrets](https://supabase.com/docs/guides/functions/secrets): store upstream keys in Edge Function secrets. Client environment variables contain public configuration only.

## Implementation decisions

Keep the existing React/TypeScript/Vite stack; switching to Next.js provides little benefit for this client workspace and consumes submission time. Use Leaflet for actual map interactions, with a clearly labelled offline overview when map tiles are unavailable. Preserve approximate locality precision until a person confirms a point or NIPOST returns geometry. Do not portray rule extraction as a trained AI model, heuristic coverage as calibrated accuracy, or a user-picked point as official verification.

Build one complete journey: informal input → contact redaction → extracted address context → locality overview → recipient/dispatcher point confirmation → optional official postcode lookup → safe dispatch export. Support batch processing, a reusable checkout component, saved redacted records, and request examples. The main UI should emphasize useful output; integration details belong in the connection and developer views.

## Frontend craft

Apply the Emil Kowalski web skills across implementation and review: immediate press feedback, scoped transition properties, purposeful motion, stationary functional data, stable numbers, accessible primitives, reduced motion, touch-only hover gating, mobile safe areas and worst-case content. Apple-style principles inform hierarchy, typography, agency and responsive interaction while respecting the user's monochrome direction. Native Swift/Expo instructions do not justify adding a second application platform.

## Acceptance

Type checking, production build, meaningful parser/privacy tests, browser journeys at desktop and mobile widths, API failure states, storage failures, keyboard navigation, reduced motion and map unavailability. Live upstream verification depends on an available Supabase project and NIPOST key installed server-side. No benchmark targets from the concept note are presented as achieved results.
