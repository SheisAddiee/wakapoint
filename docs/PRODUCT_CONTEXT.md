# WakaPoint context and decisions

- **Informal address**: customer text containing landmarks, positional cues and building/unit descriptions.
- **Locality reference**: a bundled approximate centre for a supported Nigerian city or district. It is not a delivery coordinate.
- **Coverage**: the fraction of four context groups detected: location, landmarks, directions, and identifiers/units.
- **Delivery cues**: clauses preserved in input order; not computed turn-by-turn directions.
- **Confirmed point**: a dispatcher-selected map point explicitly labelled `dispatcher_confirmed`.
- **Digital postcode**: official five-segment NIPOST identifier. Syntax checks do not prove existence or destination match.
- **Linked postcode**: upstream existence check plus the user's recipient-match confirmation.
- **Demo**: no-account local workspace, isolated from account storage and official service access.
- **Account**: Supabase email-code/Google user, with owner-scoped cloud addresses. Browser fallback is keyed by user ID.

Confirmed preferences: React/TypeScript/Vite; monochrome technical workspace; mobile signup with Claude-like spacing; email and Google; separate SQL/backend folder; configuration through application environment values.

Onboarding records role, starting city and first task. Preferences live in Supabase user metadata for signed-in users and tab session storage for the demo. They affect interface defaults, not permissions. Role labels do not create administrator privileges.

Cloud availability is optional for local extraction. Cloud/fallback/demo records are not silently merged. Upstream test and live datasets differ; the gateway cache namespaces each upstream key. Human review is required even when postcode existence is valid.
