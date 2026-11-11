/**
 * format.ts
 *
 * Number formatting for readouts and tick labels (adapted from ExoplanetsDatabase): significant figures
 * with a true minus sign, grouped thousands, and powers of ten with Unicode superscripts.
 */

import { toFixed } from "scenerystack/dot";

/** Narrow no-break space, the SI thousands separator, which reads the same in every locale. */
const GROUP_SEPARATOR = " ";

const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
};

const superscript = (exponent: number): string =>
  String(exponent)
    .split("")
    .map((c) => SUPERSCRIPTS[c] ?? c)
    .join("");

const group = (integerText: string): string => integerText.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);

/** A whole number with grouped thousands: 10 000. */
export const formatInteger = (value: number): string =>
  Number.isFinite(value) ? group(toFixed(Math.round(value), 0)).replace("-", "−") : "—";

/**
 * A value to `digits` significant figures: plain decimals between 10⁻³ and 10⁵ (grouped above 9999),
 * otherwise m × 10ⁿ.
 */
export const formatValue = (value: number, digits = 3): string => {
  if (!Number.isFinite(value)) {
    return "—";
  }
  if (value === 0) {
    return "0";
  }
  const magnitude = Math.abs(value);
  if (magnitude < 1e-3 || magnitude >= 1e5) {
    const exponent = Math.floor(Math.log10(magnitude));
    const mantissa = Number((value / 10 ** exponent).toPrecision(Math.max(1, digits - 1)));
    return `${String(mantissa).replace("-", "−")} × 10${superscript(exponent)}`;
  }
  const rounded = Number(value.toPrecision(digits));
  if (magnitude >= 10 ** (digits - 1)) {
    return formatInteger(rounded);
  }
  const decimals = Math.max(0, digits - 1 - Math.floor(Math.log10(magnitude)));
  return toFixed(rounded, decimals).replace("-", "−");
};

/** A decade label: 0.01, 0.1, 1, 10, 100, 1000, then 10⁴, 10⁻³, … */
export const formatDecade = (exponent: number): string => {
  const n = Math.round(exponent);
  if (n >= -2 && n <= 3) {
    return n < 0 ? toFixed(10 ** n, -n) : formatInteger(10 ** n);
  }
  return `10${superscript(n)}`;
};

/** A signed value with fixed decimals and a true minus sign: −0.4, 1.2. */
export const formatFixed = (value: number, decimals: number): string =>
  Number.isFinite(value) ? toFixed(value, decimals).replace("-", "−") : "—";
