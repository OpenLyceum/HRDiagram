/**
 * luminosityClasses.ts
 *
 * Where each luminosity class lies on the HR diagram, as curves of (temperature, luminosity), and the
 * classical instability strip.
 *
 *   - V (main sequence): the Pecaut & Mamajek dwarf table itself.
 *   - D (white dwarfs): the Montreal 0.6 M☉ cooling sequence.
 *   - Iab supergiants and III giants: representative absolute visual magnitudes by spectral type,
 *     rounded from standard textbook compilations (after Schmidt-Kaler 1982). Ia and Ib sit about
 *     1.3 mag above and below Iab, II halfway between Ib and III, and IV halfway between III and V.
 *   These are teaching guides, not calibrations: real classes are bands, and the overlay draws them so.
 */

import { type LuminosityClassName, temperatureFromCode } from "./spectralTypes.js";
import {
  DWARF_TABLE,
  Interpolator,
  luminosityFromAbsoluteVisualMagnitude,
  luminosityFromBolometricMagnitude,
  WHITE_DWARF_TABLE,
} from "./stellarPhysics.js";

/** A point on a class curve. */
export type TemperatureLuminosity = { readonly temperature: number; readonly luminosity: number };

/** Representative M_V of Iab supergiants by spectral code. */
const SUPERGIANT_MV: [number, number][] = [
  [8, -6.5],
  [10, -6.4],
  [15, -6.2],
  [20, -6.3],
  [25, -6.6],
  [30, -6.6],
  [35, -6.6],
  [40, -6.4],
  [45, -6.2],
  [50, -6.0],
  [55, -5.8],
  [60, -5.6],
  [63, -5.6],
];

/** Representative M_V of III giants by spectral code. */
const GIANT_MV: [number, number][] = [
  [8, -5.6],
  [10, -5.0],
  [15, -2.2],
  [20, -0.6],
  [25, 0.3],
  [30, 0.6],
  [40, 0.9],
  [45, 0.8],
  [50, 0.7],
  [55, -0.2],
  [60, -0.4],
  [63, -0.5],
  [65, -0.4],
];

const SUPERGIANT = new Interpolator(SUPERGIANT_MV);
const GIANT = new Interpolator(GIANT_MV);
const DWARF_MV = new Interpolator(
  DWARF_TABLE.flatMap((row): [number, number][] => {
    const match = /^([OBAFGKM])(\d+(?:\.\d+)?)V$/.exec(row.spType);
    return match && row.mV !== null ? [["OBAFGKM".indexOf(match[1] ?? "") * 10 + Number(match[2]), row.mV]] : [];
  }),
);

/** The classes the overlay draws, brightest first. */
export const OVERLAY_CLASSES: readonly LuminosityClassName[] = ["Ia", "Ib", "II", "III", "IV", "V", "D"];

/** Spectral-code span of each class curve. */
const CODE_SPAN: Record<Exclude<LuminosityClassName, "D" | "V" | "Iab">, [number, number]> = {
  Ia: [8, 63],
  Ib: [8, 63],
  II: [10, 63],
  III: [10, 65],
  IV: [10, 51],
};

const absoluteVOf = (luminosityClass: LuminosityClassName, code: number): number => {
  switch (luminosityClass) {
    case "Ia":
      return SUPERGIANT.evaluate(code) - 1.3;
    case "Iab":
      return SUPERGIANT.evaluate(code);
    case "Ib":
      return SUPERGIANT.evaluate(code) + 1.3;
    case "II":
      return (SUPERGIANT.evaluate(code) + 1.3 + GIANT.evaluate(code)) / 2;
    case "III":
      return GIANT.evaluate(code);
    case "IV":
      return (GIANT.evaluate(code) + DWARF_MV.evaluate(code)) / 2;
    default:
      return DWARF_MV.evaluate(code);
  }
};

/** The (T, L) curve of a luminosity class, hottest point first. */
export const luminosityClassCurve = (luminosityClass: LuminosityClassName): TemperatureLuminosity[] => {
  if (luminosityClass === "V") {
    return DWARF_TABLE.filter((row) => row.teff !== null && row.logL !== null).map((row) => ({
      temperature: row.teff ?? 0,
      luminosity: 10 ** (row.logL ?? 0),
    }));
  }
  if (luminosityClass === "D") {
    return [...WHITE_DWARF_TABLE]
      .sort((a, b) => b.teff - a.teff)
      .map((row) => ({ temperature: row.teff, luminosity: luminosityFromBolometricMagnitude(row.mBol) }));
  }
  const [first, last] = luminosityClass === "Iab" ? CODE_SPAN.Ia : CODE_SPAN[luminosityClass];
  const points: TemperatureLuminosity[] = [];
  for (let code = first; code <= last + 1e-9; code += 0.5) {
    const temperature = temperatureFromCode(code, luminosityClass);
    points.push({
      temperature,
      luminosity: luminosityFromAbsoluteVisualMagnitude(absoluteVOf(luminosityClass, code), temperature),
    });
  }
  return points;
};

/**
 * The classical instability strip (Cepheids, RR Lyrae, δ Scuti), as a quadrilateral in (T, L):
 * a band about 1000 K wide that leans to cooler temperatures at higher luminosity.
 */
export const INSTABILITY_STRIP: readonly TemperatureLuminosity[] = [
  { temperature: 8300, luminosity: 3 },
  { temperature: 6000, luminosity: 1e5 },
  { temperature: 4800, luminosity: 1e5 },
  { temperature: 6900, luminosity: 3 },
];
