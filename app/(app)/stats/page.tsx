import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";
import { StatsClient } from "@/components/stats/stats-client";

export default async function StatsPage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();

  const [{ data: txnRows }, { data: budgetRows }, { data: accountRows }, { data: cardRows }] = await Promise.all([
    supabase.from("transactions").select("id, type, amount, date, category, name, src_account_id, src_card_id"),
    supabase.from("budgets").select("category, monthly_limit"),
    supabase.from("accounts").select("id, name"),
    supabase.from("cards").select("id, name"),
  ]);

  const nameById = new Map<string, string>();
  for (const a of accountRows ?? []) nameById.set(a.id, a.name);
  for (const c of cardRows ?? []) nameById.set(c.id, c.name);

  const txns = (txnRows ?? []).map((t) => ({
    id: t.id, type: t.type, amount: t.amount, date: t.date, category: t.category, name: t.name,
    srcLabel: nameById.get(t.src_account_id ?? t.src_card_id ?? "") ?? "—",
  }));

  const budgets: Record<string, number> = {};
  for (const b of budgetRows ?? []) budgets[b.category] = b.monthly_limit;

  return <StatsClient todayISO={todayISO} txns={txns} budgets={budgets} />;
}
