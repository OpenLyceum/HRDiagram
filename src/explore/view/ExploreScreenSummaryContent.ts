import { EXPLORE_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../HRDiagramConstants.js";
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
          temperature: formatValue(temperature, EXPLORE_SCREEN_SUMMARY_CONTENT_SETTINGS.CURRENT_DETAILS_DIGITS),
          luminosity: formatValue(luminosity, EXPLORE_SCREEN_SUMMARY_CONTENT_SETTINGS.CURRENT_DETAILS_DIGITS),
          radius: formatValue(radius, EXPLORE_SCREEN_SUMMARY_CONTENT_SETTINGS.CURRENT_DETAILS_RADIUS_DIGITS),
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
