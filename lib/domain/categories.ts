// Ported from design-reference/lifeos-data.jsx (EXP_CATS/INC_CATS) and
// lifeos-ui.jsx (CAT_HUE/catColor). Categories are free text (schema.sql:
// "เก็บเป็น text ให้ผู้ใช้เพิ่มได้ภายหลัง") — this is the v1 default set, not an enum.
export const EXPENSE_CATEGORIES = ["อาหาร", "เดินทาง", "ช้อปปิ้ง", "บ้าน", "บิล/ค่าน้ำไฟ", "บันเทิง", "สุขภาพ", "รถ", "อื่นๆ"];
export const INCOME_CATEGORIES = ["เงินเดือน", "ฟรีแลนซ์", "โบนัส", "ขายของ", "อื่นๆ"];

const CAT_HUE: Record<string, number> = {
  "อาหาร": 55, "เดินทาง": 235, "ช้อปปิ้ง": 340, "บ้าน": 150,
  "บิล/ค่าน้ำไฟ": 90, "บันเทิง": 295, "สุขภาพ": 185, "รถ": 262,
};

export function categoryColor(cat: string | null | undefined): { bg: string; fg: string; bar: string } | null {
  if (!cat) return null;
  const h = CAT_HUE[cat];
  if (h == null) return null;
  return { bg: `oklch(0.95 0.035 ${h})`, fg: `oklch(0.5 0.13 ${h})`, bar: `oklch(0.7 0.13 ${h})` };
}
