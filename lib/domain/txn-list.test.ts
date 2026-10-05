import { describe, expect, it } from "vitest";
import { nextTxnCursor, toTxnListItem } from "./txn-list";

describe("nextTxnCursor", () => {
  const rows = [{ date: "2026-10-05", id: "b" }, { date: "2026-10-04", id: "a" }];
  it("returns the last row as the cursor when the page is full", () => {
    expect(nextTxnCursor(rows, 2)).toEqual({ date: "2026-10-04", id: "a" });
  });
  it("returns null when the page is short (no more rows)", () => {
    expect(nextTxnCursor(rows, 3)).toBeNull();
  });
});

describe("toTxnListItem", () => {
  it("maps account/card sources and transfer targets", () => {
    const item = toTxnListItem({
      id: "1", type: "transfer", amount: 100, date: "2026-10-05", name: "x", category: null, note: null,
      src_account_id: "acc", src_card_id: null, to_account_id: null, to_card_id: "card",
    });
    expect(item).toMatchObject({ srcId: "acc", srcKind: "account", toId: "card", toKind: "card" });
  });
});
