"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_COLORS } from "@/lib/domain/trips";
import { zEmptyToUndefined } from "@/lib/validation/helpers";

function revalidateTripPages(tripId?: string) {
  revalidatePath("/trips");
  if (tripId) revalidatePath(`/trips/${tripId}`);
}

const tripSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อทริป"),
  startOn: zEmptyToUndefined,
  endOn: zEmptyToUndefined,
  currency: z.string().min(1),
  rate: z.coerce.number().positive(),
});

function parseTrip(formData: FormData) {
  return tripSchema.safeParse({
    name: formData.get("name"),
    startOn: formData.get("startOn"),
    endOn: formData.get("endOn"),
    currency: formData.get("currency"),
    rate: formData.get("rate") || "1",
  });
}

export async function createTrip(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseTrip(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const friendIds = formData.getAll("friendId").map(String);
  const newFriendNames = formData.getAll("newFriendName").map(String).filter((n) => n.trim());

  const supabase = await createClient();

  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .insert({ name: d.name, start_on: d.startOn, end_on: d.endOn, currency: d.currency, rate: d.rate })
    .select("id")
    .single();
  if (tripErr) return { error: tripErr.message };

  const { error: meErr } = await supabase.from("trip_members").insert({ trip_id: trip.id, friend_id: null });
  if (meErr) return { error: meErr.message };

  if (newFriendNames.length) {
    const { data: existingFriends } = await supabase.from("friends").select("id");
    let colorIdx = existingFriends?.length ?? 0;
    const { data: newFriends, error: friendErr } = await supabase
      .from("friends")
      .insert(newFriendNames.map((name) => ({ name, color: AVATAR_COLORS[colorIdx++ % AVATAR_COLORS.length] })))
      .select("id");
    if (friendErr) return { error: friendErr.message };
    friendIds.push(...(newFriends ?? []).map((f) => f.id));
  }

  if (friendIds.length) {
    const { error: membersErr } = await supabase.from("trip_members").insert(friendIds.map((friend_id) => ({ trip_id: trip.id, friend_id })));
    if (membersErr) return { error: membersErr.message };
  }

  revalidateTripPages();
  return { id: trip.id };
}

export async function updateTrip(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseTrip(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const friendIds = new Set(formData.getAll("friendId").map(String));
  const newFriendNames = formData.getAll("newFriendName").map(String).filter((n) => n.trim());

  const supabase = await createClient();

  const { error: tripErr } = await supabase
    .from("trips")
    .update({ name: d.name, start_on: d.startOn, end_on: d.endOn, currency: d.currency, rate: d.rate })
    .eq("id", id);
  if (tripErr) return { error: tripErr.message };

  if (newFriendNames.length) {
    const { data: existingFriends } = await supabase.from("friends").select("id");
    let colorIdx = existingFriends?.length ?? 0;
    const { data: newFriends, error: friendErr } = await supabase
      .from("friends")
      .insert(newFriendNames.map((name) => ({ name, color: AVATAR_COLORS[colorIdx++ % AVATAR_COLORS.length] })))
      .select("id");
    if (friendErr) return { error: friendErr.message };
    for (const f of newFriends ?? []) friendIds.add(f.id);
  }

  const { data: currentMembers } = await supabase.from("trip_members").select("id, friend_id").eq("trip_id", id);
  const current = (currentMembers ?? []).filter((m): m is { id: string; friend_id: string } => m.friend_id !== null);

  const toRemove = current.filter((m) => !friendIds.has(m.friend_id));
  const toAdd = [...friendIds].filter((fid) => !current.some((m) => m.friend_id === fid));

  if (toRemove.length) {
    const { error } = await supabase.from("trip_members").delete().in("id", toRemove.map((m) => m.id));
    if (error) return { error: "ลบสมาชิกไม่ได้ เพราะมีค่าใช้จ่ายผูกอยู่" };
  }
  if (toAdd.length) {
    const { error } = await supabase.from("trip_members").insert(toAdd.map((friend_id) => ({ trip_id: id, friend_id })));
    if (error) return { error: error.message };
  }

  revalidateTripPages(id);
  return {};
}

export async function deleteTrip(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateTripPages();
  return {};
}
