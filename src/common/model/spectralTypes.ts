/**
 * spectralTypes.ts
 *
 * MK spectral types as numbers, temperature scales per luminosity class, and a parser for the type
 * strings catalogues carry ("G2V", "M1-M2Ia-Iab", "K2:III:", "A0m...", "DA2", "sdM4", …).
 *
 * A spectral code places a type on a line: O0 = 0, B0 = 10, A0 = 20, F0 = 30, G0 = 40, K0 = 50, M0 = 60,
 * so G2 = 42 and M5.5 = 65.5. That is also the scale of the diagram's "spectral type" axis.
 *
 * Temperatures: dwarfs (V) and subgiants (IV) follow the Pecaut & Mamajek dwarf table. Giants and
 * supergiants of the same type are cooler, most of all from G to M; their scales below are
 * approximate, rounded from standard compilations, and only matter for stars whose catalogue gives a
 * class. White dwarf types use the temperature index of the WD classification, T = 50 400 K / index.
 */

import { DWARF_TABLE, Interpolator } from "./stellarPhysics.js";

const CLASS_LETTERS = "OBAFGKM";

/** Spectral code of a type letter and subtype, e.g. ("G", 2) → 42. */
export const spectralCode = (letter: string, subtype: number): number => CLASS_LETTERS.indexOf(letter) * 10 + subtype;

/** "G2", "M5.5", "B0.5" from a spectral code. */
export const formatSpectralCode = (code: number): string => {
  const clamped = Math.min(Math.max(code, 0), 69.9);
  const letterIndex = Math.floor(clamped / 10);
  const subtype = Math.round((clamped - letterIndex * 10) * 2) / 2;
  // Rounding 9.75 up to 10 moves to the next letter.
  if (subtype >= 10) {
    return formatSpectralCode((letterIndex + 1) * 10);
  }
  return `${CLASS_LETTERS[letterIndex] ?? "M"}${subtype}`;
};

/** The letter (O … M) of a spectral code. */
export const spectralLetter = (code: number): string =>
  CLASS_LETTERS[Math.min(Math.max(Math.floor(code / 10), 0), 6)] ?? "M";

/** Spectral codes of the dwarf table rows ("O3V" → 3, "M9.5V" → 69.5). */
const DWARF_CODE_TEMPERATURES: [number, number][] = DWARF_TABLE.flatMap((row): [number, number][] => {
  const match = /^([OBAFGKM])(\d+(?:\.\d+)?)V$/.exec(row.spType);
  return match && row.teff !== null ? [[spectralCode(match[1] ?? "", Number(match[2])), Math.log10(row.teff)]] : [];
});

const DWARF_LOG_T_OF_CODE = new Interpolator(DWARF_CODE_TEMPERATURES);
const CODE_OF_DWARF_LOG_T = new Interpolator(DWARF_CODE_TEMPERATURES.map(([code, logT]) => [logT, code]));

/** Range of codes covered by the dwarf table (O3 … M9.5). */
export const SPECTRAL_CODE_RANGE = { min: DWARF_CODE_TEMPERATURES[0]?.[0] ?? 3, max: 69.5 };

/** Temperature (K) of a dwarf of the given spectral code. */
export const dwarfTemperatureFromCode = (code: number): number => 10 ** DWARF_LOG_T_OF_CODE.evaluate(code);

/** Spectral code of a dwarf at temperature T (K). */
export const spectralCodeFromTemperature = (temperature: number): number =>
  CODE_OF_DWARF_LOG_T.evaluate(Math.log10(temperature));

/** Approximate giant (III) temperatures from G to M; hotter giants use the dwarf scale. */
const GIANT_TEMPERATURES: [number, number][] = [
  [35, 6500],
  [40, 5700],
  [45, 5100],
  [48, 4850],
  [50, 4700],
  [52, 4450],
  [53, 4300],
  [55, 4000],
  [60, 3850],
  [61, 3750],
  [62, 3650],
  [63, 3550],
  [64, 3450],
  [65, 3350],
  [66, 3250],
  [67, 3150],
];

/** Approximate supergiant (I) temperatures across the whole sequence. */
const SUPERGIANT_TEMPERATURES: [number, number][] = [
  [9, 31000],
  [10, 26000],
  [11, 21000],
  [12, 18500],
  [13, 16500],
  [15, 14000],
  [18, 12000],
  [20, 9800],
  [22, 9000],
  [25, 8300],
  [30, 7400],
  [35, 6400],
  [40, 5500],
  [45, 4900],
  [50, 4450],
  [52, 4150],
  [55, 3900],
  [60, 3750],
  [61, 3650],
  [62, 3600],
  [63, 3550],
  [64, 3500],
  [65, 3450],
];

const toLog = (pairs: [number, number][]): [number, number][] => pairs.map(([code, t]) => [code, Math.log10(t)]);
const GIANT_LOG_T_OF_CODE = new Interpolator(toLog(GIANT_TEMPERATURES));
const SUPERGIANT_LOG_T_OF_CODE = new Interpolator(toLog(SUPERGIANT_TEMPERATURES));
const GIANT_SCALE_START = GIANT_TEMPERATURES[0]?.[0] ?? 35;

/** MK luminosity classes, plus D for white dwarfs. */
export type LuminosityClassName = "Ia" | "Iab" | "Ib" | "II" | "III" | "IV" | "V" | "D";

/** Temperature (K) of a star of spectral code and luminosity class (class unknown → dwarf scale). */
export const temperatureFromCode = (code: number, luminosityClass: LuminosityClassName | null): number => {
  switch (luminosityClass) {
    case "Ia":
    case "Iab":
    case "Ib":
      return 10 ** SUPERGIANT_LOG_T_OF_CODE.evaluate(code);
    case "II":
    case "III":
      return code < GIANT_SCALE_START ? dwarfTemperatureFromCode(code) : 10 ** GIANT_LOG_T_OF_CODE.evaluate(code);
    default:
      return dwarfTemperatureFromCode(code);
  }
};

/** What the parser reads from a type string. */
export type ParsedSpectralType = {
  /** Spectral code (null for white dwarfs, which have no OBAFGKM type). */
  readonly code: number | null;
  readonly luminosityClass: LuminosityClassName | null;
  /** White dwarf temperature from the WD temperature index, when the type gives one. */
  readonly whiteDwarfTemperature: number | null;
};

const LUMINOSITY_CLASS_PATTERN = /^(0|Ia\+|Iab|Ia|Ib|III|II|IV|VI|V|I)/;

/**
 * Reads the first spectral type and luminosity class from a catalogue string. Returns null when the
 * string has no recognizable type. A range such as "M1-M2" keeps the first type; "IV-V" keeps IV.
 * Subdwarfs ("sdM4", class VI) count as dwarfs.
 */
export const parseSpectralType = (text: string | null): ParsedSpectralType | null => {
  if (text === null) {
    return null;
  }
  const trimmed = text.trim();
  const whiteDwarf = /^D[ABOQZCXP]*(\d+(?:\.\d+)?)?/.exec(trimmed);
  if (whiteDwarf && !/^D[a-z]/.test(trimmed)) {
    const index = whiteDwarf[1] === undefined ? Number.NaN : Number(whiteDwarf[1]);
    return {
      code: null,
      luminosityClass: "D",
      whiteDwarfTemperature: index > 0 ? 50400 / index : null,
    };
  }
  const typeMatch = /([OBAFGKM])(\d+(?:\.\d+)?)?/.exec(trimmed.replace(/^(sd|esd|usd|d|g|c)/, ""));
  if (!typeMatch) {
    return null;
  }
  const subtype = typeMatch[2] === undefined ? 5 : Math.min(Number(typeMatch[2]), 9.5);
  const code = spectralCode(typeMatch[1] ?? "G", subtype);
  // Look for a class after the type, skipping range and uncertainty marks ("M1-M2Ia", "K2:III").
  const rest = trimmed
    .slice((typeMatch.index ?? 0) + typeMatch[0].length)
    .replace(/^[-/][OBAFGKM]\d*(?:\.\d+)?/, "")
    .replace(/^[:+\s]+/, "");
  const classMatch = LUMINOSITY_CLASS_PATTERN.exec(rest);
  let luminosityClass: LuminosityClassName | null = null;
  if (/^sd/.test(trimmed)) {
    luminosityClass = "V";
  } else if (classMatch) {
    const token = classMatch[1];
    luminosityClass =
      token === "0" || token === "Ia+" || token === "Ia"
        ? "Ia"
        : token === "I"
          ? "Iab"
          : token === "VI"
            ? "V"
            : (token as LuminosityClassName);
  }
  return { code, luminosityClass, whiteDwarfTemperature: null };
};
