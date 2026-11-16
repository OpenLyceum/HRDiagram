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
 *  - Model values use solar units (L☉, R☉) and kelvin where the HR diagram
 *    is drawn in them; note the unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels (view px).
 *  - Colour strings live in HRDiagramColors.ts, not here.
 *  - Display strings live in strings_*.json, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 */

import { Dimension2 } from "scenerystack/dot";
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
  PREFERENCES_TITLE: new PhetFont({ size: 18, weight: "bold" }),
  PREFERENCES_LABEL: new PhetFont(14),
} as const;

/** Radius (view px) within which a click picks the nearest plotted star. */
export const PICK_DISTANCE = 9;

/** Shared panel margins, content width and the right-hand column (view px). */
export const PANEL = {
  /** Inner content width of side-panel controls. */
  CONTENT_WIDTH: 300,
  /** Extra width added to CONTENT_WIDTH for panel minWidth (2 × X_MARGIN). */
  MIN_WIDTH_INSET: 24,
  X_MARGIN: 12,
  Y_MARGIN: 10,
  /** Width of the right-hand column in ScreenLayout. */
  COLUMN_WIDTH: 336,
  /** Shrinkage applied to labels inside a panel (CONTENT_WIDTH − this). */
  LABEL_INSET: 30,
} as const;

/** Screen region sizes beyond the shared margin and gap (view px). */
export const LAYOUT = {
  FOOTER_HEIGHT: 46,
  STRIP_HEIGHT: 96,
} as const;

/**
 * Chart plot sizes (view px). Explore and Radius use the taller frame; Star Samples
 * and Gaia Census use the shorter one so the settings strip fits underneath.
 */
export const CHART = {
  WIDTH: 560,
  TALL_HEIGHT: 500,
  SHORT_HEIGHT: 420,
} as const;

/** Tick and title placement around the chart frame (view px). */
export const CHART_FRAME = {
  TICK_LENGTH: 5,
  MINOR_TICK_LENGTH: 3,
  LABEL_GAP: 3,
  TITLE_GAP: 6,
  LINE_WIDTH: 1,
} as const;

/** Movable cursor-star marker geometry and keyboard steps (view px). */
export const CURSOR_STAR = {
  RING_RADIUS: 10,
  CROSS_LENGTH: 6,
  /** Inset of each cross-hair arm from the ring (view px). */
  CROSS_INSET: 3,
  DISC_RADIUS: 4.5,
  RING_LINE_WIDTH: 2,
  DISC_LINE_WIDTH: 0.5,
  /** View pixels per arrow-key press. */
  KEY_STEP: 8,
  /** View pixels per Shift+arrow press. */
  FINE_KEY_STEP: 1.5,
  /** Extra touch-area padding beyond the cross-hair (view px). */
  TOUCH_PADDING: 8,
  LABEL_MAX_WIDTH: 30,
} as const;

/** Side-by-side star size comparison (view px). */
export const SIZE_COMPARISON = {
  /** Radius of the larger disc. */
  MAX_DISC_RADIUS: 46,
  /** Below this drawn radius the disc becomes a visible dot. */
  MIN_VISIBLE_RADIUS: 1.5,
  DOT_RADIUS: 1.5,
  /** Extra gap between disc centres beyond 2 × MAX_DISC_RADIUS. */
  CENTRE_GAP: 36,
  LABEL_INSET: 6,
  CAPTION_TOP_GAP: 6,
  GRADIENT_OFFSET_FACTOR: 0.3,
  GRADIENT_BRIGHTER: 0.35,
  GRADIENT_DARKER: 0.25,
} as const;

/** Sun marker on the diagram (view px). */
export const SUN_MARKER = {
  SYMBOL_RADIUS: 6,
  DOT_RADIUS: 1.6,
  LINE_WIDTH: 1.6,
  LABEL_MAX_WIDTH: 60,
  LABEL_X_GAP: 3,
  LABEL_Y_OFFSET: 2,
} as const;

/** Guide overlays: band widths, label placement, isoradius sampling. */
export const OVERLAY = {
  /** Main-sequence band stroke width (view px). */
  BAND_WIDTH: 12,
  /** Luminosity-class band stroke width (view px). */
  CLASS_BAND_WIDTH: 9,
  /** Keep labels this far inside the chart frame (view px). */
  LABEL_MARGIN: 6,
  ISORADIUS_LINE_WIDTH: 1.2,
  ISORADIUS_DASH: [6, 4] as const,
  /** Margin used when placing an isoradius label inside the frame (view px). */
  ISORADIUS_LABEL_MARGIN: 28,
  /** Samples along each edge of the instability strip (dimensionless). */
  STRIP_EDGE_SAMPLES: 20,
  /** Label anchor just outside the hot edge of the strip (K, L☉). */
  STRIP_LABEL_TEMPERATURE: 7900,
  STRIP_LABEL_LUMINOSITY: 40,
  STRIP_LABEL_MAX_WIDTH: 120,
  CLASS_LABEL_MAX_WIDTH: 150,
  /** Log-spaced temperatures along a line of equal radius. */
  ISORADIUS_SAMPLE_COUNT: 61,
  /** Hottest temperature sampled on an isoradius line (K). */
  ISORADIUS_T_MAX: 50000,
  /** log₁₀ span from hottest to coolest sample (dimensionless). */
  ISORADIUS_LOG_SPAN: 1.4,
} as const;

/** Radii (R☉) of the lines of equal radius. */
export const ISORADIUS_VALUES = [0.001, 0.01, 0.1, 1, 10, 100, 1000] as const;

/** Star Samples plot markers (view px and dimensionless alpha). */
export const STAR_SAMPLE_MARKERS = {
  DOT_RADIUS: 3.5,
  /** Selection / hover ring. */
  RING_RADIUS: 8,
  /** Extra radius for stars on both lists (squares). */
  BOTH_RADIUS_EXTRA: 1,
  ALPHA: 0.9,
  BOTH_ALPHA: 1,
  RING_LINE_WIDTH: 2,
  LABEL_MAX_WIDTH: 200,
  LABEL_X_GAP: 3,
  LABEL_Y_GAP: 2,
  LABEL_EDGE_INSET: 4,
  LABEL_FLIP_TOP: 4,
} as const;

/** Gaia Census plot and kinds table (view px, pc, magnitudes). */
export const GAIA = {
  POINT_RADIUS: 1.4,
  /** Extra radius for non-dwarf markers. */
  GIANT_RADIUS_EXTRA: 0.4,
  DWARF_ALPHA: 0.6,
  OTHER_ALPHA: 0.85,
  BAR_MAX_WIDTH: 70,
  BAR_HEIGHT: 10,
  /** Minimum bar width so a tiny share stays visible (view px). */
  BAR_MIN_WIDTH: 0.5,
  DISTANCE_BIN_WIDTH: 20, // pc
  SLIDER_TRACK_WIDTH: 260,
  /** Default / max distance cut (pc). */
  DISTANCE_DEFAULT: 100,
  DISTANCE_MIN: 5,
  DISTANCE_MAX: 100,
  /** Apparent-V range for the brightness limit. */
  BRIGHTNESS_MIN: 3,
  BRIGHTNESS_MAX: 16,
  /** Rough naked-eye limit (apparent V). */
  NAKED_EYE_LIMIT_V: 6,
  CATEGORY_SWATCH_RADIUS: 5,
  LEGEND_DOT_RADIUS: 4,
  RADIO_BUTTON_RADIUS: 7,
} as const;

/** Explore-screen log-axis slider track and steps. */
export const EXPLORE_SLIDERS = {
  TRACK_WIDTH: 270,
  /** Steps in log₁₀ units. */
  KEYBOARD_STEP: 0.01,
  SHIFT_KEYBOARD_STEP: 0.002,
  PAGE_KEYBOARD_STEP: 0.1,
} as const;

/** Gaia Census slider keyboard steps (pc or magnitudes). */
export const GAIA_SLIDERS = {
  DISTANCE_KEYBOARD_STEP: 5,
  DISTANCE_SHIFT_STEP: 1,
  DISTANCE_PAGE_STEP: 20,
  BRIGHTNESS_KEYBOARD_STEP: 0.5,
  BRIGHTNESS_SHIFT_STEP: 0.1,
  BRIGHTNESS_PAGE_STEP: 2,
} as const;

/** Shared control chrome sizes (view px); arrow-button scale is dimensionless. */
export const CONTROLS = {
  THUMB_SIZE: new Dimension2(12, 22),
  STANDALONE_TRACK_SIZE: new Dimension2(150, 3),
  NUMBER_CONTROL_TRACK_SIZE: new Dimension2(110, 3),
  CHECKBOX_BOX_WIDTH: 16,
  CHECKBOX_SPACING: 4,
  ARROW_BUTTON_SCALE: 0.75,
  SLIDER_PADDING: 4,
  ARROW_BUTTON_SPACING: 3,
  VERTICAL_SPACING: 4,
  RADIO_BUTTON_RADIUS: 7,
} as const;

/** Axis combo-box label widths (view px). */
export const AXIS_CONTROLS = {
  ITEM_MAX_WIDTH: 190,
  LABEL_MAX_WIDTH: 90,
  ROW_SPACING: 8,
  VBOX_SPACING: 6,
} as const;

/** Overlay checkbox group (view px). */
export const OVERLAY_CHECKBOXES = {
  LABEL_MAX_WIDTH: 240,
  /** Extra width granted per column beyond the first. */
  MULTI_COLUMN_BONUS: 40,
  X_SPACING: 16,
  Y_SPACING: 6,
} as const;

/** Star card column widths and the pc→ly conversion. */
export const STAR_CARD = {
  /** Light-years per parsec. */
  LIGHT_YEARS_PER_PARSEC: 3.2616,
  VALUE_MAX_WIDTH: 170,
  LABEL_MAX_WIDTH: 130,
  X_SPACING: 10,
  Y_SPACING: 3,
  VBOX_SPACING: 6,
} as const;

/** Preferences dialog spacing (view px). */
export const PREFERENCES_LAYOUT = {
  CHECKBOX_SPACING: 8,
  SECTION_SPACING: 12,
} as const;

/** Home-screen icon canvas (view px). */
export const SCREEN_ICONS = {
  WIDTH: 548,
  HEIGHT: 373,
} as const;

// ── Model ranges and classification ───────────────────────────────────────────
// The sim works in solar units (L☉, R☉) and kelvin, not SI: the HR diagram is drawn in them.

/** Temperatures (K) the user's star can take. */
export const CURSOR_TEMPERATURE_RANGE = { min: 2300, max: 40000 } as const;

/** Luminosities (L☉) the user's star can take. */
export const CURSOR_LUMINOSITY_RANGE = { min: 1e-4, max: 1e6 } as const;

/** Initial luminosities (L☉) and Radius-screen temperature factor for star B. */
export const MODEL_DEFAULTS = {
  INITIAL_LUMINOSITY: 1, // L☉
  /** Star B starts this many times as hot as star A. */
  RADIUS_STAR_B_TEMPERATURE_FACTOR: 2,
} as const;

/**
 * Kind-of-star thresholds used when classifying catalogue stars.
 * Absolute magnitudes are dimensionless; luminosity ratios are L / L_MS(T);
 * temperatures are kelvin; Gaia "above main sequence" values are magnitudes.
 */
export const STAR_CATEGORY = {
  MAX_GIANT_ABSOLUTE_G: 5,
  MAX_GIANT_ABSOLUTE_V: 5.5,
  /** Cool catalogued giants below this luminosity ratio are treated as catalogue errors. */
  MIN_GIANT_LUMINOSITY_RATIO: 2,
  /** Only stars cooler than this (K) are checked for the giant overrule. */
  OVERRULE_BELOW_TEMPERATURE: 5500,
  /** L / L_MS below this → white dwarf (position-based). */
  WHITE_DWARF_LUMINOSITY_RATIO: 0.02,
  /** L / L_MS below this (or faint absolute V) → dwarf. */
  DWARF_LUMINOSITY_RATIO: 4,
  /** L / L_MS below this (and hot enough) → subgiant. */
  SUBGIANT_LUMINOSITY_RATIO: 20,
  SUBGIANT_MIN_TEMPERATURE: 4600, // K
  SUPERGIANT_MIN_LUMINOSITY: 3e4, // L☉
  /** Magnitudes below the main sequence → white dwarf (Gaia). */
  GAIA_WHITE_DWARF_ABOVE: -4,
  /** Magnitudes above the main sequence still counted as dwarf (Gaia). */
  GAIA_DWARF_ABOVE: 1.5,
  /** Magnitudes above the main sequence still counted as subgiant (Gaia). */
  GAIA_SUBGIANT_ABOVE: 3.5,
  GAIA_SUBGIANT_MAX_BP_RP: 1.2,
  GAIA_SUPERGIANT_MAX_ABSOLUTE_G: -3,
} as const;

/** Point-cloud stroke width when a style supplies an outline (view px). */
export const POINT_CLOUD = {
  STROKE_WIDTH: 0.6,
  /** Diamond marker extent relative to radius. */
  DIAMOND_FACTOR: 1.3,
  /** Square marker half-extent relative to radius. */
  SQUARE_FACTOR: 0.95,
  /** Marker-icon canvas padding factor beyond 2 × radius. */
  ICON_PAD_FACTOR: 1.4,
  ICON_PAD: 2,
} as const;

/** Settings for common/HRDiagramScreenIcons.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const HR_DIAGRAM_SCREEN_ICONS_SETTINGS = {
  RING_RADIUS: 26, // px
  RING_X_SEGMENT_2: -18, // px
  RING_X_SEGMENT_3: 18, // px
  RING_X_SEGMENT_4: 46, // px
  RING_Y_SEGMENT_2: -18, // px
  RING_Y_SEGMENT_3: 18, // px
  RING_Y_SEGMENT_4: 46, // px
  CREATE_EXPLORE_ICON_RADIUS: 12, // px
  CREATE_RADIUS_ICON_RADIUS: 130, // px
  CREATE_RADIUS_ICON_RADIUS_SEGMENT_2: 22, // px

  CREATE_RADIUS_ICON_LINE_DASH_DASH: 14, // px

  MAIN_SEQUENCE_BAND_LINE_WIDTH: 34,
  RING_X: -46,
  RING_Y: -46,
  RING_LINE_WIDTH: 7,
  CREATE_RADIUS_ICON_LINE_WIDTH: 4,
  DOT_RADIUS: 9,
  DOT_LINE_WIDTH: 1.5,
  /** Create gaia census icon opacity (dimensionless). */
  CREATE_GAIA_CENSUS_ICON_OPACITY: 0.8,
} as const;

/** Settings for common/model/AxisQuantity.ts. */
export const AXIS_QUANTITY_SETTINGS = {
  /** Temperature range min (K). */
  TEMPERATURE_RANGE_MIN: 2000,
  /** Temperature range max (K). */
  TEMPERATURE_RANGE_MAX: 50000,
  /** Color index range min (dimensionless). */
  COLOR_INDEX_RANGE_MIN: -0.4,
  /** Color index range max (dimensionless). */
  COLOR_INDEX_RANGE_MAX: 2.2,
  /** Spectral type range max (spectral code). */
  SPECTRAL_TYPE_RANGE_MAX: 70,
  /** Bp rp range min (magnitudes). */
  BP_RP_RANGE_MIN: -0.6,
  /** Bp rp range max (magnitudes). */
  BP_RP_RANGE_MAX: 5.2,
  /** Luminosity range min (solar luminosities). */
  LUMINOSITY_RANGE_MIN: 1e-5,
  /** Luminosity range max (solar luminosities). */
  LUMINOSITY_RANGE_MAX: 1e7,
  /** Absolute magnitude range min (magnitudes). */
  ABSOLUTE_MAGNITUDE_RANGE_MIN: -10,
  /** Absolute magnitude range max (magnitudes). */
  ABSOLUTE_MAGNITUDE_RANGE_MAX: 20,
  /** Absolute g range min (magnitudes). */
  ABSOLUTE_G_RANGE_MIN: -4,
  /** Absolute g range max (magnitudes). */
  ABSOLUTE_G_RANGE_MAX: 18,
} as const;

/** Settings for common/model/stellarPhysics.ts. */
export const STELLAR_PHYSICS_SETTINGS = {
  /** IAU 2015 nominal solar effective temperature (K). */
  SUN_TEMPERATURE: 5772,
  /** IAU 2015 absolute bolometric magnitude of the Sun. */
  SUN_BOLOMETRIC_MAGNITUDE: 4.74,
} as const;

/** Settings for common/view/PointCloudNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const POINT_CLOUD_NODE_SETTINGS = {
  /** Group index that is never drawn. */
  HIDDEN_GROUP: 255,
} as const;

/** Settings for common/view/format.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const FORMAT_SETTINGS = {
  DEFAULT_DIGITS: 3,
} as const;

/** Settings for explore/view/ExploreScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const EXPLORE_SCREEN_VIEW_SETTINGS = {
  LUMINOSITY_TEXT_DIGITS: 3, // digits
  RADIUS_TEXT_DIGITS: 3, // digits
  LUMINOSITY_SLIDER_DIGITS: 3, // digits

  TEMPERATURE_TEXT_SIGNIFICANT_FIGURES: 3, // digits
  TEMPERATURE_SLIDER_SIGNIFICANT_FIGURES: 3, // digits
  CONSTRUCTOR_SLIDER_BLOCK_SPACING: 10, // px

  DEFAULT_MAX_WIDTH: 150,
  READOUT_MAX_WIDTH: 160,
  SLIDER_BLOCK_SPACING: 2,
  READOUTS_X_SPACING: 12,
  READOUTS_Y_SPACING: 4,
  STAR_PANEL_SPACING: 8,
  SETTINGS_PANEL_SPACING: 10,
  CHILDREN_SPACING: 10,
} as const;

/** Settings for gaia-census/view/GaiaCensusScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const GAIA_CENSUS_SCREEN_VIEW_SETTINGS = {
  BRIGHTNESS_LIMIT_TEXT_NODE_MAX_WIDTH: 200, // px
  DISTANCE_LIMIT_TEXT_NODE_MAX_WIDTH: 150, // px
  ROWS_MAX_WIDTH: 130, // px
  ROWS_MAX_WIDTH_SEGMENT_2: 50, // px
  ROWS_MAX_WIDTH_SEGMENT_3: 55, // px
  COLOR_BY_GROUP_MAX_WIDTH: 130, // px
  DISTANCE_LEGEND_MAX_WIDTH: 50, // px

  CONSTRUCTOR_SELECTION_PANEL_SPACING: 8, // px
  CONSTRUCTOR_STRIP_SPACING: 24, // px

  BRIGHTNESS_CHECKBOX_SPACING: 6,
  BRIGHTNESS_CHECKBOX_MAX_WIDTH: 80,
  SELECTION_PANEL_SPACING: 6,
  SELECTION_PANEL_MAX_WIDTH: 130,
  KINDS_PANEL_SPACING: 6,
  KINDS_PANEL_X_SPACING: 6,
  KINDS_PANEL_Y_SPACING: 4,
  COLOR_BY_GROUP_SPACING: 16,
  DISTANCE_LEGEND_SPACING: 8,
  COLOR_PANEL_SPACING: 6,
  STRIP_SPACING: 4,
  CHILDREN_SPACING: 8,
} as const;

/** Settings for radius/view/RadiusScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const RADIUS_SCREEN_VIEW_SETTINGS = {
  SOLAR_L_DIGITS: 3, // digits
  SOLAR_R_DIGITS: 3, // digits
  RATIO_DIGITS: 3, // digits
  EQUATION_DIGITS: 3, // digits

  KELVIN_SIGNIFICANT_FIGURES: 3, // digits
  EQUATION_RADIUS_DIGITS: 3, // digits
  CONSTRUCTOR_COMPARE_PANEL_SPACING: 4, // px

  DEFAULT_MAX_WIDTH: 90,
  TABLE_X_SPACING: 10,
  TABLE_Y_SPACING: 5,
  COMPARE_PANEL_SPACING: 8,
  CONSTRAINT_GROUP_SPACING: 6,
  SETTINGS_PANEL_SPACING: 8,
  CHILDREN_SPACING: 10,
} as const;

/** Settings for star-samples/view/StarPlotNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const STAR_PLOT_NODE_SETTINGS = {
  TEMPERATURE_FORMAT_VALUE_DIGITS: 3, // digits
  LUMINOSITY_FORMAT_VALUE_DIGITS: 3, // digits

  DESCRIBE_RADIUS_DIGITS: 3, // digits

  /** Point groups, painted in this order. */
  BOTH_GROUP: 2,
} as const;

/** Settings for star-samples/view/StarSamplesScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const STAR_SAMPLES_SCREEN_VIEW_SETTINGS = {
  LEGEND_ENTRY_MAX_WIDTH: 90, // px
  FIND_STAR_TEXT_NODE_MAX_WIDTH: 120, // px

  SAMPLE_GROUP_SPACING: 6,
  LEGEND_ENTRY_SPACING: 4,
  LEGEND_SPACING: 12,
  SAMPLE_PANEL_SPACING: 7,
  KINDS_PANEL_SPACING: 5,
  FIND_COMBO_BOX_MAX_WIDTH: 150,
  CARD_PANEL_SPACING: 8,
  STRIP_SPACING: 24,
  CHILDREN_SPACING: 8,
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const STAR_CARD_NODE_SETTINGS = {
  DISTANCE_FORMAT_VALUE_DIGITS: 3, // digits
  ROWS_DIGITS: 3, // digits
  ROWS_DECIMALS: 2, // digits
  LUMINOSITY_FORMAT_VALUE_DIGITS: 3, // digits
  RADIUS_FORMAT_VALUE_DIGITS: 3, // digits

  ROWS_SIGNIFICANT_FIGURES: 3, // digits
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const RADIUS_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  CURRENT_DETAILS_DIGITS: 3, // digits

  CURRENT_DETAILS_RADIUS_DIGITS: 3, // digits
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const EXPLORE_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  CURRENT_DETAILS_DIGITS: 3, // digits

  CURRENT_DETAILS_RADIUS_DIGITS: 3, // digits
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const AXIS_TICKS_SETTINGS = {
  RANGE_DECIMAL_PLACES: 6, // digits
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const HR_OVERLAY_NODE_SETTINGS = {
  DRAW_STRIP_RIGHT_OFFSET: 4, // px
  DRAW_STRIP_LEFT_OFFSET: 40, // px
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const CURSOR_STAR_NODE_SETTINGS = {
  TEXT_BOTTOM_OFFSET: 4, // px
} as const;

HRDiagramNamespace.register("HRDiagramConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  REGION_GAP,
  FONTS,
  PICK_DISTANCE,
  PANEL,
  LAYOUT,
  CHART,
  CHART_FRAME,
  CURSOR_STAR,
  SIZE_COMPARISON,
  SUN_MARKER,
  OVERLAY,
  ISORADIUS_VALUES,
  STAR_SAMPLE_MARKERS,
  GAIA,
  EXPLORE_SLIDERS,
  GAIA_SLIDERS,
  CONTROLS,
  AXIS_CONTROLS,
  OVERLAY_CHECKBOXES,
  STAR_CARD,
  PREFERENCES_LAYOUT,
  SCREEN_ICONS,
  CURSOR_TEMPERATURE_RANGE,
  CURSOR_LUMINOSITY_RANGE,
  MODEL_DEFAULTS,
  STAR_CATEGORY,
  POINT_CLOUD,
});
