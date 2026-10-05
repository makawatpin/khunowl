// Ported from design-reference/lifeos-store.jsx (payBillNow/paySubNow/payCardNow).
// Balances are never mutated directly (schema §1: they're computed from
// account_balances/card_usage views) — these are the pure decision helpers a
// Server Action calls before inserting the paying transaction and advancing dates.
import { addCycle, type Cycle } from "./dates";

export function guessBillCategory(name: string): string {
  if (/ไฟ|น้ำ|เน็ต|มือถือ|AIS|True|3BB/i.test(name)) return "บิล/ค่าน้ำไฟ";
  if (/เช่า|คอนโด|บ้าน/.test(name)) return "บ้าน";
  if (/ประกัน/.test(name)) return "สุขภาพ";
  return "บิล/ค่าน้ำไฟ";
}

export function nextBillDue(dueDate: string, cycle: Cycle): string {
  return addCycle(dueDate, cycle);
}

export function nextSubBilling(nextBillingDate: string, cycle: Cycle): string {
  return addCycle(nextBillingDate, cycle);
}

/**
 * Paying a card at least its minimum (or the full balance, if that's less than
 * the minimum) rolls the statement/due dates forward a month.
 */
export function shouldRollCardCycle(paymentAmount: number, minPayment: number, usedBeforePayment: number): boolean {
  return paymentAmount >= Math.min(minPayment || 0, usedBeforePayment);
}
