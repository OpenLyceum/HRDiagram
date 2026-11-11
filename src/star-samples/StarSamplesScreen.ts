/**
 * StarSamplesScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createStarSamplesIcon() in src/common/HRDiagramScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createStarSamplesIcon } from "../common/HRDiagramScreenIcons.js";
import { HRDiagramKeyboardHelpContent } from "../common/view/HRDiagramKeyboardHelpContent.js";
import HRDiagramColors from "../HRDiagramColors.js";
import { StarSamplesModel } from "./model/StarSamplesModel.js";
import { StarSamplesScreenView } from "./view/StarSamplesScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type StarSamplesScreenOptions = ScreenOptions & { tandem: Tandem };

export class StarSamplesScreen extends Screen<StarSamplesModel, StarSamplesScreenView> {
  public constructor(options: StarSamplesScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new StarSamplesModel(),
      // View factory — receives the model instance
      (model) =>
        new StarSamplesScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<StarSamplesScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: HRDiagramColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new HRDiagramKeyboardHelpContent(),
          homeScreenIcon: createStarSamplesIcon(),
          navigationBarIcon: createStarSamplesIcon(),
        },
        options,
      ),
    );
  }
}
