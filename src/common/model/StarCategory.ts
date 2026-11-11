/**
 * StarCategory.ts
 *
 * The broad kinds of star the sim sorts real stars into, and filters by: main-sequence dwarfs,
 * subgiants, giants (classes III and II), supergiants (class I) and white dwarfs.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import type { LuminosityClassName } from "./spectralTypes.js";

export class StarCategory extends EnumerationValue {
  public static readonly DWARF = new StarCategory("dwarf");
  public static readonly SUBGIANT = new StarCategory("subgiant");
  public static readonly GIANT = new StarCategory("giant");
  public static readonly SUPERGIANT = new StarCategory("supergiant");
  public static readonly WHITE_DWARF = new StarCategory("whiteDwarf");

  public static readonly enumeration = new Enumeration(StarCategory);

  /** Key into the `categories` string group and the category colour map. */
  public readonly key: string;

  public constructor(key: string) {
    super();
    this.key = key;
  }

  /** The category of an MK luminosity class. */
  public static fromLuminosityClass(luminosityClass: LuminosityClassName): StarCategory {
    switch (luminosityClass) {
      case "Ia":
      case "Iab":
      case "Ib":
        return StarCategory.SUPERGIANT;
      case "II":
      case "III":
        return StarCategory.GIANT;
      case "IV":
        return StarCategory.SUBGIANT;
      case "D":
        return StarCategory.WHITE_DWARF;
      default:
        return StarCategory.DWARF;
    }
  }
}
