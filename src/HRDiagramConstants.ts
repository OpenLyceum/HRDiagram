/**
 * HRDiagramConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Physics / model values use SI units (metres, seconds, kilograms, …);
 *    note the unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in HRDiagramColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 *
 * Remove the example constants below and replace them with the sim's own.
 */

import { PhetFont } from "scenerystack/scenery-phet";
import HRDiagramNamespace from "./HRDiagramNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Gap between neighbouring layout regions. */
export const REGION_GAP = 12;

/** Fonts used across the sim. */
export const FONTS = {
  TITLE: new PhetFont({ size: 15, weight: "bold" }),
  LABEL: new PhetFont(13),
  READOUT: new PhetFont(14),
  AXIS_TITLE: new PhetFont(14),
  TICK: new PhetFont(11),
  CHART_LABEL: new PhetFont(11),
  SMALL: new PhetFont(11),
} as const;

/** Radius (view px) within which a click picks the nearest plotted star. */
export const PICK_DISTANCE = 9;

// ── Model ranges ──────────────────────────────────────────────────────────────
// The sim works in solar units (L☉, R☉) and kelvin, not SI: the HR diagram is drawn in them.

/** Temperatures (K) the user's star can take. */
export const CURSOR_TEMPERATURE_RANGE = { min: 2300, max: 40000 } as const;

/** Luminosities (L☉) the user's star can take. */
export const CURSOR_LUMINOSITY_RANGE = { min: 1e-4, max: 1e6 } as const;

HRDiagramNamespace.register("HRDiagramConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  REGION_GAP,
  PICK_DISTANCE,
  CURSOR_TEMPERATURE_RANGE,
  CURSOR_LUMINOSITY_RANGE,
});
