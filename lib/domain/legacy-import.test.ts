import { describe, expect, it } from "vitest";
import {
  computeOpeningBalance, computeOpeningUsed, legacyCycleMonths, mapLegacyAccountType,
  mapLegacyCycle, mapLegacyProjectStatus, mapLegacyTaskPriority, mapLegacyVehicleKind,
} from "./legacy-import";

describe("mapLegacyCycle", () => {
  it("maps every documented Thai label (README §9 step 4)", () => {
    expect(mapLegacyCycle("รายเดือน")).toBe("monthly");
    expect(mapLegacyCycle("เดือน")).toBe("monthly");
    expect(mapLegacyCycle("ทุก 3 เดือน")).toBe("quarterly");
    expect(mapLegacyCycle("ทุก 6 เดือน")).toBe("semiannual");
    expect(mapLegacyCycle("รายปี")).toBe("yearly");
    expect(mapLegacyCycle("ปี")).toBe("yearly");
    expect(mapLegacyCycle("ทุกปี")).toBe("yearly");
  });
  it("defaults unknown labels to monthly", () => {
    expect(mapLegacyCycle(undefined)).toBe("monthly");
    expect(mapLegacyCycle("???")).toBe("monthly");
  });
});

describe("legacyCycleMonths", () => {
  it("matches the cycle's month count", () => {
    expect(legacyCycleMonths("ทุก 6 เดือน")).toBe(6);
    expect(legacyCycleMonths("ทุกปี")).toBe(12);
  });
});

describe("mapLegacyAccountType", () => {
  it("maps the documented labels (README §9 step 4)", () => {
    expect(mapLegacyAccountType("เงินสด")).toBe("cash");
    expect(mapLegacyAccountType("ออมทรัพย์")).toBe("savings");
    expect(mapLegacyAccountType("e-Wallet")).toBe("ewallet");
  });
  it("defaults unknown labels to savings", () => {
    expect(mapLegacyAccountType("???")).toBe("savings");
  });
});

describe("mapLegacyTaskPriority / mapLegacyVehicleKind / mapLegacyProjectStatus", () => {
  it("maps task priority", () => {
    expect(mapLegacyTaskPriority("สูง")).toBe("high");
    expect(mapLegacyTaskPriority("กลาง")).toBe("medium");
    expect(mapLegacyTaskPriority("ต่ำ")).toBe("low");
  });
  it("maps vehicle kind, falling back to car", () => {
    expect(mapLegacyVehicleKind("มอเตอร์ไซค์")).toBe("motorcycle");
    expect(mapLegacyVehicleKind("กระบะ")).toBe("car");
  });
  it("maps project status", () => {
    expect(mapLegacyProjectStatus("วางแผน")).toBe("planning");
    expect(mapLegacyProjectStatus("กำลังทำ")).toBe("in_progress");
    expect(mapLegacyProjectStatus("เสร็จแล้ว")).toBe("done");
  });
});

describe("computeOpeningBalance", () => {
  it("backfills opening_balance so balance = opening_balance + net effect", () => {
    const txns = [
      { type: "income" as const, amount: 1000, src: "a1" },
      { type: "expense" as const, amount: 300, src: "a1" },
      { type: "transfer" as const, amount: 200, src: "a1", to: "a2" },
      { type: "transfer" as const, amount: 50, src: "a2", to: "a1" },
    ];
    // a1 net effect: +1000 -300 -200 +50 = +550; legacyBal 2000 => opening = 1450
    expect(computeOpeningBalance(2000, "a1", txns)).toBe(1450);
  });
  it("is 0 effect when no transactions touch the account", () => {
    expect(computeOpeningBalance(500, "a9", [])).toBe(500);
  });
});

describe("computeOpeningUsed", () => {
  it("backfills opening_used so used = opening_used + net card effect", () => {
    const txns = [
      { type: "expense" as const, amount: 1000, src: "c1" },
      { type: "income" as const, amount: 100, src: "c1" },
      { type: "transfer" as const, amount: 400, src: "a1", to: "c1" },
    ];
    // c1 net effect: +1000(expense) -100(income) -400(transfer-to, paydown) = +500; used 2000 => opening_used 1500
    expect(computeOpeningUsed(2000, "c1", txns)).toBe(1500);
  });
});
