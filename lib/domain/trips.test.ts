import { describe, expect, it } from "vitest";
import { avatarInitial, fmtC, tAmt, tBalances, tSettle, tShares, tStatus, tTotal, type Trip } from "./trips";

// Fixture ported from design-reference/lifeos-data.jsx LOS_TRIPS["t_hy"] (เที่ยวหาดใหญ่):
// covers all three split modes in one trip.
const hatyaiTrip: Trip = {
  members: ["me", "mint", "bank", "fah"],
  expenses: [
    { id: "th1", paidBy: "me", splitMode: "equal", amount: 7200, split: ["me", "mint", "bank", "fah"] },
    { id: "th2", paidBy: "mint", splitMode: "equal", amount: 6400, split: ["me", "mint", "bank", "fah"] },
    { id: "th3", paidBy: "bank", splitMode: "equal", amount: 1800, split: ["me", "mint", "bank", "fah"] },
    { id: "th4", paidBy: "me", splitMode: "equal", amount: 560, split: ["me", "mint", "fah"] },
    {
      id: "th5", paidBy: "bank", splitMode: "items", amount: 0,
      items: [
        { price: 1200, people: ["me", "mint", "bank", "fah"] },
        { price: 900, people: ["me", "bank", "fah"] },
        { price: 80, people: ["mint"] },
        { price: 70, people: ["me"] },
        { price: 240, people: ["bank", "fah"] },
      ],
    },
  ],
  settlements: [{ from: "fah", to: "me", amt: 1500 }],
};

// Fixture ported from LOS_TRIPS["t_jp"] (ตะลุยญี่ปุ่น): equal + custom split modes.
const japanTrip: Trip = {
  members: ["me", "mint", "bank"],
  expenses: [
    { id: "te1", paidBy: "me", splitMode: "equal", amount: 29650, split: ["me", "mint", "bank"] },
    { id: "te2", paidBy: "mint", splitMode: "equal", amount: 48000, split: ["me", "mint", "bank"] },
    { id: "te3", paidBy: "me", splitMode: "custom", amount: 28200, shares: { me: 10000, mint: 10000, bank: 8200 } },
  ],
};

describe("tAmt", () => {
  it("sums item prices for 'items' mode instead of using .amount", () => {
    const itemsExpense = hatyaiTrip.expenses.find((e) => e.id === "th5")!;
    expect(tAmt(itemsExpense)).toBe(1200 + 900 + 80 + 70 + 240);
  });
  it("uses .amount for equal/custom modes", () => {
    expect(tAmt(hatyaiTrip.expenses[0])).toBe(7200);
  });
});

describe("tShares — equal mode", () => {
  it("splits evenly across the listed members", () => {
    expect(tShares(hatyaiTrip.expenses[0])).toEqual({ me: 1800, mint: 1800, bank: 1800, fah: 1800 });
  });
  it("excludes members not in `split`", () => {
    const th4 = hatyaiTrip.expenses[3]; // 560 split among me/mint/fah only
    expect(tShares(th4)).toEqual({ me: 560 / 3, mint: 560 / 3, fah: 560 / 3 });
  });
});

describe("tShares — items mode", () => {
  it("splits each item's price evenly among that item's participants and sums per member", () => {
    const th5 = hatyaiTrip.expenses[4];
    const shares = tShares(th5);
    // item1: 1200/4=300 each; item2: 900/3=300 to me/bank/fah; item3: 80 to mint; item4: 70 to me; item5: 240/2=120 to bank/fah
    expect(shares.me).toBeCloseTo(300 + 300 + 70);
    expect(shares.mint).toBeCloseTo(300 + 80);
    expect(shares.bank).toBeCloseTo(300 + 300 + 120);
    expect(shares.fah).toBeCloseTo(300 + 300 + 120);
  });
});

describe("tShares — custom mode", () => {
  it("uses the explicit per-member amounts as-is", () => {
    const te3 = japanTrip.expenses[2];
    expect(tShares(te3)).toEqual({ me: 10000, mint: 10000, bank: 8200 });
  });
});

describe("tBalances", () => {
  it("nets to zero across all members (every expense is fully paid-for and shared)", () => {
    for (const trip of [hatyaiTrip, japanTrip]) {
      const sum = Object.values(tBalances(trip)).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(0, 6);
    }
  });

  it("matches a hand-computed balance for a simple trip", () => {
    const sum = tTotal(japanTrip);
    expect(sum).toBe(29650 + 48000 + 28200);
  });
});

describe("tSettle", () => {
  it("produces transfers that fully reconcile every balance to zero", () => {
    const transfers = tSettle(hatyaiTrip);
    const balances = tBalances(hatyaiTrip);
    for (const t of transfers) {
      balances[t.from] += t.amt;
      balances[t.to] -= t.amt;
    }
    for (const v of Object.values(balances)) expect(Math.abs(v)).toBeLessThan(0.02);
  });

  it("uses the minimum number of transfers (greedy largest-debtor/largest-creditor pairing)", () => {
    // me paid 100 for a 2-way split with mint: mint owes me 50 — exactly one transfer.
    const simple: Trip = { members: ["me", "mint"], expenses: [{ id: "e1", paidBy: "me", splitMode: "equal", amount: 100, split: ["me", "mint"] }] };
    const transfers = tSettle(simple);
    expect(transfers).toEqual([{ from: "mint", to: "me", amt: 50 }]);
  });
});

describe("fmtC", () => {
  it("formats THB with up to 2 decimals, trimmed when whole", () => {
    expect(fmtC(1200, "THB")).toBe("฿1,200");
    expect(fmtC(1200.5, "THB")).toBe("฿1,200.50");
  });
  it("formats no-decimal currencies (JPY) without cents", () => {
    expect(fmtC(29650, "JPY")).toBe("¥29,650");
  });
  it("hides the amount when `hide` is set", () => {
    expect(fmtC(1200, "THB", true)).toBe("฿ •••");
  });
  it("prefixes negative amounts with a minus sign", () => {
    expect(fmtC(-50, "THB")).toBe("−฿50");
  });
});

describe("avatarInitial", () => {
  it("takes one character for ordinary names", () => {
    expect(avatarInitial("มิ้นท์")).toBe("ม");
  });
  it("takes two characters when the name starts with a leading Thai vowel", () => {
    // เบนซ์ — เ attaches to the next consonant, so a 1-char slice would cut it mid-syllable
    expect(avatarInitial("เบนซ์")).toBe("เบ");
  });
});

describe("tStatus", () => {
  it("counts down to an upcoming trip", () => {
    expect(tStatus("2026-10-20", "2026-10-23", "2026-10-05")).toEqual({ text: "อีก 15 วัน", tone: "accent" });
  });
  it("is ongoing between start and end", () => {
    expect(tStatus("2026-10-01", "2026-10-10", "2026-10-05")).toEqual({ text: "กำลังเที่ยว", tone: "green" });
  });
  it("is finished after the end date", () => {
    expect(tStatus("2026-09-01", "2026-09-05", "2026-10-05")).toEqual({ text: "จบแล้ว", tone: "" });
  });
});
