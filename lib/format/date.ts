// Ported from design-reference/lifeos-data.jsx (dShort/dLong).
const M_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function dShort(iso: string | null | undefined, todayISO?: string): string {
  if (!iso) return "—";
  const { y, m, d } = parse(iso);
  const nowYear = todayISO ? parse(todayISO).y : new Date().getFullYear();
  return `${d} ${M_TH[m - 1]}` + (y !== nowYear ? ` ${y}` : "");
}

export function dLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  const { y, m, d } = parse(iso);
  return `${d} ${MONTHS_TH[m - 1]} ${y}`;
}
