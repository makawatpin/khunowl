// Thai labels for the English DB enums (CLAUDE.md: "Enum ภาษาอังกฤษใน DB, label ไทยอยู่ใน lib/i18n/th.ts").
import type { Database } from "@/lib/db.types";

type AccountType = Database["public"]["Enums"]["account_type"];
type Cycle = Database["public"]["Enums"]["cycle_t"];
type TaskPriority = Database["public"]["Enums"]["task_pri"];
type VehicleKind = Database["public"]["Enums"]["vehicle_kind"];

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  cash: "เงินสด",
  savings: "ออมทรัพย์",
  checking: "กระแสรายวัน",
  ewallet: "e-Wallet",
  investment: "ลงทุน",
};

export const CYCLE_LABEL: Record<Cycle, string> = {
  monthly: "รายเดือน",
  quarterly: "ทุก 3 เดือน",
  semiannual: "ทุก 6 เดือน",
  yearly: "รายปี",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: "สูง",
  medium: "กลาง",
  low: "ต่ำ",
};

// schema's `vehicle_kind` enum only has car/motorcycle (the prototype's กระบะ/อื่นๆ
// options have no matching DB value — a scope cut, same as other free-text lists
// that became enums going from prototype to schema).
export const VEHICLE_KIND_LABEL: Record<VehicleKind, string> = {
  car: "รถยนต์",
  motorcycle: "มอเตอร์ไซค์",
};
