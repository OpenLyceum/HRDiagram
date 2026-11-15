/**
 * SunMarkerNode.ts
 *
 * The astronomical symbol for the Sun (a circle with a central dot) with its name, placed on an HR
 * diagram at T = 5772 K, L = 1 L☉ and kept there when the axes change.
 */

import { Circle, Node, Text } from "scenerystack/scenery";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS, MODEL_DEFAULTS, SUN_MARKER } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { SUN_TEMPERATURE } from "../model/stellarPhysics.js";
import type { HRChartNode } from "./HRChartNode.js";

export class SunMarkerNode extends Node {
  public constructor(chart: HRChartNode) {
    super({ pickable: false });
    const symbol = new Node({
      children: [
        new Circle(SUN_MARKER.SYMBOL_RADIUS, {
          stroke: HRDiagramColors.sunColorProperty,
          lineWidth: SUN_MARKER.LINE_WIDTH,
        }),
        new Circle(SUN_MARKER.DOT_RADIUS, { fill: HRDiagramColors.sunColorProperty }),
      ],
    });
    const label = new Text(StringManager.getInstance().getCommonStrings().sunStringProperty, {
      font: FONTS.CHART_LABEL,
      fill: HRDiagramColors.sunColorProperty,
      maxWidth: SUN_MARKER.LABEL_MAX_WIDTH,
    });
    label.boundsProperty.link(() => {
      label.left = SUN_MARKER.SYMBOL_RADIUS + SUN_MARKER.LABEL_X_GAP;
      label.top = SUN_MARKER.SYMBOL_RADIUS - SUN_MARKER.LABEL_Y_OFFSET;
    });
    this.children = [symbol, label];
    const place = (): void => {
      this.translation = chart.viewPositionOf(SUN_TEMPERATURE, MODEL_DEFAULTS.INITIAL_LUMINOSITY);
    };
    chart.chartTransform.changedEmitter.addListener(place);
    place();
  }
}
