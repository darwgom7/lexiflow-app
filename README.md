# LexiFlow

Read English with a natural voice and word-by-word highlighting, on phone and PC.

- Voice: Azure Speech (free F0 tier). Audio and word timings come from the same request, so the highlight follows the real audio.
- Each paragraph is generated once and saved on the device (IndexedDB). Reading it again costs nothing and works offline.
- The Azure key is stored only in the browser that uses it. It is never in this repository.
- Static site, no server. Hosted on GitHub Pages.

Files: `index.html` (app), `sw.js` (offline), `speech-sdk.js` (Microsoft Cognitive Services Speech SDK for JavaScript 1.53.0, MIT), `manifest.webmanifest` and icons (install as an app).
