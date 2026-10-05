import { describe, expect, it } from "vitest";
import { fuelStats, nextServiceKm, vehicleYearCost } from "./vehicle";

describe("nextServiceKm", () => {
  it("rounds up to the next service interval", () => {
    expect(nextServiceKm(14450, 5000)).toBe(15000);
  });
  it("defaults to 5000km when serviceEveryKm is falsy", () => {
    expect(nextServiceKm(4999, 0)).toBe(5000);
  });
});

describe("fuelStats", () => {
  // Ported from design-reference/lifeos-data.jsx LOS_FUEL (v_yaris), newest-first.
  const rows = [
    { date: "2026-09-14", mileage: 14450, liters: 32.1, total: 1111 },
    { date: "2026-09-01", mileage: 13960, liters: 30.4, total: 1040 },
    { date: "2026-08-18", mileage: 13480, liters: 33.0, total: 1119 },
    { date: "2026-08-04", mileage: 12950, liters: 31.2, total: 1064 },
  ];

  it("averages km/L and cost/km across consecutive fill-up legs", () => {
    const s = fuelStats(rows, "2026-09");
    // leg0: (14450-13960)/32.1 = 15.26 km/L; leg1: (13960-13480)/30.4 = 15.79; leg2: (13480-12950)/33.0 = 16.06
    expect(s.legs).toBe(3);
    expect(s.kmPerL).toBeCloseTo(15.7, 1);
  });

  it("sums only the current month's fill-ups for `monthly`", () => {
    const s = fuelStats(rows, "2026-09");
    expect(s.monthly).toBe(1111 + 1040);
  });

  it("returns zeroed stats with a single fill-up (no legs)", () => {
    const s = fuelStats([rows[0]], "2026-09");
    expect(s.legs).toBe(0);
    expect(s.kmPerL).toBe(0);
  });
});

describe("vehicleYearCost", () => {
  it("sums this year's service + fuel costs plus annual premiums", () => {
    const total = vehicleYearCost({
      year: "2026",
      services: [{ date: "2026-06-02", cost: 2400 }, { date: "2025-11-08", cost: 3200 }],
      fuel: [{ date: "2026-09-14", total: 1111 }],
      insurancePremium: 15200,
      prbPremium: 645,
      taxPremium: 1200,
    });
    expect(total).toBe(2400 + 1111 + 15200 + 645 + 1200);
  });
});
