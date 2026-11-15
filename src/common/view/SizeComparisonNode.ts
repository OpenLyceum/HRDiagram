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
import { FONTS, SIZE_COMPARISON } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { SUN_TEMPERATURE } from "../model/stellarPhysics.js";
import { blackbodyColor } from "./blackbodyColor.js";

const DISC_SPACING = 2 * SIZE_COMPARISON.MAX_DISC_RADIUS + SIZE_COMPARISON.CENTRE_GAP;

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

    const leftDisc = new Circle(1, {
      centerX: SIZE_COMPARISON.MAX_DISC_RADIUS,
      centerY: SIZE_COMPARISON.MAX_DISC_RADIUS,
    });
    const rightDisc = new Circle(1, {
      centerX: SIZE_COMPARISON.MAX_DISC_RADIUS + DISC_SPACING,
      centerY: SIZE_COMPARISON.MAX_DISC_RADIUS,
    });

    /** A label under a disc, with a "too small to see" note that shows when the disc is a dot. */
    const caption = (label: TReadOnlyProperty<string>, centerX: number): { box: VBox; tooSmall: Node } => {
      const tooSmall = new Text(strings.size.tooSmallStringProperty, {
        font: FONTS.SMALL,
        fill: HRDiagramColors.textColorProperty,
        maxWidth: DISC_SPACING - SIZE_COMPARISON.LABEL_INSET,
        visible: false,
      });
      const box = new VBox({
        spacing: 1,
        children: [
          new Text(label, {
            font: FONTS.LABEL,
            fill: HRDiagramColors.textColorProperty,
            maxWidth: DISC_SPACING - SIZE_COMPARISON.LABEL_INSET,
          }),
          tooSmall,
        ],
        excludeInvisibleChildrenFromBounds: false,
      });
      box.boundsProperty.link(() => {
        box.centerX = centerX;
        box.top = 2 * SIZE_COMPARISON.MAX_DISC_RADIUS + SIZE_COMPARISON.CAPTION_TOP_GAP;
      });
      return { box, tooSmall };
    };
    const leftCaption = caption(left.labelProperty, leftDisc.centerX);
    const rightCaption = caption(right.labelProperty, rightDisc.centerX);

    Multilink.multilink(
      [left.temperatureProperty, left.radiusProperty, right.temperatureProperty, right.radiusProperty],
      (leftTemperature, leftRadius, rightTemperature, rightRadius) => {
        const scale = SIZE_COMPARISON.MAX_DISC_RADIUS / Math.max(leftRadius, rightRadius);
        const draw = (disc: Circle, tooSmall: Node, temperature: number, radius: number): void => {
          const r = radius * scale;
          disc.radius = r < SIZE_COMPARISON.MIN_VISIBLE_RADIUS ? SIZE_COMPARISON.DOT_RADIUS : r;
          tooSmall.visible = r < SIZE_COMPARISON.MIN_VISIBLE_RADIUS;
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
  const offset = SIZE_COMPARISON.GRADIENT_OFFSET_FACTOR * radius;
  return new RadialGradient(-offset, -offset, 0, 0, 0, radius)
    .addColorStop(0, color.colorUtilsBrighter(SIZE_COMPARISON.GRADIENT_BRIGHTER))
    .addColorStop(1, color.colorUtilsDarker(SIZE_COMPARISON.GRADIENT_DARKER));
};
