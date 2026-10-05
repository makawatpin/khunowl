import { describe, expect, it } from "vitest";
import { calendarEvents } from "./calendar";
import { occurrences } from "./dates";

const todayISO = "2026-10-05";
const money = (n: number) => `฿${n}`;
const nextIncomeOccurrences = (dayOfMonth: number, from: string, to: string) =>
  occurrences(`${from.slice(0, 7)}-${String(dayOfMonth).padStart(2, "0")}`, "monthly", from, to);

const empty = {
  todayISO,
  bills: [],
  subscriptions: [],
  cards: [],
  income: [],
  assets: [],
  homeTasks: [],
  vehicles: [],
  tasks: [],
  documents: [],
  moneyFormatter: money,
  nextIncomeOccurrences,
};

describe("calendarEvents", () => {
  it("expands a recurring bill into one event per occurrence", () => {
    const ev = calendarEvents({ ...empty, bills: [{ name: "ค่าไฟ", amount: 1240, cycle: "monthly", nextDue: "2026-10-05" }] });
    expect(ev.filter((e) => e.kind === "bill").length).toBeGreaterThan(1);
    expect(ev[0]).toMatchObject({ kind: "bill", title: "ค่าไฟ", tone: "red" });
  });

  it("excludes ประกัน/ทะเบียน documents, same rule as notifications", () => {
    const ev = calendarEvents({ ...empty, documents: [{ name: "ประกันรถ", type: "ประกัน", expiry: "2026-10-20" }] });
    expect(ev).toEqual([]);
  });

  it("includes an undone task on its due date, excludes done ones", () => {
    const ev = calendarEvents({
      ...empty,
      tasks: [
        { name: "งาน A", due: "2026-10-10", priority: "high", done: false },
        { name: "งาน B", due: "2026-10-10", priority: "low", done: true },
      ],
    });
    expect(ev).toHaveLength(1);
    expect(ev[0].title).toBe("งาน A");
  });

  it("sorts all events chronologically", () => {
    const ev = calendarEvents({
      ...empty,
      bills: [{ name: "บิล", amount: 100, cycle: "yearly", nextDue: "2026-10-20" }],
      tasks: [{ name: "งาน", due: "2026-10-06", priority: "medium", done: false }],
    });
    const dates = ev.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
  });
});
