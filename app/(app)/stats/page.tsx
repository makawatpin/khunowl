import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";
import { StatsClient } from "@/components/stats/stats-client";
import { monthKeyAdd } from "@/lib/domain/stats";

const PAGE_SIZE = 1000;
/** How many months back the stats screen can navigate (current month + 11 earlier). */
const HISTORY_MONTHS = 11;

export default async function StatsPage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();
  const minMonth = monthKeyAdd(todayISO.slice(0, 7), -HISTORY_MONTHS);

  const [txnRows, { data: budgetRows }, { data: accountRows }, { data: cardRows }] = await Promise.all([
    fetchTransactions(supabase, `${minMonth}-01`),
    supabase.from("budgets").select("category, monthly_limit"),
    supabase.from("accounts").select("id, name"),
    supabase.from("cards").select("id, name"),
  ]);

  const nameById = new Map<string, string>();
  for (const a of accountRows ?? []) nameById.set(a.id, a.name);
  for (const c of cardRows ?? []) nameById.set(c.id, c.name);

  const txns = txnRows.map((t) => ({
    id: t.id, type: t.type, amount: t.amount, date: t.date, category: t.category, name: t.name,
    srcLabel: nameById.get(t.src_account_id ?? t.src_card_id ?? "") ?? "—",
  }));

  const budgets: Record<string, number> = {};
  for (const b of budgetRows ?? []) budgets[b.category] = b.monthly_limit;

  return <StatsClient todayISO={todayISO} txns={txns} budgets={budgets} minMonth={minMonth} />;
}

async function fetchTransactions(supabase: Awaited<ReturnType<typeof createClient>>, fromDate: string) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from("transactions")
      .select("id, type, amount, date, category, name, src_account_id, src_card_id")
      .gte("date", fromDate)
      .order("date", { ascending: false })
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}
