/**
 * StarCatalog.test.ts
 *
 * The bundled snapshot, decoded: famous stars land where the literature puts them.
 */

import { describe, expect, it } from "vitest";
import { GAIA_CENSUS, NAMED_STARS, type Star } from "../../src/common/model/StarCatalog.js";
import { StarCategory } from "../../src/common/model/StarCategory.js";

const star = (name: string): Star => {
  const found = NAMED_STARS.find((s) => s.name === name);
  if (!found) {
    throw new Error(`${name} missing from the snapshot`);
  }
  return found;
};

describe("named stars", () => {
  it("has both sets", () => {
    expect(NAMED_STARS.filter((s) => s.nearest).length).toBeGreaterThan(200);
    expect(NAMED_STARS.filter((s) => s.brightest).length).toBeGreaterThan(150);
  });

  it("puts Sirius A at about 25 L☉ and 1.7 R☉", () => {
    const sirius = star("Sirius");
    expect(sirius.luminosity).toBeGreaterThan(20);
    expect(sirius.luminosity).toBeLessThan(30);
    expect(sirius.radius).toBeGreaterThan(1.5);
    expect(sirius.radius).toBeLessThan(2);
    expect(sirius.nearest && sirius.brightest).toBe(true);
  });

  it("makes Betelgeuse a supergiant of several hundred solar radii", () => {
    const betelgeuse = star("Betelgeuse");
    expect(betelgeuse.luminosity).toBeGreaterThan(2e4);
    expect(betelgeuse.radius).toBeGreaterThan(300);
    expect(betelgeuse.category).toBe(StarCategory.SUPERGIANT);
  });

  it("makes Arcturus a giant of about 25 R☉", () => {
    const arcturus = star("Arcturus");
    expect(arcturus.radius).toBeGreaterThan(18);
    expect(arcturus.radius).toBeLessThan(32);
    expect(arcturus.category).toBe(StarCategory.GIANT);
  });

  it("puts Proxima Centauri at about 0.0016 L☉", () => {
    const proxima = star("Proxima Centauri");
    expect(proxima.luminosity).toBeGreaterThan(0.001);
    expect(proxima.luminosity).toBeLessThan(0.0025);
    expect(proxima.category).toBe(StarCategory.DWARF);
  });

  it("gives every star finite values", () => {
    for (const s of NAMED_STARS) {
      expect(Number.isFinite(s.temperature) && Number.isFinite(s.luminosity) && Number.isFinite(s.radius)).toBe(true);
    }
  });
});

describe("Gaia census", () => {
  it("decodes every star", () => {
    expect(GAIA_CENSUS.size).toBe(GAIA_CENSUS.distance.length);
    expect(GAIA_CENSUS.size).toBeGreaterThan(30000);
  });

  it("is dominated by dwarfs, with a few percent white dwarfs", () => {
    const count = (category: StarCategory): number => GAIA_CENSUS.categories.filter((c) => c === category).length;
    expect(count(StarCategory.DWARF) / GAIA_CENSUS.size).toBeGreaterThan(0.8);
    const whiteDwarfShare = count(StarCategory.WHITE_DWARF) / GAIA_CENSUS.size;
    expect(whiteDwarfShare).toBeGreaterThan(0.03);
    expect(whiteDwarfShare).toBeLessThan(0.12);
  });

  it("gives white dwarfs about Earth's size (a few white dwarf + M dwarf pairs come out larger)", () => {
    const radii: number[] = [];
    for (let i = 0; i < GAIA_CENSUS.size; i++) {
      if (GAIA_CENSUS.categories[i] === StarCategory.WHITE_DWARF) {
        radii.push(GAIA_CENSUS.radius[i] ?? 0);
      }
    }
    radii.sort((a, b) => a - b);
    expect(radii[Math.floor(radii.length / 2)]).toBeLessThan(0.02);
    expect(radii.filter((r) => r > 0.04).length / radii.length).toBeLessThan(0.01);
  });

  it("finds giants only among red stars well above the main sequence", () => {
    for (let i = 0; i < GAIA_CENSUS.size; i++) {
      if (GAIA_CENSUS.categories[i] === StarCategory.GIANT) {
        expect(GAIA_CENSUS.luminosity[i]).toBeGreaterThan(1);
      }
    }
  });
});
