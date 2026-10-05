import { describe, expect, it } from "vitest";
import { forecast, subsMonthly, upcomingPayments } from "./forecast";

const todayISO = "2026-10-05";

describe("forecast", () => {
  it("counts an overdue bill once as a catch-up item plus its next in-window occurrence", () => {
    const r = forecast({
      days: 10,
      todayISO,
      startBalance: 1000,
      bills: [{ id: "b1", name: "ค่าไฟ", amount: 500, cycle: "monthly", nextDue: "2026-10-01" }],
      subscriptions: [],
      cards: [],
      income: [],
    });
    // overdue catch-up (today) + the cycle's next occurrence on 2026-11-01 is outside the 10-day window
    expect(r.items).toEqual([{ name: "ค่าไฟ (ค้างจ่าย)", amount: -500, date: todayISO }]);
    expect(r.out).toBe(500);
    expect(r.end).toBe(500);
  });

  it("skips subscriptions whose funding source no longer exists", () => {
    const r = forecast({
      todayISO,
      startBalance: 0,
      bills: [],
      subscriptions: [{ id: "s1", name: "Netflix", price: 419, cycle: "monthly", nextBilling: "2026-10-08", hasValidSource: false }],
      cards: [],
      income: [],
    });
    expect(r.items).toEqual([]);
  });

  it("includes a card payoff only once, clamped to today if already overdue", () => {
    const r = forecast({
      todayISO,
      startBalance: 0,
      bills: [],
      subscriptions: [],
      cards: [{ id: "c1", name: "KTC", used: 2000, dueDate: "2026-10-01" }],
      income: [],
    });
    expect(r.items).toEqual([{ name: "ชำระ KTC", amount: -2000, date: todayISO }]);
  });

  it("projects recurring income within the window and nets start/out/inc/end", () => {
    const r = forecast({
      days: 30,
      todayISO,
      startBalance: 1000,
      bills: [{ id: "b1", name: "เน็ต", amount: 700, cycle: "monthly", nextDue: "2026-10-01" }],
      subscriptions: [],
      cards: [],
      income: [{ id: "i1", name: "เงินเดือน", amount: 5000, dayOfMonth: 25 }],
    });
    expect(r.start).toBe(1000);
    expect(r.inc).toBe(5000);
    expect(r.out).toBe(700 + 700); // overdue catch-up + the Nov 1 occurrence inside the 30-day window
    expect(r.end).toBe(1000 - r.out + r.inc);
  });
});

describe("upcomingPayments", () => {
  it("includes bills/cards/subs due within the window, sorted by date", () => {
    const items = upcomingPayments({
      days: 8,
      todayISO,
      bills: [{ id: "b1", name: "มือถือ", amount: 599, cycle: "monthly", nextDue: "2026-10-09", accountId: "a1" }],
      cards: [{ id: "c1", name: "KTC", used: 1000, dueDate: "2026-10-07", minPayment: 100, bank: "ktc" }],
      subscriptions: [],
    });
    expect(items.map((i) => i.kind)).toEqual(["card", "bill"]);
  });

  it("excludes cards with nothing owed even if the due date is near", () => {
    const items = upcomingPayments({
      todayISO,
      bills: [],
      cards: [{ id: "c1", name: "KTC", used: 0, dueDate: "2026-10-07", minPayment: 100 }],
      subscriptions: [],
    });
    expect(items).toEqual([]);
  });
});

describe("subsMonthly", () => {
  it("divides yearly subs by 12 but counts other cycles at face value", () => {
    const monthly = subsMonthly([
      { price: 419, cycle: "monthly" },
      { price: 3990, cycle: "yearly" },
    ]);
    expect(monthly).toBeCloseTo(419 + 3990 / 12);
  });
});
