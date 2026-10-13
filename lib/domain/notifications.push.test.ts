import { describe, expect, it } from "vitest";
import { selectPushItems, type NotificationItem } from "./notifications";

const item = (over: Partial<NotificationItem>): NotificationItem => ({
  id: "bill:1@2026-10-10", key: "bill:1", group: "ต้องจ่าย", tone: "red", title: "ค่าไฟ", date: "2026-10-10", done: false, ...over,
});

describe("selectPushItems", () => {
  const today = "2026-10-10";
  it("fires on the due date and configured lead days only", () => {
    const items = [
      item({ id: "a", date: "2026-10-10" }), // d=0
      item({ id: "b", date: "2026-10-11" }), // d=1
      item({ id: "c", date: "2026-10-13" }), // d=3
      item({ id: "d", date: "2026-10-12" }), // d=2 — not a lead day
      item({ id: "e", date: "2026-10-17" }), // d=7 — not in default
    ];
    expect(selectPushItems(items, today).map((n) => n.id)).toEqual(["a", "b", "c"]);
    expect(selectPushItems(items, today, [7]).map((n) => n.id)).toEqual(["e"]);
  });
  it("nags overdue payments daily but not other overdue groups", () => {
    const items = [
      item({ id: "pay", date: "2026-10-05" }),
      item({ id: "doc", group: "ใกล้หมดอายุ", date: "2026-10-05" }),
    ];
    expect(selectPushItems(items, today).map((n) => n.id)).toEqual(["pay"]);
  });
  it("skips acknowledged items", () => {
    expect(selectPushItems([item({ done: true })], today)).toEqual([]);
  });
});
