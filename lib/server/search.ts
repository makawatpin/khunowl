import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import { formatMoney } from "@/lib/format/money";
import { dShort } from "@/lib/format/date";
import { dueLabel } from "@/lib/domain/dates";

export interface SearchResult {
  kind: string;
  title: string;
  sub: string;
  href: string;
}

// Ported from design-reference/lifeos-data.jsx (searchAll) — v1 via parallel ILIKE
// queries (README §4: "v1: ILIKE + pg_trgm ผ่าน RPC... หรือ query คู่ขนานใน server action").
export async function searchAll(supabase: SupabaseClient<Database>, query: string, todayISO: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q}%`;
  const out: SearchResult[] = [];

  const [accounts, cards, txns, bills, subs, assets, vehicles, services, docs, homeTasks, tasks] = await Promise.all([
    supabase.from("accounts").select("id, name, last4").or(`name.ilike.${like},last4.ilike.${like}`).limit(10),
    supabase.from("cards").select("id, name, last4").or(`name.ilike.${like},last4.ilike.${like}`).limit(10),
    supabase.from("transactions").select("id, name, category, note, amount, date, type").or(`name.ilike.${like},category.ilike.${like},note.ilike.${like}`).limit(10),
    supabase.from("bills").select("id, name, amount, next_due").ilike("name", like).limit(10),
    supabase.from("subscriptions").select("id, name, price, cycle").ilike("name", like).limit(10),
    supabase.from("assets").select("id, name, brand, store, price").or(`name.ilike.${like},brand.ilike.${like},store.ilike.${like},serial.ilike.${like}`).limit(10),
    supabase.from("vehicles").select("id, brand, model, plate").or(`brand.ilike.${like},model.ilike.${like},plate.ilike.${like}`).limit(10),
    supabase.from("vehicle_services").select("id, name, provider, date, cost, vehicle_id").or(`name.ilike.${like},provider.ilike.${like}`).limit(10),
    supabase.from("documents").select("id, name, type, related, expiry").or(`name.ilike.${like},related.ilike.${like},type.ilike.${like}`).limit(10),
    supabase.from("home_tasks").select("id, name, next_due").ilike("name", like).limit(10),
    supabase.from("tasks").select("id, name, due, related, done").or(`name.ilike.${like},related.ilike.${like}`).limit(10),
  ]);

  for (const a of accounts.data ?? []) out.push({ kind: "บัญชี", title: a.name, sub: a.last4 ? `•••• ${a.last4}` : "", href: "/money" });
  for (const c of cards.data ?? []) out.push({ kind: "บัตรเครดิต", title: c.name, sub: c.last4 ? `•••• ${c.last4}` : "", href: "/bills" });
  for (const t of txns.data ?? []) {
    out.push({
      kind: "รายการเงิน", title: t.name,
      sub: `${dShort(t.date, todayISO)} · ${t.type === "income" ? "+" : ""}${formatMoney(t.amount)}${t.category ? ` · ${t.category}` : ""}`,
      href: "/money",
    });
  }
  for (const b of bills.data ?? []) out.push({ kind: "บิล", title: b.name, sub: `${formatMoney(b.amount)} · ${dueLabel(b.next_due, todayISO).text}`, href: "/bills" });
  for (const s of subs.data ?? []) out.push({ kind: "สมาชิกรายเดือน", title: s.name, sub: `${formatMoney(s.price)}/${s.cycle === "yearly" ? "ปี" : "เดือน"}`, href: "/bills" });
  for (const a of assets.data ?? []) out.push({ kind: "ทรัพย์สิน", title: a.name, sub: [a.brand, a.price ? formatMoney(a.price) : null, a.store].filter(Boolean).join(" · "), href: "/assets" });
  for (const v of vehicles.data ?? []) out.push({ kind: "รถ", title: `${v.brand ?? ""} ${v.model ?? ""}`.trim(), sub: v.plate ?? "", href: "/vehicle" });
  for (const s of services.data ?? []) out.push({ kind: "ประวัติรถ", title: s.name, sub: `${dShort(s.date, todayISO)} · ${formatMoney(s.cost)}${s.provider ? ` · ${s.provider}` : ""}`, href: "/vehicle" });
  for (const d of docs.data ?? []) out.push({ kind: "เอกสาร", title: d.name, sub: d.type + (d.related ? ` · ${d.related}` : ""), href: "/docs" });
  for (const h of homeTasks.data ?? []) out.push({ kind: "ดูแลบ้าน", title: h.name, sub: `ครั้งถัดไป ${dShort(h.next_due, todayISO)}`, href: "/home" });
  for (const t of tasks.data ?? []) out.push({ kind: "งาน", title: t.name, sub: `กำหนด ${dShort(t.due, todayISO)}${t.done ? " · เสร็จแล้ว" : ""}`, href: "/calendar" });

  return out;
}
