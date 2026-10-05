// Ported from design-reference/lifeos-data.jsx (forecast, upcomingPayments, subsMonthly).
import { addDays, addMonths, CYCLE_MONTHS, daysTo, nextIncomeDate, occurrences, type Cycle } from "./dates";

export interface ForecastBill {
  id: string;
  name: string;
  amount: number;
  cycle: Cycle;
  nextDue: string;
}
export interface ForecastSubscription {
  id: string;
  name: string;
  price: number;
  cycle: Cycle;
  nextBilling: string;
  /** False when the account/card it bills to no longer exists (prototype: `LOS_ACCOUNTS.find(...)`). */
  hasValidSource: boolean;
}
export interface ForecastCard {
  id: string;
  name: string;
  used: number;
  dueDate: string | null;
}
export interface ForecastIncome {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
}

export interface ForecastItem {
  name: string;
  amount: number;
  date: string;
}
export interface ForecastResult {
  start: number;
  out: number;
  inc: number;
  end: number;
  items: ForecastItem[];
}

export function forecast(opts: {
  days?: number;
  todayISO: string;
  startBalance: number;
  bills: ForecastBill[];
  subscriptions: ForecastSubscription[];
  cards: ForecastCard[];
  income: ForecastIncome[];
}): ForecastResult {
  const { days = 10, todayISO, startBalance, bills, subscriptions, cards, income } = opts;
  const end = addDays(todayISO, days);
  const items: ForecastItem[] = [];

  for (const b of bills) {
    if (b.nextDue < todayISO) items.push({ name: `${b.name} (ค้างจ่าย)`, amount: -b.amount, date: todayISO });
    for (const d of occurrences(b.nextDue, b.cycle, todayISO, end)) items.push({ name: b.name, amount: -b.amount, date: d });
  }
  for (const s of subscriptions) {
    if (!s.hasValidSource) continue;
    for (const d of occurrences(s.nextBilling, s.cycle, todayISO, end)) items.push({ name: s.name, amount: -s.price, date: d });
  }
  for (const c of cards) {
    if (c.used > 0 && c.dueDate && c.dueDate <= end) {
      items.push({ name: `ชำระ ${c.name}`, amount: -c.used, date: c.dueDate < todayISO ? todayISO : c.dueDate });
    }
  }
  for (const i of income) {
    let d = nextIncomeDate(i.dayOfMonth, todayISO);
    let k = 0;
    while (d <= end && k++ < 24) {
      items.push({ name: i.name, amount: i.amount, date: d });
      d = addMonths(d, 1);
    }
  }

  items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const out = items.filter((i) => i.amount < 0).reduce((s, i) => s - i.amount, 0);
  const inc = items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0);
  return { start: startBalance, out, inc, end: startBalance - out + inc, items };
}

export interface UpcomingPayment {
  key: string;
  kind: "bill" | "card" | "sub";
  id: string;
  name: string;
  amount: number;
  date: string;
  domain?: string | null;
  bank?: string | null;
  auto?: boolean;
  sourceAccountId?: string | null;
  minPayment?: number;
}

export function upcomingPayments(opts: {
  days?: number;
  todayISO: string;
  bills: (ForecastBill & { domain?: string | null; auto?: boolean; accountId: string | null })[];
  cards: (ForecastCard & { bank?: string | null; minPayment: number })[];
  subscriptions: (ForecastSubscription & { domain?: string | null; accountId?: string | null; cardId?: string | null })[];
}): UpcomingPayment[] {
  const { days = 10, todayISO, bills, cards, subscriptions } = opts;
  const out: UpcomingPayment[] = [];
  for (const b of bills) {
    if (daysTo(b.nextDue, todayISO) <= days) {
      out.push({ key: `b${b.id}`, kind: "bill", id: b.id, name: b.name, amount: b.amount, date: b.nextDue, domain: b.domain, auto: b.auto, sourceAccountId: b.accountId });
    }
  }
  for (const c of cards) {
    if (c.used > 0 && daysTo(c.dueDate, todayISO) <= days) {
      out.push({ key: `c${c.id}`, kind: "card", id: c.id, name: `ชำระ ${c.name}`, amount: c.used, date: c.dueDate ?? todayISO, bank: c.bank, minPayment: c.minPayment });
    }
  }
  for (const s of subscriptions) {
    if (daysTo(s.nextBilling, todayISO) <= days) {
      out.push({ key: `s${s.id}`, kind: "sub", id: s.id, name: s.name, amount: s.price, date: s.nextBilling, domain: s.domain, sourceAccountId: s.accountId ?? s.cardId ?? null });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function subsMonthly(subscriptions: { price: number; cycle: Cycle }[]): number {
  return subscriptions.reduce((s, x) => s + (CYCLE_MONTHS[x.cycle] === 12 ? x.price / 12 : x.price), 0);
}
