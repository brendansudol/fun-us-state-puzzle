import { describe, expect, it } from "vitest";

import { compareNumeric } from "@/lib/compare";
import { getDailyTargetCode } from "@/lib/daily";
import { bearingToDirection8, roundMiles } from "@/lib/geo";
import { normalizeStateInput } from "@/lib/puzzle";
import type { StateRecord } from "@/lib/types";

const TEST_STATES: StateRecord[] = [
  {
    code: "CA",
    name: "California",
    slug: "california",
    abbr: "CA",
    region: "West",
    coastal: true,
    centroid: { lat: 36.0, lon: -119.0 },
    landAreaSqMi: 155860,
    population: 39431263,
    gdpUsd: 3870379000000,
    gdpPerCapitaUsd: 98155,
    topExportFamily: { code: "334", label: "Computer & Electronic Products" },
  },
  {
    code: "NY",
    name: "New York",
    slug: "new-york",
    abbr: "NY",
    region: "Northeast",
    coastal: true,
    centroid: { lat: 42.0, lon: -75.0 },
    landAreaSqMi: 47214,
    population: 19835913,
    gdpUsd: 2172010000000,
    gdpPerCapitaUsd: 109498,
    topExportFamily: { code: "334", label: "Computer & Electronic Products" },
  },
];

describe("puzzle helpers", () => {
  it("normalizes full names and abbreviations", () => {
    expect(normalizeStateInput("ca", TEST_STATES)).toBe("CA");
    expect(normalizeStateInput("California", TEST_STATES)).toBe("CA");
    expect(normalizeStateInput("new york", TEST_STATES)).toBe("NY");
  });

  it("applies numeric tolerances", () => {
    expect(compareNumeric(100, 95, 0.05)).toBe("equal");
    expect(compareNumeric(110, 100, 0.05)).toBe("higher");
    expect(compareNumeric(90, 100, 0.05)).toBe("lower");
  });

  it("buckets bearings and rounds miles", () => {
    expect(bearingToDirection8(1)).toBe("N");
    expect(bearingToDirection8(44)).toBe("NE");
    expect(bearingToDirection8(181)).toBe("S");
    expect(roundMiles(384)).toBe(380);
  });

  it("keeps daily targets deterministic", () => {
    expect(getDailyTargetCode("2026-03-07")).toBe(getDailyTargetCode("2026-03-07"));
  });
});
