/**
 * SizeComparisonNode.ts
 *
 * Two stars side by side, drawn to the same scale and in their blackbody colours. The larger of the two
 * always fills the frame, so the smaller can shrink to a dot: a red supergiant makes the Sun invisible,
 * and a white dwarf is a speck beside it. That is the point.
 *
 * {@link SizeComparisonNode.withSun} compares one star with the Sun.
 */

import { Multilink, TinyProperty, type TReadOnlyProperty } from "scenerystack/axon";
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

/** One of the two stars compared. */
export type ComparedStar = {
  readonly temperatureProperty: TReadOnlyProperty<number>; // K
  readonly radiusProperty: TReadOnlyProperty<number>; // R☉
  readonly labelProperty: TReadOnlyProperty<string>;
};

export class SizeComparisonNode extends Node {
  public constructor(left: ComparedStar, right: ComparedStar, options?: NodeOptions) {
    super();
    const strings = StringManager.getInstance().getCommonStrings();

    const leftDisc = new Circle(1, { centerX: MAX_DISC_RADIUS, centerY: MAX_DISC_RADIUS });
    const rightDisc = new Circle(1, { centerX: MAX_DISC_RADIUS + DISC_SPACING, centerY: MAX_DISC_RADIUS });

    /** A label under a disc, with a "too small to see" note that shows when the disc is a dot. */
    const caption = (label: TReadOnlyProperty<string>, centerX: number): { box: VBox; tooSmall: Node } => {
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
      return { box, tooSmall };
    };
    const leftCaption = caption(left.labelProperty, leftDisc.centerX);
    const rightCaption = caption(right.labelProperty, rightDisc.centerX);

    Multilink.multilink(
      [left.temperatureProperty, left.radiusProperty, right.temperatureProperty, right.radiusProperty],
      (leftTemperature, leftRadius, rightTemperature, rightRadius) => {
        const scale = MAX_DISC_RADIUS / Math.max(leftRadius, rightRadius);
        const draw = (disc: Circle, tooSmall: Node, temperature: number, radius: number): void => {
          const r = radius * scale;
          disc.radius = r < MIN_VISIBLE_RADIUS ? DOT_RADIUS : r;
          tooSmall.visible = r < MIN_VISIBLE_RADIUS;
          disc.fill = gradientFor(temperature, disc.radius);
        };
        draw(leftDisc, leftCaption.tooSmall, leftTemperature, leftRadius);
        draw(rightDisc, rightCaption.tooSmall, rightTemperature, rightRadius);
      },
    );

    this.children = [leftDisc, rightDisc, leftCaption.box, rightCaption.box];
    this.mutate(options);
  }

  /** The Sun on the left, a star on the right. */
  public static withSun(
    temperatureProperty: TReadOnlyProperty<number>,
    radiusProperty: TReadOnlyProperty<number>,
    labelProperty: TReadOnlyProperty<string>,
    options?: NodeOptions,
  ): SizeComparisonNode {
    const strings = StringManager.getInstance().getCommonStrings();
    return new SizeComparisonNode(
      {
        temperatureProperty: new TinyProperty(SUN_TEMPERATURE),
        radiusProperty: new TinyProperty(1),
        labelProperty: strings.sunStringProperty,
      },
      { temperatureProperty, radiusProperty, labelProperty },
      options,
    );
  }
}

/** A disc fill in the star's colour, slightly darker at the limb. */
const gradientFor = (temperature: number, radius: number): RadialGradient => {
  const color = blackbodyColor(temperature);
  return new RadialGradient(-0.3 * radius, -0.3 * radius, 0, 0, 0, radius)
    .addColorStop(0, color.colorUtilsBrighter(0.35))
    .addColorStop(1, color.colorUtilsDarker(0.25));
};
