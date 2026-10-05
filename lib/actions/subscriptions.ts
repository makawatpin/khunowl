"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { zEmptyToUndefined, zPositiveMoney } from "@/lib/validation/helpers";

const CYCLES = ["monthly", "yearly"] as const;

function revalidateMoneyPages() {
  revalidatePath("/");
  revalidatePath("/money");
  revalidatePath("/bills");
}

function cleanDomain(v: FormDataEntryValue | null) {
  return String(v ?? "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null;
}

const subSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อบริการ"),
  domain: zEmptyToUndefined,
  price: zPositiveMoney,
  cycle: z.enum(CYCLES),
  nextBilling: z.string().min(1, "ระบุวันตัดเงิน"),
  source: z.string().min(1, "เลือกบัญชี/บัตรที่ตัดผ่าน"),
  sourceKind: z.enum(["account", "card"]),
});

function parseSub(formData: FormData) {
  return subSchema.safeParse({
    name: formData.get("name"),
    domain: cleanDomain(formData.get("domain")),
    price: formData.get("price"),
    cycle: formData.get("cycle"),
    nextBilling: formData.get("nextBilling"),
    source: formData.get("source"),
    sourceKind: formData.get("sourceKind"),
  });
}

export async function createSubscription(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseSub(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      name: d.name, domain: d.domain, price: d.price, cycle: d.cycle, next_billing: d.nextBilling,
      account_id: d.sourceKind === "account" ? d.source : null,
      card_id: d.sourceKind === "card" ? d.source : null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return { id: data.id };
}

export async function updateSubscription(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseSub(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      name: d.name, domain: d.domain, price: d.price, cycle: d.cycle, next_billing: d.nextBilling,
      account_id: d.sourceKind === "account" ? d.source : null,
      card_id: d.sourceKind === "card" ? d.source : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return {};
}

export async function deleteSubscription(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMoneyPages();
  return {};
}
