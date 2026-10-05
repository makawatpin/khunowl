import { describe, expect, it } from "vitest";
import { parseSlip, slipAmount, slipDate, slipIsDuplicate, slipRef } from "./slips";

const EXP_CATS = ["อาหาร", "เดินทาง", "ช้อปปิ้ง", "บ้าน", "บิล/ค่าน้ำไฟ", "บันเทิง", "สุขภาพ", "รถ", "อื่นๆ"];
const todayISO = "2026-10-05";

describe("slipAmount", () => {
  it("prefers a line explicitly labelled as the amount", () => {
    const lines = ["โอนเงินสำเร็จ", "จำนวนเงิน 1,250.00 บาท", "ค่าธรรมเนียม 0.00 บาท"];
    expect(slipAmount(lines)).toBe(1250);
  });
  it("falls back to the largest number found when no label matches", () => {
    expect(slipAmount(["100.00", "2,500.50"])).toBe(2500.5);
  });
});

describe("slipDate", () => {
  it("parses a Thai short month", () => {
    expect(slipDate("โอนเงินวันที่ 14 ก.ย. 69", todayISO)).toBe("2026-09-14");
  });
  it("parses an English month", () => {
    expect(slipDate("14 Sep 2026", todayISO)).toBe("2026-09-14");
  });
  it("parses a numeric d/m/y date", () => {
    expect(slipDate("14/09/2026", todayISO)).toBe("2026-09-14");
  });
  it("falls back to today when nothing matches", () => {
    expect(slipDate("no date here", todayISO)).toBe(todayISO);
  });
});

describe("slipRef", () => {
  it("extracts a reference number following a labelled line", () => {
    const lines = ["เลขที่รายการ 202609140012345678"];
    expect(slipRef(lines, lines.join("\n"))).toBe("202609140012345678");
  });
});

describe("parseSlip", () => {
  it("assembles amount/date/bank/category from raw OCR text", () => {
    const text = ["K PLUS", "โอนเงินสำเร็จ", "14 ก.ย. 69 10:32", "ไปยัง 7-Eleven สาขา 1234", "จำนวนเงิน 65.00 บาท", "เลขที่รายการ 202609140012345678"].join("\n");
    const p = parseSlip({ text, todayISO, expenseCategories: EXP_CATS });
    expect(p.amount).toBe(65);
    expect(p.date).toBe("2026-09-14");
    expect(p.bank).toBe("kbank");
    expect(p.category).toBe("อาหาร"); // 7-Eleven keyword match
    expect(p.time).toBe("10:32");
  });

  it("reuses the category of a past transaction with the same payee name", () => {
    // Two labelled-name lines so slipNames() falls back to its "2nd name = recipient" heuristic
    // (the "ไปยัง "/"จาก " prefix match itself needs a non-Thai character to its right to satisfy \b,
    // which plain Thai text after the label never provides — a quirk ported as-is from the prototype).
    const text = "จาก นายสมชาย ใจดี\nไปยัง ร้านลุงมี\nจำนวนเงิน 40.00 บาท";
    const p = parseSlip({
      text,
      todayISO,
      expenseCategories: EXP_CATS,
      pastCategoryForName: (name) => (name === "ร้านลุงมี" ? "สุขภาพ" : undefined),
    });
    expect(p.category).toBe("สุขภาพ");
  });
});

describe("slipIsDuplicate", () => {
  it("flags a repeat of the same bank reference", () => {
    const p = { ref: "ABC123", type: "expense" as const, amount: 100, date: "2026-10-01", name: "ร้านค้า" };
    expect(slipIsDuplicate(p, new Set(["slip:ABC123"]), [], [])).toBe(true);
  });
  it("flags a matching amount+date+name even without a ref", () => {
    const p = { ref: "", type: "expense" as const, amount: 100, date: "2026-10-01", name: "ร้านค้า" };
    const existing = [{ type: "expense", amount: 100, date: "2026-10-01", name: "ร้านค้า" }];
    expect(slipIsDuplicate(p, new Set(), [], existing)).toBe(true);
  });
  it("does not flag a genuinely new transaction", () => {
    const p = { ref: "XYZ999", type: "expense" as const, amount: 50, date: "2026-10-05", name: "ร้านใหม่" };
    expect(slipIsDuplicate(p, new Set(), [], [])).toBe(false);
  });
});
