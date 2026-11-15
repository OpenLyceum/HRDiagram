/**
 * HRDiagramPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to HRDiagramPreferencesModel Properties (whose initial values come from
 * hRDiagramQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import HRDiagramColors from "../HRDiagramColors.js";
import { FONTS, PREFERENCES_LAYOUT } from "../HRDiagramConstants.js";
import HRDiagramNamespace from "../HRDiagramNamespace.js";
import { StringManager } from "../i18n/StringManager.js";
import type { HRDiagramPreferencesModel } from "./HRDiagramPreferencesModel.js";

export class HRDiagramPreferencesNode extends VBox {
  public constructor(preferencesModel: HRDiagramPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: FONTS.PREFERENCES_TITLE,
      fill: HRDiagramColors.controlSurfaceTextColorProperty,
    });

    const showEquationsCheckbox = new Checkbox(
      preferencesModel.showEquationsProperty,
      new Text(prefStrings.showEquationsStringProperty, {
        font: FONTS.PREFERENCES_LABEL,
        fill: HRDiagramColors.controlSurfaceTextColorProperty,
      }),
      {
        checkboxColor: HRDiagramColors.controlSurfaceTextColorProperty,
        checkboxColorBackground: HRDiagramColors.controlSurfaceColorProperty,
        spacing: PREFERENCES_LAYOUT.CHECKBOX_SPACING,
        ...(tandem && { tandem: tandem.createTandem("showEquationsCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: PREFERENCES_LAYOUT.SECTION_SPACING,
      children: [header, showEquationsCheckbox],
    });
  }
}

HRDiagramNamespace.register("HRDiagramPreferencesNode", HRDiagramPreferencesNode);
