import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import { addCycle, anchorDayOf, type Cycle } from "@/lib/domain/dates";
import { guessBillCategory } from "@/lib/domain/money";

export interface ProcessDueResult {
  billsProcessed: number;
  subsProcessed: number;
}

/**
 * Auto-debits bills (auto_debit=true) and bills subscriptions that have reached their due/billing
 * date, inserting a transaction per cycle and rolling the date forward — up to 12 (bills) / 24
 * (subscriptions) cycles per call, in case the app wasn't opened for a long time (README §5).
 * Idempotent via `transactions.ref` (unique per user) so this is safe to call from both the daily
 * cron (all users, service-role client) and a per-user trigger on app open (RLS-scoped client) —
 * always pass `userId` explicitly since a service-role client has no session to infer it from.
 */
export async function processDueForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  todayISO: string,
): Promise<ProcessDueResult> {
  let billsProcessed = 0;
  let subsProcessed = 0;

  const { data: bills } = await supabase
    .from("bills")
    .select("id, name, amount, cycle, next_due, anchor_day, account_id")
    .eq("user_id", userId)
    .eq("auto_debit", true)
    .lte("next_due", todayISO);

  for (const bill of bills ?? []) {
    // account_id is `on delete set null` — a null here means the payment account was deleted.
    // Mirror the prototype (lifeos-store.jsx autoProcess): skip creating transactions but still
    // catch the due date up, rather than failing the transactions table's "exactly one source" check.
    const hasSource = !!bill.account_id;
    // Roll every cycle on the same anchor day so a catch-up across short months doesn't drift
    // (31 Jan → 28 Feb → 31 Mar, not → 28 Mar) — the stored anchor_day survives across runs.
    const anchor = anchorDayOf(bill.next_due, bill.anchor_day);
    let nextDue = bill.next_due;
    for (let i = 0; i < 12 && nextDue <= todayISO; i++) {
      if (hasSource) {
        // Dated on the due date, not today — a multi-cycle catch-up must land each charge in its own month.
        const { error } = await supabase.from("transactions").insert({
          user_id: userId, type: "expense", amount: bill.amount, name: bill.name,
          category: guessBillCategory(bill.name), date: nextDue, src_account_id: bill.account_id,
          ref: `bill:${bill.id}:${nextDue}`,
        });
        if (!error) billsProcessed++;
        else if (error.code !== "23505") break; // real failure (not "already processed") — stop advancing this bill
      }
      nextDue = addCycle(nextDue, bill.cycle as Cycle, anchor);
    }
    if (nextDue !== bill.next_due) {
      await supabase.from("bills").update({ next_due: nextDue, last_paid: todayISO }).eq("id", bill.id);
    }
  }

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("id, name, price, cycle, next_billing, anchor_day, account_id, card_id")
    .eq("user_id", userId)
    .eq("active", true)
    .lte("next_billing", todayISO);

  for (const sub of subs ?? []) {
    const hasSource = !!sub.account_id || !!sub.card_id;
    const anchor = anchorDayOf(sub.next_billing, sub.anchor_day);
    let nextBilling = sub.next_billing;
    for (let i = 0; i < 24 && nextBilling <= todayISO; i++) {
      if (hasSource) {
        const { error } = await supabase.from("transactions").insert({
          user_id: userId, type: "expense", amount: sub.price, name: sub.name, category: "บันเทิง",
          date: nextBilling, src_account_id: sub.account_id, src_card_id: sub.card_id,
          ref: `sub:${sub.id}:${nextBilling}`,
        });
        if (!error) subsProcessed++;
        else if (error.code !== "23505") break;
      }
      nextBilling = addCycle(nextBilling, sub.cycle as Cycle, anchor);
    }
    if (nextBilling !== sub.next_billing) {
      await supabase.from("subscriptions").update({ next_billing: nextBilling }).eq("id", sub.id);
    }
  }

  return { billsProcessed, subsProcessed };
}
