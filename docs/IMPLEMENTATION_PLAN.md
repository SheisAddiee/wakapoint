# WakaPoint implementation status

Updated 23 November 2026. Production auth, notifications and server email integration
were implemented while preserving the supplied wallpapers, editorial landing imagery,
shared React Bits components, original animation timing and readable wavy theme reveal.

| Work | Current status | Evidence / remaining setup |
| --- | --- | --- |
| Landing, signup and six workspace tools | Implemented | Existing preview journeys and responsive checks |
| Theme pill, original motion timing and content-visible wavy transition | Preserved | Previous screenshot and keyboard/reduced-motion checks |
| Landing screenshots, NIPOST diagram, DM Sans/Newsreader | Committed previously | Local assets and font licenses |
| Production Auth boundary | Implemented | Non-anonymous sessions, restored-user verification, safe callback cleanup |
| Email OTP and cross-device token-hash links | Implemented / mock-browser verified | Real email delivery still requires provider activation |
| Google OAuth | Enabled; invalid secret blocks sign-in | Google token endpoint returned HTTP 401 invalid_client; matching client secret must be replaced |
| Private address library and gateway storage | Deployed | Owner isolation, invalid/foreign-ID rollback and anonymous-denial SQL tests passed |
| Notification inbox | Deployed / implemented | Welcome/save triggers, content grants, history/read state, retries and navigation |
| NIPOST gateway | Deployed | JWT + Auth user checks, rate limits, output allowlist/cache; real key pending |
| Resend Auth email hook | Deployed | Signed/timestamped webhooks, safe redirects, correct email-change hashes, idempotency |
| Credential worksheet and hosted-placeholder helper | Hosted names verified | Four names already existed; missing site/origin values were added without replacing credentials |
| Vercel paths, headers and hosted Auth URLs | Implemented / configured | Production Auth site and exact local/production allowlist verified; Vercel public vars set by hosting owner |
| Database advisors | No warnings | Intentional private-table RLS and new unused indexes are informational |
| Verification | See verification record below | Local mocks do not prove live delivery or Google consent |

## Verification record

- 32 unit tests passed: extraction, redaction, previews, gateway auth/rate limits,
  email signatures/timestamps, secure email changes, redirect validation and dummy-key rejection.
- TypeScript passed after the final UI error-handling changes.
- Final production build passed at 897.18 kB JS with the existing chunk-size warning.
- Remote SQL smoke tests passed in a rolled-back transaction. No fixture users remain;
  no test emails were sent. RLS performance and public function grants were checked.
- 10 account/browser journeys passed in the first continuation run. Subsequent
  notification read-state/navigation check passed after the response-header mock fix.
  The final notification read/navigation and error/retry checks passed. Two account-entry
  checks failed during Vite restarts/cold startup; the complete browser suite is not green.
- Live Supabase settings report Email and Google enabled. Mobile signup screenshot
  shows enabled Google entry, no horizontal overflow and no JavaScript page errors.
- Local preview returned HTTP 200 on port 3000 and opened in the default browser.

## Remaining activation

1. Replace the invalid Google client secret with the matching Web client secret value
   in Supabase Auth > Google, then verify a fresh real sign-in. The local management
   token is configured and remains excluded from Git/Vercel/runtime secrets.
2. Replace Resend sender/key/hook placeholders in hosted Edge Function Secrets,
   verify the sending domain, enable the Auth hook and test real delivery.
3. Set a real NIPOST key and verify permitted sandbox/live calls.
4. Configure public VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in Vercel and
   rebuild. The connected Vercel account does not expose WakaPoint.
5. Verify real Google consent/callback, device behaviour, account deletion/retention
   and Auth abuse settings before launch. Full-library saves retain stale-tab
   replacement semantics; team collaboration/conflict resolution is not implemented.

Follow ../supabase/README.md for exact project URLs and setup. API activation is
distinct from deployed code; Google/Resend secrets are never fabricated as working.

Git workflow: add and commit locally, then say **push**. The user pushes manually.
Do not automatically push. Earlier verified milestones: b86931d, 474577d, ef67dd4.

Hosted follow-up on 23 November: Auth Site URL is https://wakapoint.vercel.app;
production and localhost/127.0.0.1 roots/callbacks are allowed. Existing Google
credentials were preserved. Google credential validation returned invalid_client
with an invalid-client-secret message; no user authorization code was consumed.
