"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { zEmptyToUndefined, zPositiveMoney } from "@/lib/validation/helpers";
import { TXN_LIST_COLUMNS, TXN_PAGE_SIZE, nextTxnCursor, toTxnListItem, type TxnCursor, type TxnListItem, type TxnRow } from "@/lib/domain/txn-list";

function revalidateMoneyPages() {
  revalidatePath("/");
  revalidatePath("/money");
  revalidatePath("/bills");
}

const txnSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: zPositiveMoney,
  category: zEmptyToUndefined,
  name: z.string().trim().optional(),
  date: z.string().min(1, "ระบุวันที่"),
  note: zEmptyToUndefined,
  source: z.string().min(1, "เลือกบัญชี/บัตร"),
  sourceKind: z.enum(["account", "card"]),
});

function parseTxn(formData: FormData) {
  return txnSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    name: formData.get("name"),
    date: formData.get("date"),
    note: formData.get("note"),
    source: formData.get("source"),
    sourceKind: formData.get("sourceKind"),
  });
}

export async function createTransaction(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseTxn(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      type: d.type,
      amount: d.amount,
      category: d.category,
      name: d.name?.trim() || d.category || "รายการ",
      date: d.date,
      note: d.note,
      src_account_id: d.sourceKind === "account" ? d.source : null,
      src_card_id: d.sourceKind === "card" ? d.source : null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return { id: data.id };
}

export async function updateTransaction(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseTxn(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      type: d.type,
      amount: d.amount,
      category: d.category,
      name: d.name?.trim() || d.category || "รายการ",
      date: d.date,
      note: d.note,
      src_account_id: d.sourceKind === "account" ? d.source : null,
      src_card_id: d.sourceKind === "card" ? d.source : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return {};
}

export async function deleteTransaction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMoneyPages();
  return {};
}

const transferSchema = z.object({
  srcAccountId: z.string().min(1, "เลือกบัญชีต้นทาง"),
  toAccountId: z.string().min(1, "เลือกบัญชีปลายทาง"),
  amount: zPositiveMoney,
  date: z.string().min(1, "ระบุวันที่"),
  note: zEmptyToUndefined,
});

function parseTransfer(formData: FormData) {
  return transferSchema.safeParse({
    srcAccountId: formData.get("srcAccountId"),
    toAccountId: formData.get("toAccountId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note"),
  });
}

export async function createTransfer(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseTransfer(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.srcAccountId === d.toAccountId) return { error: "เลือกบัญชีต้นทางและปลายทางต่างกัน" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      type: "transfer", amount: d.amount, date: d.date, note: d.note, category: "โอน",
      name: "โอนเงินระหว่างบัญชี",
      src_account_id: d.srcAccountId, to_account_id: d.toAccountId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateMoneyPages();
  return { id: data.id };
}

export async function deleteTransfer(id: string): Promise<{ error?: string }> {
  return deleteTransaction(id);
}

const cursorSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), id: z.string().uuid() });

/** Next page of the /money transaction list, keyset-paginated (date desc, id desc) after `cursor`. */
export async function listTransactionsPage(cursor: TxnCursor): Promise<{ rows: TxnListItem[]; next: TxnCursor | null; error?: string }> {
  const parsed = cursorSchema.safeParse(cursor);
  if (!parsed.success) return { rows: [], next: null, error: "cursor ไม่ถูกต้อง" };
  const { date, id } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TXN_LIST_COLUMNS)
    .or(`date.lt.${date},and(date.eq.${date},id.lt.${id})`)
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(TXN_PAGE_SIZE);
  if (error) return { rows: [], next: null, error: error.message };
  const rows = (data ?? []) as TxnRow[];
  return { rows: rows.map(toTxnListItem), next: nextTxnCursor(rows) };
}
