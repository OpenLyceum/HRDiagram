/**
 * RadiusScreenView.ts
 *
 * The Radius screen: two movable stars on a temperature–luminosity diagram with lines of equal radius,
 * a table comparing them (B ÷ A for T, L and R), the Stefan–Boltzmann ratio worked out with the current
 * numbers, the two stars drawn to scale, and a choice to hold a moving star's luminosity or temperature.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, HSeparator, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/HRDiagramButtonOptions.js";
import { HRDiagramPanel } from "../../common/HRDiagramPanel.js";
import type { MovableStar } from "../../common/model/MovableStar.js";
import { CursorStarNode } from "../../common/view/CursorStarNode.js";
import { formatInteger, formatValue } from "../../common/view/format.js";
import { HRChartNode } from "../../common/view/HRChartNode.js";
import { HROverlayNode } from "../../common/view/HROverlayNode.js";
import { OverlayCheckboxGroup } from "../../common/view/OverlayCheckboxGroup.js";
import { chartAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { SizeComparisonNode } from "../../common/view/SizeComparisonNode.js";
import { SunMarkerNode } from "../../common/view/SunMarkerNode.js";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { RadiusModel } from "../model/RadiusModel.js";
import { StarConstraint } from "../model/StarConstraint.js";
import { RadiusScreenSummaryContent } from "./RadiusScreenSummaryContent.js";

export type RadiusScreenViewOptions = ScreenViewOptions;

const CHART_WIDTH = 560;
const CHART_HEIGHT = 500;
const PANEL_CONTENT_WIDTH = 300;

export class RadiusScreenView extends ScreenView {
  public constructor(model: RadiusModel, providedOptions?: RadiusScreenViewOptions) {
    const options = optionize<RadiusScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new RadiusScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getRadiusStrings();
    const a11y = StringManager.getInstance().getRadiusA11yStrings();
    const layout = chartAndPanelsLayout(this.layoutBounds);

    // ── Diagram ───────────────────────────────────────────────────────────────
    const chart = new HRChartNode(
      model.settings.xQuantityProperty,
      model.settings.yQuantityProperty,
      CHART_WIDTH,
      CHART_HEIGHT,
    );
    const cursorFor = (star: MovableStar, label: TReadOnlyProperty<string>, name: TReadOnlyProperty<string>) =>
      new CursorStarNode(
        chart,
        star.temperatureProperty,
        star.luminosityProperty,
        (temperature, luminosity) => star.setTemperatureLuminosity(temperature, luminosity),
        {
          label,
          constrain: (temperature, luminosity) => model.constrain(star, temperature, luminosity),
          accessibleName: name,
          accessibleHelpText: a11y.controls.starHelpStringProperty,
        },
      );
    const cursorA = cursorFor(model.starA, strings.starAStringProperty, a11y.controls.starAStringProperty);
    const cursorB = cursorFor(model.starB, strings.starBStringProperty, a11y.controls.starBStringProperty);
    chart.plotLayer.children = [new HROverlayNode(chart, model.settings), new SunMarkerNode(chart), cursorA, cursorB];

    // ── Comparison table ──────────────────────────────────────────────────────
    const text = (value: TReadOnlyProperty<string> | string, font = FONTS.READOUT, maxWidth = 90): RichText =>
      new RichText(value, { font, fill: HRDiagramColors.textColorProperty, maxWidth });
    const formatted = (
      pattern: TReadOnlyProperty<string>,
      property: TReadOnlyProperty<number>,
      format: (value: number) => string,
    ): TReadOnlyProperty<string> =>
      new DerivedProperty([pattern, property], (p, value) => StringUtils.fillIn(p, { value: format(value) }));
    const kelvin = (property: TReadOnlyProperty<number>) =>
      formatted(common.units.kelvinPatternStringProperty, property, (T) => formatInteger(Number(T.toPrecision(3))));
    const solarL = (property: TReadOnlyProperty<number>) =>
      formatted(common.units.solarLuminosityPatternStringProperty, property, (L) => formatValue(L, 3));
    const solarR = (property: TReadOnlyProperty<number>) =>
      formatted(common.units.solarRadiusPatternStringProperty, property, (R) => formatValue(R, 3));
    const ratio = (property: TReadOnlyProperty<number>) =>
      formatted(strings.ratioPatternStringProperty, property, (value) => formatValue(value, 3));

    const header = (value: TReadOnlyProperty<string>): RichText => text(value, FONTS.TITLE);
    const rowLabel = (value: TReadOnlyProperty<string>): RichText => {
      const label = text(value, FONTS.LABEL);
      label.layoutOptions = { xAlign: "left" };
      return label;
    };
    const table = new GridBox({
      xSpacing: 10,
      ySpacing: 5,
      xAlign: "right",
      rows: [
        [
          new Node(),
          header(strings.starAStringProperty),
          header(strings.starBStringProperty),
          header(strings.ratioHeaderStringProperty),
        ],
        [
          rowLabel(common.quantities.temperatureStringProperty),
          text(kelvin(model.starA.temperatureProperty)),
          text(kelvin(model.starB.temperatureProperty)),
          text(ratio(model.temperatureRatioProperty)),
        ],
        [
          rowLabel(common.quantities.luminosityStringProperty),
          text(solarL(model.starA.luminosityProperty)),
          text(solarL(model.starB.luminosityProperty)),
          text(ratio(model.luminosityRatioProperty)),
        ],
        [
          rowLabel(common.quantities.radiusStringProperty),
          text(solarR(model.starA.radiusProperty)),
          text(solarR(model.starB.radiusProperty)),
          text(ratio(model.radiusRatioProperty)),
        ],
      ],
    });

    const equation = new DerivedProperty(
      [
        strings.equationPatternStringProperty,
        model.luminosityRatioProperty,
        model.temperatureRatioProperty,
        model.radiusRatioProperty,
      ],
      (pattern, luminosity, temperature, radius) =>
        StringUtils.fillIn(pattern, {
          luminosity: formatValue(luminosity, 3),
          temperature: formatValue(temperature, 3),
          radius: formatValue(radius, 3),
        }),
    );

    const comparePanel = new HRDiagramPanel(
      new VBox({
        spacing: 8,
        align: "left",
        children: [
          new Text(strings.compareTitleStringProperty, {
            font: FONTS.TITLE,
            fill: HRDiagramColors.textColorProperty,
            maxWidth: PANEL_CONTENT_WIDTH,
          }),
          table,
          text(strings.ruleStringProperty, FONTS.READOUT, PANEL_CONTENT_WIDTH),
          text(equation, FONTS.READOUT, PANEL_CONTENT_WIDTH),
          new HSeparator({ stroke: HRDiagramColors.panelBorderColorProperty }),
          new SizeComparisonNode(
            {
              temperatureProperty: model.starA.temperatureProperty,
              radiusProperty: model.starA.radiusProperty,
              labelProperty: strings.starALabelStringProperty,
            },
            {
              temperatureProperty: model.starB.temperatureProperty,
              radiusProperty: model.starB.radiusProperty,
              labelProperty: strings.starBLabelStringProperty,
            },
          ),
        ],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + 24 },
    );

    // ── Constraint and guides ─────────────────────────────────────────────────
    const constraintNames = strings as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const constraintGroup = new AquaRadioButtonGroup(
      model.constraintProperty,
      StarConstraint.enumeration.values.map((constraint) => {
        const name = constraintNames[`${constraint.key}StringProperty`] as TReadOnlyProperty<string>;
        return {
          value: constraint,
          createNode: () =>
            new Text(name, {
              font: FONTS.LABEL,
              fill: HRDiagramColors.textColorProperty,
              maxWidth: PANEL_CONTENT_WIDTH - 30,
            }),
          options: { accessibleName: name },
        };
      }),
      { spacing: 6, radioButtonOptions: { radius: 7 }, accessibleName: strings.constraintTitleStringProperty },
    );
    const overlayCheckboxes = new OverlayCheckboxGroup(model.settings);
    const settingsPanel = new HRDiagramPanel(
      new VBox({
        spacing: 8,
        align: "left",
        children: [
          new Text(strings.constraintTitleStringProperty, {
            font: FONTS.TITLE,
            fill: HRDiagramColors.textColorProperty,
            maxWidth: PANEL_CONTENT_WIDTH,
          }),
          constraintGroup,
          new HSeparator({ stroke: HRDiagramColors.panelBorderColorProperty }),
          overlayCheckboxes,
        ],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + 24 },
    );

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
      },
    });

    this.children = [
      placeInRegion(chart, layout.chart),
      placeInRegion(new VBox({ spacing: 10, children: [comparePanel, settingsPanel] }), layout.panels, {
        yAlign: "top",
      }),
      placeInRegion(resetAllButton, layout.footer, { xAlign: "right", yAlign: "bottom" }),
    ];

    this.pdomPlayAreaNode.pdomOrder = [cursorA, cursorB];
    this.pdomControlAreaNode.pdomOrder = [constraintGroup, overlayCheckboxes, resetAllButton];
  }
}
