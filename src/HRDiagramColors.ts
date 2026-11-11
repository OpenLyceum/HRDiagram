/**
 * HRDiagramColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import HRDiagramColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import HRDiagramColors from "../../HRDiagramColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: HRDiagramColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the HRDiagramColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import HRDiagramNamespace from "./HRDiagramNamespace.js";

const HRDiagramColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(HRDiagramNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(HRDiagramNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(HRDiagramNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(HRDiagramNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(HRDiagramNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(HRDiagramNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(HRDiagramNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(HRDiagramNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  // ── HR diagram ──────────────────────────────────────────────────────────────

  /** Plotting area of the diagram: night-sky dark by default, white for projectors. */
  chartBackgroundColorProperty: new ProfileColorProperty(HRDiagramNamespace, "chartBackground", {
    default: "#05060f",
    projector: "#ffffff",
  }),

  /** Frame, tick marks and tick labels. */
  axisColorProperty: new ProfileColorProperty(HRDiagramNamespace, "axis", {
    default: "#b8bcd0",
    projector: "#333333",
  }),

  /** Major gridlines. */
  gridColorProperty: new ProfileColorProperty(HRDiagramNamespace, "grid", {
    default: "#262a44",
    projector: "#dddddd",
  }),

  /** The main-sequence band. */
  mainSequenceColorProperty: new ProfileColorProperty(HRDiagramNamespace, "mainSequence", {
    default: "rgba(255,209,102,0.28)",
    projector: "rgba(214,140,0,0.25)",
  }),

  /** Luminosity-class bands and their labels. */
  luminosityClassColorProperty: new ProfileColorProperty(HRDiagramNamespace, "luminosityClass", {
    default: "rgba(150,170,255,0.22)",
    projector: "rgba(60,80,200,0.18)",
  }),
  luminosityClassLabelColorProperty: new ProfileColorProperty(HRDiagramNamespace, "luminosityClassLabel", {
    default: "#9fb0ff",
    projector: "#2c3e9e",
  }),

  /** Lines of equal radius and their labels. */
  isoradiusColorProperty: new ProfileColorProperty(HRDiagramNamespace, "isoradius", {
    default: "#5fd38d",
    projector: "#1b7a3e",
  }),

  /** The instability strip. */
  instabilityStripColorProperty: new ProfileColorProperty(HRDiagramNamespace, "instabilityStrip", {
    default: "rgba(255,120,200,0.22)",
    projector: "rgba(200,40,140,0.18)",
  }),
  instabilityStripLabelColorProperty: new ProfileColorProperty(HRDiagramNamespace, "instabilityStripLabel", {
    default: "#ff8fd0",
    projector: "#a0186e",
  }),

  /** The user's star marker (cross-hair ring). */
  cursorColorProperty: new ProfileColorProperty(HRDiagramNamespace, "cursor", {
    default: "#ff4d4d",
    projector: "#d00000",
  }),

  /** The Sun's marker. */
  sunColorProperty: new ProfileColorProperty(HRDiagramNamespace, "sun", {
    default: "#ffd700",
    projector: "#c98a00",
  }),
  // ── Real stars ──────────────────────────────────────────────────────────────
  // Sample membership follows NAAP's HR Diagram Explorer: nearest red, brightest cyan, both purple.

  nearestStarColorProperty: new ProfileColorProperty(HRDiagramNamespace, "nearestStar", {
    default: "#ff5c5c",
    projector: "#d11a1a",
  }),
  brightestStarColorProperty: new ProfileColorProperty(HRDiagramNamespace, "brightestStar", {
    default: "#3fd6e6",
    projector: "#007f8f",
  }),
  bothStarColorProperty: new ProfileColorProperty(HRDiagramNamespace, "bothStar", {
    default: "#c88dff",
    projector: "#7a1fc2",
  }),

  /** Ring around the selected star, and its hover label. */
  selectionColorProperty: new ProfileColorProperty(HRDiagramNamespace, "selection", {
    default: "#ffffff",
    projector: "#000000",
  }),

  // Kinds of star (Gaia Census "colour by kind").
  dwarfColorProperty: new ProfileColorProperty(HRDiagramNamespace, "dwarf", {
    default: "#d9d4c7",
    projector: "#6b6455",
  }),
  subgiantColorProperty: new ProfileColorProperty(HRDiagramNamespace, "subgiant", {
    default: "#4fd1b5",
    projector: "#14806a",
  }),
  giantColorProperty: new ProfileColorProperty(HRDiagramNamespace, "giant", {
    default: "#ffad5c",
    projector: "#c25e00",
  }),
  supergiantColorProperty: new ProfileColorProperty(HRDiagramNamespace, "supergiant", {
    default: "#ff4f6d",
    projector: "#b3001e",
  }),
  whiteDwarfColorProperty: new ProfileColorProperty(HRDiagramNamespace, "whiteDwarf", {
    default: "#7fb3ff",
    projector: "#1f5fbf",
  }),
};

export default HRDiagramColors;
