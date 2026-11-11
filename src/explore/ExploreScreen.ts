/**
 * ExploreScreen.ts
 *
 * The Explore screen: place a star anywhere on the HR diagram and read its radius.
 * Wires the model and view factories, the keyboard-help dialog and the screen icons
 * (createExploreIcon() in src/common/HRDiagramScreenIcons.ts). Registered in src/main.ts.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createExploreIcon } from "../common/HRDiagramScreenIcons.js";
import { HRDiagramKeyboardHelpContent } from "../common/view/HRDiagramKeyboardHelpContent.js";
import HRDiagramColors from "../HRDiagramColors.js";
import type { HRDiagramPreferencesModel } from "../preferences/HRDiagramPreferencesModel.js";
import { ExploreModel } from "./model/ExploreModel.js";
import { ExploreScreenView } from "./view/ExploreScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ExploreScreenOptions = ScreenOptions & { tandem: Tandem };

export class ExploreScreen extends Screen<ExploreModel, ExploreScreenView> {
  public constructor(preferences: HRDiagramPreferencesModel, options: ExploreScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ExploreModel(),
      // View factory — receives the model instance
      (model) =>
        new ExploreScreenView(model, preferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ExploreScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: HRDiagramColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new HRDiagramKeyboardHelpContent(),
          homeScreenIcon: createExploreIcon(),
          navigationBarIcon: createExploreIcon(),
        },
        options,
      ),
    );
  }
}
