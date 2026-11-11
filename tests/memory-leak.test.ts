/**
 * Memory-leak regression suite (fleet standard).
 *
 * Nearly every node in this sim lives as long as the sim. What is rebuilt at runtime is the guide
 * overlay (paths and labels redrawn on every toggle and axis change) and the chart's tick labels and
 * axis titles, so those are checked here: repeated redraws must not pile up listeners on the global
 * string Properties. The point cloud is the one node with its own dispose() and goes through the
 * shared harness.
 */

import { ChartTransform } from "scenerystack/bamboo";
import { describe, expect, it } from "vitest";
import { AxisQuantity } from "../src/common/model/AxisQuantity.js";
import { DiagramSettings } from "../src/common/model/DiagramSettings.js";
import { HRChartNode } from "../src/common/view/HRChartNode.js";
import { HROverlayNode } from "../src/common/view/HROverlayNode.js";
import { PointCloudNode } from "../src/common/view/PointCloudNode.js";
import { StringManager } from "../src/i18n/StringManager.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

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
