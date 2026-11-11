/**
 * HRDiagramPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in hRDiagramQueryParameters.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import HRDiagramNamespace from "../HRDiagramNamespace.js";
import hRDiagramQueryParameters from "./hRDiagramQueryParameters.js";

export class HRDiagramPreferencesModel {
  /** Whether the Stefan–Boltzmann relations are shown; starts from the `showEquations` query parameter. */
  public readonly showEquationsProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.showEquationsProperty = new BooleanProperty(
      hRDiagramQueryParameters.showEquations,
      tandem ? { tandem: tandem.createTandem("showEquationsProperty") } : undefined,
    );
  }

  public reset(): void {
    this.showEquationsProperty.reset();
  }
}

HRDiagramNamespace.register("HRDiagramPreferencesModel", HRDiagramPreferencesModel);
