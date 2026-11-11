/**
 * HRDiagramPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to HRDiagramPreferencesModel Properties (whose initial values come from
 * hRDiagramQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import HRDiagramColors from "../HRDiagramColors.js";
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
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: HRDiagramColors.controlSurfaceTextColorProperty,
    });

    const exampleToggleCheckbox = new Checkbox(
      preferencesModel.exampleToggleProperty,
      new Text(prefStrings.exampleToggleStringProperty, {
        font: new PhetFont(14),
        fill: HRDiagramColors.controlSurfaceTextColorProperty,
      }),
      {
        checkboxColor: HRDiagramColors.controlSurfaceTextColorProperty,
        checkboxColorBackground: HRDiagramColors.controlSurfaceColorProperty,
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("exampleToggleCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: 12,
      children: [header, exampleToggleCheckbox],
    });
  }
}

HRDiagramNamespace.register("HRDiagramPreferencesNode", HRDiagramPreferencesNode);
