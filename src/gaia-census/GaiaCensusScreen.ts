/**
 * GaiaCensusScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createGaiaCensusIcon() in src/common/HRDiagramScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createGaiaCensusIcon } from "../common/HRDiagramScreenIcons.js";
import { HRDiagramKeyboardHelpContent } from "../common/view/HRDiagramKeyboardHelpContent.js";
import HRDiagramColors from "../HRDiagramColors.js";
import { GaiaCensusModel } from "./model/GaiaCensusModel.js";
import { GaiaCensusScreenView } from "./view/GaiaCensusScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type GaiaCensusScreenOptions = ScreenOptions & { tandem: Tandem };

export class GaiaCensusScreen extends Screen<GaiaCensusModel, GaiaCensusScreenView> {
  public constructor(options: GaiaCensusScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new GaiaCensusModel(),
      // View factory — receives the model instance
      (model) =>
        new GaiaCensusScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<GaiaCensusScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: HRDiagramColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new HRDiagramKeyboardHelpContent(),
          homeScreenIcon: createGaiaCensusIcon(),
          navigationBarIcon: createGaiaCensusIcon(),
        },
        options,
      ),
    );
  }
}
