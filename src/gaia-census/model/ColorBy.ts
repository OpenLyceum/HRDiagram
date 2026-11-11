/**
 * ColorBy.ts
 *
 * How the Gaia Census screen colours its stars: by kind of star, or by distance from the Sun.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class ColorBy extends EnumerationValue {
  public static readonly KIND = new ColorBy("colorKind");
  public static readonly DISTANCE = new ColorBy("colorDistance");

  public static readonly enumeration = new Enumeration(ColorBy);

  /** Key into the `gaiaCensus` string group. */
  public readonly key: string;

  public constructor(key: string) {
    super();
    this.key = key;
  }
}
