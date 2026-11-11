/**
 * blackbodyColor.ts
 *
 * The approximate colour of a star of a given temperature: Tanner Helland's polynomial fit to blackbody
 * colours, valid from 1000 to 40 000 K. Copied from HabitableZones (circumstellar/view/blackbodyColor.ts).
 */

import { Color } from "scenerystack/scenery";

const clamp255 = (value: number): number => Math.min(255, Math.max(0, value));

/** Maps an effective temperature (K) to its approximate blackbody Color. */
export const blackbodyColor = (temperature: number): Color => {
  const clamped = Math.min(40000, Math.max(1000, temperature));
  const logT = Math.log10(clamped);
  const logT2 = logT * logT;
  const logT3 = logT * logT2;
  const red = 22686.34111 - logT * 15082.52755 + logT2 * 3375.333832 - logT3 * 252.4073853;
  const green =
    clamped <= 6500
      ? -811.6499145 + logT * 36.97365953 + logT2 * 160.7861677 - logT3 * 25.57573664
      : 13836.23586 - logT * 9069.078214 + logT2 * 2015.254756 - logT3 * 149.7766966;
  const blue = -11545.34298 + logT * 8529.658165 - logT2 * 2150.198586 + logT3 * 190.0306573;
  return new Color(Math.round(clamp255(red)), Math.round(clamp255(green)), Math.round(clamp255(blue)));
};
