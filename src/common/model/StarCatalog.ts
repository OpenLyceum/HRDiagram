/**
 * StarCatalog.ts
 *
 * The bundled star snapshot (written by scripts/catalog/fetch-catalog.ts), turned into physical
 * quantities once at load time:
 *
 *   - NAMED_STARS: the nearest stars (within 10 pc) and the brightest stars (V < 3), one entry each.
 *     Stars Gaia measured well use Gaia G and BP−RP; the brightest stars, which saturate Gaia, use
 *     Hipparcos V, B−V and spectral type.
 *   - GAIA_CENSUS: a random 1-in-10 sample of the Gaia Catalogue of Nearby Stars out to 100 pc,
 *     as typed columns.
 *
 * The snapshot stores only observables; the conversions live in stellarPhysics.ts.
 */

import censusJson from "./data/gaiaCensus.json";
import namedJson from "./data/namedStars.json";
import { StarCategory } from "./StarCategory.js";
import {
  type LuminosityClassName,
  type ParsedSpectralType,
  parseSpectralType,
  spectralCodeFromTemperature,
  temperatureFromCode,
} from "./spectralTypes.js";
import {
  absoluteMagnitude,
  deriveFromGaia,
  luminosityFromAbsoluteVisualMagnitude,
  mainSequenceAbsoluteG,
  mainSequenceLuminosity,
  radiusFromLuminosityAndTemperature,
  temperatureFromColorIndex,
} from "./stellarPhysics.js";

/** A row of data/namedStars.json. */
type NamedStarRow = {
  readonly name: string;
  readonly designation: string;
  readonly hip: number | null;
  readonly gaia: string | null;
  readonly photometry: "gaia" | "hipparcos";
  readonly distance: number | null;
  readonly v: number | null;
  readonly bv: number | null;
  readonly g: number | null;
  readonly bpRp: number | null;
  readonly spType: string | null;
  readonly whiteDwarf: boolean;
  readonly nearest: boolean;
  readonly brightest: boolean;
};

/** A real star with everything the diagram and the star card show. */
export type Star = {
  readonly name: string;
  readonly designation: string;
  readonly hip: number | null;
  readonly gaia: string | null;
  readonly photometry: "gaia" | "hipparcos";
  /** Distance from the Sun (pc). */
  readonly distance: number;
  /** Apparent V magnitude (measured by Hipparcos, or converted from Gaia G). */
  readonly apparentV: number;
  readonly absoluteV: number;
  /** Measured B−V, or NaN. */
  readonly colorIndex: number;
  /** Gaia BP−RP, or NaN. */
  readonly bpRp: number;
  /** The catalogue's spectral type, verbatim, or null. */
  readonly spectralType: string | null;
  /** Spectral code (G2 = 42): parsed from the type when there is one, otherwise from the temperature. */
  readonly spectralCode: number;
  readonly temperature: number; // K
  readonly luminosity: number; // L☉
  readonly radius: number; // R☉
  readonly category: StarCategory;
  /** True when the category comes from the star's place on the diagram rather than a catalogued class. */
  readonly categoryInferred: boolean;
  readonly nearest: boolean;
  readonly brightest: boolean;
};

/** No giant or subgiant is fainter than these absolute magnitudes. */
const MAX_GIANT_ABSOLUTE_G = 5;
const MAX_GIANT_ABSOLUTE_V = 5.5;

/**
 * A catalogued giant or supergiant class is overruled (as a catalogue error) when a cool star is not even
 * this many times as luminous as a main-sequence star of its temperature. Hot giants lie close to the
 * main sequence, so only stars cooler than OVERRULE_BELOW_TEMPERATURE are checked.
 */
const MIN_GIANT_LUMINOSITY_RATIO = 2;
const OVERRULE_BELOW_TEMPERATURE = 5500;

/**
 * The kind of star at (T, L), judged by how far above the main sequence it sits. Used when no
 * luminosity class is catalogued (most Gaia stars). Main-sequence stars scatter up to about 0.75 mag
 * (×2) above the line when they are unresolved binaries, so "dwarf" reaches ×4.
 */
export const categoryFromPosition = (
  temperature: number,
  luminosity: number,
  absoluteV: number,
  whiteDwarf: boolean,
): StarCategory => {
  if (whiteDwarf) {
    return StarCategory.WHITE_DWARF;
  }
  const ratio = luminosity / mainSequenceLuminosity(temperature);
  if (ratio < 0.02) {
    return StarCategory.WHITE_DWARF;
  }
  if (ratio < 4 || absoluteV > MAX_GIANT_ABSOLUTE_V) {
    return StarCategory.DWARF;
  }
  if (ratio < 20 && temperature > 4600) {
    return StarCategory.SUBGIANT;
  }
  return luminosity > 3e4 ? StarCategory.SUPERGIANT : StarCategory.GIANT;
};

/**
 * The kind of star from Gaia photometry: how many magnitudes it sits above the main sequence at its
 * BP−RP colour. Comparing magnitudes at fixed colour avoids the steep cool end of the main sequence,
 * where a small temperature error is a large luminosity ratio. Unresolved binaries and young stars sit
 * up to about 1.5 mag above the line, so "dwarf" reaches that far; and no giant is fainter than about
 * M_G = 5, so fainter stars are dwarfs however red they are (the M-dwarf sequence is broad).
 */

export const categoryFromGaia = (absoluteG: number, bpRp: number, whiteDwarf: boolean): StarCategory => {
  if (whiteDwarf) {
    return StarCategory.WHITE_DWARF;
  }
  const aboveMainSequence = mainSequenceAbsoluteG(bpRp) - absoluteG;
  if (aboveMainSequence < -4) {
    return StarCategory.WHITE_DWARF;
  }
  if (aboveMainSequence < 1.5 || absoluteG > MAX_GIANT_ABSOLUTE_G) {
    return StarCategory.DWARF;
  }
  if (aboveMainSequence < 3.5 && bpRp < 1.2) {
    return StarCategory.SUBGIANT;
  }
  return absoluteG < -3 ? StarCategory.SUPERGIANT : StarCategory.GIANT;
};

/** Temperature, luminosity and magnitudes of a named star, or null when its data can't place it. */
type Placement = {
  readonly temperature: number;
  readonly luminosity: number;
  readonly absoluteV: number;
  readonly apparentV: number;
};

/** Temperature (K) of a Hipparcos star: from its white dwarf index, its type and class, or its B−V. */
const hipparcosTemperature = (parsed: ParsedSpectralType | null, bv: number | null): number | null => {
  if (parsed?.whiteDwarfTemperature) {
    return parsed.whiteDwarfTemperature;
  }
  if (parsed && parsed.code !== null) {
    return temperatureFromCode(parsed.code, parsed.luminosityClass);
  }
  return bv === null ? null : temperatureFromColorIndex(bv);
};

const place = (row: NamedStarRow, parsed: ParsedSpectralType | null, distance: number): Placement | null => {
  if (row.photometry === "gaia" && row.g !== null && row.bpRp !== null) {
    const derived = deriveFromGaia(row.g, row.bpRp, distance, row.whiteDwarf);
    return {
      temperature: derived.temperature,
      luminosity: derived.luminosity,
      absoluteV: row.v === null ? derived.absoluteV : absoluteMagnitude(row.v, distance),
      apparentV: row.v ?? derived.apparentV,
    };
  }
  const temperature = hipparcosTemperature(parsed, row.bv);
  if (row.v === null || temperature === null) {
    return null;
  }
  const absoluteV = absoluteMagnitude(row.v, distance);
  return {
    temperature,
    luminosity: luminosityFromAbsoluteVisualMagnitude(absoluteV, temperature),
    absoluteV,
    apparentV: row.v,
  };
};

/** The catalogued luminosity class, unless a cool "giant" is too faint to be one (a catalogue error). */
const trustedClass = (
  parsed: ParsedSpectralType | null,
  whiteDwarf: boolean,
  temperature: number,
  luminosity: number,
): LuminosityClassName | null => {
  const catalogued = parsed?.luminosityClass ?? (whiteDwarf ? "D" : null);
  const implausibleGiant =
    catalogued !== null &&
    GIANT_CLASSES.includes(catalogued) &&
    temperature < OVERRULE_BELOW_TEMPERATURE &&
    luminosity / mainSequenceLuminosity(temperature) < MIN_GIANT_LUMINOSITY_RATIO;
  return implausibleGiant ? null : catalogued;
};

const GIANT_CLASSES: readonly LuminosityClassName[] = ["Ia", "Iab", "Ib", "II", "III"];

const toStar = (row: NamedStarRow): Star | null => {
  const distance = row.distance ?? Number.NaN;
  const parsed = parseSpectralType(row.spType);
  const placement = place(row, parsed, distance);
  if (placement === null) {
    return null;
  }
  const { temperature, luminosity, absoluteV, apparentV } = placement;
  if (!(Number.isFinite(temperature) && Number.isFinite(luminosity) && luminosity > 0)) {
    return null;
  }
  const catalogued = trustedClass(parsed, row.whiteDwarf, temperature, luminosity);
  const inferred = (): StarCategory =>
    row.photometry === "gaia" && row.g !== null && row.bpRp !== null
      ? categoryFromGaia(absoluteMagnitude(row.g, distance), row.bpRp, row.whiteDwarf)
      : categoryFromPosition(temperature, luminosity, absoluteV, row.whiteDwarf);
  return {
    name: row.name,
    designation: row.designation,
    hip: row.hip,
    gaia: row.gaia,
    photometry: row.photometry,
    distance,
    apparentV,
    absoluteV,
    colorIndex: row.bv ?? Number.NaN,
    bpRp: row.bpRp ?? Number.NaN,
    spectralType: row.spType,
    spectralCode: parsed?.code ?? spectralCodeFromTemperature(temperature),
    temperature,
    luminosity,
    radius: radiusFromLuminosityAndTemperature(luminosity, temperature),
    category: catalogued === null ? inferred() : StarCategory.fromLuminosityClass(catalogued),
    categoryInferred: catalogued === null,
    nearest: row.nearest,
    brightest: row.brightest,
  };
};

/** Shape of data/namedStars.json (the parts the sim reads). */
type NamedSnapshot = {
  readonly retrieved: string;
  readonly nearestLimitPc: number;
  readonly brightestLimitV: number;
  readonly stars: readonly NamedStarRow[];
};

const namedSnapshot = namedJson as NamedSnapshot;

/** Every named star the snapshot could place on the diagram, nearest first. */
export const NAMED_STARS: readonly Star[] = namedSnapshot.stars.flatMap((row) => {
  const star = toStar(row);
  return star === null ? [] : [star];
});

/** Distance limit of the "nearest" set (pc) and magnitude limit of the "brightest" set (V). */
export const NEAREST_LIMIT_PC = namedSnapshot.nearestLimitPc;
export const BRIGHTEST_LIMIT_V = namedSnapshot.brightestLimitV;
export const SNAPSHOT_DATE = namedSnapshot.retrieved;

/** Shape of data/gaiaCensus.json. */
type CensusSnapshot = {
  readonly retrieved: string;
  readonly sampleFraction: number;
  readonly count: number;
  readonly distance: readonly (number | null)[];
  readonly g: readonly (number | null)[];
  readonly bpRp: readonly (number | null)[];
  readonly whiteDwarf: readonly number[];
};

const toFloat64 = (values: readonly (number | null)[]): Float64Array =>
  Float64Array.from(values, (value) => (value === null ? Number.NaN : value));

/** The Gaia 100 pc sample as typed columns, ordered by distance. */
export class GaiaCensus {
  public readonly size: number;
  public readonly retrieved: string;
  /** Fraction of the full catalogue in this sample (0.1: every star stands for 10). */
  public readonly sampleFraction: number;
  public readonly distance: Float64Array; // pc
  public readonly apparentG: Float64Array;
  public readonly bpRp: Float64Array;
  public readonly absoluteG: Float64Array;
  public readonly apparentV: Float64Array;
  public readonly absoluteV: Float64Array;
  public readonly temperature: Float64Array; // K
  public readonly luminosity: Float64Array; // L☉
  public readonly radius: Float64Array; // R☉
  public readonly categories: readonly StarCategory[];

  public constructor(snapshot: CensusSnapshot) {
    this.size = snapshot.count;
    this.retrieved = snapshot.retrieved;
    this.sampleFraction = snapshot.sampleFraction;
    this.distance = toFloat64(snapshot.distance);
    this.apparentG = toFloat64(snapshot.g);
    this.bpRp = toFloat64(snapshot.bpRp);
    const n = this.size;
    this.absoluteG = new Float64Array(n);
    this.apparentV = new Float64Array(n);
    this.absoluteV = new Float64Array(n);
    this.temperature = new Float64Array(n);
    this.luminosity = new Float64Array(n);
    this.radius = new Float64Array(n);
    const categories: StarCategory[] = [];
    for (let i = 0; i < n; i++) {
      const whiteDwarf = snapshot.whiteDwarf[i] === 1;
      const derived = deriveFromGaia(this.apparentG[i] ?? 0, this.bpRp[i] ?? 0, this.distance[i] ?? 1, whiteDwarf);
      this.absoluteG[i] = derived.absoluteG;
      this.apparentV[i] = derived.apparentV;
      this.absoluteV[i] = derived.absoluteV;
      this.temperature[i] = derived.temperature;
      this.luminosity[i] = derived.luminosity;
      this.radius[i] = radiusFromLuminosityAndTemperature(derived.luminosity, derived.temperature);
      categories.push(categoryFromGaia(derived.absoluteG, this.bpRp[i] ?? 0, whiteDwarf));
    }
    this.categories = categories;
  }
}

export const GAIA_CENSUS = new GaiaCensus(censusJson as CensusSnapshot);
