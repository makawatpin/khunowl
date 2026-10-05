// Ported from design-reference/lifeos-data.jsx (addMonths, addCycle, occurrences,
// daysTo, dueLabel). Pure ISO-date-string math (UTC-based, no local-timezone drift) —
// every caller passes `todayISO` explicitly instead of reading `new Date()` here,
// per CLAUDE.md (dates are Asia/Bangkok `date` values; "today" is computed server-side).

export type Cycle = "monthly" | "quarterly" | "semiannual" | "yearly";

export const CYCLE_MONTHS: Record<Cycle, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  yearly: 12,
};

function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function daysInMonth(y: number, monthZeroBased: number): number {
  return new Date(Date.UTC(y, monthZeroBased + 1, 0)).getUTCDate();
}

function formatISO(y: number, monthZeroBased: number, d: number): string {
  const dt = new Date(Date.UTC(y, monthZeroBased, d));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/** Adds `n` months, clamping the day to the target month's last day (31 Jan + 1mo → 28/29 Feb). */
export function addMonths(iso: string, n: number): string {
  const { y, m, d } = parseISO(iso);
  const monthIndex = m - 1 + n;
  const targetYear = y + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const clampedDay = Math.min(d, daysInMonth(targetYear, targetMonth));
  return formatISO(targetYear, targetMonth, clampedDay);
}

export function addDays(iso: string, n: number): string {
  const { y, m, d } = parseISO(iso);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function addCycle(iso: string, cycle: Cycle): string {
  return addMonths(iso, CYCLE_MONTHS[cycle]);
}

/** All cycle occurrences of `start` that fall within [from, to], capped at `limit` iterations. */
export function occurrences(start: string, cycle: Cycle, from: string, to: string, limit = 60): string[] {
  const out: string[] = [];
  let d = start;
  let k = 0;
  while (d && d <= to && k++ < limit) {
    if (d >= from) out.push(d);
    d = addCycle(d, cycle);
  }
  return out;
}

export function daysTo(iso: string | null | undefined, todayISO: string): number {
  if (!iso) return 99999;
  const a = parseISO(todayISO);
  const b = parseISO(iso);
  const t0 = Date.UTC(a.y, a.m - 1, a.d);
  const t1 = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((t1 - t0) / 86400000);
}

export type DueTone = "" | "red" | "amber";

export function dueLabel(iso: string | null | undefined, todayISO: string): { text: string; tone: DueTone } {
  if (!iso) return { text: "ไม่ระบุวัน", tone: "" };
  const n = daysTo(iso, todayISO);
  if (n < 0) return { text: `เกินกำหนด ${-n} วัน`, tone: "red" };
  if (n === 0) return { text: "วันนี้", tone: "red" };
  if (n === 1) return { text: "พรุ่งนี้", tone: "red" };
  if (n <= 7) return { text: `อีก ${n} วัน`, tone: "amber" };
  return { text: `อีก ${n} วัน`, tone: "" };
}

/** Next occurrence of a monthly-recurring day (income payday), rolling to next month if this month's has passed. */
export function nextIncomeDate(dayOfMonth: number, todayISO: string): string {
  const { y, m } = parseISO(todayISO);
  const monthZero = m - 1;
  const thisMonthIso = formatISO(y, monthZero, Math.min(dayOfMonth, daysInMonth(y, monthZero)));
  if (thisMonthIso >= todayISO) return thisMonthIso;
  const nextMonthZero = monthZero + 1;
  const ny = y + Math.floor(nextMonthZero / 12);
  const nm = ((nextMonthZero % 12) + 12) % 12;
  return formatISO(ny, nm, Math.min(dayOfMonth, daysInMonth(ny, nm)));
}
