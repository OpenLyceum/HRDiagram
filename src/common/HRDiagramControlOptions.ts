/**
 * HRDiagramControlOptions.ts
 *
 * Shared sizing and layout for panel controls (sliders, checkboxes, NumberControls).
 * Import these instead of repeating scale / track-size values in each screen view.
 *
 * Template-owned toolkit: each sim uses only some of these, so every export is tagged
 * `@public` to tell dead-code checkers (knip) that an unused one is not dead code.
 */

import { NumberControl } from "scenerystack/scenery-phet";
import type { CheckboxOptions, HSliderOptions } from "scenerystack/sun";
import HRDiagramColors from "../HRDiagramColors.js";
import { CONTROLS } from "../HRDiagramConstants.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "./HRDiagramButtonOptions.js";

/** Options for standalone HSlider instances in control panels. @public */
export const HR_DIAGRAM_SLIDER_OPTIONS = {
  trackSize: CONTROLS.STANDALONE_TRACK_SIZE,
  thumbSize: CONTROLS.THUMB_SIZE,
  trackFillEnabled: HRDiagramColors.textColorProperty,
} satisfies HSliderOptions;

/** Base NumberControl options; spread into each instance and add titleNodeOptions as needed. @public */
export const HR_DIAGRAM_NUMBER_CONTROL_OPTIONS = {
  arrowButtonOptions: { ...FLAT_RECTANGULAR_BUTTON_OPTIONS, scale: CONTROLS.ARROW_BUTTON_SCALE },
  layoutFunction: NumberControl.createLayoutFunction4({
    sliderPadding: CONTROLS.SLIDER_PADDING,
    arrowButtonSpacing: CONTROLS.ARROW_BUTTON_SPACING,
    verticalSpacing: CONTROLS.VERTICAL_SPACING,
  }),
  sliderOptions: {
    trackSize: CONTROLS.NUMBER_CONTROL_TRACK_SIZE,
    thumbSize: CONTROLS.THUMB_SIZE,
    trackFillEnabled: HRDiagramColors.textColorProperty,
  },
};

/**
 * Themed checkbox chrome on dark panel backgrounds.
 *
 * The box fill matches the panel so the control reads as part of the panel, and
 * the tick/border use {@link HRDiagramColors.textColorProperty} (near-white in default
 * mode). Do not use {@link HRDiagramColors.controlSurfaceColorProperty} here — that
 * colour is for white chrome (push buttons, combo lists, Preferences).
 *
 * @public
 */
export const HR_DIAGRAM_CHECKBOX_OPTIONS = {
  boxWidth: CONTROLS.CHECKBOX_BOX_WIDTH,
  spacing: CONTROLS.CHECKBOX_SPACING,
  checkboxColor: HRDiagramColors.textColorProperty,
  checkboxColorBackground: HRDiagramColors.panelBackgroundColorProperty,
} satisfies CheckboxOptions;
