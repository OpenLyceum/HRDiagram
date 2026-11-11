/**
 * StarConstraint.ts
 *
 * How a star on the Radius screen may move: freely, at fixed luminosity (sideways), or at fixed
 * temperature (up and down). Fixing one quantity isolates the effect of the other on the radius.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class StarConstraint extends EnumerationValue {
  public static readonly FREE = new StarConstraint("free");
  public static readonly HOLD_LUMINOSITY = new StarConstraint("holdLuminosity");
  public static readonly HOLD_TEMPERATURE = new StarConstraint("holdTemperature");

  public static readonly enumeration = new Enumeration(StarConstraint);

  /** Key into the `radius` string group. */
  public readonly key: string;

  public constructor(key: string) {
    super();
    this.key = key;
  }
}
