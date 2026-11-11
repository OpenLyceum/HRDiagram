/**
 * ExploreScreenSummaryContent.ts
 *
 * The accessible screen summary: what the play area and controls are, a live description of the star,
 * and how to start.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatValue } from "../../common/view/format.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ExploreModel } from "../model/ExploreModel.js";

export class ExploreScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ExploreModel) {
    const a11y = StringManager.getInstance().getExploreA11yStrings();
    const currentDetails = new DerivedProperty(
      [
        a11y.currentDetailsPatternStringProperty,
        model.star.temperatureProperty,
        model.star.luminosityProperty,
        model.star.radiusProperty,
      ],
      (pattern, temperature, luminosity, radius) =>
        StringUtils.fillIn(pattern, {
          temperature: formatValue(temperature, 3),
          luminosity: formatValue(luminosity, 3),
          radius: formatValue(radius, 3),
        }),
    );
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetails,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
