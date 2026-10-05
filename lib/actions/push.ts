"use server";

import { createClient } from "@/lib/supabase/server";

async function setNotifyPref(notify: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from("profiles").select("prefs").eq("user_id", user.id).single();
  const prefs = { ...((profile?.prefs as Record<string, unknown>) ?? {}), notify };
  await supabase.from("profiles").update({ prefs }).eq("user_id", user.id);
}

export async function savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string }): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, { onConflict: "endpoint" });
  if (error) return { error: error.message };
  await setNotifyPref(true);
  return {};
}

export async function deletePushSubscription(endpoint: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return { error: error.message };
  await setNotifyPref(false);
  return {};
}
