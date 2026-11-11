/**
 * ExploreModel.ts
 *
 * The Explore screen: one star the user places anywhere on the HR diagram (starting at the Sun), and
 * what the diagram shows.
 */

import type { TModel } from "scenerystack/joist";
import { DiagramSettings } from "../../common/model/DiagramSettings.js";
import { MovableStar } from "../../common/model/MovableStar.js";
import { SUN_TEMPERATURE } from "../../common/model/stellarPhysics.js";

export class ExploreModel implements TModel {
  public readonly settings = new DiagramSettings();
  public readonly star = new MovableStar(SUN_TEMPERATURE, 1);

  public reset(): void {
    this.settings.reset();
    this.star.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on its own.
  }
}
