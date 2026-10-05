import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";
import { AccountList, type AccountListItem } from "@/components/money/account-list";
import { CardList, type CardListItem } from "@/components/money/card-list";
import { TransactionList } from "@/components/money/transaction-list";
import { TXN_LIST_COLUMNS, TXN_PAGE_SIZE, nextTxnCursor, toTxnListItem, type TxnListItem, type TxnRow } from "@/lib/domain/txn-list";
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

  const [{ data: accountRows }, { data: cardRows }, { data: txnRows }, { data: monthRows }, { data: budgetRows }] = await Promise.all([
    supabase.from("account_balances").select("id, name, bank, type, last4, balance, pinned").eq("archived", false),
    supabase.from("card_usage").select("id, name, bank, network, last4, used, credit_limit, statement_date, due_date, min_payment, pinned").eq("archived", false),
    // First page of the list (older pages load on demand via listTransactionsPage).
    supabase.from("transactions").select(TXN_LIST_COLUMNS).order("date", { ascending: false }).order("id", { ascending: false }).limit(TXN_PAGE_SIZE),
    // Month totals/budgets get their own query, independent of how much of the list is loaded.
    supabase.from("transactions").select("type, amount, category").gte("date", `${monthKey}-01`).lte("date", `${monthKey}-31`).neq("type", "transfer").limit(5000),
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

  const firstPage = (txnRows ?? []) as TxnRow[];
  const transactions: TxnListItem[] = firstPage.map(toTxnListItem);
  const nextCursor = nextTxnCursor(firstPage);

  const monthTxns = monthRows ?? [];
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
      <TransactionList transactions={transactions} nextCursor={nextCursor} sourceNames={sourceNames} accounts={accountRefs} cards={cardRefs} />
      <Sec title="งบประมาณเดือนนี้" />
      <BudgetProgress rows={budgetRowsOut} />
    </>
  );
}
