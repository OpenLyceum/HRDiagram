import { EXPLORE_SCREEN_VIEW_SETTINGS } from "../../HRDiagramConstants.js";
/**
 * ExploreScreenView.ts
 *
 * The Explore screen: an HR diagram with a star the user places anywhere (drag it, click the diagram,
 * use the sliders or the arrow keys), the Sun for reference, optional guides (main sequence,
 * luminosity classes, lines of equal radius, instability strip), a choice of axes, and the star's
 * radius, magnitude and spectral type with a to-scale comparison with the Sun.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { DragListener, GridBox, HBox, HSeparator, Node, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { HSlider } from "scenerystack/sun";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/HRDiagramButtonOptions.js";
import { HR_DIAGRAM_SLIDER_OPTIONS } from "../../common/HRDiagramControlOptions.js";
import { HRDiagramPanel } from "../../common/HRDiagramPanel.js";
import { formatSpectralCode, spectralCodeFromTemperature } from "../../common/model/spectralTypes.js";
import { absoluteVisualMagnitude } from "../../common/model/stellarPhysics.js";
import { AxisControlsNode } from "../../common/view/AxisControlsNode.js";
import { CursorStarNode } from "../../common/view/CursorStarNode.js";
import { formatFixed, formatInteger, formatValue } from "../../common/view/format.js";
import { HRChartNode } from "../../common/view/HRChartNode.js";
import { HROverlayNode } from "../../common/view/HROverlayNode.js";
import { OverlayCheckboxGroup } from "../../common/view/OverlayCheckboxGroup.js";
import { chartAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { SizeComparisonNode } from "../../common/view/SizeComparisonNode.js";
import { SunMarkerNode } from "../../common/view/SunMarkerNode.js";
import HRDiagramColors from "../../HRDiagramColors.js";
import { CHART, EXPLORE_SLIDERS, FONTS, PANEL } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { HRDiagramPreferencesModel } from "../../preferences/HRDiagramPreferencesModel.js";
import type { ExploreModel } from "../model/ExploreModel.js";
import { ExploreScreenSummaryContent } from "./ExploreScreenSummaryContent.js";

export type ExploreScreenViewOptions = ScreenViewOptions;

const PANEL_CONTENT_WIDTH: number = PANEL.CONTENT_WIDTH;
const SLIDER_STEPS = {
  keyboardStep: EXPLORE_SLIDERS.KEYBOARD_STEP,
  shiftKeyboardStep: EXPLORE_SLIDERS.SHIFT_KEYBOARD_STEP,
  pageKeyboardStep: EXPLORE_SLIDERS.PAGE_KEYBOARD_STEP,
};

export class ExploreScreenView extends ScreenView {
  public constructor(
    model: ExploreModel,
    preferences: HRDiagramPreferencesModel,
    providedOptions?: ExploreScreenViewOptions,
  ) {
    const options = optionize<ExploreScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new ExploreScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getCommonStrings();
    const exploreStrings = StringManager.getInstance().getExploreStrings();
    const a11y = StringManager.getInstance().getExploreA11yStrings();
    const settings = model.settings;
    const layout = chartAndPanelsLayout(this.layoutBounds);
    const listParent = new Node();

    // ── Diagram ───────────────────────────────────────────────────────────────
    const chart = new HRChartNode(
      settings.xQuantityProperty,
      settings.yQuantityProperty,
      CHART.WIDTH,
      CHART.TALL_HEIGHT,
    );
    const overlays = new HROverlayNode(chart, settings);
    const cursorStar = new CursorStarNode(
      chart,
      model.star.temperatureProperty,
      model.star.luminosityProperty,
      (temperature, luminosity) => model.star.setTemperatureLuminosity(temperature, luminosity),
      {
        accessibleName: a11y.controls.cursorStarStringProperty,
        accessibleHelpText: a11y.controls.cursorStarHelpStringProperty,
      },
    );
    // Pressing anywhere on the diagram moves the star there, and keeps dragging it.
    const hitArea = new Rectangle(0, 0, CHART.WIDTH, CHART.TALL_HEIGHT, { cursor: "pointer" });
    hitArea.addInputListener(
      new DragListener({
        press: (event) => cursorStar.moveToViewPoint(chart.plotLayer.globalToLocalPoint(event.pointer.point)),
        drag: (event) => cursorStar.moveToViewPoint(chart.plotLayer.globalToLocalPoint(event.pointer.point)),
      }),
    );
    chart.plotLayer.children = [hitArea, overlays, new SunMarkerNode(chart), cursorStar];

    // ── Your star: sliders, readouts, size comparison ─────────────────────────
    const label = (
      text: TReadOnlyProperty<string>,
      maxWidth: number = EXPLORE_SCREEN_VIEW_SETTINGS.DEFAULT_MAX_WIDTH,
    ): Text => new Text(text, { font: FONTS.LABEL, fill: HRDiagramColors.textColorProperty, maxWidth });
    const readout = (text: TReadOnlyProperty<string>): RichText =>
      new RichText(text, {
        font: FONTS.READOUT,
        fill: HRDiagramColors.textColorProperty,
        maxWidth: EXPLORE_SCREEN_VIEW_SETTINGS.READOUT_MAX_WIDTH,
      });

    const temperatureText = new DerivedProperty(
      [strings.units.kelvinPatternStringProperty, model.star.temperatureProperty],
      (pattern, temperature) =>
        StringUtils.fillIn(pattern, {
          value: formatInteger(
            Number(temperature.toPrecision(EXPLORE_SCREEN_VIEW_SETTINGS.TEMPERATURE_TEXT_SIGNIFICANT_FIGURES)),
          ),
        }),
    );
    const luminosityText = new DerivedProperty(
      [strings.units.solarLuminosityPatternStringProperty, model.star.luminosityProperty],
      (pattern, luminosity) =>
        StringUtils.fillIn(pattern, {
          value: formatValue(luminosity, EXPLORE_SCREEN_VIEW_SETTINGS.LUMINOSITY_TEXT_DIGITS),
        }),
    );
    const radiusText = new DerivedProperty(
      [strings.units.solarRadiusPatternStringProperty, model.star.radiusProperty],
      (pattern, radius) =>
        StringUtils.fillIn(pattern, { value: formatValue(radius, EXPLORE_SCREEN_VIEW_SETTINGS.RADIUS_TEXT_DIGITS) }),
    );
    const magnitudeText = new DerivedProperty([model.star.luminosityProperty, model.star.temperatureProperty], (L, T) =>
      formatFixed(absoluteVisualMagnitude(L, T), 1),
    );
    const spectralText = new DerivedProperty(
      [strings.mainSequenceTypePatternStringProperty, model.star.temperatureProperty],
      (pattern, temperature) =>
        StringUtils.fillIn(pattern, { type: formatSpectralCode(spectralCodeFromTemperature(temperature)) }),
    );

    const slider = (
      property: typeof model.star.logTemperatureProperty,
      name: TReadOnlyProperty<string>,
      valuePattern: TReadOnlyProperty<string>,
      format: (value: number) => string,
    ): HSlider =>
      new HSlider(property, property.range, {
        ...HR_DIAGRAM_SLIDER_OPTIONS,
        ...SLIDER_STEPS,
        trackSize: HR_DIAGRAM_SLIDER_OPTIONS.trackSize.copy().setWidth(EXPLORE_SLIDERS.TRACK_WIDTH),
        accessibleName: name,
        pdomCreateAriaValueText: (value: number | null) =>
          StringUtils.fillIn(valuePattern.value, { value: value === null ? "" : format(10 ** value) }),
        pdomDependencies: [valuePattern],
      });
    const temperatureSlider = slider(
      model.star.logTemperatureProperty,
      exploreStrings.temperatureStringProperty,
      a11y.controls.temperatureValuePatternStringProperty,
      (T) => formatInteger(Number(T.toPrecision(EXPLORE_SCREEN_VIEW_SETTINGS.TEMPERATURE_SLIDER_SIGNIFICANT_FIGURES))),
    );
    const luminositySlider = slider(
      model.star.logLuminosityProperty,
      exploreStrings.luminosityStringProperty,
      a11y.controls.luminosityValuePatternStringProperty,
      (L) => formatValue(L, EXPLORE_SCREEN_VIEW_SETTINGS.LUMINOSITY_SLIDER_DIGITS),
    );

    const sliderBlock = (name: TReadOnlyProperty<string>, value: TReadOnlyProperty<string>, control: HSlider): VBox =>
      new VBox({
        spacing: EXPLORE_SCREEN_VIEW_SETTINGS.SLIDER_BLOCK_SPACING,
        align: "left",
        children: [
          new HBox({
            spacing: EXPLORE_SCREEN_VIEW_SETTINGS.SLIDER_LABEL_ROW_SPACING,
            children: [label(name), readout(value)],
          }),
          control,
        ],
      });

    const readouts = new GridBox({
      xSpacing: EXPLORE_SCREEN_VIEW_SETTINGS.READOUTS_X_SPACING,
      ySpacing: EXPLORE_SCREEN_VIEW_SETTINGS.READOUTS_Y_SPACING,
      xAlign: "left",
      rows: [
        [label(strings.quantities.radiusStringProperty), readout(radiusText)],
        [label(strings.quantities.absoluteMagnitudeStringProperty), readout(magnitudeText)],
        [label(strings.quantities.spectralTypeStringProperty), readout(spectralText)],
      ],
    });

    const starPanel = new HRDiagramPanel(
      new VBox({
        spacing: EXPLORE_SCREEN_VIEW_SETTINGS.STAR_PANEL_SPACING,
        align: "left",
        children: [
          new Text(exploreStrings.starTitleStringProperty, {
            font: FONTS.TITLE,
            fill: HRDiagramColors.textColorProperty,
            maxWidth: PANEL_CONTENT_WIDTH,
          }),
          sliderBlock(exploreStrings.temperatureStringProperty, temperatureText, temperatureSlider),
          sliderBlock(exploreStrings.luminosityStringProperty, luminosityText, luminositySlider),
          readouts,
          new RichText(exploreStrings.radiusEquationStringProperty, {
            font: FONTS.SMALL,
            fill: HRDiagramColors.textColorProperty,
            maxWidth: PANEL_CONTENT_WIDTH,
            visibleProperty: preferences.showEquationsProperty,
          }),
          new HSeparator({ stroke: HRDiagramColors.panelBorderColorProperty }),
          new Text(strings.size.titleStringProperty, {
            font: FONTS.LABEL,
            fill: HRDiagramColors.textColorProperty,
            maxWidth: PANEL_CONTENT_WIDTH,
          }),
          SizeComparisonNode.withSun(
            model.star.temperatureProperty,
            model.star.radiusProperty,
            strings.size.starStringProperty,
          ),
        ],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + PANEL.MIN_WIDTH_INSET },
    );

    // ── Guides and axes ───────────────────────────────────────────────────────
    const overlayCheckboxes = new OverlayCheckboxGroup(settings);
    const axisControls = new AxisControlsNode(settings, listParent);
    const settingsPanel = new HRDiagramPanel(
      new VBox({
        spacing: EXPLORE_SCREEN_VIEW_SETTINGS.SETTINGS_PANEL_SPACING,
        align: "left",
        children: [overlayCheckboxes, axisControls],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + PANEL.MIN_WIDTH_INSET },
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
      placeInRegion(
        new VBox({ spacing: EXPLORE_SCREEN_VIEW_SETTINGS.CHILDREN_SPACING, children: [starPanel, settingsPanel] }),
        layout.panels,
        {
          yAlign: "top",
        },
      ),
      placeInRegion(resetAllButton, layout.footer, { xAlign: "right", yAlign: "bottom" }),
      listParent,
    ];

    this.pdomPlayAreaNode.pdomOrder = [cursorStar, temperatureSlider, luminositySlider];
    this.pdomControlAreaNode.pdomOrder = [overlayCheckboxes, axisControls, resetAllButton];
  }
}
