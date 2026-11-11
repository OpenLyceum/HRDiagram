/**
 * OverlayCheckboxGroup.ts
 *
 * Checkboxes for the guides drawn on the diagram: main sequence, luminosity classes, lines of equal
 * radius and the instability strip.
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Text } from "scenerystack/scenery";
import { VerticalCheckboxGroup } from "scenerystack/sun";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { HR_DIAGRAM_CHECKBOX_OPTIONS } from "../HRDiagramControlOptions.js";
import type { DiagramSettings } from "../model/DiagramSettings.js";

const LABEL_MAX_WIDTH = 240;

export class OverlayCheckboxGroup extends VerticalCheckboxGroup {
  public constructor(settings: DiagramSettings) {
    const strings = StringManager.getInstance().getCommonStrings().overlays;
    const item = (property: Property<boolean>, label: TReadOnlyProperty<string>) => ({
      property,
      createNode: () =>
        new Text(label, { font: FONTS.LABEL, fill: HRDiagramColors.textColorProperty, maxWidth: LABEL_MAX_WIDTH }),
      options: { ...HR_DIAGRAM_CHECKBOX_OPTIONS, accessibleName: label },
    });
    super(
      [
        item(settings.mainSequenceVisibleProperty, strings.mainSequenceStringProperty),
        item(settings.luminosityClassesVisibleProperty, strings.luminosityClassesStringProperty),
        item(settings.isoradiusVisibleProperty, strings.isoradiusStringProperty),
        item(settings.instabilityStripVisibleProperty, strings.instabilityStripStringProperty),
      ],
      { spacing: 6 },
    );
  }
}
