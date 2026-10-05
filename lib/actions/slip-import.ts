"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.number().positive(),
  accountId: z.string().min(1),
  category: z.string().min(1),
  name: z.string().trim().min(1),
  date: z.string().min(1),
  note: z.string().optional(),
  ref: z.string().optional(),
});

/** Bulk-saves reviewed slip-OCR drafts as transactions (README §5 slip import). `ref` (slip:<bank
 * ref>) relies on the same `transactions_ref_uq` unique index as bill/sub auto-debit for dedup —
 * a slip already imported (or re-read twice) is silently skipped, not duplicated. */
export async function importSlipTransactions(items: z.infer<typeof itemSchema>[]): Promise<{ imported: number; error?: string }> {
  const parsed = z.array(itemSchema).safeParse(items);
  if (!parsed.success) return { imported: 0, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  let imported = 0;
  for (const d of parsed.data) {
    const { error } = await supabase.from("transactions").insert({
      type: d.type, amount: d.amount, name: d.name, category: d.category, date: d.date,
      note: d.note, src_account_id: d.accountId, ref: d.ref || undefined,
    });
    if (!error) imported++;
    else if (error.code !== "23505") return { imported, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/money");
  return { imported };
}

export interface SlipDedupeTxn {
  type: string;
  amount: number;
  date: string;
  name: string;
  category: string | null;
}

/** Fetched lazily when SlipImportForm opens (not on every page load) — the client-side dup
 * check (slipIsDuplicate) and the "same payee → same category as last time" guess both need it. */
export async function getSlipDedupeContext(): Promise<{
  existingRefs: string[];
  recentTxns: SlipDedupeTxn[];
  accounts: { id: string; name: string; bank: string | null }[];
}> {
  const supabase = await createClient();
  const [{ data: refRows }, { data: txnRows }, { data: accountRows }] = await Promise.all([
    supabase.from("transactions").select("ref").like("ref", "slip:%"),
    supabase.from("transactions").select("type, amount, date, name, category").order("date", { ascending: false }).limit(300),
    supabase.from("accounts").select("id, name, bank").eq("archived", false),
  ]);

  return {
    existingRefs: (refRows ?? []).map((r) => r.ref).filter((r): r is string => !!r),
    recentTxns: txnRows ?? [],
    accounts: (accountRows ?? []).filter((a): a is { id: string; name: string; bank: string | null } => !!a.id && !!a.name),
  };
}
