"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Deepest-dependency-first — several FKs are `on delete restrict` (e.g. transactions →
// accounts/cards), so parents must be deleted after everything that references them, not before.
const DELETE_ORDER = [
  "trip_settlements", "trip_expense_shares", "trip_expense_items", "trip_expenses", "trip_members", "trips", "friends",
  "project_bills", "projects",
  "vehicle_services", "fuel_logs", "vehicles",
  "documents", "tasks", "home_tasks", "properties", "assets",
  "transactions",
  "installment_plans", "budgets", "recurring_income", "subscriptions", "bills",
  "cards", "accounts",
  "notification_acks", "push_subscriptions",
] as const;

/** Permanently deletes every row this user owns (README §5 "ล้างข้อมูลทั้งหมด"). Storage
 * objects (receipts/docs/slips) are not swept — a deliberate scope cut, not an oversight;
 * they become orphaned but harmless (RLS still scopes them to the now-empty account). */
export async function clearAllData(confirmPhrase: string): Promise<{ error?: string }> {
  if (confirmPhrase.trim() !== "ลบข้อมูลทั้งหมด") {
    return { error: "พิมพ์ข้อความยืนยันให้ตรงก่อน" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่พบผู้ใช้" };

  for (const table of DELETE_ORDER) {
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) return { error: `ลบ ${table} ไม่สำเร็จ: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return {};
}
