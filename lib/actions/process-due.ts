"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { processDueForUser, type ProcessDueResult } from "@/lib/server/process-due";
import { todayISOInBangkok } from "@/lib/dates/today";

/** Called once per app open (README §5 "เรียกซ้ำตอนเปิดแอปได้") — catches up any auto-debit
 * bills/subscriptions the daily cron might have missed, idempotent via `transactions.ref`. */
export async function processDueForCurrentUser(): Promise<ProcessDueResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { billsProcessed: 0, subsProcessed: 0 };

  const result = await processDueForUser(supabase, user.id, todayISOInBangkok());
  if (result.billsProcessed || result.subsProcessed) {
    revalidatePath("/");
    revalidatePath("/money");
    revalidatePath("/bills");
  }
  return result;
}
