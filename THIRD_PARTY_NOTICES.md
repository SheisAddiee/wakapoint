# Third-party notices

## React Bits

WakaPoint includes adapted portions of the following free React Bits components by David Haz:

- [BlurText](https://reactbits.dev/text-animations/blur-text): one-time word reveal in the landing headline.
- [SpotlightCard](https://reactbits.dev/components/spotlight-card): pointer light on the feature grid, using a transformed fixed gradient and local listeners.
- [CircularText](https://reactbits.dev/text-animations/circular-text): character placement around the satellite, driven by CSS with reduced-motion and visibility pauses.
- [SpecularButton](https://reactbits.dev/components/specular-button): native signup/action buttons with pointer highlights, existing disabled/loading states and reduced-motion support. A fixed CSS gradient supplies the highlight.

Adaptations use CSS/native browser APIs and WakaPoint design tokens. The original sources were retrieved from the React Bits TypeScript/CSS registry on 18 and 22 November 2026. The components are used within this application.

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Fonts

The landing page uses locally hosted DM Sans and Newsreader, distributed under
the SIL Open Font License 1.1. Their copyright notices and full licenses are in
[public/fonts/DM-Sans-OFL.txt](public/fonts/DM-Sans-OFL.txt) and
[public/fonts/Newsreader-OFL.txt](public/fonts/Newsreader-OFL.txt).

## Standard Webhooks

The server-only Auth email function uses Standard Webhooks 1.0.0 to validate
webhook signatures and timestamps. It is MIT licensed; see the package's
[license](https://github.com/standard-webhooks/standard-webhooks/blob/main/libraries/javascript/LICENSE).

## Nigeria and state outlines

The hero's decorative SVG silhouettes are adapted and simplified from GRID3
boundaries distributed through [geoBoundaries](https://www.geoboundaries.org/),
under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Attribution: GRID3 / geoBoundaries, Nigeria ADM0 and ADM1. The source dataset includes
36 states and the Federal Capital Territory. Projection, scale and simplification
were changed for the inline illustration; these silhouettes are not used to resolve addresses.
Exact source versions/downloads are recorded in
[nigeria-boundary-sources.json](public/images/nigeria-boundary-sources.json).
