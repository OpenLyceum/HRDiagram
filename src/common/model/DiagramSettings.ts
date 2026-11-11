/**
 * DiagramSettings.ts
 *
 * What an HR diagram shows: the quantity on each axis and which guides are drawn. Each screen model
 * owns one, with its own defaults.
 */

import { BooleanProperty, EnumerationProperty } from "scenerystack/axon";
import { AxisQuantity } from "./AxisQuantity.js";

export type DiagramSettingsOptions = {
  readonly mainSequenceVisible?: boolean;
  readonly luminosityClassesVisible?: boolean;
  readonly isoradiusVisible?: boolean;
  readonly instabilityStripVisible?: boolean;
  readonly horizontalQuantities?: readonly AxisQuantity[];
  readonly verticalQuantities?: readonly AxisQuantity[];
};

export class DiagramSettings {
  public readonly xQuantityProperty: EnumerationProperty<AxisQuantity>;
  public readonly yQuantityProperty: EnumerationProperty<AxisQuantity>;
  public readonly mainSequenceVisibleProperty: BooleanProperty;
  public readonly luminosityClassesVisibleProperty: BooleanProperty;
  public readonly isoradiusVisibleProperty: BooleanProperty;
  public readonly instabilityStripVisibleProperty: BooleanProperty;

  /** The choices each axis offers, first one is the default. */
  public readonly horizontalQuantities: readonly AxisQuantity[];
  public readonly verticalQuantities: readonly AxisQuantity[];

  public constructor(options?: DiagramSettingsOptions) {
    this.horizontalQuantities = options?.horizontalQuantities ?? AxisQuantity.HORIZONTAL;
    this.verticalQuantities = options?.verticalQuantities ?? AxisQuantity.VERTICAL;
    this.xQuantityProperty = new EnumerationProperty(this.horizontalQuantities[0] ?? AxisQuantity.TEMPERATURE, {
      validValues: [...this.horizontalQuantities],
    });
    this.yQuantityProperty = new EnumerationProperty(this.verticalQuantities[0] ?? AxisQuantity.LUMINOSITY, {
      validValues: [...this.verticalQuantities],
    });
    this.mainSequenceVisibleProperty = new BooleanProperty(options?.mainSequenceVisible ?? true);
    this.luminosityClassesVisibleProperty = new BooleanProperty(options?.luminosityClassesVisible ?? false);
    this.isoradiusVisibleProperty = new BooleanProperty(options?.isoradiusVisible ?? false);
    this.instabilityStripVisibleProperty = new BooleanProperty(options?.instabilityStripVisible ?? false);
  }

  public reset(): void {
    this.xQuantityProperty.reset();
    this.yQuantityProperty.reset();
    this.mainSequenceVisibleProperty.reset();
    this.luminosityClassesVisibleProperty.reset();
    this.isoradiusVisibleProperty.reset();
    this.instabilityStripVisibleProperty.reset();
  }
}
