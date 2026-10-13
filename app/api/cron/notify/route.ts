import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNotificationItems } from "@/lib/server/notifications";
import { pushToUser } from "@/lib/server/push";
import { DEFAULT_LEAD_DAYS, selectPushItems } from "@/lib/domain/notifications";
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
    const prefs = p.prefs as { notify?: boolean; notifyLeadDays?: number[] } | null;
    if (!prefs?.notify) continue;

    const items = await getNotificationItems(supabase, p.user_id);
    const leadDays = prefs.notifyLeadDays?.length ? prefs.notifyLeadDays : [...DEFAULT_LEAD_DAYS];
    const due = selectPushItems(items, todayISO, leadDays);
    if (!due.length) continue;

    const result = await pushToUser(supabase, p.user_id, {
      title: "ถึงกำหนด " + due.length + " รายการ",
      body: due.slice(0, 3).map((n) => n.title).join(", ") + (due.length > 3 ? ` และอีก ${due.length - 3} รายการ` : ""),
      url: "/notifications",
      ackIds: due.map((n) => n.id),
      badge: items.filter((n) => !n.done).length,
      tag: "daily-due",
    });
    notified += result.sent;
    removedSubscriptions += result.removed;
  }

  return NextResponse.json({ ok: true, notified, removedSubscriptions });
}
