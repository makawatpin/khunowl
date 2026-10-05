import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok, nowHourInBangkok, todayLongLabelInBangkok } from "@/lib/dates/today";
import { forecast, upcomingPayments } from "@/lib/domain/forecast";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

function greetingFor(hour: number): string {
  if (hour < 11) return "สวัสดีตอนเช้า";
  if (hour < 16) return "สวัสดีตอนบ่าย";
  if (hour < 19) return "สวัสดีตอนเย็น";
  return "สวัสดีตอนค่ำ";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();

  const [{ data: accountRows }, { data: cardRows }, { data: billRows }, { data: subRows }, { data: incomeRows }] = await Promise.all([
    supabase.from("account_balances").select("id, name, balance").eq("archived", false),
    supabase.from("card_usage").select("id, name, used, due_date, min_payment, bank").eq("archived", false),
    supabase.from("bills").select("id, name, amount, cycle, next_due, domain, auto_debit, account_id"),
    supabase.from("subscriptions").select("id, name, price, cycle, next_billing, domain, account_id, card_id"),
    supabase.from("recurring_income").select("id, name, amount, day_of_month"),
  ]);

  const accounts = (accountRows ?? []).filter((a): a is { id: string; name: string; balance: number } => !!a.id && !!a.name);
  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const cards = (cardRows ?? []).filter((c): c is typeof c & { id: string; name: string } => !!c.id && !!c.name);
  const cardDebt = cards.reduce((s, c) => s + (c.used ?? 0), 0);

  const bills = (billRows ?? []).map((b) => ({ id: b.id, name: b.name, amount: b.amount, cycle: b.cycle, nextDue: b.next_due, domain: b.domain, auto: b.auto_debit, accountId: b.account_id }));
  const subscriptions = (subRows ?? []).map((s) => ({
    id: s.id, name: s.name, price: s.price, cycle: s.cycle, nextBilling: s.next_billing, domain: s.domain,
    hasValidSource: !!(s.account_id ? accounts.some((a) => a.id === s.account_id) : s.card_id ? cards.some((c) => c.id === s.card_id) : false),
    accountId: s.account_id, cardId: s.card_id,
  }));
  const income = (incomeRows ?? []).map((i) => ({ id: i.id, name: i.name, amount: i.amount, dayOfMonth: i.day_of_month }));

  const f = forecast({
    days: 10, todayISO, startBalance: totalBalance,
    bills, subscriptions,
    cards: cards.map((c) => ({ id: c.id, name: c.name, used: c.used ?? 0, dueDate: c.due_date })),
    income,
  });

  const payments = upcomingPayments({
    days: 10, todayISO,
    bills: bills.map((b) => ({ ...b, accountId: b.accountId })),
    cards: cards.map((c) => ({ id: c.id, name: c.name, used: c.used ?? 0, dueDate: c.due_date, bank: c.bank, minPayment: c.min_payment ?? 0 })),
    subscriptions,
  });

  const cardLookup: Record<string, { id: string; name: string; used: number; minPayment: number; dueDate: string | null }> = {};
  for (const c of cards) cardLookup[c.id] = { id: c.id, name: c.name, used: c.used ?? 0, minPayment: c.min_payment ?? 0, dueDate: c.due_date };

  return (
    <DashboardClient
      greeting={greetingFor(nowHourInBangkok())}
      dateLabel={todayLongLabelInBangkok()}
      totalBalance={totalBalance}
      accountCount={accounts.length}
      cardDebt={cardDebt}
      forecastEnd={f.end}
      forecastOut={f.out}
      forecastInc={f.inc}
      forecastStart={f.start}
      payments={payments}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      cardLookup={cardLookup}
    />
  );
}
