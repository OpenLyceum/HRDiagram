/**
 * stellarPhysics.test.ts
 *
 * The conversions behind every point, checked against the Sun and against tabulated values.
 */

import { describe, expect, it } from "vitest";
import {
  absoluteMagnitude,
  absoluteVisualMagnitude,
  bolometricCorrectionV,
  colorIndexFromTemperature,
  deriveFromGaia,
  Interpolator,
  luminosityFromAbsoluteVisualMagnitude,
  luminosityFromBolometricMagnitude,
  luminosityFromRadiusAndTemperature,
  mainSequenceLuminosity,
  radiusFromLuminosityAndTemperature,
  SUN_TEMPERATURE,
  temperatureFromColorIndex,
  temperatureFromLuminosityAndRadius,
  whiteDwarfLuminosity,
} from "../../src/common/model/stellarPhysics.js";

describe("Stefan–Boltzmann in solar units", () => {
  it("gives the Sun one solar radius", () => {
    expect(radiusFromLuminosityAndTemperature(1, SUN_TEMPERATURE)).toBeCloseTo(1, 12);
  });

  it("round-trips L, R and T", () => {
    const luminosity = luminosityFromRadiusAndTemperature(3.2, 7400);
    expect(radiusFromLuminosityAndTemperature(luminosity, 7400)).toBeCloseTo(3.2, 10);
    expect(temperatureFromLuminosityAndRadius(luminosity, 3.2)).toBeCloseTo(7400, 6);
  });

  it("follows log L = 2 log R + 4 log(T/T☉) along an isoradius line", () => {
    for (const temperature of [3000, 6000, 12000, 30000]) {
      const luminosity = luminosityFromRadiusAndTemperature(10, temperature);
      expect(Math.log10(luminosity)).toBeCloseTo(2 + 4 * Math.log10(temperature / SUN_TEMPERATURE), 10);
    }
  });

  it("doubles R when L is ×4 at fixed T, and quarters R when T is ×2 at fixed L", () => {
    expect(radiusFromLuminosityAndTemperature(4, 5000) / radiusFromLuminosityAndTemperature(1, 5000)).toBeCloseTo(2);
    expect(radiusFromLuminosityAndTemperature(1, 10000) / radiusFromLuminosityAndTemperature(1, 5000)).toBeCloseTo(
      0.25,
    );
  });
});

describe("magnitudes", () => {
  it("puts the Sun at M_bol 4.74 and M_V about 4.8", () => {
    expect(luminosityFromBolometricMagnitude(4.74)).toBeCloseTo(1, 10);
    expect(absoluteVisualMagnitude(1, SUN_TEMPERATURE)).toBeCloseTo(4.81, 1);
  });

  it("makes 5 magnitudes a factor of 100", () => {
    expect(luminosityFromBolometricMagnitude(-0.26)).toBeCloseTo(100, 6);
  });

  it("puts a star at 10 pc at its absolute magnitude", () => {
    expect(absoluteMagnitude(3.5, 10)).toBeCloseTo(3.5, 12);
    expect(absoluteMagnitude(3.5, 100)).toBeCloseTo(-1.5, 12);
  });

  it("round-trips M_V and L", () => {
    const absoluteV = absoluteVisualMagnitude(250, 5200);
    expect(luminosityFromAbsoluteVisualMagnitude(absoluteV, 5200)).toBeCloseTo(250, 8);
  });

  it("has bolometric corrections near zero for F stars and large for hot and cool stars", () => {
    expect(Math.abs(bolometricCorrectionV(7000))).toBeLessThan(0.05);
    expect(bolometricCorrectionV(30000)).toBeLessThan(-2.5);
    expect(bolometricCorrectionV(3000)).toBeLessThan(-2);
  });
});

describe("colour–temperature", () => {
  it("gives the Sun B−V about 0.65", () => {
    expect(colorIndexFromTemperature(SUN_TEMPERATURE)).toBeCloseTo(0.65, 1);
  });

  it("inverts", () => {
    for (const temperature of [3500, 5000, 8000, 20000]) {
      expect(temperatureFromColorIndex(colorIndexFromTemperature(temperature)) / temperature).toBeCloseTo(1, 2);
    }
  });
});

describe("reference sequences", () => {
  it("puts the Sun on the main sequence", () => {
    expect(mainSequenceLuminosity(SUN_TEMPERATURE)).toBeGreaterThan(0.8);
    expect(mainSequenceLuminosity(SUN_TEMPERATURE)).toBeLessThan(1.25);
  });

  it("makes white dwarfs about 10⁴ times fainter than main-sequence stars of the same temperature", () => {
    const ratio = mainSequenceLuminosity(9000) / whiteDwarfLuminosity(9000);
    expect(ratio).toBeGreaterThan(1e3);
    expect(ratio).toBeLessThan(1e5);
  });

  it("gives a white dwarf about Earth's size", () => {
    const radius = radiusFromLuminosityAndTemperature(whiteDwarfLuminosity(10000), 10000);
    expect(radius).toBeGreaterThan(0.008);
    expect(radius).toBeLessThan(0.018);
  });
});

describe("Gaia photometry", () => {
  it("places Proxima Centauri (G 8.985, BP−RP 3.805, 1.302 pc) near 0.0016 L☉ and 3000 K", () => {
    const proxima = deriveFromGaia(8.985, 3.805, 1.302, false);
    expect(proxima.temperature).toBeGreaterThan(2700);
    expect(proxima.temperature).toBeLessThan(3200);
    expect(proxima.luminosity).toBeGreaterThan(0.001);
    expect(proxima.luminosity).toBeLessThan(0.0025);
  });

  it("places Van Maanen's Star (G 12.30, BP−RP 0.60, 4.32 pc) as a cool white dwarf", () => {
    const star = deriveFromGaia(12.299, 0.598, 4.315, true);
    expect(star.temperature).toBeGreaterThan(5000);
    expect(star.temperature).toBeLessThan(7000);
    const radius = radiusFromLuminosityAndTemperature(star.luminosity, star.temperature);
    expect(radius).toBeLessThan(0.02);
  });
});

describe("Interpolator", () => {
  it("interpolates linearly and clamps", () => {
    const f = new Interpolator([
      [2, 20],
      [0, 0],
      [1, 10],
    ]);
    expect(f.evaluate(0.5)).toBeCloseTo(5);
    expect(f.evaluate(1.5)).toBeCloseTo(15);
    expect(f.evaluate(-3)).toBe(0);
    expect(f.evaluate(9)).toBe(20);
  });
});
