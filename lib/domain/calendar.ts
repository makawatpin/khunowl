// Ported from design-reference/lifeos-data.jsx (calendarEvents). Window matches
// the prototype: 2 months back to 420 days ahead.
import { addDays, addMonths, daysTo, nextIncomeDate, occurrences, type Cycle } from "./dates";

/** Default `nextIncomeOccurrences`: rolls a monthly payday forward from `from`, capped at 14 (matches the prototype). */
export function defaultNextIncomeOccurrences(dayOfMonth: number, from: string, to: string): string[] {
  const out: string[] = [];
  let d = nextIncomeDate(dayOfMonth, from);
  let k = 0;
  while (d <= to && k++ < 14) {
    out.push(d);
    d = addMonths(d, 1);
  }
  return out;
}

export type CalendarTone = "red" | "accent" | "green" | "amber" | "";
export type CalendarKind = "bill" | "sub" | "card" | "income" | "warranty" | "home" | "vehicle" | "task" | "doc";

export interface CalendarEvent {
  date: string;
  kind: CalendarKind;
  title: string;
  sub: string;
  tone: CalendarTone;
  domain?: string | null;
}

export function calendarEvents(input: {
  todayISO: string;
  bills: { name: string; amount: number; cycle: Cycle; nextDue: string; domain?: string | null }[];
  subscriptions: { name: string; price: number; cycle: Cycle; nextBilling: string; domain?: string | null }[];
  cards: { name: string; used: number; dueDate: string | null }[];
  income: { name: string; amount: number; dayOfMonth: number }[];
  assets: { name: string; warrantyUntil: string | null }[];
  homeTasks: { name: string; nextDue: string; homeName: string }[];
  vehicles: { model: string | null; plate: string | null; insuranceExpiry: string | null; taxExpiry: string | null }[];
  tasks: { name: string; due: string | null; priority: "high" | "medium" | "low"; done: boolean }[];
  documents: { name: string; type: string | null; expiry: string | null }[];
  moneyFormatter: (n: number) => string;
  nextIncomeOccurrences: (dayOfMonth: number, from: string, to: string) => string[];
}): CalendarEvent[] {
  const { todayISO, bills, subscriptions, cards, income, assets, homeTasks, vehicles, tasks, documents, moneyFormatter: money, nextIncomeOccurrences } = input;
  const from = addMonths(todayISO, -2);
  const to = addDays(todayISO, 420);
  const ev: CalendarEvent[] = [];

  for (const b of bills) {
    for (const d of occurrences(b.nextDue, b.cycle, from, to)) ev.push({ date: d, kind: "bill", title: b.name, sub: money(b.amount), tone: "red", domain: b.domain });
  }
  for (const s of subscriptions) {
    for (const d of occurrences(s.nextBilling, s.cycle, from, to)) ev.push({ date: d, kind: "sub", title: s.name, sub: money(s.price), tone: "accent", domain: s.domain });
  }
  for (const c of cards) {
    if (c.used > 0 && c.dueDate) ev.push({ date: c.dueDate, kind: "card", title: `ชำระ ${c.name}`, sub: money(c.used), tone: "red" });
  }
  for (const i of income) {
    for (const d of nextIncomeOccurrences(i.dayOfMonth, todayISO, to)) ev.push({ date: d, kind: "income", title: i.name, sub: money(i.amount), tone: "green" });
  }
  for (const a of assets) {
    if (a.warrantyUntil && daysTo(a.warrantyUntil, todayISO) >= 0) {
      ev.push({ date: a.warrantyUntil, kind: "warranty", title: `ประกัน ${a.name} หมด`, sub: "รับประกันสินค้า", tone: "amber" });
    }
  }
  for (const h of homeTasks) {
    ev.push({ date: h.nextDue, kind: "home", title: h.name, sub: h.homeName, tone: "green" });
  }
  for (const v of vehicles) {
    if (v.insuranceExpiry) ev.push({ date: v.insuranceExpiry, kind: "vehicle", title: `ประกันรถหมด · ${v.model ?? ""}`.trim(), sub: v.plate ?? "", tone: "amber" });
    if (v.taxExpiry) ev.push({ date: v.taxExpiry, kind: "vehicle", title: `ภาษีรถหมด · ${v.model ?? ""}`.trim(), sub: v.plate ?? "", tone: "amber" });
  }
  for (const t of tasks) {
    if (!t.done && t.due) ev.push({ date: t.due, kind: "task", title: t.name, sub: `งาน · ${t.priority}`, tone: "" });
  }
  for (const d of documents) {
    const n = daysTo(d.expiry, todayISO);
    if (d.expiry && n >= 0 && n < 400 && d.type !== "ประกัน" && d.type !== "ทะเบียน") {
      ev.push({ date: d.expiry, kind: "doc", title: `${d.name} หมดอายุ`, sub: "เอกสาร", tone: "amber" });
    }
  }

  return ev.sort((a, b) => (a.date < b.date ? -1 : 1));
}
