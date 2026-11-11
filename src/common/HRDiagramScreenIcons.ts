/**
 * HRDiagramScreenIcons.ts
 *
 * Home-screen and navigation-bar icons, drawn on the standard 548 × 373 canvas:
 *   - Explore: an HR diagram with the main-sequence band and the cross-hair star;
 *   - Radius: a red giant beside a small blue star, with lines of equal radius;
 *   - Star Samples: red (nearest) and cyan (brightest) stars in an HR-diagram pattern;
 *   - Gaia Census: a dense cloud of stars, main sequence above and white dwarfs below.
 * Scatter positions come from a fixed-seed generator, so the icons never change.
 */

import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, RadialGradient, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import HRDiagramColors from "../HRDiagramColors.js";

const W = 548;
const H = 373;

/** A small deterministic pseudo-random generator (LCG), so icons are identical on every load. */
const seeded = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

/** Approximately normal noise from a uniform generator. */
const gaussian = (random: () => number): number => random() + random() + random() - 1.5;

const background = (): Rectangle => new Rectangle(0, 0, W, H, { fill: HRDiagramColors.chartBackgroundColorProperty });

const iconFrom = (...children: Node[]): ScreenIcon =>
  new ScreenIcon(new Node({ children: [background(), ...children] }), {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: HRDiagramColors.chartBackgroundColorProperty,
  });

/** The main sequence across the icon, from hot and bright (upper left) to cool and faint. */
const mainSequenceY = (x: number): number => 60 + 0.62 * x + 0.00025 * (x - 250) ** 2;

const mainSequenceBand = (): Path => {
  const shape = new Shape();
  for (let x = 40; x <= 510; x += 10) {
    if (x === 40) {
      shape.moveTo(x, mainSequenceY(x));
    } else {
      shape.lineTo(x, mainSequenceY(x));
    }
  }
  return new Path(shape, {
    stroke: HRDiagramColors.mainSequenceColorProperty,
    lineWidth: 34,
    lineCap: "round",
    lineJoin: "round",
  });
};

const disc = (radius: number, x: number, y: number, inner: string, outer: string): Circle =>
  new Circle(radius, {
    x,
    y,
    fill: new RadialGradient(-0.3 * radius, -0.3 * radius, 0, 0, 0, radius)
      .addColorStop(0, inner)
      .addColorStop(1, outer),
  });

export const createExploreIcon = (): ScreenIcon => {
  const x = 300;
  const y = mainSequenceY(x);
  const ring = new Path(
    new Shape()
      .circle(0, 0, 26)
      .moveTo(-46, 0)
      .lineTo(-18, 0)
      .moveTo(18, 0)
      .lineTo(46, 0)
      .moveTo(0, -46)
      .lineTo(0, -18)
      .moveTo(0, 18)
      .lineTo(0, 46),
    { stroke: HRDiagramColors.cursorColorProperty, lineWidth: 7, x, y },
  );
  return iconFrom(mainSequenceBand(), disc(12, x, y, "#fff8e0", "#e8c060"), ring);
};

export const createRadiusIcon = (): ScreenIcon => {
  const lines = new Shape();
  for (const offset of [-120, 0, 120, 240]) {
    lines.moveTo(0, 40 + offset).lineTo(W, 260 + offset);
  }
  return iconFrom(
    new Path(lines, { stroke: HRDiagramColors.isoradiusColorProperty, lineWidth: 4, lineDash: [14, 10] }),
    disc(130, 360, 190, "#ffd0a0", "#c0402a"),
    disc(22, 120, 210, "#ffffff", "#7ea6ff"),
  );
};

export const createStarSamplesIcon = (): ScreenIcon => {
  const random = seeded(7);
  const dots: Node[] = [];
  const dot = (x: number, y: number, fill: typeof HRDiagramColors.nearestStarColorProperty): void => {
    dots.push(new Circle(9, { x, y, fill, stroke: "black", lineWidth: 1.5 }));
  };
  // Nearest stars: faint red dwarfs low on the main sequence, and a few white dwarfs.
  for (let i = 0; i < 26; i++) {
    const x = 300 + 200 * random();
    dot(x, mainSequenceY(x) + 18 * gaussian(random), HRDiagramColors.nearestStarColorProperty);
  }
  for (let i = 0; i < 5; i++) {
    dot(150 + 120 * random(), 320 + 15 * gaussian(random), HRDiagramColors.nearestStarColorProperty);
  }
  // Brightest stars: luminous main-sequence stars, giants and supergiants.
  for (let i = 0; i < 16; i++) {
    const x = 50 + 180 * random();
    dot(x, mainSequenceY(x) - 10 + 18 * gaussian(random), HRDiagramColors.brightestStarColorProperty);
  }
  for (let i = 0; i < 16; i++) {
    dot(320 + 150 * random(), 40 + 120 * random(), HRDiagramColors.brightestStarColorProperty);
  }
  return iconFrom(...dots);
};

export const createGaiaCensusIcon = (): ScreenIcon => {
  const random = seeded(11);
  const dwarfs = new Shape();
  const whiteDwarfs = new Shape();
  const giants = new Shape();
  const add = (shape: Shape, x: number, y: number, r: number): void => {
    shape.moveTo(x + r, y).arc(x, y, r, 0, 2 * Math.PI);
  };
  for (let i = 0; i < 900; i++) {
    // Crowd the faint, cool end, as a volume-limited sample does.
    const x = 120 + 400 * Math.sqrt(random());
    add(dwarfs, x, mainSequenceY(x) + 14 * gaussian(random), 3);
  }
  for (let i = 0; i < 160; i++) {
    const x = 40 + 260 * random();
    add(whiteDwarfs, x, 250 + 0.35 * x + 9 * gaussian(random), 3);
  }
  for (let i = 0; i < 25; i++) {
    add(giants, 360 + 30 * gaussian(random), 110 + 25 * gaussian(random), 4);
  }
  return iconFrom(
    new Path(dwarfs, { fill: HRDiagramColors.dwarfColorProperty, opacity: 0.8 }),
    new Path(whiteDwarfs, { fill: HRDiagramColors.whiteDwarfColorProperty }),
    new Path(giants, { fill: HRDiagramColors.giantColorProperty }),
  );
};
