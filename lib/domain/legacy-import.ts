// Pure mapping/computation helpers for importLegacy (README §9) — kept separate from the
// Server Action (lib/actions/import-legacy.ts) so the Thai-label→enum rules and the
// opening-balance backfill math are unit-testable without a database.
import type { Cycle } from "./dates";

export function mapLegacyCycle(label: string | undefined | null): Cycle {
  switch (label) {
    case "ทุก 3 เดือน":
      return "quarterly";
    case "ทุก 6 เดือน":
      return "semiannual";
    case "รายปี":
    case "ปี":
    case "ทุกปี":
      return "yearly";
    case "รายเดือน":
    case "เดือน":
    default:
      return "monthly";
  }
}

/** months-per-cycle for home_tasks.every_months (an int column, not the cycle_t enum). */
export function legacyCycleMonths(label: string | undefined | null): number {
  return { monthly: 1, quarterly: 3, semiannual: 6, yearly: 12 }[mapLegacyCycle(label)];
}

export type LegacyAccountType = "cash" | "savings" | "checking" | "ewallet" | "investment";
export function mapLegacyAccountType(label: string | undefined | null): LegacyAccountType {
  switch (label) {
    case "เงินสด":
      return "cash";
    case "e-Wallet":
      return "ewallet";
    case "กระแสรายวัน":
      return "checking";
    case "ลงทุน":
      return "investment";
    case "ออมทรัพย์":
    default:
      return "savings";
  }
}

export type LegacyTaskPriority = "high" | "medium" | "low";
export function mapLegacyTaskPriority(label: string | undefined | null): LegacyTaskPriority {
  if (label === "สูง") return "high";
  if (label === "ต่ำ") return "low";
  return "medium";
}

export type LegacyVehicleKind = "car" | "motorcycle";
/** Schema's vehicle_kind enum only has car/motorcycle (step 7 scope cut) — the prototype's
 * กระบะ/อื่นๆ have no matching value, so they fall back to car. */
export function mapLegacyVehicleKind(label: string | undefined | null): LegacyVehicleKind {
  return label === "มอเตอร์ไซค์" ? "motorcycle" : "car";
}

export type LegacyProjectStatus = "planning" | "in_progress" | "done";
export function mapLegacyProjectStatus(label: string | undefined | null): LegacyProjectStatus {
  if (label === "วางแผน") return "planning";
  if (label === "เสร็จแล้ว") return "done";
  return "in_progress";
}

export interface LegacyTxnEffect {
  type: "expense" | "income" | "transfer";
  amount: number;
  src: string;
  to?: string;
}

/** `opening_balance` such that `opening_balance + sum(txn effects)` reproduces the legacy
 * `bal` snapshot exactly (schema §1: balances are always derived, never stored directly). */
export function computeOpeningBalance(legacyBal: number, accountId: string, txns: readonly LegacyTxnEffect[]): number {
  let effect = 0;
  for (const t of txns) {
    if (t.type === "expense" && t.src === accountId) effect -= t.amount;
    else if (t.type === "income" && t.src === accountId) effect += t.amount;
    else if (t.type === "transfer") {
      if (t.src === accountId) effect -= t.amount;
      if (t.to === accountId) effect += t.amount;
    }
  }
  return Math.round((legacyBal - effect) * 100) / 100;
}

/** Same idea as computeOpeningBalance but for a card's `used` snapshot — card_usage's view
 * formula is opening_used + expense - income - transfer-to-this-card, so this is its inverse. */
export function computeOpeningUsed(legacyUsed: number, cardId: string, txns: readonly LegacyTxnEffect[]): number {
  let effect = 0;
  for (const t of txns) {
    if (t.type === "expense" && t.src === cardId) effect += t.amount;
    else if (t.type === "income" && t.src === cardId) effect -= t.amount;
    else if (t.type === "transfer" && t.to === cardId) effect -= t.amount;
  }
  return Math.round((legacyUsed - effect) * 100) / 100;
}
