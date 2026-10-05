// Ported from design-reference/lifeos-data.jsx and lifeos-build.jsx. Free-text
// suggestion lists (schema stores these as plain `text`, not enums), same
// pattern as EXPENSE_CATEGORIES in categories.ts.
export const ASSET_KINDS = ["อุปกรณ์", "เครื่องใช้ไฟฟ้า", "เฟอร์นิเจอร์", "เครื่องประดับ", "อื่นๆ"];
export const ASSET_CHANNELS = ["หน้าร้าน", "Shopee", "Lazada", "เว็บไซต์แบรนด์", "อื่นๆ"];
export const DOC_TYPES = ["เอกสารบุคคล", "ประกัน", "ทะเบียน", "ใบเสร็จ", "ใบรับประกัน", "สัญญา", "อื่นๆ"];
export const HOME_KINDS = ["เช่า", "เป็นเจ้าของ", "ผ่อน", "อยู่กับครอบครัว"];
export const HOME_TASK_CYCLES = [3, 6, 12] as const;
export const HOME_TASK_CYCLE_LABEL: Record<number, string> = { 3: "ทุก 3 เดือน", 6: "ทุก 6 เดือน", 12: "ทุกปี" };
export const PJ_KINDS = ["ต่อเติม", "รีโนเวท", "ซ่อมใหญ่", "สร้างใหม่", "ตกแต่ง"];
export const PJ_STATUS = ["planning", "in_progress", "done"] as const;
export const PJ_STATUS_LABEL: Record<string, string> = { planning: "วางแผน", in_progress: "กำลังทำ", done: "เสร็จแล้ว" };
export const PJ_PHASES_DEFAULT = ["รื้อถอน", "งานดิน", "โครงสร้าง", "พื้น", "ผนัง", "หลังคา", "ประปา", "ไฟฟ้า", "ห้องน้ำ", "สี/ตกแต่ง"];
