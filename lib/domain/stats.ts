// Ported from design-reference/lifeos-stats.jsx — month-scoped aggregation helpers.
import { addMonths } from "./dates";

export interface StatsTxn {
  type: "expense" | "income" | "transfer";
  amount: number;
  date: string; // ISO
  category: string | null;
  name: string;
}

export function monthKeyAdd(monthKey: string, n: number): string {
  return addMonths(`${monthKey}-01`, n).slice(0, 7);
}

export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function txnsInMonth(txns: StatsTxn[], monthKey: string, type?: StatsTxn["type"]): StatsTxn[] {
  return txns.filter((t) => t.date.startsWith(monthKey) && (!type || t.type === type));
}

export function sumAmount(txns: StatsTxn[]): number {
  return txns.reduce((s, t) => s + (t.amount || 0), 0);
}

export function groupByDayOfMonth(txns: StatsTxn[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const t of txns) {
    const day = Number(t.date.slice(8, 10));
    out[day] = (out[day] || 0) + (t.amount || 0);
  }
  return out;
}

export function groupByCategory(txns: StatsTxn[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of txns) {
    const key = t.category || "อื่นๆ";
    out[key] = (out[key] || 0) + (t.amount || 0);
  }
  return out;
}

export interface Payee {
  name: string;
  amount: number;
  count: number;
}

export function topPayees(txns: StatsTxn[], limit = 5): Payee[] {
  const map = new Map<string, Payee>();
  for (const t of txns) {
    const key = t.name || "—";
    const p = map.get(key) ?? { name: key, amount: 0, count: 0 };
    p.amount += t.amount || 0;
    p.count += 1;
    map.set(key, p);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, limit);
}

export interface TrendPoint {
  monthKey: string;
  expense: number;
  income: number;
}

export function monthTrend(txns: StatsTxn[], currentMonthKey: string, monthsBack = 5): TrendPoint[] {
  const offsets = Array.from({ length: monthsBack + 1 }, (_, i) => i - monthsBack);
  return offsets.map((n) => {
    const mk = monthKeyAdd(currentMonthKey, n);
    return {
      monthKey: mk,
      expense: sumAmount(txnsInMonth(txns, mk, "expense")),
      income: sumAmount(txnsInMonth(txns, mk, "income")),
    };
  });
}
