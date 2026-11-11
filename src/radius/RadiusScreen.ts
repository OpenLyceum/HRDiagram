/**
 * RadiusScreen.ts
 *
 * The Radius screen: two stars on a temperature–luminosity diagram, and how temperature and luminosity
 * set a star's radius.
 * Wires the model and view factories, the keyboard-help dialog and the screen icons
 * (createRadiusIcon() in src/common/HRDiagramScreenIcons.ts). Registered in src/main.ts.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createRadiusIcon } from "../common/HRDiagramScreenIcons.js";
import { HRDiagramKeyboardHelpContent } from "../common/view/HRDiagramKeyboardHelpContent.js";
import HRDiagramColors from "../HRDiagramColors.js";
import type { HRDiagramPreferencesModel } from "../preferences/HRDiagramPreferencesModel.js";
import { RadiusModel } from "./model/RadiusModel.js";
import { RadiusScreenView } from "./view/RadiusScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type RadiusScreenOptions = ScreenOptions & { tandem: Tandem };

export class RadiusScreen extends Screen<RadiusModel, RadiusScreenView> {
  public constructor(preferences: HRDiagramPreferencesModel, options: RadiusScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new RadiusModel(),
      // View factory — receives the model instance
      (model) =>
        new RadiusScreenView(model, preferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<RadiusScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: HRDiagramColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new HRDiagramKeyboardHelpContent(),
          homeScreenIcon: createRadiusIcon(),
          navigationBarIcon: createRadiusIcon(),
        },
        options,
      ),
    );
  }
}
