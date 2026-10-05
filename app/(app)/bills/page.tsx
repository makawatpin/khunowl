import { createClient } from "@/lib/supabase/server";
import { BillsTabs } from "@/components/bills/bills-tabs";
import type { BillItem } from "@/components/bills/bills-tab";
import type { SubItem } from "@/components/bills/subs-tab";
import type { CardListItem } from "@/components/money/card-list";

export default async function BillsPage() {
  const supabase = await createClient();

  const [{ data: billRows }, { data: subRows }, { data: cardRows }, { data: accountRows }] = await Promise.all([
    supabase.from("bills").select("id, name, domain, amount, cycle, next_due, account_id, auto_debit, last_paid"),
    supabase.from("subscriptions").select("id, name, domain, price, cycle, next_billing, account_id, card_id"),
    supabase.from("card_usage").select("id, name, bank, network, last4, used, credit_limit, statement_date, due_date, min_payment, pinned").eq("archived", false),
    supabase.from("accounts").select("id, name").eq("archived", false),
  ]);

  const accounts = (accountRows ?? []).filter((a): a is { id: string; name: string } => !!a.id && !!a.name);
  const accountName = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? "—";

  const cards: CardListItem[] = (cardRows ?? [])
    .filter((c): c is typeof c & { id: string; name: string } => !!c.id && !!c.name)
    .map((c) => ({
      id: c.id, name: c.name, bank: c.bank, network: c.network, last4: c.last4, used: c.used ?? 0,
      creditLimit: c.credit_limit ?? 0, statementDate: c.statement_date, dueDate: c.due_date, minPayment: c.min_payment ?? 0, pinned: c.pinned ?? false,
    }));
  const cardRefs = cards.map((c) => ({ id: c.id, name: c.name }));
  const cardName = (id: string | null) => cardRefs.find((c) => c.id === id)?.name ?? "—";

  const bills: BillItem[] = (billRows ?? []).map((b) => ({
    id: b.id, name: b.name, domain: b.domain, amount: b.amount, cycle: b.cycle, nextDue: b.next_due,
    accountId: b.account_id ?? "", autoDebit: b.auto_debit, accountName: accountName(b.account_id), lastPaid: b.last_paid,
  }));

  const subs: SubItem[] = (subRows ?? []).map((s) => {
    const sourceKind: "account" | "card" = s.card_id ? "card" : "account";
    const source = s.card_id ?? s.account_id ?? "";
    return {
      id: s.id, name: s.name, domain: s.domain, price: s.price, cycle: s.cycle as "monthly" | "yearly",
      nextBilling: s.next_billing, source, sourceKind,
      sourceName: sourceKind === "card" ? cardName(source) : accountName(source),
    };
  });

  return <BillsTabs bills={bills} subs={subs} cards={cards} accounts={accounts} cardRefs={cardRefs} />;
}
