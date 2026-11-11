/**
 * spectralTypes.test.ts
 *
 * Parsing catalogue spectral types and turning them into temperatures.
 */

import { describe, expect, it } from "vitest";
import {
  dwarfTemperatureFromCode,
  formatSpectralCode,
  parseSpectralType,
  spectralCodeFromTemperature,
  temperatureFromCode,
} from "../../src/common/model/spectralTypes.js";

describe("parseSpectralType", () => {
  it.each([
    ["G2V", 42, "V"],
    ["K2IIIp", 52, "III"],
    ["F5IV-V", 35, "IV"],
    ["M1-M2Ia-Iab", 61, "Ia"],
    ["M2Ib", 62, "Ib"],
    ["K2:III:", 52, "III"],
    ["B8Ia", 18, "Ia"],
    ["O9.5Iab", 9.5, "Iab"],
    ["G8IIIab", 48, "III"],
    ["sdM4", 64, "V"],
    ["K0V SB", 50, "V"],
    ["A0m...", 20, null],
    ["M5", 65, null],
  ])("%s → code %d, class %s", (text, code, luminosityClass) => {
    const parsed = parseSpectralType(text);
    expect(parsed?.code).toBeCloseTo(code);
    expect(parsed?.luminosityClass ?? null).toBe(luminosityClass);
  });

  it("reads white dwarf types and their temperature index", () => {
    expect(parseSpectralType("DA2")).toEqual({ code: null, luminosityClass: "D", whiteDwarfTemperature: 25200 });
    expect(parseSpectralType("DG")?.luminosityClass).toBe("D");
  });

  it("returns null for strings without a type", () => {
    expect(parseSpectralType("comp")).toBeNull();
    expect(parseSpectralType(null)).toBeNull();
  });
});

describe("temperature scales", () => {
  it("gives the Sun's type, G2V, about 5800 K", () => {
    expect(dwarfTemperatureFromCode(42)).toBeGreaterThan(5700);
    expect(dwarfTemperatureFromCode(42)).toBeLessThan(5900);
    expect(formatSpectralCode(spectralCodeFromTemperature(5772))).toMatch(/^G[123]/);
  });

  it("makes cool giants and supergiants cooler than dwarfs of the same type", () => {
    expect(temperatureFromCode(52, "III")).toBeLessThan(temperatureFromCode(52, "V"));
    expect(temperatureFromCode(62, "Iab")).toBeLessThan(3700);
  });

  it("formats codes", () => {
    expect(formatSpectralCode(42)).toBe("G2");
    expect(formatSpectralCode(65.5)).toBe("M5.5");
    expect(formatSpectralCode(9.8)).toBe("B0");
  });
});
