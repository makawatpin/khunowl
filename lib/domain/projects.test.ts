import { describe, expect, it } from "vitest";
import { billTotal, pjStats } from "./projects";

describe("billTotal", () => {
  it("sums qty * price across items", () => {
    expect(billTotal([{ qty: 2, price: 150 }, { qty: 1, price: 99.5 }])).toBe(399.5);
  });
  it("is 0 for an empty bill", () => {
    expect(billTotal([])).toBe(0);
  });
});

describe("pjStats", () => {
  it("sums material cost across all bills", () => {
    const stats = pjStats([
      { items: [{ qty: 2, price: 100 }] },
      { items: [{ qty: 1, price: 50 }] },
    ]);
    expect(stats.mat).toBe(250);
  });
});
