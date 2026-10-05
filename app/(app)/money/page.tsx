import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";
import { AccountList, type AccountListItem } from "@/components/money/account-list";
import { CardList, type CardListItem } from "@/components/money/card-list";
import { TransactionList, type TxnListItem } from "@/components/money/transaction-list";
import { BudgetProgress } from "@/components/money/budget-progress";
import { MoneyStatsActions } from "@/components/money/money-stats-actions";
import { Sec } from "@/components/ui/sec";

const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export default async function MoneyPage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();
  const monthKey = todayISO.slice(0, 7);

  const [{ data: accountRows }, { data: cardRows }, { data: txnRows }, { data: budgetRows }] = await Promise.all([
    supabase.from("account_balances").select("id, name, bank, type, last4, balance, pinned").eq("archived", false),
    supabase.from("card_usage").select("id, name, bank, network, last4, used, credit_limit, statement_date, due_date, min_payment, pinned").eq("archived", false),
    supabase
      .from("transactions")
      .select("id, type, amount, date, name, category, note, src_account_id, src_card_id, to_account_id, to_card_id")
      .order("date", { ascending: false })
      .limit(500),
    supabase.from("budgets").select("category, monthly_limit"),
  ]);

  const accounts: AccountListItem[] = (accountRows ?? [])
    .filter((a): a is typeof a & { id: string; name: string; type: NonNullable<typeof a.type> } => !!a.id && !!a.name && !!a.type)
    .map((a) => ({
      id: a.id, name: a.name, bank: a.bank, type: a.type, last4: a.last4, balance: a.balance ?? 0, pinned: a.pinned ?? false,
    }));
  const cards: CardListItem[] = (cardRows ?? [])
    .filter((c): c is typeof c & { id: string; name: string } => !!c.id && !!c.name)
    .map((c) => ({
      id: c.id, name: c.name, bank: c.bank, network: c.network, last4: c.last4, used: c.used ?? 0,
      creditLimit: c.credit_limit ?? 0, statementDate: c.statement_date, dueDate: c.due_date, minPayment: c.min_payment ?? 0, pinned: c.pinned ?? false,
    }));
  const accountRefs = accounts.map((a) => ({ id: a.id, name: a.name }));
  const cardRefs = cards.map((c) => ({ id: c.id, name: c.name }));

  const sourceNames: Record<string, string> = {};
  for (const a of accounts) sourceNames[a.id] = a.name;
  for (const c of cards) sourceNames[c.id] = c.name;

  const transactions: TxnListItem[] = (txnRows ?? []).map((t) => ({
    id: t.id, type: t.type, amount: t.amount, date: t.date, name: t.name, category: t.category, note: t.note,
    srcId: t.src_account_id ?? t.src_card_id, srcKind: t.src_account_id ? "account" : t.src_card_id ? "card" : null,
    toId: t.to_account_id ?? t.to_card_id, toKind: t.to_account_id ? "account" : t.to_card_id ? "card" : null,
  }));

  const monthTxns = transactions.filter((t) => t.date.startsWith(monthKey));
  const monthSpend = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthIncome = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const categorySpend = new Map<string, number>();
  for (const t of monthTxns) {
    if (t.type !== "expense" || !t.category) continue;
    categorySpend.set(t.category, (categorySpend.get(t.category) ?? 0) + t.amount);
  }
  const budgetCategories = new Set([...(budgetRows ?? []).map((b) => b.category), ...categorySpend.keys()]);
  const budgetRowsOut = [...budgetCategories].map((category) => ({
    category,
    spent: categorySpend.get(category) ?? 0,
    limit: budgetRows?.find((b) => b.category === category)?.monthly_limit ?? null,
  }));

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const cardDebt = cards.reduce((s, c) => s + c.used, 0);
  const monthIndex = Number(monthKey.slice(5, 7)) - 1;

  return (
    <>
      <MoneyStatsActions
        totalBalance={totalBalance}
        accountCount={accounts.length}
        cardDebt={cardDebt}
        cardCount={cards.length}
        monthLabel={MONTHS_TH[monthIndex]}
        monthSpend={monthSpend}
        monthIncome={monthIncome}
      />
      <AccountList accounts={accounts} />
      <CardList cards={cards} accounts={accountRefs} />
      <Sec title="รายการล่าสุด" />
      <TransactionList transactions={transactions} sourceNames={sourceNames} accounts={accountRefs} cards={cardRefs} />
      <Sec title="งบประมาณเดือนนี้" />
      <BudgetProgress rows={budgetRowsOut} />
    </>
  );
}
