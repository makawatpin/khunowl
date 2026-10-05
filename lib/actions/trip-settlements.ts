"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { zPositiveMoney } from "@/lib/validation/helpers";

function revalidateTrip(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  revalidatePath("/money");
}

const settleSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  amount: zPositiveMoney,
  date: z.string().min(1, "ระบุวันที่"),
});

export async function createTripSettlement(tripId: string, formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = settleSchema.safeParse({
    from: formData.get("from"),
    to: formData.get("to"),
    amount: formData.get("amount"),
    date: formData.get("date"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: trip } = await supabase.from("trips").select("name, rate").eq("id", tripId).single();
  if (!trip) return { error: "ไม่พบทริป" };

  const { data: members } = await supabase.from("trip_members").select("id, friend_id, friends(name)").in("id", [d.from, d.to]);
  const fromMember = members?.find((m) => m.id === d.from);
  const toMember = members?.find((m) => m.id === d.to);
  const meMember = members?.find((m) => m.friend_id === null);

  let txnId: string | null = null;
  const paySrc = String(formData.get("paySrc") || "");
  if (meMember && paySrc) {
    const thb = Math.round(d.amount * trip.rate * 100) / 100;
    const otherName = (d.from === meMember.id ? toMember : fromMember)?.friends as unknown as { name: string } | null;
    const label = d.from === meMember.id ? `โอนคืน${otherName?.name ?? ""}` : `รับคืนจาก${otherName?.name ?? ""}`;
    const { data: txn, error: txnErr } = await supabase
      .from("transactions")
      .insert({
        type: d.from === meMember.id ? "expense" : "income", amount: thb, category: "อื่นๆ",
        name: `${label} · ${trip.name}`, date: d.date, src_account_id: paySrc,
      })
      .select("id")
      .single();
    if (txnErr) return { error: txnErr.message };
    txnId = txn.id;
  }

  const { data, error } = await supabase
    .from("trip_settlements")
    .insert({ trip_id: tripId, from_member: d.from, to_member: d.to, amount: d.amount, date: d.date, txn_id: txnId })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateTrip(tripId);
  return { id: data.id };
}

export async function deleteTripSettlement(id: string, tripId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("trip_settlements").select("txn_id").eq("id", id).single();
  const { error } = await supabase.from("trip_settlements").delete().eq("id", id);
  if (error) return { error: error.message };
  if (existing?.txn_id) await supabase.from("transactions").delete().eq("id", existing.txn_id);
  revalidateTrip(tripId);
  return {};
}
