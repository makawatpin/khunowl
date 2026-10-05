"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";

export async function ackNotification(notiId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notification_acks").upsert({ noti_id: notiId, acked_on: todayISOInBangkok() });
  revalidatePath("/notifications");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function unackNotification(notiId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notification_acks").delete().eq("noti_id", notiId);
  revalidatePath("/notifications");
  revalidatePath("/");
  revalidatePath("/calendar");
}
