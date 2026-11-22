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

The extended public landing page uses the supplied world-map image across the hero and navbar on tablets, laptops and desktops. Phones below 700px and touch-device landscape viewports below 1000px wide/500px high use the portrait globe image. Theme-specific overlays keep text readable; the wallpaper stays still. The navbar becomes solid when the hero leaves view. Section entrances play once using opacity/transform, FAQs use accessible accordion controls, and keyboard section navigation transfers focus immediately. The session loader uses CSS rotation/shimmer while the actual auth request is pending and stops motion when reduced motion is requested.

Signup uses one email field followed by a single paste-friendly verification-code field. Google uses the provider's recognisable mark and its own redirect. Onboarding uses native labelled radio groups and a city select, with focus moving to the new step heading. Back navigation preserves selections.

## Mobile and accessibility

The signup content is 376px maximum; onboarding is 440px maximum and both fit 320px screens. Forms use at least 16px input text, explicit labels, suitable keyboard hints and visible focus. Layout uses `100svh` for stable account screens, mobile safe-area padding and scrollable content when the software keyboard reduces available space. Browser zoom remains enabled.

The workspace collapses navigation into a labelled drawer and stacks the map beneath input on smaller screens. Map keyboard users can pan with arrows and select its centre with Enter while placing a pin. Modal focus/escape use established accessible primitives.

Automated viewport checks can verify layout and semantics. Safe-area behaviour, iOS input zoom and gesture feel still require a physical phone.

## React Bits integration

The public landing uses adapted [BlurText](https://reactbits.dev/text-animations/blur-text), [SpotlightCard](https://reactbits.dev/components/spotlight-card), [CircularText](https://reactbits.dev/text-animations/circular-text) and [SpecularButton](https://reactbits.dev/components/specular-button). SpecularButton also supplies the email/verification submit controls. Components preserve the existing monochrome palette, semantic buttons, form validation, disabled/loading states and keyboard focus. The dashboard retains its functional, immediate interactions.

The hero's satellite label rotates with CSS while visible, with an occasional airplane following a dotted path on desktop. Phone ornament is smaller. Motion pauses offscreen/in hidden tabs; reduced motion leaves a static illustration. The airplane theme sweep uses native View Transitions and a shared 450ms timing. Keyboard toggles, reduced motion and browsers without View Transitions apply the theme immediately. A second toggle cancels the current sweep.

| Element | Role | Starts | Duration | Motion | Relationship |
| --- | --- | --- | --- | --- | --- |
| Headline words | Lead | On first view, 20ms word steps capped at 80ms | 280ms | 2px blur, opacity and 5px translation | Short overlapping reveal |
| Supporting copy | Support | 40ms | 280ms | Opacity and small translation | Overlaps headline |
| Hero actions | Support | 80ms | 280ms | Opacity and small translation | Overlaps copy; immediately clickable |
| Airplane theme sweep | Lead | Pointer theme toggle | 450ms | Horizontal transform | Together with theme reveal |
| Theme snapshot | Support | Same toggle | 450ms | Horizontal clip | Revealed behind airplane |

Background photographs and functional data stay still. Pointer highlights use small, fixed gradients with direct transforms and no React rendering per frame. BlurText uses CSS rather than introducing Motion's component runtime for a predetermined reveal. Sources and the full React Bits license are recorded in `THIRD_PARTY_NOTICES.md`.
