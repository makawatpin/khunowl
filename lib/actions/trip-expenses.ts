"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { tAmt, tShares, type TripExpense } from "@/lib/domain/trips";
import { zEmptyToUndefined } from "@/lib/validation/helpers";

const SPLIT_MODES = ["equal", "items", "custom"] as const;

function revalidateTrip(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
}

const itemSchema = z.object({ name: z.string().trim().min(1), price: z.coerce.number().nonnegative(), people: z.array(z.string()).min(1) });

const expenseSchema = z.object({
  title: zEmptyToUndefined,
  category: zEmptyToUndefined,
  date: zEmptyToUndefined,
  splitMode: z.enum(SPLIT_MODES),
  paidBy: z.string().min(1, "เลือกคนจ่าย"),
  amount: z.coerce.number().nonnegative().optional(),
  split: z.array(z.string()).optional(),
  shares: z.record(z.string(), z.coerce.number()).optional(),
  items: z.array(itemSchema).optional(),
});

function parseExpense(formData: FormData) {
  let items: unknown;
  let shares: unknown;
  try {
    items = JSON.parse(String(formData.get("items") || "null"));
  } catch {
    items = undefined;
  }
  try {
    shares = JSON.parse(String(formData.get("shares") || "null"));
  } catch {
    shares = undefined;
  }
  return expenseSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    date: formData.get("date"),
    splitMode: formData.get("splitMode"),
    paidBy: formData.get("paidBy"),
    amount: formData.get("amount") || undefined,
    split: formData.getAll("split").map(String),
    shares: shares ?? undefined,
    items: items ?? undefined,
  });
}

function toTripExpense(d: z.infer<typeof expenseSchema>): TripExpense {
  return {
    id: "", paidBy: d.paidBy, splitMode: d.splitMode, amount: d.amount ?? 0,
    split: d.split, shares: d.shares, items: d.items,
  };
}

async function writeShares(supabase: Awaited<ReturnType<typeof createClient>>, expenseId: string, expense: TripExpense) {
  await supabase.from("trip_expense_shares").delete().eq("expense_id", expenseId);
  const shares = tShares(expense);
  const rows = Object.entries(shares)
    .filter(([, amount]) => Math.abs(amount) > 0.001)
    .map(([member_id, amount]) => ({ expense_id: expenseId, member_id, amount: Math.round(amount * 100) / 100 }));
  if (rows.length) {
    const { error } = await supabase.from("trip_expense_shares").insert(rows);
    if (error) return error.message;
  }
  return null;
}

export async function createTripExpense(tripId: string, formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseExpense(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const expense = toTripExpense(d);
  const amount = tAmt(expense);
  if (amount <= 0) return { error: "ระบุจำนวนเงิน" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_expenses")
    .insert({ trip_id: tripId, title: d.title ?? d.category ?? "ค่าใช้จ่าย", category: d.category, date: d.date, split_mode: d.splitMode, amount, paid_by: d.paidBy })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (d.splitMode === "items" && d.items?.length) {
    const { error: itemsErr } = await supabase
      .from("trip_expense_items")
      .insert(d.items.map((it) => ({ expense_id: data.id, name: it.name, price: it.price, people: it.people })));
    if (itemsErr) return { error: itemsErr.message };
  }

  const shareErr = await writeShares(supabase, data.id, expense);
  if (shareErr) return { error: shareErr };

  revalidateTrip(tripId);
  return { id: data.id };
}

export async function updateTripExpense(id: string, tripId: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseExpense(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const expense = toTripExpense(d);
  const amount = tAmt(expense);
  if (amount <= 0) return { error: "ระบุจำนวนเงิน" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_expenses")
    .update({ title: d.title ?? d.category ?? "ค่าใช้จ่าย", category: d.category, date: d.date, split_mode: d.splitMode, amount, paid_by: d.paidBy })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("trip_expense_items").delete().eq("expense_id", id);
  if (d.splitMode === "items" && d.items?.length) {
    const { error: itemsErr } = await supabase
      .from("trip_expense_items")
      .insert(d.items.map((it) => ({ expense_id: id, name: it.name, price: it.price, people: it.people })));
    if (itemsErr) return { error: itemsErr.message };
  }

  const shareErr = await writeShares(supabase, id, expense);
  if (shareErr) return { error: shareErr };

  revalidateTrip(tripId);
  return {};
}

export async function deleteTripExpense(id: string, tripId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("trip_expenses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateTrip(tripId);
  return {};
}
