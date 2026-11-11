# AGENTS.md — HR Diagram

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

An interactive Hertzsprung–Russell diagram for introductory astronomy, built on real stars. It is
original work, forked from `SceneryStackTemplate` on 11 Nov 2026. It modernizes NAAP's Flash
*HR Diagram Explorer* and covers every question in the NAAP student guide
(`Baseline/Astronomy/astroUNL/naap/hr/naap_hr_sg.pdf`, Q1–Q16). There are four screens:

| Screen | Folder | Content | NAAP questions |
|---|---|---|---|
| Explore | `src/explore/` | One movable star, the Sun, guides (main sequence, luminosity classes, lines of equal radius, instability strip), axis choices, readouts, to-scale comparison with the Sun | Q4–Q10, Q15–Q16 |
| Radius | `src/radius/` | Stars A and B, the B ÷ A table, the worked Stefan–Boltzmann ratio, hold-L / hold-T constraint | Q2, Q6, Q15–Q16 |
| Star Samples | `src/star-samples/` | Nearest (≤ 10 pc) and brightest (V < 3) real stars, kind filters, star card, Find a star | Q1, Q11–Q14 |
| Gaia Census | `src/gaia-census/` | 1-in-10 sample of the Gaia Catalogue of Nearby Stars, distance and brightness limits, share of each kind | Q11–Q14 |

Data, formulas and their sources are in [`doc/model.md`](doc/model.md). Architecture and decisions are in
[`doc/implementation-notes.md`](doc/implementation-notes.md). Data acknowledgements are in
[`CREDITS.md`](CREDITS.md).

### Things to know first

- **The data are a frozen snapshot.** The ESA Gaia archive's TAP service sends no CORS headers, so the
  sim cannot query it from GitHub Pages.
  - `scripts/catalog/fetch-catalog.ts` (`npm run fetch-data`) writes `src/common/model/data/*.json`.
    It is committed, excluded from Biome, and refreshed only by hand.
  - The Gaia archive answers HTTP 429 after many queries in a row. `FETCH_CACHE_DIR=<dir>` caches the
    responses for development reruns.
  - CDS (SIMBAD/VizieR) was down when the snapshot was built, so everything comes from the Gaia
    archive, which also hosts Hipparcos and the GCNS, plus the IAU star names and HYG designations.
- **Only observables are stored** (distance, G, BP−RP, V, B−V, spectral type). Temperatures,
  luminosities, radii and kinds are derived at load time by `stellarPhysics.ts`, `spectralTypes.ts` and
  `StarCatalog.ts`, which the specs in `tests/model/` cover.
- **Gaia saturates brighter than G ≈ 3**, so the brightest stars use Hipparcos photometry and spectral
  types. Three garbled or companion Hipparcos types (Capella, Dubhe, Izar) are overridden in the fetch
  script, and the overrides are recorded in `namedStars.json`.
- **Axes are AxisQuantity values** (`src/common/model/AxisQuantity.ts`). Each one knows its range,
  log scale and direction, and how to place a (T, L) pair or a real star, including measured colours
  and magnitudes. `acceptsTemperature` keeps curves out of temperatures the reference tables only
  clamp.
- **Hot stars are always on the left, and bright stars always on top.** The temperature axis and the
  magnitude axes are inverted through `ChartTransform.modelX/YRangeInverted`.
- **The guides are approximate.** The main sequence (Pecaut & Mamajek) and the white dwarf sequence
  (Montreal 0.6 M☉ DA) are published tables. The giant and supergiant curves are rounded textbook
  magnitudes; treat them as guides, not calibrations.
- **Node >= 26** is required. Run `source ~/.nvm/nvm.sh && nvm use 26` before npm or a git commit (the
  pre-commit hook runs npm).

## Key files

| File | Purpose |
|---|---|
| `scripts/catalog/fetch-catalog.ts` | Gaia TAP queries (GCNS sample, ≤ 10 pc, Hipparcos), IAU/HYG naming, reference tables, snapshot writer |
| `src/common/model/stellarPhysics.ts` | Stefan–Boltzmann, magnitudes, BC_V(T), colour–temperature, Gaia photometry → T, L, M_V |
| `src/common/model/spectralTypes.ts` | Spectral codes (G2 = 42), MK type parser, temperature scales by class |
| `src/common/model/luminosityClasses.ts` | Class curves for the overlay; instability strip |
| `src/common/model/StarCatalog.ts` | Decodes the snapshot: `NAMED_STARS`, `GAIA_CENSUS`, kind classification |
| `src/common/model/AxisQuantity.ts` | Axis quantities: ranges, log/inverted, forward and inverse mappings |
| `src/common/model/MovableStar.ts` | A star placed by log T and log L, with derived radius |
| `src/common/view/HRChartNode.ts` | Chart frame, custom ticks per quantity, (T, L) ↔ view conversions |
| `src/common/view/HROverlayNode.ts` | Main sequence, class bands, isoradius lines, instability strip |
| `src/common/view/CursorStarNode.ts` | Drag/keyboard star marker; optional constraint |
| `src/common/view/PointCloudNode.ts` | Canvas markers (circle, diamond, square) per group, with picking |
| `src/common/view/SizeComparisonNode.ts` | Two stars to scale in blackbody colours |
| `src/common/view/ScreenLayout.ts` | Non-overlapping regions (chart, optional strip, panels, footer) |

## Accessibility

Standard fleet pattern:

- Per-screen a11y strings live under `a11y.<screenKey>` in each locale JSON. Every screen summary
  has a live current-details paragraph.
- Each ScreenView sets `pdomPlayAreaNode.pdomOrder` and `pdomControlAreaNode.pdomOrder` (Reset All
  last). All screens share `HRDiagramKeyboardHelpContent` (move a star, sliders, combo boxes, basic
  actions).
- Custom keyboard interactions:
  - Star markers: arrows move the marker in view space, so they work on any axes; Shift gives fine
    steps.
  - Star Samples plot: left/right select the next hotter/cooler star, and Escape clears the selection.
    The selected star is read out in an accessible paragraph.
- Colour is never the only cue on Star Samples: nearest stars are circles, brightest diamonds, both
  squares. The Gaia Census points are too small for shapes, so its table gives each kind's count and
  share in text.

## Compliance carve-outs

- **Hardcoded colors:**
  - `DISTANCE_COLORS` in `src/gaia-census/view/GaiaCensusScreenView.ts` is a fixed sequential palette
    that reads on both the dark and the projector chart.
  - Marker outlines (`rgba(0,0,0,0.6)`) in `src/star-samples/view/StarPlotNode.ts`.
  - The disc gradients in `src/common/HRDiagramScreenIcons.ts`, which are star colours, not theme
    colours.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

For screenshots, run the dev server with `npx vite --port <free port>`. Screen models are reachable
from the console as `phet.joist.sim.screens[i].model` (with `?screens=n`, at index 0).
