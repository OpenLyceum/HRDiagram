/**
 * Memory-leak regression suite (fleet standard).
 *
 * Nearly every node in this sim lives as long as the sim. What is rebuilt at runtime is the guide
 * overlay (paths and labels redrawn on every toggle and axis change) and the chart's tick labels and
 * axis titles, so those are checked here: repeated redraws must not pile up listeners on the global
 * string Properties. The point cloud is the one node with its own dispose() and goes through the
 * shared harness.
 *
 * Beyond that:
 *  - the four screen models (and the Properties they derive) are plain object graphs and must be
 *    collectible as a unit however they were driven;
 *  - PointCloudNode, built on a long-lived ChartTransform as in the sim, must release the transform's
 *    emitter when disposed;
 *  - HRChartNode, CursorStarNode, SizeComparisonNode, StarCardNode and StarPlotNode link model and
 *    string Properties in Multilinks that are never torn down (they live as long as their screen),
 *    so they stay out of the disposal list; instead, driving the models must not pile listeners onto
 *    the Properties they observe.
 */

import { ChartTransform } from "scenerystack/bamboo";
import { Range } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { AxisQuantity } from "../src/common/model/AxisQuantity.js";
import { DiagramSettings } from "../src/common/model/DiagramSettings.js";
import type { MovableStar } from "../src/common/model/MovableStar.js";
import { NAMED_STARS } from "../src/common/model/StarCatalog.js";
import { CursorStarNode } from "../src/common/view/CursorStarNode.js";
import { HRChartNode } from "../src/common/view/HRChartNode.js";
import { HROverlayNode } from "../src/common/view/HROverlayNode.js";
import { PointCloudNode } from "../src/common/view/PointCloudNode.js";
import { SizeComparisonNode } from "../src/common/view/SizeComparisonNode.js";
import { ExploreModel } from "../src/explore/model/ExploreModel.js";
import { ColorBy } from "../src/gaia-census/model/ColorBy.js";
import { GaiaCensusModel } from "../src/gaia-census/model/GaiaCensusModel.js";
import HRDiagramColors from "../src/HRDiagramColors.js";
import { StringManager } from "../src/i18n/StringManager.js";
import { RadiusModel } from "../src/radius/model/RadiusModel.js";
import { StarConstraint } from "../src/radius/model/StarConstraint.js";
import { StarSample } from "../src/star-samples/model/StarSample.js";
import { StarSamplesModel } from "../src/star-samples/model/StarSamplesModel.js";
import { StarCardNode } from "../src/star-samples/view/StarCardNode.js";
import { StarPlotNode } from "../src/star-samples/view/StarPlotNode.js";
import { describeDisposalLeaks, forceGC } from "./helpers/memoryLeak.js";

describeDisposalLeaks([
  {
    name: "PointCloudNode",
    create: () => new PointCloudNode(new ChartTransform({ viewWidth: 100, viewHeight: 100 })),
  },
]);

/** Listener count of a Property (public at runtime, private in the type declarations). */
const listenerCount = (property: object): number =>
  (property as unknown as { getListenerCount(): number }).getListenerCount();

describe("redraws do not accumulate listeners", () => {
  const strings = StringManager.getInstance().getCommonStrings();

  it("toggling guides leaves the class-label listeners unchanged", () => {
    const settings = new DiagramSettings({ luminosityClassesVisible: true });
    const chart = new HRChartNode(settings.xQuantityProperty, settings.yQuantityProperty, 400, 300);
    new HROverlayNode(chart, settings);
    const property = strings.classLabels.IIIStringProperty;
    const before = listenerCount(property);
    for (let i = 0; i < 20; i++) {
      settings.luminosityClassesVisibleProperty.toggle();
      settings.instabilityStripVisibleProperty.toggle();
      settings.isoradiusVisibleProperty.toggle();
    }
    expect(listenerCount(property)).toBe(before);
  });

  it("switching axes leaves the axis-title and class-label listeners unchanged", () => {
    const settings = new DiagramSettings({ luminosityClassesVisible: true });
    const chart = new HRChartNode(settings.xQuantityProperty, settings.yQuantityProperty, 400, 300);
    new HROverlayNode(chart, settings);
    const title = strings.axes.temperatureStringProperty;
    const label = strings.classLabels.VStringProperty;
    const titleBefore = listenerCount(title);
    const labelBefore = listenerCount(label);
    for (let i = 0; i < 10; i++) {
      for (const x of AxisQuantity.HORIZONTAL) {
        settings.xQuantityProperty.value = x;
      }
      settings.yQuantityProperty.value = AxisQuantity.ABSOLUTE_MAGNITUDE;
      settings.yQuantityProperty.value = AxisQuantity.LUMINOSITY;
    }
    settings.xQuantityProperty.value = AxisQuantity.TEMPERATURE;
    expect(listenerCount(title)).toBe(titleBefore);
    expect(listenerCount(label)).toBe(labelBefore);
  });
});

// Screen models have no dispose(); they own their Properties for the life of the page. Dropping
// a driven instance must still release the whole graph (no module-level retention).
type ScreenModel = ExploreModel | RadiusModel | StarSamplesModel | GaiaCensusModel;

const SCREEN_MODELS: readonly { name: string; create: () => ScreenModel }[] = [
  { name: "ExploreModel", create: () => new ExploreModel() },
  { name: "RadiusModel", create: () => new RadiusModel() },
  { name: "StarSamplesModel", create: () => new StarSamplesModel() },
  { name: "GaiaCensusModel", create: () => new GaiaCensusModel() },
];

function createAndDropModel(create: () => ScreenModel): WeakRef<object> {
  const model = create();
  model.reset();
  model.step(1 / 60);
  return new WeakRef<object>(model);
}

describe("Screen models (no dispose(): create/drop)", () => {
  for (const { name, create } of SCREEN_MODELS) {
    it(`${name} is collected after drop`, async () => {
      const ref = createAndDropModel(create);
      await forceGC(ref);
      expect(ref.deref()).toBeUndefined();
    });

    it(`${name}: repeated create/drop cycles leave no survivors`, async () => {
      const refs: WeakRef<object>[] = [];
      for (let i = 0; i < 10; i++) {
        refs.push(createAndDropModel(create));
      }
      await forceGC(refs);
      expect(refs.filter((r) => r.deref() !== undefined).length).toBe(0);
    });
  }
});

const survivors = (refs: readonly WeakRef<object>[]): number => refs.filter((r) => r.deref() !== undefined).length;

/** Cycles every axis quantity and every overlay, as the controls do. */
function driveSettings(settings: DiagramSettings): void {
  for (const x of settings.horizontalQuantities) {
    settings.xQuantityProperty.value = x;
  }
  for (const y of settings.verticalQuantities) {
    settings.yQuantityProperty.value = y;
  }
  settings.mainSequenceVisibleProperty.toggle();
  settings.luminosityClassesVisibleProperty.toggle();
  settings.isoradiusVisibleProperty.toggle();
  settings.instabilityStripVisibleProperty.toggle();
  settings.reset();
}

function driveStar(star: MovableStar): void {
  star.setTemperatureLuminosity(3000, 0.01);
  star.setTemperatureLuminosity(30000, 1e5);
  star.setTemperatureLuminosity(Number.NaN, -1);
  star.reset();
}

function driveExplore(model: ExploreModel): void {
  driveSettings(model.settings);
  driveStar(model.star);
  model.reset();
}

function driveRadius(model: RadiusModel): void {
  driveSettings(model.settings);
  for (const constraint of StarConstraint.enumeration.values) {
    model.constraintProperty.value = constraint;
    const { temperature, luminosity } = model.constrain(model.starA, 8000, 10);
    model.starA.setTemperatureLuminosity(temperature, luminosity);
    model.starB.setTemperatureLuminosity(2000, 0.001);
  }
  model.reset();
}

function driveStarSamples(model: StarSamplesModel): void {
  driveSettings(model.settings);
  for (const sample of StarSample.enumeration.values) {
    model.sampleProperty.value = sample;
    model.stepSelection(1);
    model.stepSelection(-1);
  }
  for (const property of model.categoryVisibleProperties.values()) {
    property.value = false;
    model.stepSelection(1);
    property.value = true;
  }
  model.selectedStarProperty.value = NAMED_STARS[0] ?? null;
  model.reset();
}

function driveGaia(model: GaiaCensusModel): void {
  driveSettings(model.settings);
  model.distanceLimitProperty.value = model.distanceLimitProperty.range.min;
  model.distanceLimitProperty.value = model.distanceLimitProperty.range.max;
  model.brightnessLimitEnabledProperty.value = true;
  model.brightnessLimitProperty.value = model.brightnessLimitProperty.range.min;
  model.colorByProperty.value = ColorBy.DISTANCE;
  expect(model.selectionProperty.value.count).toBeGreaterThanOrEqual(0);
  model.reset();
}

const modelCases: readonly (readonly [string, () => WeakRef<object>])[] = [
  [
    "ExploreModel",
    () => {
      const model = new ExploreModel();
      driveExplore(model);
      return new WeakRef<object>(model);
    },
  ],
  [
    "RadiusModel",
    () => {
      const model = new RadiusModel();
      driveRadius(model);
      return new WeakRef<object>(model);
    },
  ],
  [
    "StarSamplesModel",
    () => {
      const model = new StarSamplesModel();
      driveStarSamples(model);
      return new WeakRef<object>(model);
    },
  ],
  [
    "GaiaCensusModel",
    () => {
      const model = new GaiaCensusModel();
      driveGaia(model);
      return new WeakRef<object>(model);
    },
  ],
];

describe("screen models are collected after drop", () => {
  for (const [name, createAndDrop] of modelCases) {
    it(`${name} is collected after drop`, async () => {
      const ref = createAndDrop();
      await forceGC(ref);
      expect(ref.deref()).toBeUndefined();
    });

    it(`${name}: repeated create/drop cycles leave no survivors`, async () => {
      const refs = Array.from({ length: 10 }, createAndDrop);
      await forceGC(refs);
      expect(survivors(refs)).toBe(0);
    });
  }
});

describe("PointCloudNode on a long-lived ChartTransform", () => {
  /** Listener count of an Emitter (public at runtime, private in the type declarations). */
  const emitterListeners = (transform: ChartTransform): number =>
    (transform.changedEmitter as unknown as { getListenerCount(): number }).getListenerCount();

  const createAndDispose = (transform: ChartTransform): WeakRef<object> => {
    const cloud = new PointCloudNode(transform);
    transform.setModelXRange(new Range(0, 1 + transform.modelXRange.max));
    const ref = new WeakRef<object>(cloud);
    cloud.dispose();
    return ref;
  };

  it("is collected after dispose and leaves no listener on the transform", async () => {
    const transform = new ChartTransform({ viewWidth: 100, viewHeight: 100 });
    const before = emitterListeners(transform);
    const refs = Array.from({ length: 10 }, () => createAndDispose(transform));
    await forceGC(refs);
    expect(survivors(refs)).toBe(0);
    expect(emitterListeners(transform)).toBe(before);
  });
});

describe("driving the models does not accumulate listeners", () => {
  const strings = StringManager.getInstance();
  const common = strings.getCommonStrings();
  const starSamples = strings.getStarSamplesStrings();

  it("HRChartNode and CursorStarNode: moving the star and changing axes leaves listeners unchanged", () => {
    const model = new ExploreModel();
    const chart = new HRChartNode(model.settings.xQuantityProperty, model.settings.yQuantityProperty, 400, 300);
    new CursorStarNode(
      chart,
      model.star.temperatureProperty,
      model.star.luminosityProperty,
      (temperature, luminosity) => model.star.setTemperatureLuminosity(temperature, luminosity),
    );
    const properties = [
      model.settings.xQuantityProperty,
      model.settings.yQuantityProperty,
      model.star.temperatureProperty,
      model.star.luminosityProperty,
      common.quantities.temperatureStringProperty,
      common.quantities.luminosityStringProperty,
      HRDiagramColors.cursorColorProperty,
      HRDiagramColors.textColorProperty,
    ];
    const before = properties.map(listenerCount);
    for (let i = 0; i < 5; i++) {
      driveExplore(model);
    }
    expect(properties.map(listenerCount)).toEqual(before);
  });

  it("SizeComparisonNode: resizing both stars leaves listeners unchanged", () => {
    const model = new RadiusModel();
    new SizeComparisonNode(
      {
        temperatureProperty: model.starA.temperatureProperty,
        radiusProperty: model.starA.radiusProperty,
        labelProperty: common.size.starStringProperty,
      },
      {
        temperatureProperty: model.starB.temperatureProperty,
        radiusProperty: model.starB.radiusProperty,
        labelProperty: common.size.starStringProperty,
      },
    );
    const properties = [
      model.starA.temperatureProperty,
      model.starA.radiusProperty,
      model.starB.temperatureProperty,
      model.starB.radiusProperty,
      common.size.starStringProperty,
      common.size.tooSmallStringProperty,
    ];
    const before = properties.map(listenerCount);
    for (let i = 0; i < 5; i++) {
      driveRadius(model);
    }
    expect(properties.map(listenerCount)).toEqual(before);
  });

  it("StarCardNode: selecting stars leaves listeners unchanged", () => {
    const model = new StarSamplesModel();
    new StarCardNode(model.selectedStarProperty, 300);
    const properties = [
      model.selectedStarProperty,
      starSamples.distancePatternStringProperty,
      starSamples.notCataloguedStringProperty,
      common.units.kelvinPatternStringProperty,
      HRDiagramColors.textColorProperty,
    ];
    const before = properties.map(listenerCount);
    for (const star of NAMED_STARS) {
      model.selectedStarProperty.value = star;
    }
    for (let i = 0; i < 5; i++) {
      driveStarSamples(model);
    }
    expect(properties.map(listenerCount)).toEqual(before);
  });

  it("StarPlotNode: changing sample, categories and selection leaves listeners unchanged", () => {
    const model = new StarSamplesModel();
    const chart = new HRChartNode(model.settings.xQuantityProperty, model.settings.yQuantityProperty, 400, 300);
    new StarPlotNode(chart, model.visibleStarsProperty, model.selectedStarProperty, (direction) =>
      model.stepSelection(direction),
    );
    const properties = [
      model.visibleStarsProperty,
      model.selectedStarProperty,
      model.settings.xQuantityProperty,
      chart.chartTransform.changedEmitter,
      HRDiagramColors.nearestStarColorProperty,
      HRDiagramColors.brightestStarColorProperty,
      HRDiagramColors.bothStarColorProperty,
      HRDiagramColors.selectionColorProperty,
    ];
    const before = properties.map(listenerCount);
    for (let i = 0; i < 5; i++) {
      driveStarSamples(model);
    }
    expect(properties.map(listenerCount)).toEqual(before);
  });
});
