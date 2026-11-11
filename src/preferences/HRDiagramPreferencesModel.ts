/**
 * HRDiagramPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in hRDiagramQueryParameters.
 *
 * Remove the example preference (and its query parameter / UI control) if the
 * sim has no sim-specific preferences.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import HRDiagramNamespace from "../HRDiagramNamespace.js";
import hRDiagramQueryParameters from "./hRDiagramQueryParameters.js";

export class HRDiagramPreferencesModel {
  /** Example preference; initial value comes from the `exampleToggle` query parameter. */
  public readonly exampleToggleProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.exampleToggleProperty = new BooleanProperty(
      hRDiagramQueryParameters.exampleToggle,
      tandem ? { tandem: tandem.createTandem("exampleToggleProperty") } : undefined,
    );
  }

  public reset(): void {
    this.exampleToggleProperty.reset();
  }
}

HRDiagramNamespace.register("HRDiagramPreferencesModel", HRDiagramPreferencesModel);
