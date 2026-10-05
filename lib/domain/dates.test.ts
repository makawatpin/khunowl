import { describe, expect, it } from "vitest";
import { addCycle, addDays, addMonths, anchorDayOf, anchorForEdit, dayOf, daysTo, dueLabel, nextIncomeDate, occurrences } from "./dates";

describe("addMonths", () => {
  it("clamps end-of-month overflow (31 Jan + 1mo → 28 Feb, non-leap year)", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
  });
  it("clamps to 29 Feb in a leap year", () => {
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
  });
  it("rolls over a year boundary", () => {
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });
  it("supports negative n", () => {
    expect(addMonths("2026-03-10", -1)).toBe("2026-02-10");
  });
  it("keeps the day when the target month is long enough", () => {
    expect(addMonths("2026-01-15", 2)).toBe("2026-03-15");
  });
});

describe("addDays / addCycle", () => {
  it("addDays crosses month boundaries", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
  });
  it("addCycle maps cycle names to month counts", () => {
    expect(addCycle("2026-01-01", "monthly")).toBe("2026-02-01");
    expect(addCycle("2026-01-01", "quarterly")).toBe("2026-04-01");
    expect(addCycle("2026-01-01", "semiannual")).toBe("2026-07-01");
    expect(addCycle("2026-01-01", "yearly")).toBe("2027-01-01");
  });
  it("addCycle with an anchor day restores the 31st after a clamped month (no drift)", () => {
    expect(addCycle("2027-02-28", "monthly", 31)).toBe("2027-03-31");
    expect(addCycle("2027-03-31", "monthly", 31)).toBe("2027-04-30");
    expect(addCycle("2027-04-30", "monthly", 31)).toBe("2027-05-31");
  });
  it("addCycle without an anchor still clamps and drifts (legacy behaviour)", () => {
    expect(addCycle("2027-02-28", "monthly")).toBe("2027-03-28");
  });
});

describe("anchorDayOf", () => {
  it("prefers the stored anchor, else the day of the date", () => {
    expect(anchorDayOf("2027-02-28", 31)).toBe(31);
    expect(anchorDayOf("2027-02-28", null)).toBe(28);
  });
  it("dayOf reads the day of month", () => {
    expect(dayOf("2027-02-28")).toBe(28);
  });
  it("anchorForEdit keeps the old anchor when the date wasn't changed, else uses the new day", () => {
    expect(anchorForEdit("2027-02-28", "2027-02-28", 31)).toBe(31);
    expect(anchorForEdit("2027-03-15", "2027-02-28", 31)).toBe(15);
    expect(anchorForEdit("2027-02-28", "2027-02-28", null)).toBe(28);
  });
});

describe("occurrences", () => {
  it("lists every occurrence within [from, to], inclusive", () => {
    expect(occurrences("2026-01-05", "monthly", "2026-01-01", "2026-04-01")).toEqual([
      "2026-01-05", "2026-02-05", "2026-03-05",
    ]);
  });
  it("excludes dates before `from`", () => {
    expect(occurrences("2026-01-05", "monthly", "2026-02-01", "2026-04-01")).toEqual([
      "2026-02-05", "2026-03-05",
    ]);
  });
  it("keeps advancing through cycles to find occurrences long after `start`", () => {
    expect(occurrences("2026-01-05", "yearly", "2030-01-01", "2030-12-31")).toEqual(["2030-01-05"]);
  });
  it("does not drift after a short month (31st stays the 31st where possible)", () => {
    expect(occurrences("2027-01-31", "monthly", "2027-01-01", "2027-05-31")).toEqual([
      "2027-01-31", "2027-02-28", "2027-03-31", "2027-04-30", "2027-05-31",
    ]);
  });
  it("honours an explicit anchor when start is already clamped", () => {
    expect(occurrences("2027-02-28", "monthly", "2027-02-01", "2027-03-31", 60, 31)).toEqual([
      "2027-02-28", "2027-03-31",
    ]);
  });
  it("returns nothing once `start` is already past `to`", () => {
    expect(occurrences("2031-01-05", "monthly", "2026-01-01", "2026-12-31")).toEqual([]);
  });
});

describe("daysTo / dueLabel", () => {
  const today = "2026-10-05";
  it("daysTo is positive for future dates, negative for past", () => {
    expect(daysTo("2026-10-12", today)).toBe(7);
    expect(daysTo("2026-10-01", today)).toBe(-4);
    expect(daysTo(null, today)).toBe(99999);
  });
  it("dueLabel: overdue is red with a day count", () => {
    expect(dueLabel("2026-10-01", today)).toEqual({ text: "เกินกำหนด 4 วัน", tone: "red" });
  });
  it("dueLabel: today and tomorrow are red", () => {
    expect(dueLabel("2026-10-05", today)).toEqual({ text: "วันนี้", tone: "red" });
    expect(dueLabel("2026-10-06", today)).toEqual({ text: "พรุ่งนี้", tone: "red" });
  });
  it("dueLabel: within a week is amber, beyond is untoned", () => {
    expect(dueLabel("2026-10-12", today)).toEqual({ text: "อีก 7 วัน", tone: "amber" });
    expect(dueLabel("2026-10-13", today)).toEqual({ text: "อีก 8 วัน", tone: "" });
  });
  it("dueLabel: null date", () => {
    expect(dueLabel(null, today)).toEqual({ text: "ไม่ระบุวัน", tone: "" });
  });
});

describe("nextIncomeDate", () => {
  it("stays in the current month if payday hasn't passed", () => {
    expect(nextIncomeDate(25, "2026-10-05")).toBe("2026-10-25");
  });
  it("rolls to next month once payday has passed", () => {
    expect(nextIncomeDate(25, "2026-10-26")).toBe("2026-11-25");
  });
  it("clamps day-31 payday in short months", () => {
    expect(nextIncomeDate(31, "2026-02-01")).toBe("2026-02-28");
  });
});
