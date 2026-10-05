// Ported from design-reference/lifeos-things.jsx (yrsBetween, yrsLabel, warrantyState, assetValue).
import { daysTo } from "./dates";

export function yrsBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T00:00:00Z").getTime();
  const b = new Date(toISO + "T00:00:00Z").getTime();
  return Math.max(0, (b - a) / (365.25 * 86400000));
}

export function yrsLabel(years: number): string {
  if (years < 1) return `${Math.max(1, Math.round(years * 12))} เดือน`;
  return `${Math.round(years * 10) / 10} ปี`;
}

export type WarrantyTone = "" | "amber" | "green";

export function warrantyState(warrantyUntilISO: string | null | undefined, todayISO: string): { label: string; tone: WarrantyTone } {
  if (!warrantyUntilISO) return { label: "ไม่มีประกัน", tone: "" };
  const n = daysTo(warrantyUntilISO, todayISO);
  if (n < 0) return { label: "หมดประกันแล้ว", tone: "" };
  if (n <= 45) return { label: `หมดใน ${n} วัน`, tone: "amber" };
  return { label: `เหลือ ${Math.round(n / 30)} เดือน`, tone: "green" };
}

export function assetValue(assets: { price: number | null; sold: boolean }[]): number {
  return assets.filter((a) => !a.sold).reduce((s, a) => s + (a.price || 0), 0);
}
