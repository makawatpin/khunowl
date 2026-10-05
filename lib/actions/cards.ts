"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addMonths } from "@/lib/domain/dates";
import { shouldRollCardCycle } from "@/lib/domain/money";
import { zEmptyToUndefined, zMoney, zNonNegativeMoney } from "@/lib/validation/helpers";

const cardSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อบัตร"),
  bank: zEmptyToUndefined,
  network: zEmptyToUndefined,
  creditLimit: zMoney.pipe(z.number().positive("ระบุวงเงิน")),
  used: zNonNegativeMoney,
  statementDate: zEmptyToUndefined,
  dueDate: zEmptyToUndefined,
  minPayment: zNonNegativeMoney.optional(),
  last4: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim().slice(-4) : null)),
});

function parse(formData: FormData) {
  const used = formData.get("used");
  const minRaw = formData.get("minPayment");
  return cardSchema.safeParse({
    name: formData.get("name"),
    bank: formData.get("bank"),
    network: formData.get("network"),
    creditLimit: formData.get("creditLimit"),
    used: used || "0",
    statementDate: formData.get("statementDate"),
    dueDate: formData.get("dueDate"),
    minPayment: minRaw || undefined,
    last4: formData.get("last4"),
  });
}

function revalidateMoneyPages() {
  revalidatePath("/");
  revalidatePath("/money");
  revalidatePath("/bills");
}

export async function createCard(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const minPayment = d.minPayment ?? Math.round(d.used * 0.08);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .insert({
      name: d.name, bank: d.bank, network: d.network, last4: d.last4,
      credit_limit: d.creditLimit, opening_used: d.used,
      statement_date: d.statementDate, due_date: d.dueDate, min_payment: minPayment,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return { id: data.id };
}

export async function updateCard(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const minPayment = d.minPayment ?? Math.round(d.used * 0.08);

  const supabase = await createClient();
  // Same reasoning as updateAccount: "used" in the form is the CURRENT computed usage,
  // so shift opening_used by the delta rather than overwriting it outright.
  const { data: current, error: currentErr } = await supabase
    .from("card_usage")
    .select("used, opening_used")
    .eq("id", id)
    .single();
  if (currentErr || !current) return { error: "ไม่พบบัตร" };
  const newOpeningUsed = (current.opening_used ?? 0) + (d.used - (current.used ?? 0));

  const { error } = await supabase
    .from("cards")
    .update({
      name: d.name, bank: d.bank, network: d.network, last4: d.last4,
      credit_limit: d.creditLimit, opening_used: newOpeningUsed,
      statement_date: d.statementDate, due_date: d.dueDate, min_payment: minPayment,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return {};
}

export async function deleteCard(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) return { error: error.code === "23503" ? "บัตรนี้มีรายการผูกอยู่ ลบไม่ได้" : error.message };
  revalidateMoneyPages();
  return {};
}

export async function togglePinCard(id: string, pinned: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("cards").update({ pinned }).eq("id", id);
  revalidateMoneyPages();
}

export async function payCard(
  cardId: string,
  amount: number,
  fromAccountId: string,
): Promise<{ txnId?: string; prevDueDate?: string | null; prevStatementDate?: string | null; error?: string }> {
  if (amount <= 0) return { error: "ระบุจำนวนเงินให้ถูกต้อง" };
  const supabase = await createClient();

  const { data: card, error: cardErr } = await supabase
    .from("card_usage")
    .select("name, used, min_payment, due_date, statement_date")
    .eq("id", cardId)
    .single();
  if (cardErr || !card) return { error: "ไม่พบบัตร" };

  const { data: txn, error: txnErr } = await supabase
    .from("transactions")
    .insert({ type: "transfer", amount, src_account_id: fromAccountId, to_card_id: cardId, name: `ชำระ ${card.name}`, category: "ชำระบัตร" })
    .select("id")
    .single();
  if (txnErr) return { error: txnErr.message };

  const prevDueDate = card.due_date;
  const prevStatementDate = card.statement_date;
  if (shouldRollCardCycle(amount, card.min_payment ?? 0, card.used ?? 0)) {
    await supabase
      .from("cards")
      .update({
        due_date: card.due_date ? addMonths(card.due_date, 1) : null,
        statement_date: card.statement_date ? addMonths(card.statement_date, 1) : null,
      })
      .eq("id", cardId);
  }

  revalidateMoneyPages();
  return { txnId: txn.id, prevDueDate, prevStatementDate };
}

export async function undoPayCard(
  txnId: string,
  cardId: string,
  prevDueDate: string | null | undefined,
  prevStatementDate: string | null | undefined,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", txnId);
  await supabase.from("cards").update({ due_date: prevDueDate ?? null, statement_date: prevStatementDate ?? null }).eq("id", cardId);
  revalidateMoneyPages();
}
