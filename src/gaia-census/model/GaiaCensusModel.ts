/**
 * GaiaCensusModel.ts
 *
 * The Gaia Census screen: a random 1-in-10 sample of the Gaia Catalogue of Nearby Stars (every star Gaia
 * found within 100 pc), cut by a distance limit and, optionally, by apparent brightness. Comparing a
 * volume-limited sample (all stars within d) with a brightness-limited one (what the eye sees) shows
 * that most stars are faint red dwarfs, while the stars we see are mostly luminous ones.
 */

import {
  BooleanProperty,
  DerivedProperty,
  EnumerationProperty,
  NumberProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { AxisQuantity } from "../../common/model/AxisQuantity.js";
import { DiagramSettings } from "../../common/model/DiagramSettings.js";
import { GAIA_CENSUS, type GaiaCensus } from "../../common/model/StarCatalog.js";
import { StarCategory } from "../../common/model/StarCategory.js";
import { ColorBy } from "./ColorBy.js";

/** Stars in the census that pass the current limits. */
export type CensusSelection = {
  /** 1 where a star passes, 0 where it doesn't (one entry per census star). */
  readonly mask: Uint8Array;
  readonly count: number;
  readonly countsByCategory: ReadonlyMap<StarCategory, number>;
};

/** The naked-eye limit, roughly (apparent V). */
export const NAKED_EYE_LIMIT_V = 6;

export class GaiaCensusModel implements TModel {
  public readonly census: GaiaCensus = GAIA_CENSUS;

  public readonly settings = new DiagramSettings({
    mainSequenceVisible: false,
    horizontalQuantities: [AxisQuantity.TEMPERATURE, AxisQuantity.BP_RP, AxisQuantity.SPECTRAL_TYPE],
    verticalQuantities: [AxisQuantity.LUMINOSITY, AxisQuantity.ABSOLUTE_G, AxisQuantity.ABSOLUTE_MAGNITUDE],
  });

  /** Only stars nearer than this are plotted (pc). */
  public readonly distanceLimitProperty = new NumberProperty(100, { range: new Range(5, 100) });

  /** When on, only stars brighter (smaller V) than brightnessLimitProperty are plotted. */
  public readonly brightnessLimitEnabledProperty = new BooleanProperty(false);
  public readonly brightnessLimitProperty = new NumberProperty(NAKED_EYE_LIMIT_V, { range: new Range(3, 16) });

  public readonly colorByProperty = new EnumerationProperty(ColorBy.KIND);

  public readonly selectionProperty: TReadOnlyProperty<CensusSelection>;

  public constructor() {
    const census = this.census;
    this.selectionProperty = new DerivedProperty(
      [this.distanceLimitProperty, this.brightnessLimitEnabledProperty, this.brightnessLimitProperty],
      (distanceLimit, brightnessLimitEnabled, brightnessLimit) => {
        const mask = new Uint8Array(census.size);
        const counts = new Map(StarCategory.enumeration.values.map((category) => [category, 0]));
        let count = 0;
        for (let i = 0; i < census.size; i++) {
          const near = (census.distance[i] ?? Number.POSITIVE_INFINITY) <= distanceLimit;
          const bright = !brightnessLimitEnabled || (census.apparentV[i] ?? Number.POSITIVE_INFINITY) < brightnessLimit;
          if (near && bright) {
            mask[i] = 1;
            count++;
            const category = census.categories[i] as StarCategory;
            counts.set(category, (counts.get(category) ?? 0) + 1);
          }
        }
        return { mask, count, countsByCategory: counts };
      },
    );
  }

  public reset(): void {
    this.settings.reset();
    this.distanceLimitProperty.reset();
    this.brightnessLimitEnabledProperty.reset();
    this.brightnessLimitProperty.reset();
    this.colorByProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on its own.
  }
}
