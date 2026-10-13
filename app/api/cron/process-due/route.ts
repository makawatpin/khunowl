import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDueForUser } from "@/lib/server/process-due";
import { pushToUser } from "@/lib/server/push";
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

  let billsProcessed = 0;
  let subsProcessed = 0;
  for (const p of profiles ?? []) {
    const result = await processDueForUser(supabase, p.user_id, todayISO);
    billsProcessed += result.billsProcessed;
    subsProcessed += result.subsProcessed;

    if (result.billsProcessed + result.subsProcessed > 0 && (p.prefs as { notify?: boolean } | null)?.notify) {
      const parts = [
        result.billsProcessed ? `บิล ${result.billsProcessed} รายการ` : null,
        result.subsProcessed ? `สมาชิก ${result.subsProcessed} รายการ` : null,
      ].filter(Boolean);
      await pushToUser(supabase, p.user_id, {
        title: "ตัดเงินอัตโนมัติแล้ว",
        body: parts.join(" · "),
        url: "/money",
        tag: "auto-debit",
      });
    }
  }

  return NextResponse.json({ ok: true, users: profiles?.length ?? 0, billsProcessed, subsProcessed });
}
