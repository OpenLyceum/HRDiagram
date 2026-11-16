import { CURSOR_STAR_NODE_SETTINGS } from "../../HRDiagramConstants.js";
/**
 * CursorStarNode.ts
 *
 * A star the user moves on the HR diagram: a disc in the star's blackbody colour inside a cross-hair
 * ring. Drag it with the pointer, or focus it and use the arrow keys (Shift for fine steps). Moves are
 * made in view space and converted back to temperature and luminosity, so the arrows move the marker
 * the way they point on any choice of axes.
 *
 * A `constrain` function can restrict where it may go (the Radius screen holds L or T fixed).
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, DragListener, KeyboardListener, Node, type NodeOptions, Path, Text } from "scenerystack/scenery";
import HRDiagramColors from "../../HRDiagramColors.js";
import { CURSOR_STAR, FONTS } from "../../HRDiagramConstants.js";
import { blackbodyColor } from "./blackbodyColor.js";
import type { HRChartNode } from "./HRChartNode.js";

export type CursorStarNodeOptions = NodeOptions & {
  /** A letter or short label drawn beside the marker (e.g. "A", "B"). */
  label?: TReadOnlyProperty<string> | string | null;
  /** Restricts a requested (T, L) before it is applied. */
  constrain?: (temperature: number, luminosity: number) => { temperature: number; luminosity: number };
};

export class CursorStarNode extends Node {
  /** Moves the star to the point under a view position of the chart (used for click-to-place). */
  public readonly moveToViewPoint: (viewPoint: Vector2) => void;

  public constructor(
    chart: HRChartNode,
    temperatureProperty: TReadOnlyProperty<number>,
    luminosityProperty: TReadOnlyProperty<number>,
    setTemperatureLuminosity: (temperature: number, luminosity: number) => void,
    providedOptions?: CursorStarNodeOptions,
  ) {
    const { label, constrain, ...nodeOptions } = providedOptions ?? {};
    super({
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      ...nodeOptions,
    });

    const ring = new Path(
      new Shape()
        .circle(0, 0, CURSOR_STAR.RING_RADIUS)
        .moveTo(-CURSOR_STAR.RING_RADIUS - CURSOR_STAR.CROSS_LENGTH, 0)
        .lineTo(-CURSOR_STAR.RING_RADIUS + CURSOR_STAR.CROSS_INSET, 0)
        .moveTo(CURSOR_STAR.RING_RADIUS - CURSOR_STAR.CROSS_INSET, 0)
        .lineTo(CURSOR_STAR.RING_RADIUS + CURSOR_STAR.CROSS_LENGTH, 0)
        .moveTo(0, -CURSOR_STAR.RING_RADIUS - CURSOR_STAR.CROSS_LENGTH)
        .lineTo(0, -CURSOR_STAR.RING_RADIUS + CURSOR_STAR.CROSS_INSET)
        .moveTo(0, CURSOR_STAR.RING_RADIUS - CURSOR_STAR.CROSS_INSET)
        .lineTo(0, CURSOR_STAR.RING_RADIUS + CURSOR_STAR.CROSS_LENGTH),
      { stroke: HRDiagramColors.cursorColorProperty, lineWidth: CURSOR_STAR.RING_LINE_WIDTH },
    );
    const disc = new Circle(CURSOR_STAR.DISC_RADIUS, {
      stroke: "black",
      lineWidth: CURSOR_STAR.DISC_LINE_WIDTH,
    });
    const children: Node[] = [ring, disc];
    if (label !== undefined && label !== null) {
      const text = new Text(label, {
        font: FONTS.TITLE,
        fill: HRDiagramColors.cursorColorProperty,
        left: CURSOR_STAR.RING_RADIUS + 2,
        bottom: -CURSOR_STAR.RING_RADIUS + CURSOR_STAR_NODE_SETTINGS.TEXT_BOTTOM_OFFSET,
        maxWidth: CURSOR_STAR.LABEL_MAX_WIDTH,
      });
      children.push(text);
    }
    this.children = children;
    this.mouseArea = Shape.circle(0, 0, CURSOR_STAR.RING_RADIUS + CURSOR_STAR.CROSS_LENGTH);
    this.touchArea = Shape.circle(0, 0, CURSOR_STAR.RING_RADIUS + CURSOR_STAR.CROSS_LENGTH + CURSOR_STAR.TOUCH_PADDING);

    const apply = (temperature: number, luminosity: number): void => {
      const target = constrain ? constrain(temperature, luminosity) : { temperature, luminosity };
      setTemperatureLuminosity(target.temperature, target.luminosity);
    };

    this.moveToViewPoint = (viewPoint: Vector2): void => {
      const clamped = new Vector2(
        Math.min(Math.max(viewPoint.x, 0), chart.viewWidth),
        Math.min(Math.max(viewPoint.y, 0), chart.viewHeight),
      );
      const { temperature, luminosity } = chart.temperatureLuminosityAt(clamped);
      apply(temperature, luminosity);
    };

    this.addInputListener(
      new DragListener({
        drag: (event) => this.moveToViewPoint(chart.plotLayer.globalToLocalPoint(event.pointer.point)),
      }),
    );

    const stepBy = (dx: number, dy: number): void => {
      this.moveToViewPoint(chart.viewPositionOf(temperatureProperty.value, luminosityProperty.value).plusXY(dx, dy));
    };
    this.addInputListener(
      new KeyboardListener({
        keys: [
          "arrowLeft",
          "arrowRight",
          "arrowUp",
          "arrowDown",
          "shift+arrowLeft",
          "shift+arrowRight",
          "shift+arrowUp",
          "shift+arrowDown",
        ],
        fire: (_event, keysPressed) => {
          const step = keysPressed.startsWith("shift") ? CURSOR_STAR.FINE_KEY_STEP : CURSOR_STAR.KEY_STEP;
          const key = keysPressed.replace("shift+", "");
          if (key === "arrowLeft") {
            stepBy(-step, 0);
          } else if (key === "arrowRight") {
            stepBy(step, 0);
          } else if (key === "arrowUp") {
            stepBy(0, -step);
          } else {
            stepBy(0, step);
          }
        },
      }),
    );

    const place = (): void => {
      this.translation = chart.viewPositionOf(temperatureProperty.value, luminosityProperty.value);
      disc.fill = blackbodyColor(temperatureProperty.value);
    };
    Multilink.multilink([temperatureProperty, luminosityProperty], place);
    chart.chartTransform.changedEmitter.addListener(place);
  }
}
