import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ ids: z.array(z.string().min(1).max(200)).min(1).max(50) });

// Called by the service worker when the "ทำเครื่องหมายแล้ว" button on a push notification is
// tapped. Same-origin fetch, so the Supabase session cookie authenticates it (RLS scopes the upsert).
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const acked_on = todayISOInBangkok();
  const { error } = await supabase.from("notification_acks").upsert(parsed.data.ids.map((noti_id) => ({ noti_id, acked_on })));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
