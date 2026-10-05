"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateMoneyPages() {
  revalidatePath("/");
  revalidatePath("/money");
  revalidatePath("/stats");
  revalidatePath("/settings");
}

/** Full-replace, matching the prototype's BudgetForm (one save = the whole budget set). */
export async function saveBudgets(entries: { category: string; limit: number }[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่พบผู้ใช้" };

  const { error: deleteErr } = await supabase.from("budgets").delete().eq("user_id", user.id);
  if (deleteErr) return { error: deleteErr.message };

  const rows = entries.filter((e) => e.limit > 0).map((e) => ({ user_id: user.id, category: e.category, monthly_limit: e.limit }));
  if (rows.length) {
    const { error } = await supabase.from("budgets").insert(rows);
    if (error) return { error: error.message };
  }

  revalidateMoneyPages();
  return {};
}
