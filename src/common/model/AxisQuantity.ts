/**
 * AxisQuantity.ts
 *
 * What each axis of the HR diagram can show. Every quantity knows its range, whether it is drawn on a
 * log scale, which way it runs, and how to compute its value for a temperature–luminosity pair (curves,
 * the cursor star) and for a real star (which may carry a measured colour or magnitude instead).
 *
 * Chart (model) coordinates are the axis values themselves, or log₁₀ of them on a log axis.
 * Hot stars are always on the left: the temperature axis runs backwards, and the colour and spectral
 * type axes already put blue, early-type stars at small values.
 * Bright stars are always at the top: the magnitude axes run backwards.
 */

import { Range } from "scenerystack/dot";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { spectralCodeFromTemperature } from "./spectralTypes.js";
import {
  absoluteVisualMagnitude,
  bolometricMagnitudeFromLuminosity,
  bpRpFromTemperature,
  colorIndexFromTemperature,
  gBolometricCorrection,
} from "./stellarPhysics.js";

/** What an axis needs from a real star. */
export type PlottableStar = {
  readonly temperature: number;
  readonly luminosity: number;
  readonly absoluteV: number;
  /** Measured B−V, or NaN to derive it from the temperature. */
  readonly colorIndex: number;
  /** Gaia BP−RP, or NaN to derive it from the temperature. */
  readonly bpRp: number;
  readonly spectralCode: number;
};

type AxisQuantityConfig = {
  readonly key: string;
  readonly log: boolean;
  /** Range in data units (K, L☉, mag…), min < max. */
  readonly range: Range;
  /** True when larger values are drawn to the left (x) or bottom (y). */
  readonly inverted: boolean;
  readonly fromTemperatureLuminosity: (temperature: number, luminosity: number) => number;
  readonly fromStar: (star: PlottableStar) => number;
};

export class AxisQuantity extends EnumerationValue {
  // Horizontal quantities
  public static readonly TEMPERATURE = new AxisQuantity({
    key: "temperature",
    log: true,
    range: new Range(2000, 50000),
    inverted: true,
    fromTemperatureLuminosity: (temperature) => temperature,
    fromStar: (star) => star.temperature,
  });

  public static readonly COLOR_INDEX = new AxisQuantity({
    key: "colorIndex",
    log: false,
    range: new Range(-0.4, 2.2),
    inverted: false,
    fromTemperatureLuminosity: (temperature) => colorIndexFromTemperature(temperature),
    fromStar: (star) =>
      Number.isFinite(star.colorIndex) ? star.colorIndex : colorIndexFromTemperature(star.temperature),
  });

  public static readonly SPECTRAL_TYPE = new AxisQuantity({
    key: "spectralType",
    log: false,
    range: new Range(0, 70),
    inverted: false,
    fromTemperatureLuminosity: (temperature) => spectralCodeFromTemperature(temperature),
    fromStar: (star) => star.spectralCode,
  });

  public static readonly BP_RP = new AxisQuantity({
    key: "bpRp",
    log: false,
    range: new Range(-0.6, 5.2),
    inverted: false,
    fromTemperatureLuminosity: (temperature) => bpRpFromTemperature(temperature),
    fromStar: (star) => (Number.isFinite(star.bpRp) ? star.bpRp : bpRpFromTemperature(star.temperature)),
  });

  // Vertical quantities
  public static readonly LUMINOSITY = new AxisQuantity({
    key: "luminosity",
    log: true,
    range: new Range(1e-5, 1e7),
    inverted: false,
    fromTemperatureLuminosity: (_temperature, luminosity) => luminosity,
    fromStar: (star) => star.luminosity,
  });

  public static readonly ABSOLUTE_MAGNITUDE = new AxisQuantity({
    key: "absoluteMagnitude",
    log: false,
    range: new Range(-10, 20),
    inverted: true,
    fromTemperatureLuminosity: (temperature, luminosity) => absoluteVisualMagnitude(luminosity, temperature),
    fromStar: (star) => star.absoluteV,
  });

  public static readonly ABSOLUTE_G = new AxisQuantity({
    key: "absoluteG",
    log: false,
    range: new Range(-4, 18),
    inverted: true,
    fromTemperatureLuminosity: (temperature, luminosity) =>
      bolometricMagnitudeFromLuminosity(luminosity) - gBolometricCorrection(bpRpFromTemperature(temperature)),
    fromStar: (star) => {
      const bpRp = Number.isFinite(star.bpRp) ? star.bpRp : bpRpFromTemperature(star.temperature);
      return bolometricMagnitudeFromLuminosity(star.luminosity) - gBolometricCorrection(bpRp);
    },
  });

  public static readonly enumeration = new Enumeration(AxisQuantity);

  /** Horizontal choices on the Explore, Radius and Star Samples screens. */
  public static readonly HORIZONTAL = [
    AxisQuantity.TEMPERATURE,
    AxisQuantity.COLOR_INDEX,
    AxisQuantity.SPECTRAL_TYPE,
  ] as const;

  /** Vertical choices on the Explore, Radius and Star Samples screens. */
  public static readonly VERTICAL = [AxisQuantity.LUMINOSITY, AxisQuantity.ABSOLUTE_MAGNITUDE] as const;

  /** Key into the `axes` string group. */
  public readonly key: string;
  public readonly log: boolean;
  public readonly range: Range;
  public readonly inverted: boolean;
  private readonly config: AxisQuantityConfig;

  public constructor(config: AxisQuantityConfig) {
    super();
    this.config = config;
    this.key = config.key;
    this.log = config.log;
    this.range = config.range;
    this.inverted = config.inverted;
  }

  /** The chart-coordinate range: log₁₀ of the data range on a log axis. */
  public get chartRange(): Range {
    return this.log
      ? new Range(Math.log10(this.range.min), Math.log10(this.range.max))
      : new Range(this.range.min, this.range.max);
  }

  /** Data value → chart coordinate (NaN when it can't be placed). */
  public toChart(value: number): number {
    return this.log ? (value > 0 ? Math.log10(value) : Number.NaN) : value;
  }

  /** Chart coordinate → data value. */
  public fromChart(coordinate: number): number {
    return this.log ? 10 ** coordinate : coordinate;
  }

  /** Chart coordinate of a temperature–luminosity pair. */
  public chartValueOf(temperature: number, luminosity: number): number {
    return this.toChart(this.config.fromTemperatureLuminosity(temperature, luminosity));
  }

  /** Chart coordinate of a real star. */
  public chartValueOfStar(star: PlottableStar): number {
    return this.toChart(this.config.fromStar(star));
  }
}
