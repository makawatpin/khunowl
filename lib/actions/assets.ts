"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeFile, uploadedPath } from "@/lib/supabase/storage";
import { zEmptyToUndefined, zNonNegativeMoney } from "@/lib/validation/helpers";

function revalidateAssetPages() {
  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath("/home");
  revalidatePath("/docs");
  revalidatePath("/calendar");
  revalidatePath("/notifications");
}

const assetSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อทรัพย์สิน"),
  kind: zEmptyToUndefined,
  brand: zEmptyToUndefined,
  model: zEmptyToUndefined,
  serial: zEmptyToUndefined,
  price: zNonNegativeMoney.optional(),
  purchasedOn: zEmptyToUndefined,
  store: zEmptyToUndefined,
  warrantyUntil: zEmptyToUndefined,
  note: zEmptyToUndefined,
  sold: z.coerce.boolean(),
});

function parseAsset(formData: FormData) {
  return assetSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    serial: formData.get("serial"),
    price: formData.get("price") || undefined,
    purchasedOn: formData.get("purchasedOn"),
    store: formData.get("store"),
    warrantyUntil: formData.get("warrantyUntil"),
    note: formData.get("note"),
    sold: formData.get("sold") === "on",
  });
}

export async function createAsset(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseAsset(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "ไม่พบผู้ใช้" };

  let receiptPath: string | null = null;
  const up = uploadedPath(formData, "receiptPath", auth.user.id, "receipts");
  if (up.error) return { error: up.error };
  if (up.path) {
    receiptPath = up.path;
  }

  let purchaseTxnId: string | null = null;
  const paySrc = String(formData.get("paySrc") || "");
  if (paySrc && d.price && d.price > 0) {
    const { data: txn, error: txnErr } = await supabase
      .from("transactions")
      .insert({ type: "expense", amount: d.price, name: d.name, category: "ช้อปปิ้ง", date: d.purchasedOn, src_account_id: paySrc })
      .select("id")
      .single();
    if (txnErr) return { error: txnErr.message };
    purchaseTxnId = txn.id;
  }

  const { data, error } = await supabase
    .from("assets")
    .insert({
      name: d.name, kind: d.kind, brand: d.brand, model: d.model, serial: d.serial,
      price: d.price ?? null, purchased_on: d.purchasedOn, store: d.store,
      warranty_until: d.warrantyUntil, note: d.note, receipt_path: receiptPath,
      purchase_txn_id: purchaseTxnId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (d.warrantyUntil) {
    await supabase.from("documents").insert({
      name: `ใบรับประกัน ${d.name}`, type: "ใบรับประกัน", expiry: d.warrantyUntil,
      related: d.name, related_asset_id: data.id,
    });
  }

  revalidateAssetPages();
  return { id: data.id };
}

export async function updateAsset(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseAsset(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "ไม่พบผู้ใช้" };

  const { data: existing } = await supabase.from("assets").select("receipt_path").eq("id", id).single();

  let receiptPath: string | null | undefined = undefined;
  const up = uploadedPath(formData, "receiptPath", auth.user.id, "receipts");
  if (up.error) return { error: up.error };
  if (up.path) {
    receiptPath = up.path;
    await removeFile(supabase, existing?.receipt_path);
  }

  const { error } = await supabase
    .from("assets")
    .update({
      name: d.name, kind: d.kind, brand: d.brand, model: d.model, serial: d.serial,
      price: d.price ?? null, purchased_on: d.purchasedOn, store: d.store,
      warranty_until: d.warrantyUntil, note: d.note, sold: d.sold,
      ...(receiptPath !== undefined ? { receipt_path: receiptPath } : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateAssetPages();
  return {};
}

export async function deleteAsset(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("assets").select("receipt_path, image_path").eq("id", id).single();
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) return { error: error.message };
  await removeFile(supabase, existing?.receipt_path);
  await removeFile(supabase, existing?.image_path);
  revalidateAssetPages();
  return {};
}
