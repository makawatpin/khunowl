import "server-only";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  /** Notification ids (`<key>@<date>`) the "ทำเครื่องหมายแล้ว" action button acknowledges. */
  ackIds?: string[];
  /** Number shown on the installed app's icon (Badging API) where supported. */
  badge?: number;
  tag?: string;
}

/** Sends one push message. `gone: true` means the subscription is dead (404/410) and should be deleted. */
export async function sendPush(sub: PushSubscriptionRow, payload: PushPayload): Promise<{ ok: boolean; gone?: boolean }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) return { ok: false, gone: true };
    return { ok: false };
  }
}

/**
 * Pushes to every device a user subscribed, pruning dead subscriptions. Works with either an
 * RLS-scoped client (own rows only) or the service-role client (pass `userId` to scope it).
 */
export async function pushToUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; removed: number; devices: number }> {
  const { data: subs } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", userId);
  let sent = 0;
  let removed = 0;
  for (const sub of subs ?? []) {
    const result = await sendPush(sub, payload);
    if (result.ok) sent++;
    else if (result.gone) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      removed++;
    }
  }
  return { sent, removed, devices: subs?.length ?? 0 };
}
