/**
 * StarSample.ts
 *
 * Which real stars the Star Samples screen plots, after NAAP's HR Diagram Explorer: the nearest stars,
 * the brightest stars, both lists together, or only the stars on both lists.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import type { Star } from "../../common/model/StarCatalog.js";

export class StarSample extends EnumerationValue {
  public static readonly NEAREST = new StarSample("nearest", (star) => star.nearest);
  public static readonly BRIGHTEST = new StarSample("brightest", (star) => star.brightest);
  public static readonly BOTH = new StarSample("both", (star) => star.nearest || star.brightest);
  public static readonly OVERLAP = new StarSample("overlap", (star) => star.nearest && star.brightest);

  public static readonly enumeration = new Enumeration(StarSample);

  /** Key into the `starSamples` string group. */
  public readonly key: string;
  public readonly includes: (star: Star) => boolean;

  public constructor(key: string, includes: (star: Star) => boolean) {
    super();
    this.key = key;
    this.includes = includes;
  }
}
