/**
 * stellarPhysics.ts
 *
 * The conversions behind every point on the HR diagram, all in solar units (L☉, R☉) and kelvin.
 *
 *   - Stefan–Boltzmann: L = R² (T / T☉)⁴, so R = √L / (T / T☉)².
 *   - Bolometric magnitude: M_bol = M_bol,☉ − 2.5 log₁₀ L, with M_bol,☉ = 4.74 (IAU 2015 B2).
 *   - Bolometric corrections and colours come from two reference tables bundled with the sim:
 *       · Pecaut & Mamajek (2013) mean dwarf sequence: T, BC_V, log L, M_V, B−V, BP−RP, M_G, G−V,
 *         R and mass for each dwarf type O3 V … M9.5 V;
 *       · the Montreal cooling sequence for 0.6 M☉ pure-hydrogen white dwarfs (Bédard et al. 2020).
 *     A bolometric correction depends mostly on temperature, so the dwarf table's BC_V(T) is used for
 *     every star; colour–temperature relations differ more with surface gravity, so white dwarfs get
 *     their own table.
 *
 * Everything here is a pure function of numbers; nothing depends on SceneryStack.
 */

import dwarfJson from "./data/dwarfSequence.json";
import whiteDwarfJson from "./data/whiteDwarfSequence.json";

/** IAU 2015 nominal solar effective temperature (K). */
export const SUN_TEMPERATURE = 5772;

/** IAU 2015 absolute bolometric magnitude of the Sun. */
export const SUN_BOLOMETRIC_MAGNITUDE = 4.74;

/** The Sun's apparent V magnitude. */
export const SUN_APPARENT_V = -26.74;

/** One astronomical unit in parsecs. */
export const AU_IN_PARSECS = 4.8481e-6;

// ── Stefan–Boltzmann ──────────────────────────────────────────────────────────

/** Radius (R☉) of a star of luminosity L (L☉) and temperature T (K). */
export const radiusFromLuminosityAndTemperature = (luminosity: number, temperature: number): number =>
  Math.sqrt(luminosity) / (temperature / SUN_TEMPERATURE) ** 2;

/** Luminosity (L☉) of a star of radius R (R☉) and temperature T (K). */
export const luminosityFromRadiusAndTemperature = (radius: number, temperature: number): number =>
  radius ** 2 * (temperature / SUN_TEMPERATURE) ** 4;

/** Temperature (K) of a star of luminosity L (L☉) and radius R (R☉). */
export const temperatureFromLuminosityAndRadius = (luminosity: number, radius: number): number =>
  SUN_TEMPERATURE * (luminosity / radius ** 2) ** 0.25;

// ── Magnitudes ────────────────────────────────────────────────────────────────

export const bolometricMagnitudeFromLuminosity = (luminosity: number): number =>
  SUN_BOLOMETRIC_MAGNITUDE - 2.5 * Math.log10(luminosity);

export const luminosityFromBolometricMagnitude = (bolometricMagnitude: number): number =>
  10 ** (-0.4 * (bolometricMagnitude - SUN_BOLOMETRIC_MAGNITUDE));

/** Absolute magnitude from apparent magnitude and distance (pc), ignoring extinction. */
export const absoluteMagnitude = (apparent: number, distance: number): number =>
  apparent - 5 * Math.log10(distance / 10);

/** Apparent magnitude from absolute magnitude and distance (pc). */
export const apparentMagnitude = (absolute: number, distance: number): number =>
  absolute + 5 * Math.log10(distance / 10);

// ── Reference tables ──────────────────────────────────────────────────────────

/** One row of the Pecaut & Mamajek dwarf table (null where the table has no value). */
export type DwarfRow = {
  readonly spType: string;
  readonly teff: number | null;
  readonly bcV: number | null;
  readonly logL: number | null;
  readonly mV: number | null;
  readonly bv: number | null;
  readonly bpRp: number | null;
  readonly mG: number | null;
  readonly gMinusV: number | null;
  readonly radius: number | null;
  readonly mass: number | null;
};

/** One row of the white dwarf cooling table. */
export type WhiteDwarfRow = {
  readonly teff: number;
  readonly logg: number;
  readonly mBol: number;
  readonly mV: number;
  readonly bv: number;
  readonly mG: number;
  readonly bpRp: number;
};

export const DWARF_TABLE: readonly DwarfRow[] = dwarfJson.rows as DwarfRow[];
export const WHITE_DWARF_TABLE: readonly WhiteDwarfRow[] = whiteDwarfJson.rows as WhiteDwarfRow[];

/** A monotonic piecewise-linear lookup y(x), clamped at both ends. */
export class Interpolator {
  private readonly xs: Float64Array;
  private readonly ys: Float64Array;

  /** Pairs need not be sorted; pairs with a non-finite member are dropped. */
  public constructor(pairs: readonly (readonly [number, number])[]) {
    const clean = pairs.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y)).sort((a, b) => a[0] - b[0]);
    this.xs = Float64Array.from(clean, ([x]) => x);
    this.ys = Float64Array.from(clean, ([, y]) => y);
  }

  public get minX(): number {
    return this.xs[0] ?? Number.NaN;
  }

  public get maxX(): number {
    return this.xs[this.xs.length - 1] ?? Number.NaN;
  }

  public evaluate(x: number): number {
    const xs = this.xs;
    const ys = this.ys;
    const n = xs.length;
    if (n === 0 || Number.isNaN(x)) {
      return Number.NaN;
    }
    if (x <= (xs[0] ?? 0)) {
      return ys[0] ?? Number.NaN;
    }
    if (x >= (xs[n - 1] ?? 0)) {
      return ys[n - 1] ?? Number.NaN;
    }
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if ((xs[mid] ?? 0) <= x) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const x0 = xs[lo] ?? 0;
    const x1 = xs[hi] ?? 0;
    const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
    return (ys[lo] ?? 0) + t * ((ys[hi] ?? 0) - (ys[lo] ?? 0));
  }
}

const dwarfPairs = (x: (row: DwarfRow) => number | null, y: (row: DwarfRow) => number | null): [number, number][] =>
  DWARF_TABLE.map((row) => [x(row) ?? Number.NaN, y(row) ?? Number.NaN]);

const logT = (row: DwarfRow): number | null => (row.teff === null ? null : Math.log10(row.teff));

/** Mbol − M_G for a dwarf row (the G-band bolometric correction), from its log L. */
const dwarfBcG = (row: DwarfRow): number | null =>
  row.logL === null || row.mG === null ? null : SUN_BOLOMETRIC_MAGNITUDE - 2.5 * row.logL - row.mG;

const BC_V_OF_LOG_T = new Interpolator(dwarfPairs(logT, (row) => row.bcV));
const BV_OF_LOG_T = new Interpolator(dwarfPairs(logT, (row) => row.bv));
const LOG_T_OF_BV = new Interpolator(dwarfPairs((row) => row.bv, logT));
const LOG_T_OF_BP_RP = new Interpolator(dwarfPairs((row) => row.bpRp, logT));
const BP_RP_OF_LOG_T = new Interpolator(dwarfPairs(logT, (row) => row.bpRp));
const BC_G_OF_BP_RP = new Interpolator(dwarfPairs((row) => row.bpRp, dwarfBcG));
const G_MINUS_V_OF_BP_RP = new Interpolator(
  dwarfPairs(
    (row) => row.bpRp,
    (row) => row.gMinusV,
  ),
);
const MAIN_SEQUENCE_LOG_L_OF_LOG_T = new Interpolator(dwarfPairs(logT, (row) => row.logL));
const MAIN_SEQUENCE_M_G_OF_BP_RP = new Interpolator(
  dwarfPairs(
    (row) => row.bpRp,
    (row) => row.mG,
  ),
);
const MAIN_SEQUENCE_MASS_OF_LOG_T = new Interpolator(dwarfPairs(logT, (row) => row.mass));

const wdPairs = (x: (row: WhiteDwarfRow) => number, y: (row: WhiteDwarfRow) => number): [number, number][] =>
  WHITE_DWARF_TABLE.map((row) => [x(row), y(row)]);

const WD_LOG_T_OF_BP_RP = new Interpolator(
  wdPairs(
    (row) => row.bpRp,
    (row) => Math.log10(row.teff),
  ),
);
const WD_BC_G_OF_BP_RP = new Interpolator(
  wdPairs(
    (row) => row.bpRp,
    (row) => row.mBol - row.mG,
  ),
);
const WD_V_MINUS_G_OF_BP_RP = new Interpolator(
  wdPairs(
    (row) => row.bpRp,
    (row) => row.mV - row.mG,
  ),
);
const WD_LOG_L_OF_LOG_T = new Interpolator(
  wdPairs(
    (row) => Math.log10(row.teff),
    (row) => Math.log10(luminosityFromBolometricMagnitude(row.mBol)),
  ),
);

/** Temperature range the dwarf table covers (K). */
export const TABLE_TEMPERATURE_RANGE = {
  min: 10 ** BC_V_OF_LOG_T.minX,
  max: 10 ** BC_V_OF_LOG_T.maxX,
};

// ── Temperature, colour and bolometric correction ─────────────────────────────

/** V-band bolometric correction BC_V = M_bol − M_V at temperature T (K). */
export const bolometricCorrectionV = (temperature: number): number => BC_V_OF_LOG_T.evaluate(Math.log10(temperature));

/** B−V colour of a dwarf at temperature T (K). */
export const colorIndexFromTemperature = (temperature: number): number => BV_OF_LOG_T.evaluate(Math.log10(temperature));

/** Temperature (K) of a dwarf with colour B−V. */
export const temperatureFromColorIndex = (bv: number): number => 10 ** LOG_T_OF_BV.evaluate(bv);

/** Gaia BP−RP colour of a dwarf at temperature T (K). */
export const bpRpFromTemperature = (temperature: number): number => BP_RP_OF_LOG_T.evaluate(Math.log10(temperature));

/** Absolute visual magnitude of a star of luminosity L (L☉) and temperature T (K). */
export const absoluteVisualMagnitude = (luminosity: number, temperature: number): number =>
  bolometricMagnitudeFromLuminosity(luminosity) - bolometricCorrectionV(temperature);

/** Luminosity (L☉) of a star with absolute visual magnitude M_V and temperature T (K). */
export const luminosityFromAbsoluteVisualMagnitude = (absoluteV: number, temperature: number): number =>
  luminosityFromBolometricMagnitude(absoluteV + bolometricCorrectionV(temperature));

/** Main-sequence luminosity (L☉) at temperature T (K), from the dwarf table. */
export const mainSequenceLuminosity = (temperature: number): number =>
  10 ** MAIN_SEQUENCE_LOG_L_OF_LOG_T.evaluate(Math.log10(temperature));

/** Main-sequence mass (M☉) at temperature T (K), from the dwarf table. */
export const mainSequenceMass = (temperature: number): number =>
  MAIN_SEQUENCE_MASS_OF_LOG_T.evaluate(Math.log10(temperature));

/** G-band bolometric correction BC_G = M_bol − M_G of a normal star of colour BP−RP. */
export const gBolometricCorrection = (bpRp: number): number => BC_G_OF_BP_RP.evaluate(bpRp);

/** Absolute G magnitude of the main sequence at colour BP−RP. */
export const mainSequenceAbsoluteG = (bpRp: number): number => MAIN_SEQUENCE_M_G_OF_BP_RP.evaluate(bpRp);

/** Luminosity (L☉) of a 0.6 M☉ hydrogen white dwarf at temperature T (K). */
export const whiteDwarfLuminosity = (temperature: number): number =>
  10 ** WD_LOG_L_OF_LOG_T.evaluate(Math.log10(temperature));

/** Temperature range of the white dwarf table (K). */
export const WHITE_DWARF_TEMPERATURE_RANGE = {
  min: 10 ** WD_LOG_L_OF_LOG_T.minX,
  max: 10 ** WD_LOG_L_OF_LOG_T.maxX,
};

// ── Gaia photometry → physical quantities ────────────────────────────────────

/** Physical quantities derived from Gaia G, BP−RP and distance. */
export type GaiaDerived = {
  readonly temperature: number; // K
  readonly luminosity: number; // L☉
  readonly absoluteG: number;
  readonly absoluteV: number;
  readonly apparentV: number;
};

/**
 * Temperature, luminosity and V magnitude of a star from its Gaia photometry.
 * Normal stars use the dwarf sequence's colour–temperature relation and G-band bolometric correction;
 * white dwarfs use the white dwarf sequence. Interstellar extinction is ignored (negligible within 100 pc).
 */
export const deriveFromGaia = (g: number, bpRp: number, distance: number, whiteDwarf: boolean): GaiaDerived => {
  const absoluteG = absoluteMagnitude(g, distance);
  const temperature = 10 ** (whiteDwarf ? WD_LOG_T_OF_BP_RP : LOG_T_OF_BP_RP).evaluate(bpRp);
  const bcG = (whiteDwarf ? WD_BC_G_OF_BP_RP : BC_G_OF_BP_RP).evaluate(bpRp);
  const luminosity = luminosityFromBolometricMagnitude(absoluteG + bcG);
  const vMinusG = whiteDwarf ? WD_V_MINUS_G_OF_BP_RP.evaluate(bpRp) : -G_MINUS_V_OF_BP_RP.evaluate(bpRp);
  return {
    temperature,
    luminosity,
    absoluteG,
    absoluteV: absoluteG + vMinusG,
    apparentV: g + vMinusG,
  };
};

const WD_BP_RP_OF_LOG_T = new Interpolator(
  wdPairs(
    (row) => Math.log10(row.teff),
    (row) => row.bpRp,
  ),
);

/** Gaia BP−RP of a white dwarf at temperature T (K). */
export const whiteDwarfBpRp = (temperature: number): number => WD_BP_RP_OF_LOG_T.evaluate(Math.log10(temperature));
