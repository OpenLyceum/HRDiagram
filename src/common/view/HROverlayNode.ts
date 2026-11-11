/**
 * HROverlayNode.ts
 *
 * Guides drawn on an HR diagram, each behind its own visibility Property:
 *   - the main sequence, as a band;
 *   - the luminosity classes (Ia, Ib, II, III, IV, V and the white dwarfs), as labelled bands;
 *   - lines of equal radius, from 0.001 to 1000 R☉, labelled along the line;
 *   - the classical instability strip.
 * All are defined in temperature–luminosity and redrawn whenever the chart's axes change.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { StringUtils } from "scenerystack/phetcommon";
import { Node, Path, RichText, Text } from "scenerystack/scenery";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import {
  INSTABILITY_STRIP,
  luminosityClassCurve,
  OVERLAY_CLASSES,
  type TemperatureLuminosity,
} from "../model/luminosityClasses.js";
import type { LuminosityClassName } from "../model/spectralTypes.js";
import { luminosityFromRadiusAndTemperature } from "../model/stellarPhysics.js";
import { formatValue } from "./format.js";
import type { HRChartNode } from "./HRChartNode.js";

export type HROverlayVisibility = {
  readonly mainSequenceVisibleProperty: TReadOnlyProperty<boolean>;
  readonly luminosityClassesVisibleProperty: TReadOnlyProperty<boolean>;
  readonly isoradiusVisibleProperty: TReadOnlyProperty<boolean>;
  readonly instabilityStripVisibleProperty: TReadOnlyProperty<boolean>;
};

/** Radii (R☉) of the lines of equal radius. */
export const ISORADIUS_VALUES = [0.001, 0.01, 0.1, 1, 10, 100, 1000] as const;

const BAND_WIDTH = 12;
const CLASS_BAND_WIDTH = 9;
const LABEL_MARGIN = 6;

/** Where along each class curve (0 = hottest end, 1 = coolest) its label sits. */
const LABEL_FRACTION: Record<LuminosityClassName, number> = {
  Ia: 0.72,
  Iab: 0.72,
  Ib: 0.72,
  II: 0.72,
  III: 0.8,
  IV: 0.55,
  V: 0.84,
  D: 0.35,
};

/** A point just outside the hot edge of the instability strip, about halfway up it. */
const STRIP_LABEL_ANCHOR = { temperature: 7900, luminosity: 40 };

/** Temperatures sampled along a line of equal radius (log-spaced, hot to cool). */
const ISORADIUS_TEMPERATURES = Array.from({ length: 61 }, (_, i) => 10 ** (Math.log10(50000) - (i * 1.4) / 60));

export class HROverlayNode extends Node {
  public constructor(chart: HRChartNode, visibility: HROverlayVisibility) {
    super({ pickable: false });
    const strings = StringManager.getInstance().getCommonStrings();
    const classLabels = strings.classLabels as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;

    const mainSequenceLayer = new Node();
    const classLayer = new Node();
    const isoradiusLayer = new Node();
    const stripLayer = new Node();
    this.children = [stripLayer, classLayer, mainSequenceLayer, isoradiusLayer];

    const toView = (points: readonly TemperatureLuminosity[]): Vector2[] =>
      points
        .filter((p) => chart.acceptsTemperature(p.temperature))
        .map((p) => chart.viewPositionOf(p.temperature, p.luminosity))
        .filter((v) => v.isFinite());

    const polyline = (points: Vector2[]): Shape => {
      const shape = new Shape();
      for (const [i, p] of points.entries()) {
        if (i === 0) {
          shape.moveToPoint(p);
        } else {
          shape.lineToPoint(p);
        }
      }
      return shape;
    };

    const inside = (p: Vector2, margin: number): boolean =>
      p.x > margin && p.x < chart.viewWidth - margin && p.y > margin && p.y < chart.viewHeight - margin;

    /** A label placed at a fraction along a curve, nudged to stay inside the frame. */
    const curveLabel = (points: Vector2[], fraction: number, text: Node, below: boolean): Node | null => {
      const visible = points.filter((p) => inside(p, LABEL_MARGIN));
      const anchor = visible[Math.min(visible.length - 1, Math.round(fraction * (visible.length - 1)))];
      if (!anchor) {
        return null;
      }
      text.centerX = anchor.x;
      if (below) {
        text.top = anchor.y + CLASS_BAND_WIDTH;
      } else {
        text.bottom = anchor.y - CLASS_BAND_WIDTH;
      }
      text.left = Math.max(LABEL_MARGIN, Math.min(text.left, chart.viewWidth - LABEL_MARGIN - text.width));
      text.top = Math.max(LABEL_MARGIN, Math.min(text.top, chart.viewHeight - LABEL_MARGIN - text.height));
      return text;
    };

    const disposeChildren = (layer: Node): void => {
      for (const child of layer.children) {
        child.dispose();
      }
      layer.removeAllChildren();
    };

    const classText = (name: LuminosityClassName): Text =>
      new Text(classLabels[`${name}StringProperty`] ?? "", {
        font: FONTS.CHART_LABEL,
        fill: HRDiagramColors.luminosityClassLabelColorProperty,
        maxWidth: 150,
      });

    const drawMainSequence = (): void => {
      disposeChildren(mainSequenceLayer);
      if (!visibility.mainSequenceVisibleProperty.value) {
        return;
      }
      const points = toView(luminosityClassCurve("V"));
      mainSequenceLayer.addChild(
        new Path(polyline(points), {
          stroke: HRDiagramColors.mainSequenceColorProperty,
          lineWidth: BAND_WIDTH,
          lineJoin: "round",
          lineCap: "round",
        }),
      );
      if (!visibility.luminosityClassesVisibleProperty.value) {
        const label = curveLabel(points, LABEL_FRACTION.V, classText("V"), false);
        label && mainSequenceLayer.addChild(label);
      }
    };

    const drawClasses = (): void => {
      disposeChildren(classLayer);
      if (!visibility.luminosityClassesVisibleProperty.value) {
        return;
      }
      for (const name of OVERLAY_CLASSES) {
        const points = toView(luminosityClassCurve(name));
        classLayer.addChild(
          new Path(polyline(points), {
            stroke: HRDiagramColors.luminosityClassColorProperty,
            lineWidth: CLASS_BAND_WIDTH,
            lineJoin: "round",
            lineCap: "round",
          }),
        );
        const label = curveLabel(points, LABEL_FRACTION[name], classText(name), name === "D" || name === "V");
        label && classLayer.addChild(label);
      }
    };

    const drawIsoradius = (): void => {
      disposeChildren(isoradiusLayer);
      if (!visibility.isoradiusVisibleProperty.value) {
        return;
      }
      for (const radius of ISORADIUS_VALUES) {
        const points = toView(
          ISORADIUS_TEMPERATURES.map((temperature) => ({
            temperature,
            luminosity: luminosityFromRadiusAndTemperature(radius, temperature),
          })),
        );
        isoradiusLayer.addChild(
          new Path(polyline(points), {
            stroke: HRDiagramColors.isoradiusColorProperty,
            lineWidth: 1.2,
            lineDash: [6, 4],
          }),
        );
        // Label the line near the last point that is comfortably inside the frame, rotated along it.
        const index = points.findLastIndex((p) => inside(p, 28));
        const at = points[index];
        const before = points[Math.max(0, index - 3)];
        if (at && before && index > 0) {
          const angle = Math.atan2(at.y - before.y, at.x - before.x);
          const label = new RichText(
            StringUtils.fillIn(strings.units.solarRadiusPatternStringProperty.value, {
              value: formatValue(radius, 1),
            }),
            { font: FONTS.CHART_LABEL, fill: HRDiagramColors.isoradiusColorProperty },
          );
          label.rotation = Math.abs(angle) > Math.PI / 2 ? angle + Math.PI : angle;
          label.center = at.plusXY(-8 * Math.cos(label.rotation), -8 * Math.sin(label.rotation) - 7);
          isoradiusLayer.addChild(label);
        }
      }
    };

    const drawStrip = (): void => {
      disposeChildren(stripLayer);
      if (!visibility.instabilityStripVisibleProperty.value) {
        return;
      }
      // Sample each edge in log T and log L so it bends correctly on non-logarithmic axes.
      const corners = [...INSTABILITY_STRIP, INSTABILITY_STRIP[0] as TemperatureLuminosity];
      const outline: TemperatureLuminosity[] = [];
      for (let i = 0; i < corners.length - 1; i++) {
        const a = corners[i] as TemperatureLuminosity;
        const b = corners[i + 1] as TemperatureLuminosity;
        for (let k = 0; k < 20; k++) {
          const t = k / 20;
          outline.push({
            temperature: 10 ** ((1 - t) * Math.log10(a.temperature) + t * Math.log10(b.temperature)),
            luminosity: 10 ** ((1 - t) * Math.log10(a.luminosity) + t * Math.log10(b.luminosity)),
          });
        }
      }
      const points = toView(outline);
      stripLayer.addChild(new Path(polyline(points).close(), { fill: HRDiagramColors.instabilityStripColorProperty }));
      // Label beside the hot edge of the strip, halfway up, where no class label sits.
      const anchor = chart.viewPositionOf(STRIP_LABEL_ANCHOR.temperature, STRIP_LABEL_ANCHOR.luminosity);
      const label = new Text(strings.instabilityStripStringProperty, {
        font: FONTS.CHART_LABEL,
        fill: HRDiagramColors.instabilityStripLabelColorProperty,
        maxWidth: 120,
      });
      if (anchor.isFinite()) {
        label.right = anchor.x - 4;
        label.centerY = anchor.y;
        if (label.left < LABEL_MARGIN) {
          label.left = anchor.x + 40;
        }
        stripLayer.addChild(label);
      }
    };

    const drawAll = (): void => {
      drawMainSequence();
      drawClasses();
      drawIsoradius();
      drawStrip();
    };
    chart.chartTransform.changedEmitter.addListener(drawAll);
    visibility.mainSequenceVisibleProperty.lazyLink(drawMainSequence);
    visibility.luminosityClassesVisibleProperty.lazyLink(() => {
      drawMainSequence();
      drawClasses();
    });
    visibility.isoradiusVisibleProperty.lazyLink(drawIsoradius);
    visibility.instabilityStripVisibleProperty.lazyLink(drawStrip);
    // Labels are built from string values, so redraw when the locale changes them.
    strings.units.solarRadiusPatternStringProperty.lazyLink(drawIsoradius);
    drawAll();
  }
}
