"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { pushToUser } from "@/lib/server/push";
import { LEAD_DAY_OPTIONS } from "@/lib/domain/notifications";
import type { Json } from "@/lib/db.types";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  p256dh: z.string().min(1).max(200),
  auth: z.string().min(1).max(100),
});

async function setNotifyPref(notify: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from("profiles").select("prefs").eq("user_id", user.id).single();
  const prefs = { ...((profile?.prefs as Record<string, unknown>) ?? {}), notify };
  await supabase.from("profiles").update({ prefs }).eq("user_id", user.id);
}

export async function savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string }): Promise<{ error?: string }> {
  const parsedSub = subscriptionSchema.safeParse(sub);
  if (!parsedSub.success) return { error: "ข้อมูลการแจ้งเตือนไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, { onConflict: "endpoint" });
  if (error) return { error: error.message };
  await setNotifyPref(true);
  return {};
}

export async function deletePushSubscription(endpoint: string): Promise<{ error?: string }> {
  if (!z.string().url().max(2048).safeParse(endpoint).success) return { error: "ข้อมูลการแจ้งเตือนไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return { error: error.message };
  await setNotifyPref(false);
  return {};
}

/** Sends a test notification to every device the signed-in user subscribed. */
export async function sendTestPush(): Promise<{ error?: string; sent?: number; devices?: number }> {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_SUBJECT) {
    return { error: "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า VAPID key" };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  const result = await pushToUser(supabase, user.id, {
    title: "KhunOwl · ทดสอบแจ้งเตือน",
    body: "ถ้าเห็นข้อความนี้ แปลว่าการแจ้งเตือนใช้งานได้แล้ว",
    url: "/settings",
    tag: "test",
  });
  if (!result.devices) return { error: "ไม่พบอุปกรณ์ที่เปิดการแจ้งเตือน ลองปิดแล้วเปิดใหม่" };
  if (!result.sent) return { error: "ส่งไม่สำเร็จ ลองปิดแล้วเปิดการแจ้งเตือนใหม่อีกครั้ง", devices: result.devices };
  return { sent: result.sent, devices: result.devices };
}

const leadDaysSchema = z.array(z.number().int().refine((d) => (LEAD_DAY_OPTIONS as readonly number[]).includes(d))).max(LEAD_DAY_OPTIONS.length);

export async function saveNotifyLeadDays(days: number[]): Promise<{ error?: string }> {
  const parsed = leadDaysSchema.safeParse(days);
  if (!parsed.success) return { error: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  const { data: profile } = await supabase.from("profiles").select("prefs").eq("user_id", user.id).single();
  const prefs = { ...((profile?.prefs as Record<string, unknown>) ?? {}), notifyLeadDays: [...new Set(parsed.data)].sort((a, b) => b - a) };
  const { error } = await supabase.from("profiles").update({ prefs: prefs as Json }).eq("user_id", user.id);
  return error ? { error: error.message } : {};
}
