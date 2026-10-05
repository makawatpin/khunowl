import { describe, expect, it } from "vitest";
import { assetValue, warrantyState, yrsBetween, yrsLabel } from "./assets";

describe("warrantyState", () => {
  it("has no warranty when unset", () => {
    expect(warrantyState(null, "2026-10-05")).toEqual({ label: "ไม่มีประกัน", tone: "" });
  });
  it("is expired when in the past", () => {
    expect(warrantyState("2026-01-01", "2026-10-05")).toEqual({ label: "หมดประกันแล้ว", tone: "" });
  });
  it("is amber within 45 days", () => {
    expect(warrantyState("2026-10-20", "2026-10-05")).toEqual({ label: "หมดใน 15 วัน", tone: "amber" });
  });
  it("is green beyond 45 days", () => {
    expect(warrantyState("2027-04-05", "2026-10-05")).toEqual({ label: "เหลือ 6 เดือน", tone: "green" });
  });
});

describe("yrsBetween / yrsLabel", () => {
  it("never goes negative", () => {
    expect(yrsBetween("2026-10-05", "2026-01-01")).toBe(0);
  });
  it("labels under a year in months", () => {
    expect(yrsLabel(yrsBetween("2026-08-05", "2026-10-05"))).toBe("2 เดือน");
  });
  it("labels a year or more in years", () => {
    expect(yrsLabel(yrsBetween("2024-10-05", "2026-10-05"))).toBe("2 ปี");
  });
});

describe("assetValue", () => {
  it("sums price of unsold assets only", () => {
    expect(
      assetValue([
        { price: 100, sold: false },
        { price: 200, sold: true },
        { price: 50, sold: false },
      ]),
    ).toBe(150);
  });
});
