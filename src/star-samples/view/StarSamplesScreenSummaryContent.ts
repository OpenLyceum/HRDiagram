/**
 * StarSamplesScreenSummaryContent.ts
 *
 * The accessible screen summary: what the play area and controls are, how many stars are shown and
 * which one is selected, and a question to start with.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatInteger } from "../../common/view/format.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { StarSamplesModel } from "../model/StarSamplesModel.js";

export class StarSamplesScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: StarSamplesModel) {
    const a11y = StringManager.getInstance().getStarSamplesA11yStrings();
    const currentDetails = new DerivedProperty(
      [
        a11y.currentDetailsPatternStringProperty,
        a11y.noneSelectedStringProperty,
        model.visibleStarsProperty,
        model.selectedStarProperty,
      ],
      (pattern, none, stars, selected) =>
        StringUtils.fillIn(pattern, { count: formatInteger(stars.length), selected: selected?.name ?? none }),
    );
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetails,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
