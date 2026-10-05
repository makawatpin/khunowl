// Ported from design-reference/lifeos-data.jsx (nextServiceKm, fuelStats, vehicleYearCost)
// and lifeos-forms.jsx (SVC_CATS, svcCat, svcIcon).
import type { IconName } from "@/components/ui/icon";

export const SVC_CATEGORIES: readonly [string, IconName][] = [
  ["ซ่อมบำรุง", "wrench"],
  ["อะไหล่", "box"],
  ["ภาษี/ทะเบียน", "doc"],
  ["ล้าง/ดูแล", "star"],
  ["อื่นๆ", "more"],
];

export function svcIcon(category: string | null | undefined): IconName {
  return SVC_CATEGORIES.find(([c]) => c === category)?.[1] ?? "wrench";
}

export function nextServiceKm(mileage: number, serviceEveryKm: number): number {
  const every = serviceEveryKm || 5000;
  return Math.ceil((mileage + 1) / every) * every;
}

export interface FuelLog {
  date: string;
  mileage: number;
  liters: number;
  total: number;
}

export interface FuelStats {
  kmPerL: number;
  costPerKm: number;
  monthly: number;
  legs: number;
}

/** `rows` must be sorted newest-first by mileage (as fuelOf() does in the prototype). */
export function fuelStats(rows: FuelLog[], monthKey: string): FuelStats {
  const legs: { kmPerL: number; costPerKm: number }[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const km = rows[i].mileage - rows[i + 1].mileage;
    if (km > 0) legs.push({ kmPerL: km / rows[i].liters, costPerKm: rows[i].total / km });
  }
  const avg = (k: "kmPerL" | "costPerKm") => (legs.length ? legs.reduce((s, l) => s + l[k], 0) / legs.length : 0);
  return {
    kmPerL: avg("kmPerL"),
    costPerKm: avg("costPerKm"),
    monthly: rows.filter((r) => r.date.startsWith(monthKey)).reduce((s, f) => s + f.total, 0),
    legs: legs.length,
  };
}

export function vehicleYearCost(opts: {
  year: string; // e.g. "2026"
  services: { date: string; cost: number }[];
  fuel: { date: string; total: number }[];
  insurancePremium?: number | null;
  prbPremium?: number | null;
  taxPremium?: number | null;
}): number {
  const { year, services, fuel, insurancePremium, prbPremium, taxPremium } = opts;
  const serviceCost = services.filter((s) => s.date.startsWith(year)).reduce((s, x) => s + x.cost, 0);
  const fuelCost = fuel.filter((f) => f.date.startsWith(year)).reduce((s, f) => s + f.total, 0);
  return serviceCost + fuelCost + (insurancePremium || 0) + (prbPremium || 0) + (taxPremium || 0);
}

export function vehicleName(brand: string | null, model: string | null): string {
  return `${brand ?? ""} ${model ?? ""}`.trim();
}
