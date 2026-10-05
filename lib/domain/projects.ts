// Ported from design-reference/lifeos-build.jsx (billTotal, pjStats). Crew/labor
// draw tracking from the prototype has no matching table in supabase/schema.sql
// (projects/project_bills only) — out of scope for this step; `spent`/`forecast`
// here are material-bill totals only, with budget comparison still meaningful.
export interface ProjectBillItem {
  qty: number;
  price: number;
}

export function billTotal(items: ProjectBillItem[]): number {
  return Math.round(items.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0) * 100) / 100;
}

export function pjStats(bills: { items: ProjectBillItem[] }[]): { mat: number } {
  const mat = bills.reduce((s, b) => s + billTotal(b.items), 0);
  return { mat };
}
