import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripDetailClient, type TripDetailData, type TripDetailExpense, type TripDetailSettlement } from "@/components/trips/trip-detail-client";
import type { TripPerson } from "@/components/ui/avatar";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase.from("trips").select("id, name, start_on, end_on, currency, rate").eq("id", id).single();
  if (!trip) notFound();

  const [{ data: memberRows }, { data: friendRows }, { data: expenseRows }, { data: itemRows }, { data: shareRows }, { data: settlementRows }, { data: accountRows }] =
    await Promise.all([
      supabase.from("trip_members").select("id, friend_id").eq("trip_id", id),
      supabase.from("friends").select("id, name, color"),
      supabase.from("trip_expenses").select("id, title, category, date, paid_by, split_mode, amount").eq("trip_id", id),
      supabase.from("trip_expense_items").select("id, expense_id, name, price, people"),
      supabase.from("trip_expense_shares").select("expense_id, member_id, amount"),
      supabase.from("trip_settlements").select("id, from_member, to_member, amount, date, txn_id").eq("trip_id", id),
      supabase.from("accounts").select("id, name").eq("archived", false),
    ]);

  const friendById = new Map((friendRows ?? []).map((f) => [f.id, f]));
  const members: TripPerson[] = (memberRows ?? []).map((m) => {
    if (m.friend_id === null) return { id: m.id, name: "ฉัน", color: "var(--accent-deep)" };
    const f = friendById.get(m.friend_id);
    return f ? { id: m.id, name: f.name, color: f.color } : { id: m.id, name: "?", color: "#A4A8AD" };
  });
  const meId = (memberRows ?? []).find((m) => m.friend_id === null)?.id ?? "";
  const memberFriendIds: Record<string, string> = {};
  for (const m of memberRows ?? []) if (m.friend_id !== null) memberFriendIds[m.id] = m.friend_id;

  const expenseIds = new Set((expenseRows ?? []).map((e) => e.id));
  const itemsByExpense = new Map<string, { name: string; price: number; people: string[] }[]>();
  for (const it of itemRows ?? []) {
    if (!expenseIds.has(it.expense_id)) continue;
    const list = itemsByExpense.get(it.expense_id) ?? [];
    list.push({ name: it.name, price: it.price, people: it.people });
    itemsByExpense.set(it.expense_id, list);
  }
  const sharesByExpense = new Map<string, Record<string, number>>();
  for (const s of shareRows ?? []) {
    if (!expenseIds.has(s.expense_id)) continue;
    const m = sharesByExpense.get(s.expense_id) ?? {};
    m[s.member_id] = s.amount;
    sharesByExpense.set(s.expense_id, m);
  }

  const expenses: TripDetailExpense[] = (expenseRows ?? []).map((e) => {
    const sharesMap = sharesByExpense.get(e.id) ?? {};
    return {
      id: e.id, title: e.title, category: e.category, date: e.date, paidBy: e.paid_by, splitMode: e.split_mode, amount: e.amount,
      split: e.split_mode === "equal" ? Object.keys(sharesMap) : [],
      shares: e.split_mode === "custom" ? sharesMap : {},
      items: itemsByExpense.get(e.id) ?? [],
    };
  });

  const settlements: TripDetailSettlement[] = (settlementRows ?? []).map((s) => ({
    id: s.id, from: s.from_member, to: s.to_member, amt: s.amount, date: s.date, hasTxn: !!s.txn_id,
  }));

  const tripData: TripDetailData = {
    id: trip.id, name: trip.name, startOn: trip.start_on, endOn: trip.end_on, currency: trip.currency, rate: trip.rate,
    meId, members, memberFriendIds, expenses, settlements,
  };

  const friends: TripPerson[] = (friendRows ?? []).map((f) => ({ id: f.id, name: f.name, color: f.color }));
  const accounts = (accountRows ?? []).filter((a): a is { id: string; name: string } => !!a.id && !!a.name);

  return <TripDetailClient trip={tripData} friends={friends} accounts={accounts} />;
}
