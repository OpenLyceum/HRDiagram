import { STAR_PLOT_NODE_SETTINGS } from "../../HRDiagramConstants.js";
/**
 * StarPlotNode.ts
 *
 * The real stars of the Star Samples screen on an HR diagram: dots coloured by list (nearest red,
 * brightest cyan, both purple), a ring on the selected star, and the name of the star under the pointer.
 * Click a star to select it. The node is focusable: left and right arrows step the selection through the
 * visible stars by temperature.
 */

import { Multilink, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { StringUtils } from "scenerystack/phetcommon";
import { Circle, DragListener, KeyboardListener, Node, Rectangle, Text } from "scenerystack/scenery";
import type { Star } from "../../common/model/StarCatalog.js";
import { formatValue } from "../../common/view/format.js";
import type { HRChartNode } from "../../common/view/HRChartNode.js";
import { PointCloudNode, type PointStyle } from "../../common/view/PointCloudNode.js";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS, PICK_DISTANCE, STAR_SAMPLE_MARKERS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";

/** Point groups, painted in this order. */
const NEAREST_GROUP = 0;
const BRIGHTEST_GROUP = 1;
const BOTH_GROUP: number = STAR_PLOT_NODE_SETTINGS.BOTH_GROUP;

/** Nearest stars are circles, brightest diamonds, both squares: shape repeats what colour says. */
export const SAMPLE_STYLES: PointStyle[] = [
  {
    css: () => HRDiagramColors.nearestStarColorProperty.value.toCSS(),
    radius: STAR_SAMPLE_MARKERS.DOT_RADIUS,
    alpha: STAR_SAMPLE_MARKERS.ALPHA,
    stroke: () => "rgba(0,0,0,0.6)",
    shape: "circle",
  },
  {
    css: () => HRDiagramColors.brightestStarColorProperty.value.toCSS(),
    radius: STAR_SAMPLE_MARKERS.DOT_RADIUS,
    alpha: STAR_SAMPLE_MARKERS.ALPHA,
    stroke: () => "rgba(0,0,0,0.6)",
    shape: "diamond",
  },
  {
    css: () => HRDiagramColors.bothStarColorProperty.value.toCSS(),
    radius: STAR_SAMPLE_MARKERS.DOT_RADIUS + STAR_SAMPLE_MARKERS.BOTH_RADIUS_EXTRA,
    alpha: STAR_SAMPLE_MARKERS.BOTH_ALPHA,
    stroke: () => "rgba(0,0,0,0.6)",
    shape: "square",
  },
];

const groupOf = (star: Star): number =>
  star.nearest && star.brightest ? BOTH_GROUP : star.nearest ? NEAREST_GROUP : BRIGHTEST_GROUP;

export class StarPlotNode extends Node {
  public constructor(
    chart: HRChartNode,
    visibleStarsProperty: TReadOnlyProperty<readonly Star[]>,
    selectedStarProperty: Property<Star | null>,
    stepSelection: (direction: 1 | -1) => void,
  ) {
    const strings = StringManager.getInstance().getStarSamplesA11yStrings().controls;
    super({
      tagName: "div",
      focusable: true,
      accessibleName: strings.starsStringProperty,
      accessibleHelpText: strings.starsHelpStringProperty,
    });

    const cloud = new PointCloudNode(chart.chartTransform);
    const ring = new Circle(STAR_SAMPLE_MARKERS.RING_RADIUS, {
      stroke: HRDiagramColors.selectionColorProperty,
      lineWidth: STAR_SAMPLE_MARKERS.RING_LINE_WIDTH,
      visible: false,
      pickable: false,
    });
    const hoverLabel = new Text("", {
      font: FONTS.CHART_LABEL,
      fill: HRDiagramColors.selectionColorProperty,
      visible: false,
      pickable: false,
      maxWidth: STAR_SAMPLE_MARKERS.LABEL_MAX_WIDTH,
    });
    const selectedLabel = new Text("", {
      font: FONTS.LABEL,
      fill: HRDiagramColors.selectionColorProperty,
      visible: false,
      pickable: false,
      maxWidth: STAR_SAMPLE_MARKERS.LABEL_MAX_WIDTH,
    });
    const hitArea = new Rectangle(0, 0, chart.viewWidth, chart.viewHeight, { cursor: "crosshair" });
    this.children = [hitArea, cloud, ring, selectedLabel, hoverLabel];

    let drawn: readonly Star[] = [];

    const labelBeside = (label: Text, x: number, y: number): void => {
      label.left = x + STAR_SAMPLE_MARKERS.RING_RADIUS + STAR_SAMPLE_MARKERS.LABEL_X_GAP;
      label.bottom = y - STAR_SAMPLE_MARKERS.LABEL_Y_GAP;
      if (label.right > chart.viewWidth - STAR_SAMPLE_MARKERS.LABEL_EDGE_INSET) {
        label.right = x - STAR_SAMPLE_MARKERS.RING_RADIUS - STAR_SAMPLE_MARKERS.LABEL_X_GAP;
      }
      if (label.top < STAR_SAMPLE_MARKERS.LABEL_Y_GAP) {
        label.top = y + STAR_SAMPLE_MARKERS.LABEL_FLIP_TOP;
      }
    };

    const redraw = (): void => {
      const stars = visibleStarsProperty.value;
      const selected = selectedStarProperty.value;
      // The selected star is always drawn, even when its list or kind is hidden.
      drawn = selected !== null && !stars.includes(selected) ? [...stars, selected] : stars;
      const x = chart.xQuantity;
      const y = chart.yQuantity;
      const xs = new Float64Array(drawn.length);
      const ys = new Float64Array(drawn.length);
      const groups = new Uint8Array(drawn.length);
      drawn.forEach((star, i) => {
        xs[i] = x.chartValueOfStar(star);
        ys[i] = y.chartValueOfStar(star);
        groups[i] = groupOf(star);
      });
      cloud.setPoints({ xs, ys, groups }, SAMPLE_STYLES);
      if (selected === null) {
        ring.visible = false;
        selectedLabel.visible = false;
      } else {
        const position = chart.viewPositionOfStar(selected);
        ring.visible = position.isFinite();
        ring.center = position;
        selectedLabel.string = selected.name;
        selectedLabel.visible = ring.visible;
        labelBeside(selectedLabel, position.x, position.y);
      }
    };
    Multilink.multilink([visibleStarsProperty, selectedStarProperty], redraw);
    chart.chartTransform.changedEmitter.addListener(redraw);
    HRDiagramColors.nearestStarColorProperty.lazyLink(() => cloud.repaint());
    HRDiagramColors.brightestStarColorProperty.lazyLink(() => cloud.repaint());
    HRDiagramColors.bothStarColorProperty.lazyLink(() => cloud.repaint());

    const starAt = (viewX: number, viewY: number): Star | null => {
      const index = cloud.nearest(viewX, viewY, PICK_DISTANCE);
      return index === null ? null : (drawn[index] ?? null);
    };

    hitArea.addInputListener({
      move: (event) => {
        const point = this.globalToLocalPoint(event.pointer.point);
        const star = starAt(point.x, point.y);
        hoverLabel.visible = star !== null && star !== selectedStarProperty.value;
        if (star) {
          const position = chart.viewPositionOfStar(star);
          hoverLabel.string = star.name;
          labelBeside(hoverLabel, position.x, position.y);
        }
        hitArea.cursor = star ? "pointer" : "crosshair";
      },
      exit: () => {
        hoverLabel.visible = false;
      },
    });
    hitArea.addInputListener(
      new DragListener({
        press: (event) => {
          const point = this.globalToLocalPoint(event.pointer.point);
          selectedStarProperty.value = starAt(point.x, point.y);
          hoverLabel.visible = false;
        },
      }),
    );
    this.addInputListener(
      new KeyboardListener({
        keys: ["arrowLeft", "arrowRight", "escape"],
        fire: (_event, keysPressed) => {
          if (keysPressed === "escape") {
            selectedStarProperty.value = null;
          } else {
            // Left is hotter on every axis choice, so left steps to the next hotter star.
            stepSelection(keysPressed === "arrowLeft" ? -1 : 1);
          }
        },
      }),
    );

    // Screen-reader readout of the selected star.
    const describe = (): void => {
      const star = selectedStarProperty.value;
      this.accessibleParagraph =
        star === null
          ? null
          : StringUtils.fillIn(strings.selectedPatternStringProperty.value, {
              name: star.name,
              temperature: formatValue(star.temperature, STAR_PLOT_NODE_SETTINGS.TEMPERATURE_FORMAT_VALUE_DIGITS),
              luminosity: formatValue(star.luminosity, STAR_PLOT_NODE_SETTINGS.LUMINOSITY_FORMAT_VALUE_DIGITS),
              radius: formatValue(star.radius, STAR_PLOT_NODE_SETTINGS.DESCRIBE_RADIUS_DIGITS),
            });
    };
    selectedStarProperty.link(describe);
    strings.selectedPatternStringProperty.lazyLink(describe);
    this.focusHighlight = Shape.bounds(hitArea.bounds);
  }
}
