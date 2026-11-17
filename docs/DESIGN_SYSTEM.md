# WakaPoint design system

The workspace is a restrained geospatial desk: dark structural surfaces, clear borders, compact technical data and a map next to the primary address action. Signup uses a quieter centred composition with generous mobile spacing, a serif headline, Google/email controls and a short privacy explanation.

## Visual foundation

- Backgrounds: `#111111` workspace, `#151515` signup, `#181818` panels, `#1e1e1e` elevated surfaces.
- Text: near-white primary, readable grey secondary; status meaning always includes words.
- Primary actions: pale neutral fill and dark text; secondary actions use dark fills and outlined borders.
- Typeface: existing sans-serif workspace stack, Georgia serif for account/onboarding headlines, monospace for JSON/coordinates. No font download is required.
- Radius: small workspace controls and panels; 8–9px account fields/options; 12px centred dialogs.

## Interaction

Functional data and navigation update immediately. Press feedback uses a small transform on pointer input. Dialog transitions use opacity/transform with a 200ms entrance and faster exit. Keyboard and reduced-motion modes remove movement. Hover styles are gated by pointer capability.

Signup uses one email field followed by a single paste-friendly verification-code field. Google uses the provider's recognisable mark and its own redirect. Onboarding uses native labelled radio groups and a city select, with focus moving to the new step heading. Back navigation preserves selections.

## Mobile and accessibility

The signup content is 376px maximum; onboarding is 440px maximum and both fit 320px screens. Forms use at least 16px input text, explicit labels, suitable keyboard hints and visible focus. Layout uses `100svh` for stable account screens, mobile safe-area padding and scrollable content when the software keyboard reduces available space. Browser zoom remains enabled.

The workspace collapses navigation into a labelled drawer and stacks the map beneath input on smaller screens. Map keyboard users can pan with arrows and select its centre with Enter while placing a pin. Modal focus/escape use established accessible primitives.

Automated viewport checks can verify layout and semantics. Safe-area behaviour, iOS input zoom and gesture feel still require a physical phone.
