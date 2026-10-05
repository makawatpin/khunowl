"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tAmt, tShares, type TripExpense } from "@/lib/domain/trips";
import {
  computeOpeningBalance, computeOpeningUsed, legacyCycleMonths, mapLegacyAccountType,
  mapLegacyCycle, mapLegacyProjectStatus, mapLegacyTaskPriority, mapLegacyVehicleKind,
  type LegacyTxnEffect,
} from "@/lib/domain/legacy-import";

// Loose types for the prototype's JSON — `losExport()` in design-reference/lifeos-store.jsx.
// Untyped/`any`-leaning on purpose: this is external, hand-authored-by-an-old-app data, not
// something we control the shape of. Every field read is defensively defaulted.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Legacy = Record<string, any>;

export interface ImportLegacyResult {
  imported: Record<string, number>;
  skipped: Record<string, number>;
  error?: string;
}

const emptyResult = (): ImportLegacyResult => ({ imported: {}, skipped: {} });

function bump(result: ImportLegacyResult, key: "imported" | "skipped", field: string, n = 1) {
  result[key][field] = (result[key][field] ?? 0) + n;
}

export async function importLegacy(json: unknown): Promise<ImportLegacyResult> {
  const root = json as Legacy;
  const d: Legacy = root?.data ?? root;
  if (!d || !Array.isArray(d.accounts)) {
    return { ...emptyResult(), error: "ไฟล์ไม่ถูกต้อง (ไม่พบ accounts)" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...emptyResult(), error: "ไม่พบผู้ใช้" };

  const result = emptyResult();

  // README §9 step 3: opening_balance/opening_used are computed from the legacy snapshot's own
  // transactions (pure — see lib/domain/legacy-import.ts), before anything is inserted.
  const legacyTxns: LegacyTxnEffect[] = (d.txns ?? []).map((t: Legacy) => ({ type: t.type, amount: +t.amount || 0, src: t.src, to: t.to }));

  // ── 1. accounts, cards ──
  const accountIdMap = new Map<string, string>();
  for (const a of d.accounts ?? []) {
    const { data: row, error } = await supabase
      .from("accounts")
      .insert({
        name: a.name ?? "บัญชี", type: mapLegacyAccountType(a.type), bank: a.bank ?? null, last4: a.last4 ?? null,
        opening_balance: computeOpeningBalance(+a.bal || 0, a.id, legacyTxns),
      })
      .select("id")
      .single();
    if (error || !row) { bump(result, "skipped", "accounts"); continue; }
    accountIdMap.set(a.id, row.id);
    bump(result, "imported", "accounts");
  }

  const cardIdMap = new Map<string, string>();
  for (const c of d.cards ?? []) {
    const { data: row, error } = await supabase
      .from("cards")
      .insert({
        name: c.name ?? "บัตร", bank: c.bank ?? null, network: c.network ?? null, last4: c.last4 ?? null,
        credit_limit: +c.limit || 0, opening_used: computeOpeningUsed(+c.used || 0, c.id, legacyTxns),
        statement_date: c.statement ?? null, due_date: c.due ?? null, min_payment: +c.min || 0,
      })
      .select("id")
      .single();
    if (error || !row) { bump(result, "skipped", "cards"); continue; }
    cardIdMap.set(c.id, row.id);
    bump(result, "imported", "cards");
  }

  const srcRef = (oldId: string | undefined): { account_id: string | null; card_id: string | null } => {
    if (oldId && accountIdMap.has(oldId)) return { account_id: accountIdMap.get(oldId)!, card_id: null };
    if (oldId && cardIdMap.has(oldId)) return { account_id: null, card_id: cardIdMap.get(oldId)! };
    return { account_id: null, card_id: null };
  };

  // ── friends ──
  const friendIdMap = new Map<string, string>();
  for (const f of d.friends ?? []) {
    const { data: row, error } = await supabase.from("friends").insert({ name: f.name ?? "เพื่อน", color: f.color ?? "#3E82CF" }).select("id").single();
    if (error || !row) { bump(result, "skipped", "friends"); continue; }
    friendIdMap.set(f.id, row.id);
    bump(result, "imported", "friends");
  }

  // ── bills / subs / income / plans / budgets ──
  for (const b of d.bills ?? []) {
    const src = srcRef(b.account);
    if (!src.account_id) { bump(result, "skipped", "bills"); continue; }
    const { error } = await supabase.from("bills").insert({
      name: b.name ?? "บิล", domain: b.domain ?? null, amount: +b.amount || 0, cycle: mapLegacyCycle(b.cycle),
      next_due: b.due, account_id: src.account_id, auto_debit: !!b.auto,
    });
    if (error) { bump(result, "skipped", "bills"); continue; }
    bump(result, "imported", "bills");
  }

  for (const s of d.subs ?? []) {
    const src = srcRef(s.src);
    const { error } = await supabase.from("subscriptions").insert({
      name: s.name ?? "สมาชิก", domain: s.domain ?? null, price: +s.price || 0, cycle: mapLegacyCycle(s.cycle),
      next_billing: s.next, account_id: src.account_id, card_id: src.card_id,
    });
    if (error) { bump(result, "skipped", "subs"); continue; }
    bump(result, "imported", "subs");
  }

  for (const i of d.income ?? []) {
    const src = srcRef(i.account);
    if (!src.account_id) { bump(result, "skipped", "income"); continue; }
    const { error } = await supabase.from("recurring_income").insert({
      name: i.name ?? "รายรับ", amount: +i.amount || 0, day_of_month: Math.min(31, Math.max(1, +i.day || 1)), account_id: src.account_id,
    });
    if (error) { bump(result, "skipped", "income"); continue; }
    bump(result, "imported", "income");
  }

  for (const p of d.plans ?? []) {
    const cardId = p.card ? cardIdMap.get(p.card) : null;
    const { error } = await supabase.from("installment_plans").insert({
      name: p.name ?? "ผ่อนชำระ", card_id: cardId ?? null, total: +p.total || 0, months: +p.months || 1, paid_months: +p.paid || 0,
    });
    if (error) { bump(result, "skipped", "plans"); continue; }
    bump(result, "imported", "plans");
  }

  const budgetEntries: [string, number][] = Array.isArray(d.budgets) ? [] : Object.entries(d.budgets ?? {});
  if (budgetEntries.length) {
    const rows = budgetEntries.filter(([, v]) => (+v || 0) > 0).map(([category, limit]) => ({ category, monthly_limit: +limit }));
    if (rows.length) {
      const { error } = await supabase.from("budgets").insert(rows);
      if (!error) bump(result, "imported", "budgets", rows.length);
      else bump(result, "skipped", "budgets", rows.length);
    }
  }

  // ── transactions ──
  const txnIdMap = new Map<string, string>();
  for (const t of d.txns ?? []) {
    const src = srcRef(t.src);
    const to = t.type === "transfer" ? srcRef(t.to) : { account_id: null, card_id: null };
    if (!src.account_id && !src.card_id) { bump(result, "skipped", "txns"); continue; }
    const { data: row, error } = await supabase
      .from("transactions")
      .insert({
        type: t.type, amount: +t.amount || 0, date: t.date, name: t.name ?? "รายการ", category: t.cat ?? null,
        src_account_id: src.account_id, src_card_id: src.card_id,
        to_account_id: to.account_id, to_card_id: to.card_id,
      })
      .select("id")
      .single();
    if (error || !row) { bump(result, "skipped", "txns"); continue; }
    txnIdMap.set(t.id, row.id);
    bump(result, "imported", "txns");
  }

  // ── assets / home / home tasks / docs / tasks ──
  for (const a of d.assets ?? []) {
    const { error } = await supabase.from("assets").insert({
      name: a.name ?? "ทรัพย์สิน", kind: a.kind ?? null, brand: a.brand ?? null, model: a.model ?? null,
      price: +a.price || null, purchased_on: a.bought ?? null, store: a.store ?? null, serial: a.serial ?? null,
      warranty_until: a.warranty || null, sold: !!a.sold, note: a.note ?? null,
    });
    if (error) { bump(result, "skipped", "assets"); continue; }
    bump(result, "imported", "assets");
  }

  if (d.home && d.home.name) {
    const { error } = await supabase.from("properties").insert({
      name: d.home.name, kind: d.home.kind ?? null, monthly_rent: +d.home.rent || 0, since: d.home.since ?? null, size: d.home.size ?? null,
    });
    if (!error) bump(result, "imported", "home");
    else bump(result, "skipped", "home");
  }

  for (const h of d.homeTasks ?? []) {
    const { error } = await supabase.from("home_tasks").insert({
      name: h.name ?? "งานดูแลบ้าน", every_months: legacyCycleMonths(h.every), last_done: h.last || null, next_due: h.next, cost: +h.cost || 0,
    });
    if (error) { bump(result, "skipped", "homeTasks"); continue; }
    bump(result, "imported", "homeTasks");
  }

  for (const doc of d.docs ?? []) {
    const { error } = await supabase.from("documents").insert({
      name: doc.name ?? "เอกสาร", type: doc.type ?? null, expiry: doc.expiry || null, related: doc.rel ?? null,
    });
    if (error) { bump(result, "skipped", "docs"); continue; }
    bump(result, "imported", "docs");
  }

  for (const t of d.tasks ?? []) {
    const { error } = await supabase.from("tasks").insert({
      name: t.name ?? "งาน", due: t.due || null, priority: mapLegacyTaskPriority(t.pri), related: t.rel ?? null,
      done: !!t.done, done_at: t.done ? (t.doneAt ?? new Date().toISOString().slice(0, 10)) : null,
    });
    if (error) { bump(result, "skipped", "tasks"); continue; }
    bump(result, "imported", "tasks");
  }

  // ── vehicles → service/fuel ──
  const vehicleIdMap = new Map<string, string>();
  for (const v of d.vehicles ?? []) {
    const ins = v.insurance ?? {};
    const prb = v.prb ?? {};
    const tax = v.tax ?? {};
    const { data: row, error } = await supabase
      .from("vehicles")
      .insert({
        kind: mapLegacyVehicleKind(v.kind), brand: v.brand ?? null, model: v.model ?? null, year: v.year || null,
        plate: v.plate ?? null, vin: v.vin ?? null, color: v.color ?? null, purchased_on: v.bought || null,
        price: +v.price || null, mileage: +v.mileage || 0, service_every_km: +v.serviceEvery || 5000,
        insurance_company: ins.company ?? null, insurance_policy: ins.policy ?? null, insurance_premium: +ins.premium || null,
        insurance_expiry: ins.expiry || null, prb_premium: +prb.premium || null, prb_expiry: prb.expiry || null,
        tax_premium: +tax.premium || null, tax_expiry: tax.expiry || null,
      })
      .select("id")
      .single();
    if (error || !row) { bump(result, "skipped", "vehicles"); continue; }
    vehicleIdMap.set(v.id, row.id);
    bump(result, "imported", "vehicles");
  }

  for (const s of d.service ?? []) {
    const vehicleId = vehicleIdMap.get(s.vid);
    if (!vehicleId) { bump(result, "skipped", "service"); continue; }
    const items = (s.items ?? []).map((it: Legacy) => ({ name: it.name, price: +it.price || 0 }));
    const { error } = await supabase.from("vehicle_services").insert({
      vehicle_id: vehicleId, category: s.cat ?? null, name: s.name ?? "ซ่อมบำรุง", date: s.date, mileage: s.mileage || null,
      cost: +s.cost || 0, provider: s.provider ?? null, note: s.note ?? null, items,
    });
    if (error) { bump(result, "skipped", "service"); continue; }
    bump(result, "imported", "service");
  }

  for (const f of d.fuel ?? []) {
    const vehicleId = vehicleIdMap.get(f.vid);
    if (!vehicleId) { bump(result, "skipped", "fuel"); continue; }
    const { error } = await supabase.from("fuel_logs").insert({
      vehicle_id: vehicleId, date: f.date, mileage: +f.mileage || 0, liters: +f.liters || 0, price_per_l: +f.perL || null, total: +f.total || 0,
    });
    if (error) { bump(result, "skipped", "fuel"); continue; }
    bump(result, "imported", "fuel");
  }

  // ── trips (members, expenses, items, shares recomputed via tShares, settlements) ──
  for (const t of d.trips ?? []) {
    const { data: tripRow, error: tripErr } = await supabase
      .from("trips")
      .insert({ name: t.name ?? "ทริป", start_on: t.start || null, end_on: t.end || null, currency: t.currency ?? "THB", rate: +t.rate || 1 })
      .select("id")
      .single();
    if (tripErr || !tripRow) { bump(result, "skipped", "trips"); continue; }

    // README §9 step 4: trip.members value 'me' → the member row with friend_id null.
    const memberIdMap = new Map<string, string>();
    for (const m of t.members ?? []) {
      const friendId = m === "me" ? null : (friendIdMap.get(m) ?? null);
      const { data: memberRow, error } = await supabase.from("trip_members").insert({ trip_id: tripRow.id, friend_id: friendId }).select("id").single();
      if (error || !memberRow) continue;
      memberIdMap.set(m, memberRow.id);
    }

    for (const e of t.expenses ?? []) {
      const paidBy = memberIdMap.get(e.paidBy);
      if (!paidBy) continue;
      const items = (e.items ?? []).map((it: Legacy) => ({ name: it.name, price: +it.price || 0, people: (it.people ?? []).map((id: string) => memberIdMap.get(id)).filter(Boolean) as string[] }));
      const split = (e.split ?? []).map((id: string) => memberIdMap.get(id)).filter(Boolean) as string[];
      const shares: Record<string, number> = {};
      for (const [k, v] of Object.entries(e.shares ?? {})) {
        const mapped = memberIdMap.get(k);
        if (mapped) shares[mapped] = +(v as number) || 0;
      }
      const splitMode = e.splitMode ?? "equal";
      const expenseForAmt: TripExpense = { id: "", paidBy, splitMode, amount: +e.amount || 0, split, shares, items };
      const amount = tAmt(expenseForAmt);

      const { data: expRow, error: expErr } = await supabase
        .from("trip_expenses")
        .insert({ trip_id: tripRow.id, title: e.title ?? e.cat ?? "ค่าใช้จ่าย", category: e.cat ?? null, date: e.date || null, split_mode: splitMode, amount, paid_by: paidBy })
        .select("id")
        .single();
      if (expErr || !expRow) { bump(result, "skipped", "tripExpenses"); continue; }
      bump(result, "imported", "tripExpenses");

      if (splitMode === "items" && items.length) {
        await supabase.from("trip_expense_items").insert(items.map((it: { name: string; price: number; people: string[] }) => ({ expense_id: expRow.id, name: it.name, price: it.price, people: it.people })));
      }
      const computedShares = tShares({ ...expenseForAmt, id: expRow.id });
      const shareRows = Object.entries(computedShares).filter(([, v]) => Math.abs(v) > 0.001).map(([member_id, shareAmount]) => ({ expense_id: expRow.id, member_id, amount: Math.round(shareAmount * 100) / 100 }));
      if (shareRows.length) await supabase.from("trip_expense_shares").insert(shareRows);
    }

    for (const s of t.settlements ?? []) {
      const from = memberIdMap.get(s.from);
      const to = memberIdMap.get(s.to);
      if (!from || !to) { bump(result, "skipped", "tripSettlements"); continue; }
      const { error } = await supabase.from("trip_settlements").insert({
        trip_id: tripRow.id, from_member: from, to_member: to, amount: +s.amt || 0, date: s.date || new Date().toISOString().slice(0, 10),
        txn_id: s.txn ? (txnIdMap.get(s.txn) ?? null) : null,
      });
      if (error) { bump(result, "skipped", "tripSettlements"); continue; }
      bump(result, "imported", "tripSettlements");
    }

    bump(result, "imported", "trips");
  }

  // ── projects (material bills only — crews/draws have no matching table, same step-6 scope cut) ──
  for (const p of d.projects ?? []) {
    const { data: projRow, error: projErr } = await supabase
      .from("projects")
      .insert({
        name: p.name ?? "โครงการ", kind: p.kind ?? null, status: mapLegacyProjectStatus(p.status), start_on: p.start || null,
        end_on: p.end || null, budget: +p.budget || 0, note: p.note ?? null, phases: p.phases ?? [],
      })
      .select("id")
      .single();
    if (projErr || !projRow) { bump(result, "skipped", "projects"); continue; }
    bump(result, "imported", "projects");

    for (const b of p.bills ?? []) {
      const items = (b.items ?? []).map((it: Legacy) => ({ name: it.name, qty: +it.qty || 1, price: +it.price || 0 }));
      const { error } = await supabase.from("project_bills").insert({ project_id: projRow.id, date: b.date, shop: b.shop ?? null, phase: b.phase ?? null, note: b.note ?? null, items });
      if (!error) bump(result, "imported", "projectBills");
      else bump(result, "skipped", "projectBills");
    }
    if ((p.crews ?? []).length) bump(result, "skipped", "projectCrews", p.crews.length);
  }

  revalidatePath("/", "layout");
  return result;
}
