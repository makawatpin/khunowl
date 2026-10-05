import { describe, expect, it } from "vitest";
import { groupByCategory, groupByDayOfMonth, monthKeyAdd, monthTrend, sumAmount, topPayees, txnsInMonth, type StatsTxn } from "./stats";

const txns: StatsTxn[] = [
  { type: "expense", amount: 100, date: "2026-10-01", category: "อาหาร", name: "ร้านก" },
  { type: "expense", amount: 50, date: "2026-10-02", category: "อาหาร", name: "ร้านก" },
  { type: "expense", amount: 200, date: "2026-10-03", category: "เดินทาง", name: "ร้านข" },
  { type: "income", amount: 5000, date: "2026-10-05", category: null, name: "เงินเดือน" },
  { type: "expense", amount: 30, date: "2026-09-20", category: "อาหาร", name: "ร้านค" },
];

describe("monthKeyAdd", () => {
  it("rolls forward across a year boundary", () => {
    expect(monthKeyAdd("2026-12", 1)).toBe("2027-01");
  });
  it("rolls backward across a year boundary", () => {
    expect(monthKeyAdd("2026-01", -1)).toBe("2025-12");
  });
});

describe("txnsInMonth / sumAmount", () => {
  it("filters to the given month and optional type", () => {
    const october = txnsInMonth(txns, "2026-10");
    expect(october).toHaveLength(4);
    expect(sumAmount(txnsInMonth(txns, "2026-10", "expense"))).toBe(350);
  });
});

describe("groupByDayOfMonth", () => {
  it("sums amounts per day-of-month", () => {
    const byDay = groupByDayOfMonth(txnsInMonth(txns, "2026-10", "expense"));
    expect(byDay).toEqual({ 1: 100, 2: 50, 3: 200 });
  });
});

describe("groupByCategory", () => {
  it("sums per category, defaulting nulls to อื่นๆ", () => {
    const byCat = groupByCategory(txnsInMonth(txns, "2026-10"));
    expect(byCat).toEqual({ "อาหาร": 150, "เดินทาง": 200, "อื่นๆ": 5000 });
  });
});

describe("topPayees", () => {
  it("aggregates by name and sorts descending by amount", () => {
    const payees = topPayees(txnsInMonth(txns, "2026-10", "expense"));
    expect(payees[0]).toEqual({ name: "ร้านข", amount: 200, count: 1 });
    expect(payees[1]).toEqual({ name: "ร้านก", amount: 150, count: 2 });
  });
});

describe("monthTrend", () => {
  it("returns one point per month, oldest first, ending at the current month", () => {
    const trend = monthTrend(txns, "2026-10", 1);
    expect(trend.map((t) => t.monthKey)).toEqual(["2026-09", "2026-10"]);
    expect(trend[0].expense).toBe(30);
    expect(trend[1].expense).toBe(350);
    expect(trend[1].income).toBe(5000);
  });
});
