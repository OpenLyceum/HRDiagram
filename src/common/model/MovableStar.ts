/**
 * MovableStar.ts
 *
 * A star the user places on the HR diagram by temperature and luminosity, with the radius that follows
 * from Stefan–Boltzmann. Temperature and luminosity are stored as logarithms because the diagram, the
 * sliders and the keyboard all move in equal ratios.
 */

import { DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { clamp, Range } from "scenerystack/dot";
import { CURSOR_LUMINOSITY_RANGE, CURSOR_TEMPERATURE_RANGE } from "../../HRDiagramConstants.js";
import { radiusFromLuminosityAndTemperature } from "./stellarPhysics.js";

export class MovableStar {
  /** log₁₀ of the temperature (K). */
  public readonly logTemperatureProperty: NumberProperty;

  /** log₁₀ of the luminosity (L☉). */
  public readonly logLuminosityProperty: NumberProperty;

  public readonly temperatureProperty: TReadOnlyProperty<number>; // K
  public readonly luminosityProperty: TReadOnlyProperty<number>; // L☉
  public readonly radiusProperty: TReadOnlyProperty<number>; // R☉

  public constructor(initialTemperature: number, initialLuminosity: number) {
    this.logTemperatureProperty = new NumberProperty(Math.log10(initialTemperature), {
      range: new Range(Math.log10(CURSOR_TEMPERATURE_RANGE.min), Math.log10(CURSOR_TEMPERATURE_RANGE.max)),
    });
    this.logLuminosityProperty = new NumberProperty(Math.log10(initialLuminosity), {
      range: new Range(Math.log10(CURSOR_LUMINOSITY_RANGE.min), Math.log10(CURSOR_LUMINOSITY_RANGE.max)),
    });
    this.temperatureProperty = new DerivedProperty([this.logTemperatureProperty], (logT) => 10 ** logT);
    this.luminosityProperty = new DerivedProperty([this.logLuminosityProperty], (logL) => 10 ** logL);
    this.radiusProperty = new DerivedProperty([this.luminosityProperty, this.temperatureProperty], (L, T) =>
      radiusFromLuminosityAndTemperature(L, T),
    );
  }

  /** Moves the star, clamped to the allowed ranges. Non-finite or non-positive values are ignored. */
  public setTemperatureLuminosity(temperature: number, luminosity: number): void {
    const tRange = this.logTemperatureProperty.range;
    const lRange = this.logLuminosityProperty.range;
    if (Number.isFinite(temperature) && temperature > 0) {
      this.logTemperatureProperty.value = clamp(Math.log10(temperature), tRange.min, tRange.max);
    }
    if (Number.isFinite(luminosity) && luminosity > 0) {
      this.logLuminosityProperty.value = clamp(Math.log10(luminosity), lRange.min, lRange.max);
    }
  }

  public reset(): void {
    this.logTemperatureProperty.reset();
    this.logLuminosityProperty.reset();
  }
}
