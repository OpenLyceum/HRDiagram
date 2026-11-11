# Implementation Notes - HR Diagram

Developer-facing notes. The physics and the data are described in [model.md](./model.md).

## Architecture

```
main.ts
  ├─ ExploreScreen      ExploreModel { settings: DiagramSettings, star: MovableStar }
  ├─ RadiusScreen       RadiusModel  { settings, starA, starB, constraintProperty, B ÷ A ratios }
  ├─ StarSamplesScreen  StarSamplesModel { settings, sampleProperty, category filters, selectedStarProperty }
  └─ GaiaCensusScreen   GaiaCensusModel  { settings, distance/brightness limits, colorBy, selectionProperty }

src/common/model/
  stellarPhysics.ts     pure functions + Interpolator over the bundled reference tables
  spectralTypes.ts      spectral codes, MK parser, temperature scales by class
  luminosityClasses.ts  class curves and the instability strip, as (T, L) lists
  StarCatalog.ts        snapshot → NAMED_STARS (Star objects) and GAIA_CENSUS (typed columns)
  AxisQuantity.ts       what an axis shows, how to place (T, L) or a star, and the inverse
  DiagramSettings.ts    axes + guide visibility, one per screen
  MovableStar.ts        log T / log L Properties, derived T, L, R

src/common/view/
  HRChartNode           frame, ticks (axisTicks.ts), titles; plotLayer (clipped) + overlayLayer
  HROverlayNode         guides, redrawn on axis change and toggles
  CursorStarNode        draggable / keyboard star, optional constraint
  PointCloudNode        canvas markers by group (Star Samples, Gaia Census)
  SizeComparisonNode    two stars to scale
  SunMarkerNode, AxisControlsNode, OverlayCheckboxGroup, MarkerIconNode
  ScreenLayout          chartAndPanelsLayout / chartStripAndPanelsLayout + placeInRegion
```

No screen has a clock; `step(dt)` is empty everywhere.

## Decisions

- **Snapshot, not API.** The Gaia TAP server sends no CORS header, the same situation as the NASA
  Exoplanet Archive in ExoplanetsDatabase. The fetch script takes the snapshot instead.
  - It stores only observables, column-oriented for the census.
  - The data files are statically imported, so Vite bundles them (about 1 MB raw).
- **Derivation in the sim, not in the script.** One tested code path (`stellarPhysics.ts`) places
  every star, the guides and the cursor. That keeps the curves and the data consistent, and it makes
  the conversions visible to anyone reading the source.
- **Log T and log L as the state.** Sliders, keyboard steps and dragging all move in ratios, and the
  diagram is logarithmic.
- **Inverse mappings.** Dragging on a B − V, spectral-type or magnitude axis needs (T, L) back.
  - `AxisQuantity.temperatureAt` inverts the dwarf relations.
  - `luminosityAt` inverts M_V or M_G at that temperature.
  - The round trip is exact because the forward and inverse maps use the same interpolators.
- **Keyboard moves in view space.** `CursorStarNode` steps the marker 8 px (1.5 px with Shift) and
  converts back to (T, L). Arrow keys therefore always move the marker the way they point, whichever
  axes are shown.
- **Custom ticks.** The temperature axis spans only 1.4 decades, so decade ticks would label nothing
  useful. `axisTicks.ts` lists round temperatures instead, letters for spectral types, and decades
  for luminosity.
- **Point clouds on canvas.** 44 000 census stars are painted by `PointCloudNode`, one path per
  group. Picking uses the view positions cached at paint time.
- **Layout regions never overlap.** Every view places its content through `placeInRegion`
  (PlanetaryConfigurations pattern). `tests/browser/layout.spec.ts` checks all screens in en/fr/es.

## Data pipeline (`scripts/catalog/fetch-catalog.ts`)

1. Downloads the Mamajek dwarf table and the Montreal 0.6 M☉ DA table, and writes the trimmed
   reference JSON.
2. Queries the GCNS for a `MOD(source_id, 10) = 0` sample within 100 pc, with quality cuts:
   - BP/RP S/N > 10;
   - RUWE < 1.4;
   - the Babusiaux et al. (2018) BP/RP excess-factor cut.
3. Queries the GCNS within 10.5 pc with no quality cut. The cut is applied locally, so stars with poor
   photometry can still be matched to Hipparcos.
4. Queries Hipparcos (V, B − V, spectral type) joined with the new reduction (parallax), the
   Hipparcos–Gaia best-neighbour table and the DR3 parallax. It keeps stars with V < 3 or plx > 95 mas.
5. Names the stars with `StarNamer`:
   - IAU-CSN proper names by HIP;
   - HYG designations by HIP, or by position plus magnitude for Gaia-only stars;
   - each HYG star is used at most once.
6. Merges the sets: Gaia photometry where good and unsaturated, otherwise Hipparcos. It de-duplicates
   by HIP and Gaia source id.

To refresh, run `npm run fetch-data`, check the printed summary, run `npm test`, and commit
`src/common/model/data/`.

## Testing

- `tests/model/` covers the conversions (Sun, isoradius lines, magnitudes, colours, white dwarf size),
  the spectral-type parser, and the decoded catalogue: Sirius, Arcturus, Betelgeuse and Proxima land
  at their literature values, and the census mix is checked.
- `tests/memory-leak.test.ts`:
  - `PointCloudNode` disposal;
  - guide redraws and axis switches must not add listeners to global string Properties.
- `tests/browser/layout.spec.ts` checks region overlap in every screen and locale.
- `npm run test:fuzz` runs the pointer and keyboard fuzz.
