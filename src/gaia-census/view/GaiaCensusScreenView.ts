/**
 * GaiaCensusScreenView.ts
 *
 * The Gaia Census screen: about 44 000 real stars within 100 pc on the HR diagram, a distance limit and
 * an optional brightness limit, the share of each kind of star among those plotted, and colouring by
 * kind or by distance. Guides and axis choices sit under the diagram.
 */

import { DerivedProperty, Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { roundToInterval } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { Circle, GridBox, HBox, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, HSlider } from "scenerystack/sun";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/HRDiagramButtonOptions.js";
import { HR_DIAGRAM_CHECKBOX_OPTIONS, HR_DIAGRAM_SLIDER_OPTIONS } from "../../common/HRDiagramControlOptions.js";
import { HRDiagramPanel } from "../../common/HRDiagramPanel.js";
import type { PlottableStar } from "../../common/model/AxisQuantity.js";
import { StarCategory } from "../../common/model/StarCategory.js";
import { spectralCodeFromTemperature } from "../../common/model/spectralTypes.js";
import { AxisControlsNode } from "../../common/view/AxisControlsNode.js";
import { formatFixed, formatInteger } from "../../common/view/format.js";
import { HRChartNode } from "../../common/view/HRChartNode.js";
import { HROverlayNode } from "../../common/view/HROverlayNode.js";
import { OverlayCheckboxGroup } from "../../common/view/OverlayCheckboxGroup.js";
import { HIDDEN_GROUP, PointCloudNode, type PointStyle } from "../../common/view/PointCloudNode.js";
import { chartStripAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { SunMarkerNode } from "../../common/view/SunMarkerNode.js";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { ColorBy } from "../model/ColorBy.js";
import type { GaiaCensusModel } from "../model/GaiaCensusModel.js";
import { GaiaCensusScreenSummaryContent } from "./GaiaCensusScreenSummaryContent.js";

export type GaiaCensusScreenViewOptions = ScreenViewOptions;

const CHART_WIDTH = 560;
const CHART_HEIGHT = 420;
const PANEL_CONTENT_WIDTH = 300;
const SLIDER_TRACK_WIDTH = 260;
const BAR_MAX_WIDTH = 70;
const POINT_RADIUS = 1.4;

/** Kinds of star in drawing order: the commonest first, so rarer kinds land on top. */
const DRAW_ORDER = [
  StarCategory.DWARF,
  StarCategory.WHITE_DWARF,
  StarCategory.SUBGIANT,
  StarCategory.GIANT,
  StarCategory.SUPERGIANT,
];

const CATEGORY_COLORS = new Map([
  [StarCategory.DWARF, HRDiagramColors.dwarfColorProperty],
  [StarCategory.SUBGIANT, HRDiagramColors.subgiantColorProperty],
  [StarCategory.GIANT, HRDiagramColors.giantColorProperty],
  [StarCategory.SUPERGIANT, HRDiagramColors.supergiantColorProperty],
  [StarCategory.WHITE_DWARF, HRDiagramColors.whiteDwarfColorProperty],
]);

/** Distance bins (pc) and their colours, near (warm) to far (cool); legible on dark and light charts. */
const DISTANCE_BIN_WIDTH = 20;
const DISTANCE_COLORS = ["#ffd23f", "#ff9f43", "#ee5a6f", "#b45fd6", "#5b8cff"];

export class GaiaCensusScreenView extends ScreenView {
  public constructor(model: GaiaCensusModel, providedOptions?: GaiaCensusScreenViewOptions) {
    const options = optionize<GaiaCensusScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new GaiaCensusScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getGaiaCensusStrings();
    const a11y = StringManager.getInstance().getGaiaCensusA11yStrings();
    const layout = chartStripAndPanelsLayout(this.layoutBounds);
    const listParent = new Node();
    const census = model.census;
    const textNode = (
      value: TReadOnlyProperty<string> | string,
      maxWidth = PANEL_CONTENT_WIDTH,
      font = FONTS.LABEL,
    ): Text => new Text(value, { font, fill: HRDiagramColors.textColorProperty, maxWidth });

    // ── Diagram ───────────────────────────────────────────────────────────────
    const chart = new HRChartNode(
      model.settings.xQuantityProperty,
      model.settings.yQuantityProperty,
      CHART_WIDTH,
      CHART_HEIGHT,
    );
    const cloud = new PointCloudNode(chart.chartTransform);
    chart.plotLayer.children = [cloud, new HROverlayNode(chart, model.settings), new SunMarkerNode(chart)];

    // Chart coordinates change only with the axes; groups change with the limits and the colouring.
    let xs = new Float64Array(census.size);
    let ys = new Float64Array(census.size);
    const computePositions = (): void => {
      xs = new Float64Array(census.size);
      ys = new Float64Array(census.size);
      const x = chart.xQuantity;
      const y = chart.yQuantity;
      for (let i = 0; i < census.size; i++) {
        const temperature = census.temperature[i] ?? Number.NaN;
        const star: PlottableStar = {
          temperature,
          luminosity: census.luminosity[i] ?? Number.NaN,
          absoluteV: census.absoluteV[i] ?? Number.NaN,
          absoluteG: census.absoluteG[i] ?? Number.NaN,
          colorIndex: Number.NaN,
          bpRp: census.bpRp[i] ?? Number.NaN,
          spectralCode: spectralCodeFromTemperature(temperature),
        };
        xs[i] = x.chartValueOfStar(star);
        ys[i] = y.chartValueOfStar(star);
      }
    };
    const kindStyles: PointStyle[] = DRAW_ORDER.map((category) => ({
      css: () => (CATEGORY_COLORS.get(category) ?? HRDiagramColors.textColorProperty).value.toCSS(),
      radius: category === StarCategory.DWARF ? POINT_RADIUS : POINT_RADIUS + 0.4,
      alpha: category === StarCategory.DWARF ? 0.45 : 0.85,
    }));
    const distanceStyles: PointStyle[] = DISTANCE_COLORS.map((color) => ({
      css: () => color,
      radius: POINT_RADIUS,
      alpha: 0.6,
    }));
    const redraw = (): void => {
      const { mask } = model.selectionProperty.value;
      const byKind = model.colorByProperty.value === ColorBy.KIND;
      const groups = new Uint8Array(census.size);
      for (let i = 0; i < census.size; i++) {
        if (mask[i] !== 1) {
          groups[i] = HIDDEN_GROUP;
        } else if (byKind) {
          groups[i] = DRAW_ORDER.indexOf(census.categories[i] as StarCategory);
        } else {
          // Far stars first, so the nearer (fewer) stars land on top.
          const bin = Math.min(DISTANCE_COLORS.length - 1, Math.floor((census.distance[i] ?? 0) / DISTANCE_BIN_WIDTH));
          groups[i] = DISTANCE_COLORS.length - 1 - bin;
        }
      }
      const styles = byKind ? kindStyles : [...distanceStyles].reverse();
      cloud.setPoints({ xs, ys, groups }, styles);
    };
    chart.chartTransform.changedEmitter.addListener(() => {
      computePositions();
      redraw();
    });
    computePositions();
    Multilink.multilink([model.selectionProperty, model.colorByProperty], redraw);
    for (const color of CATEGORY_COLORS.values()) {
      color.lazyLink(() => cloud.repaint());
    }

    // ── Which stars? ──────────────────────────────────────────────────────────
    const valueText = (pattern: TReadOnlyProperty<string>, property: TReadOnlyProperty<number>, decimals: number) =>
      new DerivedProperty([pattern, property], (p, value) =>
        StringUtils.fillIn(p, { value: formatFixed(value, decimals) }),
      );
    const slider = (
      property: typeof model.distanceLimitProperty,
      name: TReadOnlyProperty<string>,
      valuePattern: TReadOnlyProperty<string>,
      decimals: number,
      steps: { keyboardStep: number; shiftKeyboardStep: number; pageKeyboardStep: number },
      enabledProperty?: TReadOnlyProperty<boolean>,
    ): HSlider =>
      new HSlider(property, property.range, {
        ...HR_DIAGRAM_SLIDER_OPTIONS,
        ...steps,
        trackSize: HR_DIAGRAM_SLIDER_OPTIONS.trackSize.copy().setWidth(SLIDER_TRACK_WIDTH),
        accessibleName: name,
        constrainValue: (value: number) => roundToInterval(value, 10 ** -decimals),
        pdomCreateAriaValueText: (value: number | null) =>
          StringUtils.fillIn(valuePattern.value, { value: value === null ? "" : formatFixed(value, decimals) }),
        pdomDependencies: [valuePattern],
        ...(enabledProperty ? { enabledProperty } : {}),
      });
    const distanceSlider = slider(
      model.distanceLimitProperty,
      strings.distanceLimitStringProperty,
      a11y.controls.distanceValuePatternStringProperty,
      0,
      { keyboardStep: 5, shiftKeyboardStep: 1, pageKeyboardStep: 20 },
    );
    const brightnessSlider = slider(
      model.brightnessLimitProperty,
      strings.brightnessLimitStringProperty,
      a11y.controls.magnitudeValuePatternStringProperty,
      1,
      { keyboardStep: 0.5, shiftKeyboardStep: 0.1, pageKeyboardStep: 2 },
      model.brightnessLimitEnabledProperty,
    );
    brightnessSlider.addMajorTick(6);
    const brightnessCheckbox = new Checkbox(
      model.brightnessLimitEnabledProperty,
      new HBox({
        spacing: 6,
        children: [
          textNode(strings.brightnessLimitStringProperty, 200),
          new Text(valueText(strings.magnitudePatternStringProperty, model.brightnessLimitProperty, 1), {
            font: FONTS.READOUT,
            fill: HRDiagramColors.textColorProperty,
            maxWidth: 80,
          }),
        ],
      }),
      { ...HR_DIAGRAM_CHECKBOX_OPTIONS, accessibleName: strings.brightnessLimitStringProperty },
    );
    const selectionPanel = new HRDiagramPanel(
      new VBox({
        spacing: 6,
        align: "left",
        children: [
          textNode(strings.selectionTitleStringProperty, PANEL_CONTENT_WIDTH, FONTS.TITLE),
          new HBox({
            spacing: 8,
            children: [
              textNode(strings.distanceLimitStringProperty, 150),
              new Text(valueText(strings.distancePatternStringProperty, model.distanceLimitProperty, 0), {
                font: FONTS.READOUT,
                fill: HRDiagramColors.textColorProperty,
                maxWidth: 130,
              }),
            ],
          }),
          distanceSlider,
          brightnessCheckbox,
          brightnessSlider,
          textNode(strings.nakedEyeStringProperty, PANEL_CONTENT_WIDTH, FONTS.SMALL),
        ],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + 24 },
    );

    // ── What kinds of star? ───────────────────────────────────────────────────
    const categoryNames = common.categories as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const rows = StarCategory.enumeration.values.map((category) => {
      const share = new DerivedProperty([model.selectionProperty], (selection) =>
        selection.count === 0 ? 0 : (selection.countsByCategory.get(category) ?? 0) / selection.count,
      );
      const percent = new DerivedProperty([strings.percentPatternStringProperty, share], (pattern, fraction) =>
        StringUtils.fillIn(pattern, { value: formatFixed(100 * fraction, fraction < 0.01 && fraction > 0 ? 2 : 1) }),
      );
      const count = new DerivedProperty([model.selectionProperty], (selection) =>
        formatInteger(selection.countsByCategory.get(category) ?? 0),
      );
      const bar = new Rectangle(0, 0, 1, 10, { fill: CATEGORY_COLORS.get(category) ?? "white" });
      share.link((fraction) => {
        bar.rectWidth = Math.max(0.5, BAR_MAX_WIDTH * fraction);
      });
      return [
        new Circle(5, { fill: CATEGORY_COLORS.get(category) ?? "white" }),
        textNode(categoryNames[`${category.key}StringProperty`] as TReadOnlyProperty<string>, 130, FONTS.SMALL),
        textNode(count, 50, FONTS.SMALL),
        textNode(percent, 55, FONTS.SMALL),
        new Node({ children: [new Rectangle(0, 0, BAR_MAX_WIDTH, 10), bar] }),
      ];
    });
    for (const row of rows) {
      for (const cell of row.slice(2, 4)) {
        cell.layoutOptions = { xAlign: "right" };
      }
    }
    const plottedText = new DerivedProperty(
      [strings.plottedPatternStringProperty, model.selectionProperty],
      (pattern, s) => StringUtils.fillIn(pattern, { count: formatInteger(s.count) }),
    );
    const standsForText = new DerivedProperty(
      [strings.standsForPatternStringProperty, model.selectionProperty],
      (pattern, s) => StringUtils.fillIn(pattern, { count: formatInteger(s.count / census.sampleFraction) }),
    );
    const kindsPanel = new HRDiagramPanel(
      new VBox({
        spacing: 6,
        align: "left",
        children: [
          textNode(strings.kindsTitleStringProperty, PANEL_CONTENT_WIDTH, FONTS.TITLE),
          textNode(plottedText),
          textNode(standsForText, PANEL_CONTENT_WIDTH, FONTS.SMALL),
          new GridBox({ xSpacing: 6, ySpacing: 4, xAlign: "left", rows }),
        ],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + 24 },
    );

    // ── Colour by ─────────────────────────────────────────────────────────────
    const colorByNames = strings as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const colorByGroup = new AquaRadioButtonGroup(
      model.colorByProperty,
      ColorBy.enumeration.values.map((colorBy) => {
        const name = colorByNames[`${colorBy.key}StringProperty`] as TReadOnlyProperty<string>;
        return { value: colorBy, createNode: () => textNode(name, 130), options: { accessibleName: name } };
      }),
      {
        orientation: "horizontal",
        spacing: 16,
        radioButtonOptions: { radius: 7 },
        accessibleName: strings.colorByTitleStringProperty,
      },
    );
    const distanceLegend = new HBox({
      spacing: 8,
      children: DISTANCE_COLORS.map((color, i) => {
        const label = new DerivedProperty([strings.distanceBinPatternStringProperty], (pattern) =>
          StringUtils.fillIn(pattern, { min: i * DISTANCE_BIN_WIDTH, max: (i + 1) * DISTANCE_BIN_WIDTH }),
        );
        return new VBox({ spacing: 1, children: [new Circle(4, { fill: color }), textNode(label, 50, FONTS.SMALL)] });
      }),
    });
    model.colorByProperty.link((colorBy) => {
      distanceLegend.visible = colorBy === ColorBy.DISTANCE;
    });
    const colorPanel = new HRDiagramPanel(
      new VBox({
        spacing: 6,
        align: "left",
        excludeInvisibleChildrenFromBounds: false,
        children: [
          textNode(strings.colorByTitleStringProperty, PANEL_CONTENT_WIDTH, FONTS.TITLE),
          colorByGroup,
          distanceLegend,
        ],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + 24 },
    );

    // ── Guides and axes, under the diagram ────────────────────────────────────
    const overlayCheckboxes = new OverlayCheckboxGroup(model.settings, 2);
    const axisControls = new AxisControlsNode(model.settings, listParent);
    const strip = new HRDiagramPanel(
      new VBox({
        spacing: 4,
        children: [
          new HBox({ spacing: 24, align: "center", children: [overlayCheckboxes, axisControls] }),
          textNode(strings.saturationNoteStringProperty, CHART_WIDTH + 40, FONTS.SMALL),
        ],
      }),
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
      placeInRegion(strip, layout.strip),
      placeInRegion(new VBox({ spacing: 8, children: [selectionPanel, kindsPanel, colorPanel] }), layout.panels, {
        yAlign: "top",
      }),
      placeInRegion(resetAllButton, layout.footer, { xAlign: "right", yAlign: "bottom" }),
      listParent,
    ];

    this.pdomPlayAreaNode.pdomOrder = [distanceSlider, brightnessCheckbox, brightnessSlider, colorByGroup];
    this.pdomControlAreaNode.pdomOrder = [overlayCheckboxes, axisControls, resetAllButton];
  }
}
