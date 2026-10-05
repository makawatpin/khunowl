import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDueForUser } from "@/lib/server/process-due";
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
  const { data: profiles, error } = await supabase.from("profiles").select("user_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let billsProcessed = 0;
  let subsProcessed = 0;
  for (const p of profiles ?? []) {
    const result = await processDueForUser(supabase, p.user_id, todayISO);
    billsProcessed += result.billsProcessed;
    subsProcessed += result.subsProcessed;
  }

  return NextResponse.json({ ok: true, users: profiles?.length ?? 0, billsProcessed, subsProcessed });
}
