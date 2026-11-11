/**
 * SizeComparisonNode.ts
 *
 * A star and the Sun side by side, drawn to the same scale and in their blackbody colours. The larger of
 * the two always fills the frame, so the smaller can shrink to a dot: a red supergiant makes the Sun
 * invisible, and a white dwarf is a speck beside it. That is the point.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Circle, Node, type NodeOptions, RadialGradient, Text, VBox } from "scenerystack/scenery";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { SUN_TEMPERATURE } from "../model/stellarPhysics.js";
import { blackbodyColor } from "./blackbodyColor.js";

/** Radius (px) of the larger disc. */
const MAX_DISC_RADIUS = 46;

/** Discs smaller than this (px) are drawn as a visible dot and flagged as too small to see. */
const MIN_VISIBLE_RADIUS = 1.5;
const DOT_RADIUS = 1.5;

const DISC_SPACING = 2 * MAX_DISC_RADIUS + 36;

export type SizeComparisonNodeOptions = NodeOptions & {
  /** Label under the star's disc. */
  starLabelProperty?: TReadOnlyProperty<string>;
};

export class SizeComparisonNode extends Node {
  public constructor(
    temperatureProperty: TReadOnlyProperty<number>,
    radiusProperty: TReadOnlyProperty<number>,
    providedOptions?: SizeComparisonNodeOptions,
  ) {
    super();
    const { starLabelProperty, ...nodeOptions } = providedOptions ?? {};
    const strings = StringManager.getInstance().getCommonStrings();

    const sunDisc = new Circle(1, { centerX: MAX_DISC_RADIUS, centerY: MAX_DISC_RADIUS });
    const starDisc = new Circle(1, { centerX: MAX_DISC_RADIUS + DISC_SPACING, centerY: MAX_DISC_RADIUS });
    sunDisc.fill = gradientFor(SUN_TEMPERATURE);

    const caption = (label: TReadOnlyProperty<string>, centerX: number): VBox => {
      const tooSmall = new Text(strings.size.tooSmallStringProperty, {
        font: FONTS.SMALL,
        fill: HRDiagramColors.textColorProperty,
        maxWidth: DISC_SPACING - 6,
        visible: false,
      });
      const box = new VBox({
        spacing: 1,
        children: [
          new Text(label, { font: FONTS.LABEL, fill: HRDiagramColors.textColorProperty, maxWidth: DISC_SPACING - 6 }),
          tooSmall,
        ],
        excludeInvisibleChildrenFromBounds: false,
      });
      box.boundsProperty.link(() => {
        box.centerX = centerX;
        box.top = 2 * MAX_DISC_RADIUS + 6;
      });
      return box;
    };
    const sunCaption = caption(strings.sunStringProperty, sunDisc.centerX);
    const starCaption = caption(starLabelProperty ?? strings.size.starStringProperty, starDisc.centerX);
    const sunTooSmall = sunCaption.children[1] as Node;
    const starTooSmall = starCaption.children[1] as Node;

    Multilink.multilink([temperatureProperty, radiusProperty], (temperature, radius) => {
      const scale = MAX_DISC_RADIUS / Math.max(1, radius);
      const sunRadius = scale;
      const starRadius = radius * scale;
      sunDisc.radius = Math.max(sunRadius, sunRadius < MIN_VISIBLE_RADIUS ? DOT_RADIUS : 0);
      starDisc.radius = Math.max(starRadius, starRadius < MIN_VISIBLE_RADIUS ? DOT_RADIUS : 0);
      sunTooSmall.visible = sunRadius < MIN_VISIBLE_RADIUS;
      starTooSmall.visible = starRadius < MIN_VISIBLE_RADIUS;
      starDisc.fill = gradientFor(temperature, starDisc.radius);
      sunDisc.fill = gradientFor(SUN_TEMPERATURE, sunDisc.radius);
    });

    this.children = [sunDisc, starDisc, sunCaption, starCaption];
    this.mutate(nodeOptions);
  }
}

/** A disc fill in the star's colour, slightly darker at the limb. */
const gradientFor = (temperature: number, radius = 1): RadialGradient => {
  const color = blackbodyColor(temperature);
  return new RadialGradient(-0.3 * radius, -0.3 * radius, 0, 0, 0, radius)
    .addColorStop(0, color.colorUtilsBrighter(0.35))
    .addColorStop(1, color.colorUtilsDarker(0.25));
};
