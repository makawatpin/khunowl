"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { zMoney, zEmptyToUndefined } from "@/lib/validation/helpers";

const ACCOUNT_TYPES = ["cash", "savings", "checking", "ewallet", "investment"] as const;

const accountSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อบัญชี"),
  bank: zEmptyToUndefined,
  type: z.enum(ACCOUNT_TYPES),
  balance: zMoney.pipe(z.number()),
  last4: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim().slice(-4) : null)),
});

function parse(formData: FormData) {
  return accountSchema.safeParse({
    name: formData.get("name"),
    bank: formData.get("bank"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    last4: formData.get("last4"),
  });
}

function revalidateMoneyPages() {
  revalidatePath("/");
  revalidatePath("/money");
  revalidatePath("/bills");
}

export async function createAccount(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({ name: parsed.data.name, bank: parsed.data.bank, type: parsed.data.type, opening_balance: parsed.data.balance, last4: parsed.data.last4 })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return { id: data.id };
}

export async function updateAccount(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // The form's "balance" field shows the CURRENT computed balance (opening_balance +
  // transaction effects), not opening_balance itself. Re-deriving opening_balance from
  // the typed value directly would double-count every past transaction, so instead we
  // shift opening_balance by exactly the delta the user typed — a no-op if unchanged.
  const { data: current, error: currentErr } = await supabase
    .from("account_balances")
    .select("balance, opening_balance")
    .eq("id", id)
    .single();
  if (currentErr || !current) return { error: "ไม่พบบัญชี" };
  const newOpeningBalance = (current.opening_balance ?? 0) + (parsed.data.balance - (current.balance ?? 0));

  const { error } = await supabase
    .from("accounts")
    .update({ name: parsed.data.name, bank: parsed.data.bank, type: parsed.data.type, opening_balance: newOpeningBalance, last4: parsed.data.last4 })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return {};
}

export async function deleteAccount(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) {
    return { error: error.code === "23503" ? "บัญชีนี้มีรายการผูกอยู่ ลบไม่ได้" : error.message };
  }
  revalidateMoneyPages();
  return {};
}

export async function togglePinAccount(id: string, pinned: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("accounts").update({ pinned }).eq("id", id);
  revalidateMoneyPages();
}
