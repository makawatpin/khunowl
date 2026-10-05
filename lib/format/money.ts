// Ported from design-reference/lifeos-data.jsx (money()).
export function formatMoney(n: number | null | undefined, hide = false): string {
  if (hide) return "฿ •••";
  const v = n || 0;
  return (v < 0 ? "−฿" : "฿") + Math.round(Math.abs(v)).toLocaleString("en-US");
}
