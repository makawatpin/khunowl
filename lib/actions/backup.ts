"use server";

import { createClient } from "@/lib/supabase/server";

const BACKUP_TABLES = [
  "accounts", "cards", "bills", "subscriptions", "recurring_income", "installment_plans", "budgets",
  "transactions", "assets", "properties", "home_tasks", "projects", "project_bills", "vehicles",
  "vehicle_services", "fuel_logs", "documents", "tasks", "friends", "trips", "trip_members",
  "trip_expenses", "trip_expense_items", "trip_expense_shares", "trip_settlements",
] as const;

/** A full dump of every user-owned row, keyed by table name — this app's own backup shape
 * (not the prototype's legacy format; see `importLegacy` for reading that one back in). */
export async function exportBackupJSON(): Promise<{ data?: object; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่พบผู้ใช้" };

  const tables: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) return { error: error.message };
    tables[table] = data ?? [];
  }

  return { data: { app: "KhunOwl", version: 2, exportedAt: new Date().toISOString(), tables } };
}

export interface TransactionCsvRow {
  date: string;
  type: string;
  name: string;
  category: string | null;
  amount: number;
  note: string | null;
}

export async function exportTransactionsForCsv(): Promise<{ rows?: TransactionCsvRow[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("date, type, name, category, amount, note")
    .order("date", { ascending: false });
  if (error) return { error: error.message };
  return { rows: data ?? [] };
}
