/**
 * HRChartNode.ts
 *
 * The frame of an HR diagram: background, gridlines, ticks, tick labels and axis titles, plus a clipped
 * plot layer and an unclipped overlay layer for content. The axes follow two Properties holding the
 * horizontal and vertical AxisQuantity, so the same chart can show temperature or colour or spectral
 * type against luminosity or absolute magnitude.
 *
 * Chart (model) coordinates are the axis values, or log₁₀ of them on a log axis (see AxisQuantity).
 * Content listens to `chartTransform.changedEmitter`, which fires whenever an axis changes.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { ChartTransform } from "scenerystack/bamboo";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Node, type NodeOptions, Path, Rectangle, RichText, Text } from "scenerystack/scenery";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { AxisQuantity, PlottableStar } from "../model/AxisQuantity.js";
import { ticksFor } from "./axisTicks.js";

const TICK_LENGTH = 5;
const MINOR_TICK_LENGTH = 3;
const LABEL_GAP = 3;
const TITLE_GAP = 6;

/** Localized axis title of a quantity. */
export const axisTitleProperty = (quantity: AxisQuantity): TReadOnlyProperty<string> => {
  const axes = StringManager.getInstance().getCommonStrings().axes as unknown as Readonly<
    Record<string, TReadOnlyProperty<string>>
  >;
  const title = axes[`${quantity.key}StringProperty`];
  if (!title) {
    throw new Error(`No axis title for ${quantity.key}`);
  }
  return title;
};

export class HRChartNode extends Node {
  public readonly chartTransform: ChartTransform;

  /** Curves and points; clipped to the plotting rectangle. */
  public readonly plotLayer: Node;

  /** Markers and labels that may overhang the frame; not clipped. */
  public readonly overlayLayer: Node;

  public readonly viewWidth: number;
  public readonly viewHeight: number;

  private readonly xQuantityProperty: TReadOnlyProperty<AxisQuantity>;
  private readonly yQuantityProperty: TReadOnlyProperty<AxisQuantity>;

  public constructor(
    xQuantityProperty: TReadOnlyProperty<AxisQuantity>,
    yQuantityProperty: TReadOnlyProperty<AxisQuantity>,
    viewWidth: number,
    viewHeight: number,
    options?: NodeOptions,
  ) {
    super(options);
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.xQuantityProperty = xQuantityProperty;
    this.yQuantityProperty = yQuantityProperty;
    this.chartTransform = new ChartTransform({ viewWidth, viewHeight });

    const background = new Rectangle(0, 0, viewWidth, viewHeight, {
      fill: HRDiagramColors.chartBackgroundColorProperty,
    });
    const frame = new Rectangle(0, 0, viewWidth, viewHeight, { stroke: HRDiagramColors.axisColorProperty });
    const grid = new Path(null, { stroke: HRDiagramColors.gridColorProperty, lineWidth: 1 });
    const tickMarks = new Path(null, { stroke: HRDiagramColors.axisColorProperty, lineWidth: 1 });
    const xLabels = new Node();
    const yLabels = new Node();
    const xTitle = new RichText("", { font: FONTS.AXIS_TITLE, fill: HRDiagramColors.textColorProperty });
    const yTitle = new RichText("", {
      font: FONTS.AXIS_TITLE,
      fill: HRDiagramColors.textColorProperty,
      rotation: -Math.PI / 2,
    });
    this.plotLayer = new Node({ clipArea: Shape.rect(0, 0, viewWidth, viewHeight) });
    this.overlayLayer = new Node();

    const placeTitles = (): void => {
      xTitle.maxWidth = viewWidth;
      yTitle.maxWidth = viewHeight;
      xTitle.centerX = viewWidth / 2;
      xTitle.top = (xLabels.bounds.isFinite() ? xLabels.bottom : viewHeight + TICK_LENGTH) + TITLE_GAP;
      yTitle.centerY = viewHeight / 2;
      yTitle.right = (yLabels.bounds.isFinite() ? yLabels.left : -TICK_LENGTH) - TITLE_GAP;
    };
    xTitle.localBoundsProperty.lazyLink(placeTitles);
    yTitle.localBoundsProperty.lazyLink(placeTitles);

    Multilink.multilink([xQuantityProperty, yQuantityProperty], (xQuantity, yQuantity) => {
      const transform = this.chartTransform;
      transform.modelXRangeInverted = xQuantity.inverted;
      transform.modelYRangeInverted = yQuantity.inverted;
      transform.setModelXRange(xQuantity.chartRange);
      transform.setModelYRange(yQuantity.chartRange);
      transform.changedEmitter.emit();

      const gridShape = new Shape();
      const tickShape = new Shape();
      const xLabelNodes = this.drawTicks(xQuantity, true, gridShape, tickShape);
      const yLabelNodes = this.drawTicks(yQuantity, false, gridShape, tickShape);
      grid.shape = gridShape;
      tickMarks.shape = tickShape;
      for (const label of [...xLabels.children, ...yLabels.children]) {
        label.dispose();
      }
      xLabels.children = xLabelNodes;
      yLabels.children = yLabelNodes;
      xTitle.stringProperty = axisTitleProperty(xQuantity);
      yTitle.stringProperty = axisTitleProperty(yQuantity);
      placeTitles();
    });

    this.children = [
      background,
      grid,
      this.plotLayer,
      frame,
      tickMarks,
      xLabels,
      yLabels,
      xTitle,
      yTitle,
      this.overlayLayer,
    ];
  }

  /**
   * Adds an axis's gridlines and tick marks to the given shapes and returns its tick labels.
   * `horizontal` is true for the x axis (ticks along the bottom edge), false for the y axis (left edge).
   */
  private drawTicks(quantity: AxisQuantity, horizontal: boolean, gridShape: Shape, tickShape: Shape): Node[] {
    const transform = this.chartTransform;
    const labels: Node[] = [];
    const extent = horizontal ? this.viewWidth : this.viewHeight;
    for (const tick of ticksFor(quantity)) {
      const chartValue = quantity.toChart(tick.value);
      const at = horizontal ? transform.modelToViewX(chartValue) : transform.modelToViewY(chartValue);
      if (!(at >= -0.5 && at <= extent + 0.5)) {
        continue;
      }
      const length = tick.major ? TICK_LENGTH : MINOR_TICK_LENGTH;
      if (horizontal) {
        if (tick.major) {
          gridShape.moveTo(at, 0).lineTo(at, this.viewHeight);
        }
        tickShape.moveTo(at, this.viewHeight).lineTo(at, this.viewHeight + length);
      } else {
        if (tick.major) {
          gridShape.moveTo(0, at).lineTo(this.viewWidth, at);
        }
        tickShape.moveTo(0, at).lineTo(-length, at);
      }
      if (tick.label !== null) {
        const text = new Text(tick.label, { font: FONTS.TICK, fill: HRDiagramColors.axisColorProperty });
        if (horizontal) {
          text.centerX = at;
          text.top = this.viewHeight + TICK_LENGTH + LABEL_GAP;
        } else {
          text.right = -TICK_LENGTH - LABEL_GAP;
          text.centerY = at;
        }
        labels.push(text);
      }
    }
    return labels;
  }

  /** View position of a temperature–luminosity pair on the current axes (may lie outside the frame). */
  public viewPositionOf(temperature: number, luminosity: number): Vector2 {
    const x = this.xQuantityProperty.value.chartValueOf(temperature, luminosity);
    const y = this.yQuantityProperty.value.chartValueOf(temperature, luminosity);
    return new Vector2(this.chartTransform.modelToViewX(x), this.chartTransform.modelToViewY(y));
  }

  /** Whether both current axes can place a star of temperature T (K). */
  public acceptsTemperature(temperature: number): boolean {
    return (
      this.xQuantityProperty.value.acceptsTemperature(temperature) &&
      this.yQuantityProperty.value.acceptsTemperature(temperature)
    );
  }

  /** View position of a real star on the current axes. */
  public viewPositionOfStar(star: PlottableStar): Vector2 {
    const x = this.xQuantityProperty.value.chartValueOfStar(star);
    const y = this.yQuantityProperty.value.chartValueOfStar(star);
    return new Vector2(this.chartTransform.modelToViewX(x), this.chartTransform.modelToViewY(y));
  }

  /** Temperature (K) and luminosity (L☉) at a view position, reading the axes as a main-sequence star would. */
  public temperatureLuminosityAt(viewPoint: Vector2): { temperature: number; luminosity: number } {
    const temperature = this.xQuantityProperty.value.temperatureAt(this.chartTransform.viewToModelX(viewPoint.x));
    const luminosity = this.yQuantityProperty.value.luminosityAt(
      this.chartTransform.viewToModelY(viewPoint.y),
      temperature,
    );
    return { temperature, luminosity };
  }
}
