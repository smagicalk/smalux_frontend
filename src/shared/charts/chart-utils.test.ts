import { describe, expect, it } from "vitest";

import { clampPercent, toPolylinePoints } from "@/shared/charts/chart-utils";

describe("chart utils", () => {
  it("clamps percentage values into the visible chart range", () => {
    expect(clampPercent(-20)).toBe(0);
    expect(clampPercent(64)).toBe(64);
    expect(clampPercent(140)).toBe(100);
  });

  it("builds stable polyline points with a shared domain", () => {
    expect(toPolylinePoints([0, 50, 100], 100, 100, 10, { min: 0, max: 100 })).toBe(
      "0.00,90.00 50.00,50.00 100.00,10.00"
    );
  });

  it("keeps a single data point inside the padded plot area", () => {
    expect(toPolylinePoints([50], 100, 100, 10, { min: 0, max: 100 })).toBe(
      "0.00,50.00"
    );
  });
});
