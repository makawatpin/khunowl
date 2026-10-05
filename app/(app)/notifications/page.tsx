import { createClient } from "@/lib/supabase/server";
import { getNotificationItems } from "@/lib/server/notifications";
import { NotificationsClient, type NotiCardTarget } from "@/components/notifications/notifications-client";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const items = await getNotificationItems(supabase);

  const [{ data: billRows }, { data: cardRows }, { data: accountRows }] = await Promise.all([
    supabase.from("bills").select("id, amount"),
    supabase.from("card_usage").select("id, name, used, due_date, min_payment").eq("archived", false),
    supabase.from("accounts").select("id, name").eq("archived", false),
  ]);

  const billById = new Map((billRows ?? []).map((b) => [b.id, b]));
  const cardById = new Map((cardRows ?? []).map((c) => [c.id, c]));
  const totalDueAmount = items
    .filter((n) => !n.done && n.group === "ต้องจ่าย")
    .reduce((s, n) => {
      if (n.action?.kind === "payBill") return s + (billById.get(n.action.id)?.amount ?? 0);
      if (n.action?.kind === "payCard") return s + (cardById.get(n.action.id)?.used ?? 0);
      return s;
    }, 0);

  const cardLookup: Record<string, NotiCardTarget> = {};
  for (const c of cardRows ?? []) {
    if (!c.id || !c.name) continue;
    cardLookup[c.id] = { id: c.id, name: c.name, used: c.used ?? 0, minPayment: c.min_payment ?? 0, dueDate: c.due_date };
  }
  const accounts = (accountRows ?? []).filter((a): a is { id: string; name: string } => !!a.id && !!a.name);

  return <NotificationsClient items={items} totalDueAmount={totalDueAmount} accounts={accounts} cardLookup={cardLookup} />;
}
