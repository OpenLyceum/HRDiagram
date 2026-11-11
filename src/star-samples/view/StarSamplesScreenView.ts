/**
 * StarSamplesScreenView.ts
 *
 * The Star Samples screen: real stars on the HR diagram. Choose the nearest stars, the brightest stars,
 * both lists or only the stars on both; filter by kind of star; click a star (or find one by name) to
 * see its properties. Guides and axis choices sit under the diagram.
 */

import { DerivedProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { Circle, HBox, Node, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, ComboBox } from "scenerystack/sun";
import {
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  HR_DIAGRAM_COMBO_BOX_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/HRDiagramButtonOptions.js";
import { HR_DIAGRAM_CHECKBOX_OPTIONS } from "../../common/HRDiagramControlOptions.js";
import { HRDiagramPanel } from "../../common/HRDiagramPanel.js";
import { BRIGHTEST_LIMIT_V, NAMED_STARS, NEAREST_LIMIT_PC, type Star } from "../../common/model/StarCatalog.js";
import { StarCategory } from "../../common/model/StarCategory.js";
import { AxisControlsNode } from "../../common/view/AxisControlsNode.js";
import { formatInteger } from "../../common/view/format.js";
import { HRChartNode } from "../../common/view/HRChartNode.js";
import { HROverlayNode } from "../../common/view/HROverlayNode.js";
import { OverlayCheckboxGroup } from "../../common/view/OverlayCheckboxGroup.js";
import { chartStripAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { SunMarkerNode } from "../../common/view/SunMarkerNode.js";
import HRDiagramColors from "../../HRDiagramColors.js";
import { FONTS } from "../../HRDiagramConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { StarSample } from "../model/StarSample.js";
import type { StarSamplesModel } from "../model/StarSamplesModel.js";
import { StarCardNode } from "./StarCardNode.js";
import { StarPlotNode } from "./StarPlotNode.js";
import { StarSamplesScreenSummaryContent } from "./StarSamplesScreenSummaryContent.js";

export type StarSamplesScreenViewOptions = ScreenViewOptions;

const CHART_WIDTH = 560;
const CHART_HEIGHT = 420;
const PANEL_CONTENT_WIDTH = 300;

/**
 * Stars offered by "Find a star": NAAP's background table (Betelgeuse, Arcturus, Procyon A, Sirius A,
 * Rigel A, δ Orionis = Mintaka) plus other well-known stars across the diagram.
 */
const FAMOUS_STAR_NAMES = [
  "Sirius",
  "Canopus",
  "Rigil Kentaurus",
  "Arcturus",
  "Vega",
  "Capella",
  "Rigel",
  "Procyon",
  "Betelgeuse",
  "Altair",
  "Aldebaran",
  "Antares",
  "Spica",
  "Pollux",
  "Deneb",
  "Polaris",
  "Mintaka",
  "Proxima Centauri",
  "Barnard's Star",
  "Van Maanen's Star",
];

export class StarSamplesScreenView extends ScreenView {
  public constructor(model: StarSamplesModel, providedOptions?: StarSamplesScreenViewOptions) {
    const options = optionize<StarSamplesScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new StarSamplesScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getStarSamplesStrings();
    const layout = chartStripAndPanelsLayout(this.layoutBounds);
    const listParent = new Node();
    const textNode = (value: TReadOnlyProperty<string>, maxWidth = PANEL_CONTENT_WIDTH, font = FONTS.LABEL): Text =>
      new Text(value, { font, fill: HRDiagramColors.textColorProperty, maxWidth });

    // ── Diagram ───────────────────────────────────────────────────────────────
    const chart = new HRChartNode(
      model.settings.xQuantityProperty,
      model.settings.yQuantityProperty,
      CHART_WIDTH,
      CHART_HEIGHT,
    );
    const starPlot = new StarPlotNode(chart, model.visibleStarsProperty, model.selectedStarProperty, (direction) =>
      model.stepSelection(direction),
    );
    chart.plotLayer.children = [new HROverlayNode(chart, model.settings), new SunMarkerNode(chart), starPlot];

    // ── Stars to plot ─────────────────────────────────────────────────────────
    const sampleNames = strings as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const sampleLabel = (sample: StarSample): TReadOnlyProperty<string> =>
      new DerivedProperty([sampleNames[`${sample.key}StringProperty`] as TReadOnlyProperty<string>], (pattern) =>
        StringUtils.fillIn(pattern, { distance: NEAREST_LIMIT_PC, magnitude: BRIGHTEST_LIMIT_V }),
      );
    const sampleGroup = new AquaRadioButtonGroup(
      model.sampleProperty,
      StarSample.enumeration.values.map((sample) => {
        const label = sampleLabel(sample);
        return {
          value: sample,
          createNode: () => textNode(label, PANEL_CONTENT_WIDTH - 30),
          options: { accessibleName: label },
        };
      }),
      { spacing: 6, radioButtonOptions: { radius: 7 }, accessibleName: strings.sampleTitleStringProperty },
    );
    const shownText = new DerivedProperty(
      [strings.shownPatternStringProperty, model.visibleStarsProperty],
      (pattern, stars) => StringUtils.fillIn(pattern, { count: formatInteger(stars.length) }),
    );
    const legendEntry = (
      color: typeof HRDiagramColors.nearestStarColorProperty,
      label: TReadOnlyProperty<string>,
    ): HBox =>
      new HBox({
        spacing: 4,
        children: [new Circle(4, { fill: color, stroke: "black", lineWidth: 0.5 }), textNode(label, 90, FONTS.SMALL)],
      });
    const legend = new HBox({
      spacing: 12,
      children: [
        legendEntry(HRDiagramColors.nearestStarColorProperty, strings.legendNearestStringProperty),
        legendEntry(HRDiagramColors.brightestStarColorProperty, strings.legendBrightestStringProperty),
        legendEntry(HRDiagramColors.bothStarColorProperty, strings.legendBothStringProperty),
      ],
    });
    const samplePanel = new HRDiagramPanel(
      new VBox({
        spacing: 7,
        align: "left",
        children: [
          textNode(strings.sampleTitleStringProperty, PANEL_CONTENT_WIDTH, FONTS.TITLE),
          sampleGroup,
          legend,
          textNode(shownText),
        ],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + 24 },
    );

    // ── Kinds of star ─────────────────────────────────────────────────────────
    const categoryNames = common.categories as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const categoryCheckboxes = StarCategory.enumeration.values.map((category) => {
      const name = categoryNames[`${category.key}StringProperty`] as TReadOnlyProperty<string>;
      const label = new DerivedProperty(
        [common.countPatternStringProperty, name, model.categoryCountsProperty],
        (pattern, kind, counts) => StringUtils.fillIn(pattern, { label: kind, count: counts.get(category) ?? 0 }),
      );
      const visibleProperty = model.categoryVisibleProperties.get(category);
      if (!visibleProperty) {
        throw new Error(`no visibility for ${category.key}`);
      }
      return new Checkbox(visibleProperty, textNode(label, PANEL_CONTENT_WIDTH - 30), {
        ...HR_DIAGRAM_CHECKBOX_OPTIONS,
        accessibleName: label,
      });
    });
    const kindsPanel = new HRDiagramPanel(
      new VBox({
        spacing: 5,
        align: "left",
        children: [textNode(strings.kindsTitleStringProperty, PANEL_CONTENT_WIDTH, FONTS.TITLE), ...categoryCheckboxes],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + 24 },
    );

    // ── Find a star and its card ──────────────────────────────────────────────
    const famousStars = FAMOUS_STAR_NAMES.flatMap((name) => {
      const star = NAMED_STARS.find((s) => s.name === name);
      return star ? [star] : [];
    }).sort((a, b) => a.name.localeCompare(b.name, "en"));
    const findProperty = new Property<Star | null>(null);
    findProperty.lazyLink((star) => {
      if (star !== null) {
        model.selectedStarProperty.value = star;
      }
    });
    model.selectedStarProperty.link((star) => {
      findProperty.value = star !== null && famousStars.includes(star) ? star : null;
    });
    const findComboBox = new ComboBox(
      findProperty,
      [
        {
          value: null,
          createNode: () =>
            new Text(strings.chooseStarStringProperty, {
              font: FONTS.LABEL,
              fill: LIGHT_SURFACE_TEXT_FILL,
              maxWidth: 150,
            }),
          accessibleName: strings.chooseStarStringProperty,
        },
        ...famousStars.map((star) => ({
          value: star,
          createNode: () => new Text(star.name, { font: FONTS.LABEL, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 150 }),
          accessibleName: star.name,
        })),
      ],
      listParent,
      { ...HR_DIAGRAM_COMBO_BOX_OPTIONS, accessibleName: strings.findStarStringProperty, listPosition: "above" },
    );
    const cardPanel = new HRDiagramPanel(
      new VBox({
        spacing: 8,
        align: "left",
        children: [
          new HBox({ spacing: 8, children: [textNode(strings.findStarStringProperty, 120), findComboBox] }),
          new StarCardNode(model.selectedStarProperty, PANEL_CONTENT_WIDTH),
        ],
      }),
      { minWidth: PANEL_CONTENT_WIDTH + 24 },
    );

    // ── Guides and axes, under the diagram ────────────────────────────────────
    const overlayCheckboxes = new OverlayCheckboxGroup(model.settings, 2);
    const axisControls = new AxisControlsNode(model.settings, listParent);
    const strip = new HRDiagramPanel(
      new HBox({ spacing: 24, align: "center", children: [overlayCheckboxes, axisControls] }),
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
      placeInRegion(new VBox({ spacing: 8, children: [samplePanel, kindsPanel, cardPanel] }), layout.panels, {
        yAlign: "top",
      }),
      placeInRegion(resetAllButton, layout.footer, { xAlign: "right", yAlign: "bottom" }),
      listParent,
    ];

    this.pdomPlayAreaNode.pdomOrder = [starPlot, sampleGroup, ...categoryCheckboxes, findComboBox];
    this.pdomControlAreaNode.pdomOrder = [overlayCheckboxes, axisControls, resetAllButton];
  }
}
