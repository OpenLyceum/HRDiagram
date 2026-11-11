/**
 * HRDiagramScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen.
 * Drawn on the standard PhET 548 × 373 canvas using HRDiagramColors.
 * Replace the stub backgrounds with screen-specific motifs.
 */
import { Node, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import HRDiagramColors from "../HRDiagramColors.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: HRDiagramColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: HRDiagramColors.backgroundColorProperty,
  });
}

export function createExploreIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createRadiusIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createStarSamplesIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createGaiaCensusIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}
