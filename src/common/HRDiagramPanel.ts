/**
 * HRDiagramPanel.ts
 *
 * A pre-themed Panel that automatically uses HRDiagramColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { HRDiagramPanel } from "../../common/HRDiagramPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new HRDiagramPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new HRDiagramPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new HRDiagramPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import HRDiagramColors from "../HRDiagramColors.js";
import { PANEL_CORNER_RADIUS } from "../HRDiagramConstants.js";

export type HRDiagramPanelOptions = PanelOptions;

export class HRDiagramPanel extends Panel {
  public constructor(content: Node, providedOptions?: HRDiagramPanelOptions) {
    const options = optionize<HRDiagramPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: HRDiagramColors.panelBackgroundColorProperty,
        stroke: HRDiagramColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
