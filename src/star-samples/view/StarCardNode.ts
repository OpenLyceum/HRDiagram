/**
 * StarCardNode.ts
 *
 * The selected star's properties: name and designation, distance, apparent and absolute magnitude,
 * spectral type, temperature, luminosity, radius, kind, and which catalogue the photometry comes from.
 * Shows a hint when no star is selected.
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, type Node, RichText, Text, VBox } from "scenerystack/scenery";
import type { Star } from "../../common/model/StarCatalog.js";
import { formatFixed, formatInteger, formatValue } from "../../common/view/format.js";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";

/** Light-years per parsec. */
const LIGHT_YEARS_PER_PARSEC = 3.2616;

const VALUE_MAX_WIDTH = 170;
const LABEL_MAX_WIDTH = 130;

export class StarCardNode extends VBox {
  public constructor(selectedStarProperty: Property<Star | null>, width: number) {
    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getStarSamplesStrings();
    const categoryNames = common.categories as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;

    const title = new Text("", { font: FONTS.TITLE, fill: HRDiagramColors.textColorProperty, maxWidth: width });
    const subtitle = new Text("", { font: FONTS.SMALL, fill: HRDiagramColors.textColorProperty, maxWidth: width });
    const hint = new Text(strings.clickHintStringProperty, {
      font: FONTS.LABEL,
      fill: HRDiagramColors.textColorProperty,
      maxWidth: width,
    });

    type Row = { label: TReadOnlyProperty<string>; value: (star: Star) => string };
    const rows: Row[] = [
      {
        label: strings.distanceStringProperty,
        value: (star) =>
          StringUtils.fillIn(strings.distancePatternStringProperty.value, {
            pc: formatValue(star.distance, 3),
            ly: formatValue(star.distance * LIGHT_YEARS_PER_PARSEC, 3),
          }),
      },
      { label: strings.apparentMagnitudeStringProperty, value: (star) => formatFixed(star.apparentV, 2) },
      { label: strings.absoluteMagnitudeStringProperty, value: (star) => formatFixed(star.absoluteV, 2) },
      {
        label: strings.spectralTypeStringProperty,
        value: (star) => star.spectralType ?? strings.notCataloguedStringProperty.value,
      },
      {
        label: common.quantities.temperatureStringProperty,
        value: (star) =>
          StringUtils.fillIn(common.units.kelvinPatternStringProperty.value, {
            value: formatInteger(Number(star.temperature.toPrecision(3))),
          }),
      },
      {
        label: common.quantities.luminosityStringProperty,
        value: (star) =>
          StringUtils.fillIn(common.units.solarLuminosityPatternStringProperty.value, {
            value: formatValue(star.luminosity, 3),
          }),
      },
      {
        label: common.quantities.radiusStringProperty,
        value: (star) =>
          StringUtils.fillIn(common.units.solarRadiusPatternStringProperty.value, {
            value: formatValue(star.radius, 3),
          }),
      },
      {
        label: strings.kindStringProperty,
        value: (star) => {
          const kind = categoryNames[`${star.category.key}StringProperty`]?.value ?? "";
          return star.categoryInferred
            ? StringUtils.fillIn(strings.inferredPatternStringProperty.value, { kind })
            : kind;
        },
      },
      {
        label: strings.dataStringProperty,
        value: (star) =>
          (star.photometry === "gaia" ? strings.gaiaStringProperty : strings.hipparcosStringProperty).value,
      },
    ];
    const valueNodes = rows.map(
      () => new RichText("", { font: FONTS.LABEL, fill: HRDiagramColors.textColorProperty, maxWidth: VALUE_MAX_WIDTH }),
    );
    const grid = new GridBox({
      xSpacing: 10,
      ySpacing: 3,
      xAlign: "left",
      rows: rows.map((row, i) => [
        new RichText(row.label, {
          font: FONTS.LABEL,
          fill: HRDiagramColors.textColorProperty,
          maxWidth: LABEL_MAX_WIDTH,
        }),
        valueNodes[i] as Node,
      ]),
    });

    super({ spacing: 6, align: "left", children: [hint] });

    const update = (): void => {
      const star = selectedStarProperty.value;
      if (star === null) {
        this.children = [hint];
        return;
      }
      title.string = star.name;
      subtitle.string = star.designation === star.name ? "" : star.designation;
      rows.forEach((row, i) => {
        (valueNodes[i] as RichText).string = row.value(star);
      });
      this.children = subtitle.string === "" ? [title, grid] : [title, subtitle, grid];
    };
    selectedStarProperty.link(update);
    // Values are built from string values, so rebuild them when the locale changes.
    for (const property of [
      strings.distancePatternStringProperty,
      strings.notCataloguedStringProperty,
      strings.inferredPatternStringProperty,
      common.units.kelvinPatternStringProperty,
    ]) {
      property.lazyLink(update);
    }
  }
}
