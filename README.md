# HR Diagram

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

An interactive Hertzsprung–Russell diagram built on real stars. Students place a star anywhere by
temperature and luminosity and watch its radius follow from L = 4πR²σT⁴. They then plot the stars
nearest the Sun, the brightest stars in the sky, and a census of every star Gaia found within
100 parsecs, and ask why the stars we see are not the stars that are there. It modernizes NAAP's
*HR Diagram Explorer* and covers every question in the NAAP *Hertzsprung–Russell Diagram* student
guide (introductory astronomy). Built with [SceneryStack](https://scenerystack.org/); runs offline
as a Progressive Web App.

## Features

- **Explore.**
  - Move a star by dragging it, clicking the diagram, using the temperature and luminosity sliders,
    or using the arrow keys.
  - Readouts give its radius, absolute magnitude and the spectral type of a main-sequence star at
    that temperature.
  - A to-scale picture compares the star with the Sun.
  - Guides you can turn on: the main sequence, luminosity classes (Ia, Ib, II, III, IV, V and white
    dwarfs), lines of equal radius from 0.001 to 1000 R☉, and the instability strip.
  - Axes: temperature, B − V or spectral type, against luminosity or absolute magnitude. Hot stars
    are always on the left.
- **Radius.**
  - Two stars, A and B, among lines of equal radius.
  - A table gives T, L and R for each star and the ratio B ÷ A.
  - The ratio rule R_B ÷ R_A = √(L ratio) ÷ (T ratio)² is worked out with the current numbers.
  - A to-scale picture shows both stars.
  - Hold a moving star's luminosity (it moves sideways) or its temperature (up and down) to see
    R ∝ 1/T² and R ∝ √L on their own.
- **Star Samples.**
  - Real stars: the 259 within 10 pc, the 172 brighter than V = 3, both lists together, or only the
    stars on both.
  - Markers: red circles for the nearest, cyan diamonds for the brightest, purple squares for both.
  - Filter by kind (main-sequence dwarfs, subgiants, giants, supergiants, white dwarfs), with live
    counts.
  - Click a star, step through stars with the arrow keys, or find one by name. Its card shows
    distance, magnitudes, spectral type, T, L, R and kind.
- **Gaia Census.**
  - About 44 000 stars: a random 1 in 10 of the Gaia Catalogue of Nearby Stars (100 pc).
  - Set a distance limit and an optional brightness limit (the naked eye sees to V ≈ 6).
  - Read off the share of each kind of star. Within 100 pc, 93% of stars are dwarfs and 0.2% are
    giants; of the stars brighter than V = 6, a quarter are giants.
  - Colour the stars by kind or by distance.
  - Axes include Gaia's own BP − RP and M_G.
- **Real data, offline.** The ESA Gaia archive cannot be queried from a web page, so the sim bundles
  a snapshot of Gaia and Hipparcos stars (about 1 MB). `npm run fetch-data` refreshes it. Only
  observables are stored; temperatures, luminosities and radii are computed in the sim from published
  colour and bolometric-correction sequences.
- **Accessible:**
  - Every control works from the keyboard, including moving stars and selecting stars.
  - Each screen has a live screen summary and a keyboard-help dialog.
  - Marker shapes back up colour.
  - Default and projector colour profiles.
  - English, French and Spanish.
  - Installable PWA.
  - A preference (or `?showEquations=false`) hides the equations for younger students.

## Quick Start

```bash
npm install
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run fetch-data` | Take a new snapshot of the star catalogues (needs network) |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

The snapshot is frozen on purpose so that class answers stay put during a term. To refresh it:

1. Run `npm run fetch-data`.
2. Check the summary it prints (about 44 000 census stars, about 260 nearest, about 170 brightest).
3. Run the tests.
4. Commit `src/common/model/data/`.

The Gaia archive rate-limits repeated queries. For development reruns, set `FETCH_CACHE_DIR` to
reuse earlier responses.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.6 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).
The bundled star data come from ESA Gaia and Hipparcos and other catalogues under their own terms.
See [CREDITS.md](CREDITS.md) for the acknowledgements.

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
