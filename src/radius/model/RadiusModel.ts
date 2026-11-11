/**
 * RadiusModel.ts
 *
 * The Radius screen: two stars, A and B, on a temperature–luminosity diagram with lines of equal radius.
 * Star B starts twice as hot as star A (the Sun) at the same luminosity, so it starts a quarter the size.
 * A constraint can hold a moving star's luminosity or temperature fixed, isolating how each one sets the
 * radius: R ∝ √L at fixed T, and R ∝ 1/T² at fixed L.
 */

import { DerivedProperty, EnumerationProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { AxisQuantity } from "../../common/model/AxisQuantity.js";
import { DiagramSettings } from "../../common/model/DiagramSettings.js";
import { MovableStar } from "../../common/model/MovableStar.js";
import { SUN_TEMPERATURE } from "../../common/model/stellarPhysics.js";
import { StarConstraint } from "./StarConstraint.js";

export class RadiusModel implements TModel {
  public readonly settings = new DiagramSettings({
    isoradiusVisible: true,
    horizontalQuantities: [AxisQuantity.TEMPERATURE],
    verticalQuantities: [AxisQuantity.LUMINOSITY],
  });

  public readonly starA = new MovableStar(SUN_TEMPERATURE, 1);
  public readonly starB = new MovableStar(2 * SUN_TEMPERATURE, 1);
  public readonly constraintProperty = new EnumerationProperty(StarConstraint.FREE);

  /** B ÷ A for temperature, luminosity and radius. */
  public readonly temperatureRatioProperty: TReadOnlyProperty<number>;
  public readonly luminosityRatioProperty: TReadOnlyProperty<number>;
  public readonly radiusRatioProperty: TReadOnlyProperty<number>;

  public constructor() {
    const ratio = (b: TReadOnlyProperty<number>, a: TReadOnlyProperty<number>): TReadOnlyProperty<number> =>
      new DerivedProperty([b, a], (vb, va) => vb / va);
    this.temperatureRatioProperty = ratio(this.starB.temperatureProperty, this.starA.temperatureProperty);
    this.luminosityRatioProperty = ratio(this.starB.luminosityProperty, this.starA.luminosityProperty);
    this.radiusRatioProperty = ratio(this.starB.radiusProperty, this.starA.radiusProperty);
  }

  /** A requested move of `star` after the current constraint is applied. */
  public constrain(
    star: MovableStar,
    temperature: number,
    luminosity: number,
  ): { temperature: number; luminosity: number } {
    const constraint = this.constraintProperty.value;
    return {
      temperature: constraint === StarConstraint.HOLD_TEMPERATURE ? star.temperatureProperty.value : temperature,
      luminosity: constraint === StarConstraint.HOLD_LUMINOSITY ? star.luminosityProperty.value : luminosity,
    };
  }

  public reset(): void {
    this.settings.reset();
    this.starA.reset();
    this.starB.reset();
    this.constraintProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on its own.
  }
}
