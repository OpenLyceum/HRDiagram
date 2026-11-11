/**
 * RadiusScreenSummaryContent.ts
 *
 * The accessible screen summary: what the play area and controls are, a live comparison of the two
 * stars, and how to start.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatValue } from "../../common/view/format.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { RadiusModel } from "../model/RadiusModel.js";

export class RadiusScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: RadiusModel) {
    const a11y = StringManager.getInstance().getRadiusA11yStrings();
    const currentDetails = new DerivedProperty(
      [
        a11y.currentDetailsPatternStringProperty,
        model.temperatureRatioProperty,
        model.luminosityRatioProperty,
        model.radiusRatioProperty,
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
