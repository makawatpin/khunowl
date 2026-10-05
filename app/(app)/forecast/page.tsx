import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";
import { ForecastClient } from "@/components/forecast/forecast-client";

export default async function ForecastPage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();

  const [{ data: accountRows }, { data: cardRows }, { data: billRows }, { data: subRows }, { data: incomeRows }] = await Promise.all([
    supabase.from("account_balances").select("balance").eq("archived", false),
    supabase.from("card_usage").select("id, name, used, due_date").eq("archived", false),
    supabase.from("bills").select("id, name, amount, cycle, next_due"),
    supabase.from("subscriptions").select("id, name, price, cycle, next_billing, account_id, card_id"),
    supabase.from("recurring_income").select("id, name, amount, day_of_month"),
  ]);

  const startBalance = (accountRows ?? []).reduce((s, a) => s + (a.balance ?? 0), 0);
  const accountIds = new Set<string>();
  const cardIds = new Set<string>();
  const { data: allAccounts } = await supabase.from("accounts").select("id").eq("archived", false);
  const { data: allCards } = await supabase.from("cards").select("id").eq("archived", false);
  (allAccounts ?? []).forEach((a) => accountIds.add(a.id));
  (allCards ?? []).forEach((c) => cardIds.add(c.id));

  const bills = (billRows ?? []).map((b) => ({ id: b.id, name: b.name, amount: b.amount, cycle: b.cycle, nextDue: b.next_due }));
  const subscriptions = (subRows ?? []).map((s) => ({
    id: s.id, name: s.name, price: s.price, cycle: s.cycle, nextBilling: s.next_billing,
    hasValidSource: !!(s.account_id ? accountIds.has(s.account_id) : s.card_id ? cardIds.has(s.card_id) : false),
  }));
  const cards = (cardRows ?? [])
    .filter((c): c is typeof c & { id: string; name: string } => !!c.id && !!c.name)
    .map((c) => ({ id: c.id, name: c.name, used: c.used ?? 0, dueDate: c.due_date }));
  const income = (incomeRows ?? []).map((i) => ({ id: i.id, name: i.name, amount: i.amount, dayOfMonth: i.day_of_month }));

  return (
    <ForecastClient todayISO={todayISO} startBalance={startBalance} bills={bills} subscriptions={subscriptions} cards={cards} income={income} />
  );
}
