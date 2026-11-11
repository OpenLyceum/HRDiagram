/**
 * GaiaCensusScreenSummaryContent.ts
 *
 * The accessible screen summary: what the play area and controls are, how many stars are plotted and
 * what share are dwarfs, giants and white dwarfs, and a question to start with.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StarCategory } from "../../common/model/StarCategory.js";
import { formatFixed, formatInteger } from "../../common/view/format.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { GaiaCensusModel } from "../model/GaiaCensusModel.js";

export class GaiaCensusScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: GaiaCensusModel) {
    const a11y = StringManager.getInstance().getGaiaCensusA11yStrings();
    const currentDetails = new DerivedProperty(
      [a11y.currentDetailsPatternStringProperty, model.selectionProperty],
      (pattern, selection) => {
        const share = (...categories: StarCategory[]): string =>
          selection.count === 0
            ? "0"
            : formatFixed(
                (100 * categories.reduce((sum, c) => sum + (selection.countsByCategory.get(c) ?? 0), 0)) /
                  selection.count,
                1,
              );
        return StringUtils.fillIn(pattern, {
          count: formatInteger(selection.count),
          dwarfs: share(StarCategory.DWARF),
          giants: share(StarCategory.SUBGIANT, StarCategory.GIANT, StarCategory.SUPERGIANT),
          whiteDwarfs: share(StarCategory.WHITE_DWARF),
        });
      },
    );
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetails,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
