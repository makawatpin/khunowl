import { createClient } from "@/lib/supabase/server";
import { TripsClient, type TripListItem } from "@/components/trips/trips-client";
import type { TripPerson } from "@/components/ui/avatar";

export default async function TripsPage() {
  const supabase = await createClient();

  const [{ data: tripRows }, { data: memberRows }, { data: friendRows }, { data: expenseRows }, { data: shareRows }, { data: settlementRows }] = await Promise.all([
    supabase.from("trips").select("id, name, start_on, end_on, currency, rate"),
    supabase.from("trip_members").select("id, trip_id, friend_id"),
    supabase.from("friends").select("id, name, color"),
    supabase.from("trip_expenses").select("id, trip_id, paid_by, amount"),
    supabase.from("trip_expense_shares").select("expense_id, member_id, amount"),
    supabase.from("trip_settlements").select("trip_id, from_member, to_member, amount"),
  ]);

  const friendById = new Map((friendRows ?? []).map((f) => [f.id, f]));
  const me: TripPerson = { id: "me", name: "ฉัน", color: "var(--accent-deep)" };
  const personOf = (friendId: string | null, memberId: string): TripPerson => {
    if (friendId === null) return { ...me, id: memberId };
    const f = friendById.get(friendId);
    return f ? { id: memberId, name: f.name, color: f.color } : { id: memberId, name: "?", color: "#A4A8AD" };
  };

  const membersByTrip = new Map<string, { id: string; friendId: string | null }[]>();
  for (const m of memberRows ?? []) {
    const list = membersByTrip.get(m.trip_id) ?? [];
    list.push({ id: m.id, friendId: m.friend_id });
    membersByTrip.set(m.trip_id, list);
  }

  const tripIdOfExpense = new Map((expenseRows ?? []).map((e) => [e.id, e.trip_id]));
  const expenseTripOf = (expenseId: string) => tripIdOfExpense.get(expenseId);

  const friends: TripPerson[] = (friendRows ?? []).map((f) => ({ id: f.id, name: f.name, color: f.color }));

  const trips: TripListItem[] = (tripRows ?? []).map((t) => {
    const members = (membersByTrip.get(t.id) ?? []).map((m) => personOf(m.friendId, m.id));
    const meMember = (membersByTrip.get(t.id) ?? []).find((m) => m.friendId === null);
    const meId = meMember?.id ?? "";
    const tripExpenses = (expenseRows ?? []).filter((e) => e.trip_id === t.id);
    const total = tripExpenses.reduce((s, e) => s + e.amount, 0);
    const hasExpenses = tripExpenses.length > 0;

    let mineBalance = 0;
    for (const e of tripExpenses) if (e.paid_by === meId) mineBalance += e.amount;
    for (const s of shareRows ?? []) if (s.member_id === meId && expenseTripOf(s.expense_id) === t.id) mineBalance -= s.amount;
    for (const s of settlementRows ?? []) {
      if (s.trip_id !== t.id) continue;
      if (s.from_member === meId) mineBalance += s.amount;
      if (s.to_member === meId) mineBalance -= s.amount;
    }

    return { id: t.id, name: t.name, startOn: t.start_on, endOn: t.end_on, currency: t.currency, rate: t.rate, meId, members, total, mineBalance, hasExpenses };
  });

  return <TripsClient trips={trips} friends={friends} />;
}
