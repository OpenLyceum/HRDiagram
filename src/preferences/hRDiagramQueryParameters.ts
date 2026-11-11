/**
 * hRDiagramQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) must set `public: true`.
 *
 * ── How to add a query parameter ──────────────────────────────────────────────
 * 1. Add an entry below with a `type`, `defaultValue`, and (if user-facing)
 *    `public: true`. Add `isValidValue` to bound numeric ranges.
 * 2. If it should also be user-editable at runtime, surface it as a preference
 *    in HRDiagramPreferencesModel (initialize that Property from this query parameter).
 *
 * Usage: append e.g. `?showEquations=false` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import HRDiagramNamespace from "../HRDiagramNamespace.js";

const hRDiagramQueryParameters = QueryStringMachine.getAll({
  /**
   * Shows the Stefan–Boltzmann relations: R = √L ÷ (T/T☉)² under the Explore readouts, and the rule
   * and worked ratio on the Radius screen. On by default (the sim is pitched at intro college);
   * `?showEquations=false` hides them for younger students.
   */
  showEquations: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },
});

HRDiagramNamespace.register("hRDiagramQueryParameters", hRDiagramQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default hRDiagramQueryParameters;
