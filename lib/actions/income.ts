"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { zPositiveMoney } from "@/lib/validation/helpers";

function revalidateIncomePages() {
  revalidatePath("/");
  revalidatePath("/money");
  revalidatePath("/forecast");
  revalidatePath("/calendar");
  revalidatePath("/settings");
}

const incomeSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อรายรับ"),
  amount: zPositiveMoney,
  dayOfMonth: z.coerce.number().int().min(1).max(31),
  accountId: z.string().min(1, "เลือกบัญชีที่เข้า"),
});

function parseIncome(formData: FormData) {
  return incomeSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    dayOfMonth: formData.get("dayOfMonth"),
    accountId: formData.get("accountId"),
  });
}

export async function createRecurringIncome(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseIncome(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_income")
    .insert({ name: d.name, amount: d.amount, day_of_month: d.dayOfMonth, account_id: d.accountId })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateIncomePages();
  return { id: data.id };
}

export async function updateRecurringIncome(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseIncome(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_income")
    .update({ name: d.name, amount: d.amount, day_of_month: d.dayOfMonth, account_id: d.accountId })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateIncomePages();
  return {};
}

export async function deleteRecurringIncome(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_income").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateIncomePages();
  return {};
}
