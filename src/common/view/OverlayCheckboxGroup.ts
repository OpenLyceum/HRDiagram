/**
 * OverlayCheckboxGroup.ts
 *
 * Checkboxes for the guides drawn on the diagram: main sequence, luminosity classes, lines of equal
 * radius and the instability strip. One column in a side panel, or two in the strip under a chart.
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import { GridBox, Text } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { HR_DIAGRAM_CHECKBOX_OPTIONS } from "../HRDiagramControlOptions.js";
import type { DiagramSettings } from "../model/DiagramSettings.js";

const LABEL_MAX_WIDTH = 240;

export class OverlayCheckboxGroup extends GridBox {
  public readonly checkboxes: readonly Checkbox[];

  public constructor(settings: DiagramSettings, columns: 1 | 2 = 1) {
    const strings = StringManager.getInstance().getCommonStrings().overlays;
    const checkbox = (property: Property<boolean>, label: TReadOnlyProperty<string>): Checkbox =>
      new Checkbox(
        property,
        new Text(label, {
          font: FONTS.LABEL,
          fill: HRDiagramColors.textColorProperty,
          maxWidth: LABEL_MAX_WIDTH / columns + 40 * (columns - 1),
        }),
        { ...HR_DIAGRAM_CHECKBOX_OPTIONS, accessibleName: label },
      );
    const checkboxes = [
      checkbox(settings.mainSequenceVisibleProperty, strings.mainSequenceStringProperty),
      checkbox(settings.luminosityClassesVisibleProperty, strings.luminosityClassesStringProperty),
      checkbox(settings.isoradiusVisibleProperty, strings.isoradiusStringProperty),
      checkbox(settings.instabilityStripVisibleProperty, strings.instabilityStripStringProperty),
    ];
    super({
      autoColumns: columns,
      xSpacing: 16,
      ySpacing: 6,
      xAlign: "left",
      children:
        columns === 2
          ? [checkboxes[0], checkboxes[2], checkboxes[1], checkboxes[3]].filter((c) => c !== undefined)
          : checkboxes,
    });
    this.checkboxes = checkboxes;
  }
}
