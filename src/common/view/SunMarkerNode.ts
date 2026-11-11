/**
 * SunMarkerNode.ts
 *
 * The astronomical symbol for the Sun (a circle with a central dot) with its name, placed on an HR
 * diagram at T = 5772 K, L = 1 L☉ and kept there when the axes change.
 */

import { Circle, Node, Text } from "scenerystack/scenery";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { SUN_TEMPERATURE } from "../model/stellarPhysics.js";
import type { HRChartNode } from "./HRChartNode.js";

const SYMBOL_RADIUS = 6;

export class SunMarkerNode extends Node {
  public constructor(chart: HRChartNode) {
    super({ pickable: false });
    const symbol = new Node({
      children: [
        new Circle(SYMBOL_RADIUS, { stroke: HRDiagramColors.sunColorProperty, lineWidth: 1.6 }),
        new Circle(1.6, { fill: HRDiagramColors.sunColorProperty }),
      ],
    });
    const label = new Text(StringManager.getInstance().getCommonStrings().sunStringProperty, {
      font: FONTS.CHART_LABEL,
      fill: HRDiagramColors.sunColorProperty,
      maxWidth: 60,
    });
    label.boundsProperty.link(() => {
      label.left = SYMBOL_RADIUS + 3;
      label.top = SYMBOL_RADIUS - 2;
    });
    this.children = [symbol, label];
    const place = (): void => {
      this.translation = chart.viewPositionOf(SUN_TEMPERATURE, 1);
    };
    chart.chartTransform.changedEmitter.addListener(place);
    place();
  }
}
