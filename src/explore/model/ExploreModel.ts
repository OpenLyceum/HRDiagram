/**
 * ExploreModel.ts
 *
 * The Explore screen: one star the user places anywhere on the HR diagram, by temperature and
 * luminosity, and the radius that follows from Stefan–Boltzmann. Temperature and luminosity are stored
 * as logarithms because the diagram, the sliders and the keyboard all move in equal ratios.
 */

import { DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { clamp, Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { DiagramSettings } from "../../common/model/DiagramSettings.js";
import { radiusFromLuminosityAndTemperature, SUN_TEMPERATURE } from "../../common/model/stellarPhysics.js";
import { CURSOR_LUMINOSITY_RANGE, CURSOR_TEMPERATURE_RANGE } from "../../HRDiagramConstants.js";

export class ExploreModel implements TModel {
  public readonly settings = new DiagramSettings();

  /** log₁₀ of the star's temperature (K). Starts at the Sun. */
  public readonly logTemperatureProperty = new NumberProperty(Math.log10(SUN_TEMPERATURE), {
    range: new Range(Math.log10(CURSOR_TEMPERATURE_RANGE.min), Math.log10(CURSOR_TEMPERATURE_RANGE.max)),
  });

  /** log₁₀ of the star's luminosity (L☉). Starts at the Sun. */
  public readonly logLuminosityProperty = new NumberProperty(0, {
    range: new Range(Math.log10(CURSOR_LUMINOSITY_RANGE.min), Math.log10(CURSOR_LUMINOSITY_RANGE.max)),
  });

  public readonly temperatureProperty: TReadOnlyProperty<number>; // K
  public readonly luminosityProperty: TReadOnlyProperty<number>; // L☉
  public readonly radiusProperty: TReadOnlyProperty<number>; // R☉

  public constructor() {
    this.temperatureProperty = new DerivedProperty([this.logTemperatureProperty], (logT) => 10 ** logT);
    this.luminosityProperty = new DerivedProperty([this.logLuminosityProperty], (logL) => 10 ** logL);
    this.radiusProperty = new DerivedProperty([this.luminosityProperty, this.temperatureProperty], (L, T) =>
      radiusFromLuminosityAndTemperature(L, T),
    );
  }

  /** Moves the star, clamped to the allowed ranges. */
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
    this.settings.reset();
    this.logTemperatureProperty.reset();
    this.logLuminosityProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on its own.
  }
}
