/**
 * axisTicks.ts
 *
 * Tick marks, gridlines and labels for each axis quantity. Values are in data units (K, L☉, mag…);
 * the chart converts them. A log axis of temperature spans little more than one decade, so it gets
 * hand-picked round temperatures rather than decade ticks. The spectral-type axis is labelled with the
 * class letters, centred in their classes.
 */

import { AxisQuantity } from "../model/AxisQuantity.js";
import { formatDecade, formatFixed, formatInteger } from "./format.js";

export type Tick = {
  /** Position in data units. */
  readonly value: number;
  /** Label, or null for an unlabelled tick. */
  readonly label: string | null;
  /** Whether a gridline is drawn (major) or only a short tick (minor). */
  readonly major: boolean;
};

const range = (start: number, stop: number, step: number): number[] => {
  const values: number[] = [];
  for (let i = 0; start + i * step <= stop + 1e-9; i++) {
    values.push(Number((start + i * step).toFixed(6)));
  }
  return values;
};

const linearTicks = (min: number, max: number, labelStep: number, minorStep: number, decimals: number): Tick[] => [
  ...range(min, max, labelStep).map((value) => ({ value, label: formatFixed(value, decimals), major: true })),
  ...range(min, max, minorStep)
    .filter((value) => Math.abs(value / labelStep - Math.round(value / labelStep)) > 1e-6)
    .map((value) => ({ value, label: null, major: false })),
];

const TEMPERATURE_LABELS = [3000, 4000, 5000, 7000, 10000, 15000, 20000, 30000, 40000];

const temperatureTicks = (): Tick[] => [
  ...TEMPERATURE_LABELS.map((value) => ({ value, label: formatInteger(value), major: true })),
  ...[...range(2000, 9000, 1000), ...range(25000, 50000, 5000), 12000, 50000]
    .filter((value) => !TEMPERATURE_LABELS.includes(value))
    .map((value) => ({ value, label: null, major: false })),
];

const decadeTicks = (minExponent: number, maxExponent: number): Tick[] =>
  range(minExponent, maxExponent, 1).map((exponent) => ({
    value: 10 ** exponent,
    label: formatDecade(exponent),
    major: true,
  }));

const SPECTRAL_LETTERS = "OBAFGKM";

const spectralTicks = (): Tick[] => [
  ...range(0, 70, 10).map((value) => ({ value, label: null, major: true })),
  ...range(5, 65, 10).map((value) => ({
    value,
    label: SPECTRAL_LETTERS[Math.floor(value / 10)] ?? "",
    major: false,
  })),
];

/** The ticks of an axis quantity. */
export const ticksFor = (quantity: AxisQuantity): Tick[] => {
  switch (quantity) {
    case AxisQuantity.TEMPERATURE:
      return temperatureTicks();
    case AxisQuantity.LUMINOSITY:
      return decadeTicks(Math.log10(quantity.range.min), Math.log10(quantity.range.max));
    case AxisQuantity.SPECTRAL_TYPE:
      return spectralTicks();
    case AxisQuantity.COLOR_INDEX:
      return linearTicks(-0.4, 2.2, 0.4, 0.2, 1);
    case AxisQuantity.BP_RP:
      return linearTicks(-0.5, 5, 1, 0.5, 1).filter((tick) => tick.value >= quantity.range.min);
    case AxisQuantity.ABSOLUTE_MAGNITUDE:
      return linearTicks(-10, 20, 5, 1, 0);
    default:
      return linearTicks(quantity.range.min, quantity.range.max, 2, 1, 0);
  }
};
