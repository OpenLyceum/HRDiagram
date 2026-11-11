/**
 * AxisControlsNode.ts
 *
 * Two combo boxes choosing what the horizontal and vertical axes show.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { HBox, type Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ComboBox } from "scenerystack/sun";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { HR_DIAGRAM_COMBO_BOX_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../HRDiagramButtonOptions.js";
import type { AxisQuantity } from "../model/AxisQuantity.js";
import type { DiagramSettings } from "../model/DiagramSettings.js";
import { axisTitleProperty } from "./HRChartNode.js";

const ITEM_MAX_WIDTH = 190;
const LABEL_MAX_WIDTH = 90;

export class AxisControlsNode extends VBox {
  public constructor(settings: DiagramSettings, listParent: Node) {
    const strings = StringManager.getInstance().getCommonStrings();

    const row = (
      label: TReadOnlyProperty<string>,
      property: DiagramSettings["xQuantityProperty"],
      quantities: readonly AxisQuantity[],
    ): HBox => {
      const comboBox = new ComboBox(
        property,
        quantities.map((quantity) => ({
          value: quantity,
          createNode: () =>
            new RichText(axisTitleProperty(quantity), {
              font: FONTS.LABEL,
              fill: LIGHT_SURFACE_TEXT_FILL,
              maxWidth: ITEM_MAX_WIDTH,
            }),
          accessibleName: axisTitleProperty(quantity),
        })),
        listParent,
        { ...HR_DIAGRAM_COMBO_BOX_OPTIONS, accessibleName: label },
      );
      return new HBox({
        spacing: 8,
        children: [
          new Text(label, { font: FONTS.LABEL, fill: HRDiagramColors.textColorProperty, maxWidth: LABEL_MAX_WIDTH }),
          comboBox,
        ],
      });
    };

    super({
      align: "right",
      spacing: 6,
      children: [
        row(strings.axes.horizontalStringProperty, settings.xQuantityProperty, settings.horizontalQuantities),
        row(strings.axes.verticalStringProperty, settings.yQuantityProperty, settings.verticalQuantities),
      ],
    });
  }
}
