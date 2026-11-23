# WakaPoint product scope

WakaPoint serves dispatch teams who receive Nigerian addresses as landmark-based descriptions. The core job is to preserve useful delivery context, identify missing details, confirm a point or known official postcode, and hand off a reviewed record.

The user requested a black-and-grey geospatial workspace for the NIPOST Hackathon, a production-oriented frontend, separate Supabase integration/SQL, and no product credential form. Signup and onboarding use Claude-inspired mobile spacing with WakaPoint branding, email verification codes and Google sign-in.

## Required journeys

1. A visitor explores the public landing page, signs in with email or Google, completes role/city/first-task onboarding, and enters their workspace. All workspace routes require authentication; missing hosted configuration shows an actionable signup error.
2. A dispatcher resolves an informal address, reviews extracted context and warnings, optionally confirms a pin, and exports after acknowledging review.
3. A dispatcher processes up to 100 lines, reviews exceptions and exports CSV or JSON.
4. A user saves, finds, reopens, deletes and restores a record in the appropriate library.
5. A signed-in user verifies a known postcode through the official gateway and confirms its match before attaching it to an address.
6. A developer tries the checkout component and gets an authenticated request example.

## Acceptance

- No credentials are entered through workspace controls; server secrets never enter browser configuration.
- Email/Google flows show real loading and failure states; failed verification does not enter the workspace.
- Onboarding survives back navigation; failed account preference saves preserve input and allow retry.
- Saved records, exports and gateway responses exclude common contact patterns and upstream owner fields.
- Changed address input blocks saving/export of stale results. Changed postcode input discards old in-flight responses.
- Unknown/conflicting localities surface review guidance, and map outages prevent new street-map pin placement.
- The production workspace starts empty and has no demo-auth bypass; owner RLS protects cloud records. Unconfigured development can use explicitly enabled local preview profiles.
- Account notifications persist read status, enforce account ownership and prevent user-authored content. New saves and verified-account setup generate notifications without including addresses.
- Auth emails support codes and cross-device links; Resend verifies signed requests, validates redirects and prevents duplicate delivery during retries.
- Landing features, FAQs and role descriptions are functional; theme preferences persist across visits. Hero and navbar share the desktop wallpaper on tablets/larger devices and the mobile wallpaper on phones, with readable overlays in both themes.
- Marketing entrances use opacity/transform, keyboard navigation is immediate, and reduced motion removes movement. Session loading reflects the actual auth request.
- Relevant type, unit, build and browser checks pass, with hosted/physical-device limits reported separately.

## Boundaries

The implementation does not claim trained NER, nationwide building-level geocoding, calculated routes, legally certified privacy compliance, or achieved benchmark targets from the concept note. Team roles/permissions, account deletion, payments, cross-tab conflict resolution and automated dispatch are outside the current scope.

The WakaPoint database and functions are deployed. Google is enabled in Supabase; real consent/callback verification remains pending. Live Resend and NIPOST require provider credentials and activation. Frontend production configuration must be set through the WakaPoint hosting account. Account deletion and cross-tab conflict handling remain open launch decisions.
