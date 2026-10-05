import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import { notifications, type NotificationItem } from "@/lib/domain/notifications";
import { todayISOInBangkok } from "@/lib/dates/today";

/**
 * Shared by app/(app)/notifications/page.tsx (full list) and the layout (badge count) — both call
 * this with an RLS-scoped client and no `userId`, relying on RLS to limit rows to the caller.
 * The notify cron (lib/server/push.ts's caller) passes a service-role client, which bypasses RLS,
 * plus an explicit `userId` to scope every query per account it loops over.
 */
export async function getNotificationItems(supabase: SupabaseClient<Database>, userId?: string): Promise<NotificationItem[]> {
  const todayISO = todayISOInBangkok();
  let billsQ = supabase.from("bills").select("id, name, next_due");
  let cardsQ = supabase.from("card_usage").select("id, name, used, due_date").eq("archived", false);
  let assetsQ = supabase.from("assets").select("id, name, warranty_until").eq("sold", false);
  let vehiclesQ = supabase.from("vehicles").select("id, model, insurance_expiry, tax_expiry, mileage, service_every_km");
  let docsQ = supabase.from("documents").select("id, name, type, expiry");
  let homeTasksQ = supabase.from("home_tasks").select("id, name, next_due");
  let tasksQ = supabase.from("tasks").select("id, name, due, done");
  let acksQ = supabase.from("notification_acks").select("noti_id");
  if (userId) {
    billsQ = billsQ.eq("user_id", userId);
    cardsQ = cardsQ.eq("user_id", userId);
    assetsQ = assetsQ.eq("user_id", userId);
    vehiclesQ = vehiclesQ.eq("user_id", userId);
    docsQ = docsQ.eq("user_id", userId);
    homeTasksQ = homeTasksQ.eq("user_id", userId);
    tasksQ = tasksQ.eq("user_id", userId);
    acksQ = acksQ.eq("user_id", userId);
  }

  const [{ data: billRows }, { data: cardRows }, { data: assetRows }, { data: vehicleRows }, { data: docRows }, { data: homeTaskRows }, { data: taskRows }, { data: ackRows }] =
    await Promise.all([billsQ, cardsQ, assetsQ, vehiclesQ, docsQ, homeTasksQ, tasksQ, acksQ]);

  return notifications({
    todayISO,
    ackedKeys: new Set((ackRows ?? []).map((a) => a.noti_id)),
    bills: (billRows ?? []).map((b) => ({ id: b.id, name: b.name, nextDue: b.next_due })),
    cards: (cardRows ?? [])
      .filter((c): c is typeof c & { id: string; name: string } => !!c.id && !!c.name)
      .map((c) => ({ id: c.id, name: c.name, used: c.used ?? 0, dueDate: c.due_date })),
    assets: (assetRows ?? []).map((a) => ({ id: a.id, name: a.name, warrantyUntil: a.warranty_until })),
    vehicles: (vehicleRows ?? []).map((v) => ({
      id: v.id, model: v.model, insuranceExpiry: v.insurance_expiry, taxExpiry: v.tax_expiry,
      mileage: v.mileage, serviceEveryKm: v.service_every_km,
    })),
    documents: (docRows ?? []).map((d) => ({ id: d.id, name: d.name, type: d.type, expiry: d.expiry })),
    homeTasks: (homeTaskRows ?? []).map((h) => ({ id: h.id, name: h.name, nextDue: h.next_due })),
    tasks: (taskRows ?? []).map((t) => ({ id: t.id, name: t.name, due: t.due, done: t.done })),
  });
}
