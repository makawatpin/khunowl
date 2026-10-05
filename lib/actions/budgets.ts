"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function revalidateMoneyPages() {
  revalidatePath("/");
  revalidatePath("/money");
  revalidatePath("/stats");
  revalidatePath("/settings");
}

const entriesSchema = z.array(
  z.object({
    category: z.string().trim().min(1).max(100),
    limit: z.number().finite().nonnegative("งบต้องไม่ติดลบ"),
  }),
).max(100);

/** Full-replace, matching the prototype's BudgetForm (one save = the whole budget set). Upserts the
 * new set first and only then deletes categories no longer in it — a failure part-way leaves the
 * old budgets in place instead of wiping them (the previous delete-all-then-insert could). */
export async function saveBudgets(entries: { category: string; limit: number }[]): Promise<{ error?: string }> {
  const parsed = entriesSchema.safeParse(entries);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่พบผู้ใช้" };

  const byCategory = new Map<string, number>();
  for (const e of parsed.data) if (e.limit > 0) byCategory.set(e.category, e.limit);
  const rows = [...byCategory].map(([category, limit]) => ({ user_id: user.id, category, monthly_limit: limit }));

  if (rows.length) {
    const { error } = await supabase.from("budgets").upsert(rows, { onConflict: "user_id,category" });
    if (error) return { error: error.message };
  }

  const { data: existing, error: readErr } = await supabase.from("budgets").select("category").eq("user_id", user.id);
  if (readErr) return { error: readErr.message };
  const stale = (existing ?? []).map((b) => b.category).filter((c) => !byCategory.has(c));
  if (stale.length) {
    const { error } = await supabase.from("budgets").delete().eq("user_id", user.id).in("category", stale);
    if (error) return { error: error.message };
  }

  revalidateMoneyPages();
  return {};
}
