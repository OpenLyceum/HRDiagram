/**
 * RadiusScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createRadiusIcon() in src/common/HRDiagramScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createRadiusIcon } from "../common/HRDiagramScreenIcons.js";
import HRDiagramColors from "../HRDiagramColors.js";
import { RadiusModel } from "./model/RadiusModel.js";
import { RadiusKeyboardHelpContent } from "./view/RadiusKeyboardHelpContent.js";
import { RadiusScreenView } from "./view/RadiusScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type RadiusScreenOptions = ScreenOptions & { tandem: Tandem };

export class RadiusScreen extends Screen<RadiusModel, RadiusScreenView> {
  public constructor(options: RadiusScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new RadiusModel(),
      // View factory — receives the model instance
      (model) =>
        new RadiusScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<RadiusScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: HRDiagramColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new RadiusKeyboardHelpContent(),
          homeScreenIcon: createRadiusIcon(),
          navigationBarIcon: createRadiusIcon(),
        },
        options,
      ),
    );
  }
}
