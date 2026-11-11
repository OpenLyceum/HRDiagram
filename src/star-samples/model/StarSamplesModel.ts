/**
 * StarSamplesModel.ts
 *
 * The Star Samples screen: real stars from the bundled snapshot (StarCatalog.NAMED_STARS), filtered by
 * sample (nearest, brightest, both lists, overlap) and by kind of star, with one selected star.
 */

import {
  BooleanProperty,
  DerivedProperty,
  EnumerationProperty,
  Property,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { DiagramSettings } from "../../common/model/DiagramSettings.js";
import { NAMED_STARS, type Star } from "../../common/model/StarCatalog.js";
import { StarCategory } from "../../common/model/StarCategory.js";
import { StarSample } from "./StarSample.js";

export class StarSamplesModel implements TModel {
  public readonly settings = new DiagramSettings();
  public readonly sampleProperty = new EnumerationProperty(StarSample.NEAREST);

  /** Whether each kind of star is shown. */
  public readonly categoryVisibleProperties: ReadonlyMap<StarCategory, BooleanProperty>;

  /** The star whose card is shown (it is drawn even if filtered out). */
  public readonly selectedStarProperty = new Property<Star | null>(null);

  /** Stars in the current sample, before the kind filter. */
  public readonly sampleStarsProperty: TReadOnlyProperty<readonly Star[]>;

  /** Stars drawn: in the sample and of a visible kind. */
  public readonly visibleStarsProperty: TReadOnlyProperty<readonly Star[]>;

  /** How many stars of each kind the current sample holds. */
  public readonly categoryCountsProperty: TReadOnlyProperty<ReadonlyMap<StarCategory, number>>;

  public constructor() {
    this.categoryVisibleProperties = new Map(
      StarCategory.enumeration.values.map((category) => [category, new BooleanProperty(true)]),
    );
    this.sampleStarsProperty = new DerivedProperty([this.sampleProperty], (sample) =>
      NAMED_STARS.filter((star) => sample.includes(star)),
    );
    this.visibleStarsProperty = DerivedProperty.deriveAny(
      [this.sampleStarsProperty, ...this.categoryVisibleProperties.values()],
      () =>
        this.sampleStarsProperty.value.filter(
          (star) => this.categoryVisibleProperties.get(star.category)?.value === true,
        ),
    );
    this.categoryCountsProperty = new DerivedProperty([this.sampleStarsProperty], (stars) => {
      const counts = new Map(StarCategory.enumeration.values.map((category) => [category, 0]));
      for (const star of stars) {
        counts.set(star.category, (counts.get(star.category) ?? 0) + 1);
      }
      return counts;
    });
  }

  /** The visible star after (+1) or before (−1) the selection in order of temperature, hottest first. */
  public stepSelection(direction: 1 | -1): void {
    const stars = [...this.visibleStarsProperty.value].sort((a, b) => b.temperature - a.temperature);
    if (stars.length === 0) {
      return;
    }
    const current = this.selectedStarProperty.value;
    const index = current === null ? -1 : stars.indexOf(current);
    const next = index < 0 ? (direction > 0 ? 0 : stars.length - 1) : (index + direction + stars.length) % stars.length;
    this.selectedStarProperty.value = stars[next] ?? null;
  }

  public reset(): void {
    this.settings.reset();
    this.sampleProperty.reset();
    for (const property of this.categoryVisibleProperties.values()) {
      property.reset();
    }
    this.selectedStarProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on its own.
  }
}
