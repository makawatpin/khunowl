import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNotificationItems } from "@/lib/server/notifications";
import { sendPush } from "@/lib/server/push";
import { daysTo } from "@/lib/domain/dates";
import { todayISOInBangkok } from "@/lib/dates/today";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const todayISO = todayISOInBangkok();
  const { data: profiles, error } = await supabase.from("profiles").select("user_id, prefs");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let notified = 0;
  let removedSubscriptions = 0;
  for (const p of profiles ?? []) {
    const notify = (p.prefs as { notify?: boolean } | null)?.notify;
    if (!notify) continue;

    const items = await getNotificationItems(supabase, p.user_id);
    const dueSoon = items.filter((n) => !n.done && daysTo(n.date, todayISO) <= 1);
    if (!dueSoon.length) continue;

    const { data: subs } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", p.user_id);
    if (!subs?.length) continue;

    const payload = { title: "ถึงกำหนด " + dueSoon.length + " รายการ", body: dueSoon.slice(0, 3).map((n) => n.title).join(", "), url: "/notifications" };
    for (const sub of subs) {
      const result = await sendPush(sub, payload);
      if (result.ok) notified++;
      else if (result.gone) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        removedSubscriptions++;
      }
    }
  }

  return NextResponse.json({ ok: true, notified, removedSubscriptions });
}
