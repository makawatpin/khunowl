// Ported from design-reference/lifeos-trips.jsx (tAmt, tShares, tBalances, tSettle, fmtC).
import { daysTo } from "./dates";
import type { IconName } from "@/components/ui/icon";

export type SplitMode = "equal" | "items" | "custom";

export const TRIP_CATEGORIES: readonly [string, IconName][] = [
  ["อาหาร", "food"],
  ["ที่พัก", "house"],
  ["เดินทาง", "car"],
  ["เที่ยว/ตั๋ว", "star"],
  ["ช้อปปิ้ง", "box"],
  ["ของฝาก", "box"],
  ["อื่นๆ", "more"],
];

export function tripCatIcon(category: string | null | undefined): IconName {
  return TRIP_CATEGORIES.find(([c]) => c === category)?.[1] ?? "more";
}

export interface TripExpenseItem {
  price: number;
  people: string[]; // member ids
}
export interface TripExpense {
  id: string;
  paidBy: string; // member id
  splitMode: SplitMode;
  amount: number; // ignored for 'items' — use tAmt()
  split?: string[]; // 'equal' mode: member ids sharing the cost
  shares?: Record<string, number>; // 'custom' mode
  items?: TripExpenseItem[]; // 'items' mode
}
export interface TripSettlement {
  from: string;
  to: string;
  amt: number;
}
export interface Trip {
  members: string[];
  expenses: TripExpense[];
  settlements?: TripSettlement[];
}

const round2 = (x: number) => Math.round(x * 100) / 100;

/** Total cost of an expense — for 'items' mode this is the sum of item prices, not `.amount`. */
export function tAmt(e: Pick<TripExpense, "splitMode" | "amount" | "items">): number {
  if (e.splitMode === "items") return (e.items || []).reduce((s, it) => s + (it.price || 0), 0);
  return e.amount || 0;
}

/** Per-member amount owed for one expense, across all three split modes. */
export function tShares(e: TripExpense): Record<string, number> {
  const o: Record<string, number> = {};
  const add = (id: string, v: number) => {
    o[id] = (o[id] || 0) + v;
  };
  if (e.splitMode === "items") {
    for (const it of e.items || []) {
      const people = it.people?.length ? it.people : [e.paidBy];
      for (const id of people) add(id, (it.price || 0) / people.length);
    }
  } else if (e.splitMode === "custom") {
    for (const [id, v] of Object.entries(e.shares || {})) add(id, v || 0);
  } else {
    const people = e.split || [];
    for (const id of people) add(id, (e.amount || 0) / people.length);
  }
  return o;
}

/** Net balance per member: positive = owed money, negative = owes money. */
export function tBalances(t: Trip): Record<string, number> {
  const b: Record<string, number> = {};
  for (const m of t.members) b[m] = 0;
  for (const e of t.expenses) {
    b[e.paidBy] = (b[e.paidBy] || 0) + tAmt(e);
    for (const [id, v] of Object.entries(tShares(e))) b[id] = (b[id] || 0) - v;
  }
  for (const s of t.settlements || []) {
    b[s.from] = (b[s.from] || 0) + s.amt;
    b[s.to] = (b[s.to] || 0) - s.amt;
  }
  return b;
}

export interface Settlement {
  from: string;
  to: string;
  amt: number;
}

/** Greedy debt-minimising settle-up: pairs the largest debtor with the largest creditor. */
export function tSettle(t: Trip): Settlement[] {
  const b = tBalances(t);
  const cr: { id: string; a: number }[] = [];
  const db: { id: string; a: number }[] = [];
  for (const [id, raw] of Object.entries(b)) {
    const v = round2(raw);
    if (v > 0.01) cr.push({ id, a: v });
    else if (v < -0.01) db.push({ id, a: -v });
  }
  cr.sort((x, y) => y.a - x.a);
  db.sort((x, y) => y.a - x.a);

  const out: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < db.length && j < cr.length) {
    const p = Math.min(db[i].a, cr[j].a);
    if (p > 0.01) out.push({ from: db[i].id, to: cr[j].id, amt: round2(p) });
    db[i].a -= p;
    cr[j].a -= p;
    if (db[i].a < 0.01) i++;
    if (cr[j].a < 0.01) j++;
  }
  return out;
}

export const tTotal = (t: Trip): number => t.expenses.reduce((s, e) => s + tAmt(e), 0);

export interface TripCurrencyInfo {
  code: string;
  symbol: string;
  nameTh: string;
  defaultRate: number; // THB per 1 unit of this currency, used as the TripForm's suggested default
  noDecimals?: boolean;
}

export const TRIP_CURRENCIES: TripCurrencyInfo[] = [
  { code: "THB", symbol: "฿", nameTh: "บาทไทย", defaultRate: 1 },
  { code: "JPY", symbol: "¥", nameTh: "เยนญี่ปุ่น", defaultRate: 0.23, noDecimals: true },
  { code: "KRW", symbol: "₩", nameTh: "วอนเกาหลี", defaultRate: 0.026, noDecimals: true },
  { code: "CNY", symbol: "CN¥", nameTh: "หยวนจีน", defaultRate: 4.7 },
  { code: "TWD", symbol: "NT$", nameTh: "ดอลลาร์ไต้หวัน", defaultRate: 1.05, noDecimals: true },
  { code: "SGD", symbol: "S$", nameTh: "ดอลลาร์สิงคโปร์", defaultRate: 26 },
  { code: "VND", symbol: "₫", nameTh: "ดองเวียดนาม", defaultRate: 0.0014, noDecimals: true },
  { code: "USD", symbol: "$", nameTh: "ดอลลาร์สหรัฐ", defaultRate: 34 },
  { code: "EUR", symbol: "€", nameTh: "ยูโร", defaultRate: 37 },
  { code: "GBP", symbol: "£", nameTh: "ปอนด์", defaultRate: 44 },
];

/** Formats a trip-currency amount, e.g. fmtC(1234.5, "JPY") → "¥1,235". */
export function fmtC(amount: number, code: string, hide = false): string {
  const c = TRIP_CURRENCIES.find((x) => x.code === code) || TRIP_CURRENCIES[0];
  if (hide) return `${c.symbol} •••`;
  const v = Math.abs(amount || 0);
  const sign = (amount || 0) < -0.004 ? "−" : "";
  const opts = c.noDecimals
    ? { maximumFractionDigits: 0 }
    : { maximumFractionDigits: 2, minimumFractionDigits: Math.round(v * 100) % 100 ? 2 : 0 };
  return sign + c.symbol + v.toLocaleString("en-US", opts);
}

/** Ported from lifeos-trips.jsx (avText): Thai leading vowels (เ/แ/โ/ใ/ไ) attach to the
 * following consonant, so a one-letter initial would cut mid-syllable — take two chars instead. */
export function avatarInitial(name: string): string {
  return /^[เแโใไ]/.test(name) ? name.slice(0, 2) : name.slice(0, 1);
}

export const AVATAR_COLORS = ["#23A36A", "#3E82CF", "#8A5CC4", "#E09338", "#E0456F", "#0E8A4A", "#C8117A", "#4A5364"];

export type TripTone = "" | "accent" | "green";

/** Ported from lifeos-trips.jsx (tStatus): อีก n วัน (upcoming) / กำลังเที่ยว (ongoing) / จบแล้ว (past). */
export function tStatus(startISO: string | null, endISO: string | null, todayISO: string): { text: string; tone: TripTone } {
  const start = daysTo(startISO, todayISO);
  const end = daysTo(endISO || startISO, todayISO);
  if (start > 0) return { text: `อีก ${start} วัน`, tone: "accent" };
  if (end >= 0) return { text: "กำลังเที่ยว", tone: "green" };
  return { text: "จบแล้ว", tone: "" };
}
