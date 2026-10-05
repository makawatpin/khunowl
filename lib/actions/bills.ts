"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addCycle, anchorDayOf, anchorForEdit, dayOf, type Cycle } from "@/lib/domain/dates";
import { guessBillCategory } from "@/lib/domain/money";
import { todayISOInBangkok } from "@/lib/dates/today";
import { zEmptyToUndefined, zPositiveMoney } from "@/lib/validation/helpers";

const CYCLES = ["monthly", "quarterly", "semiannual", "yearly"] as const;

function revalidateMoneyPages() {
  revalidatePath("/");
  revalidatePath("/money");
  revalidatePath("/bills");
}

function cleanDomain(v: FormDataEntryValue | null) {
  return String(v ?? "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null;
}

const billSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อบิล"),
  domain: zEmptyToUndefined,
  amount: zPositiveMoney,
  cycle: z.enum(CYCLES),
  nextDue: z.string().min(1, "ระบุวันครบกำหนด"),
  accountId: z.string().min(1, "เลือกบัญชีที่จ่าย"),
  autoDebit: z.coerce.boolean(),
});

function parseBill(formData: FormData) {
  return billSchema.safeParse({
    name: formData.get("name"),
    domain: cleanDomain(formData.get("domain")),
    amount: formData.get("amount"),
    cycle: formData.get("cycle"),
    nextDue: formData.get("nextDue"),
    accountId: formData.get("accountId"),
    autoDebit: formData.get("autoDebit") === "on",
  });
}

export async function createBill(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseBill(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .insert({ name: d.name, domain: d.domain, amount: d.amount, cycle: d.cycle, next_due: d.nextDue, anchor_day: dayOf(d.nextDue), account_id: d.accountId, auto_debit: d.autoDebit })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return { id: data.id };
}

export async function updateBill(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseBill(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: prev } = await supabase.from("bills").select("next_due, anchor_day").eq("id", id).single();
  const { error } = await supabase
    .from("bills")
    .update({ name: d.name, domain: d.domain, amount: d.amount, cycle: d.cycle, next_due: d.nextDue, anchor_day: anchorForEdit(d.nextDue, prev?.next_due, prev?.anchor_day), account_id: d.accountId, auto_debit: d.autoDebit })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return {};
}

export async function deleteBill(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("bills").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMoneyPages();
  return {};
}

export async function payBillNow(billId: string): Promise<{ txnId?: string; prevDue?: string; prevLastPaid?: string | null; error?: string }> {
  const supabase = await createClient();
  const { data: bill, error: billErr } = await supabase
    .from("bills")
    .select("name, amount, cycle, next_due, anchor_day, account_id, last_paid")
    .eq("id", billId)
    .single();
  if (billErr || !bill) return { error: "ไม่พบบิล" };

  const today = todayISOInBangkok();
  const { data: txn, error: txnErr } = await supabase
    .from("transactions")
    .insert({
      type: "expense", amount: bill.amount, name: bill.name, category: guessBillCategory(bill.name),
      date: today, src_account_id: bill.account_id, ref: `bill:${billId}:${bill.next_due}`,
    })
    .select("id")
    .single();
  if (txnErr) return { error: txnErr.code === "23505" ? "บิลนี้จ่ายไปแล้วสำหรับงวดนี้" : txnErr.message };

  const prevDue = bill.next_due;
  const prevLastPaid = bill.last_paid;
  const { error: updateErr } = await supabase
    .from("bills")
    .update({ next_due: addCycle(bill.next_due, bill.cycle as Cycle, anchorDayOf(bill.next_due, bill.anchor_day)), last_paid: today })
    .eq("id", billId);
  if (updateErr) return { error: updateErr.message };

  revalidateMoneyPages();
  return { txnId: txn.id, prevDue, prevLastPaid };
}

export async function undoPayBill(txnId: string, billId: string, prevDue: string, prevLastPaid: string | null): Promise<void> {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", txnId);
  await supabase.from("bills").update({ next_due: prevDue, last_paid: prevLastPaid }).eq("id", billId);
  revalidateMoneyPages();
}
