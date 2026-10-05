"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeFile, uploadFile } from "@/lib/supabase/storage";
import { bumpVehicleMileage } from "@/lib/actions/vehicles";
import { zEmptyToUndefined } from "@/lib/validation/helpers";

function revalidateVehiclePages() {
  revalidatePath("/");
  revalidatePath("/vehicle");
}

const itemSchema = z.object({ name: z.string().trim().min(1), price: z.coerce.number().nonnegative() });

const serviceSchema = z.object({
  category: zEmptyToUndefined,
  name: z.string().trim().min(1, "ใส่หัวข้อ"),
  date: z.string().min(1, "ระบุวันที่"),
  mileage: z.coerce.number().int().nonnegative().optional(),
  provider: zEmptyToUndefined,
  note: zEmptyToUndefined,
  items: z.array(itemSchema),
});

function parseService(formData: FormData) {
  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") || "[]"));
  } catch {
    items = [];
  }
  return serviceSchema.safeParse({
    category: formData.get("category"),
    name: formData.get("name"),
    date: formData.get("date"),
    mileage: formData.get("mileage") || undefined,
    provider: formData.get("provider"),
    note: formData.get("note"),
    items,
  });
}

function totalOf(items: { name: string; price: number }[]): number {
  return Math.round(items.reduce((s, it) => s + it.price, 0) * 100) / 100;
}

export async function createVehicleService(vehicleId: string, formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseService(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "ไม่พบผู้ใช้" };

  let receiptPath: string | null = null;
  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const up = await uploadFile(supabase, auth.user.id, "receipts", receipt);
    if (up.error) return { error: up.error };
    receiptPath = up.path ?? null;
  }

  const cost = totalOf(d.items);
  const paySrc = String(formData.get("paySrc") || "");
  const paySrcKind = String(formData.get("paySrcKind") || "account");
  if (paySrc && cost > 0) {
    const { data: vehicle } = await supabase.from("vehicles").select("brand, model").eq("id", vehicleId).single();
    const vehicleName = [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ");
    await supabase.from("transactions").insert({
      type: "expense", amount: cost, name: `${d.name} · ${vehicleName}`.trim(), category: "รถ", date: d.date,
      src_account_id: paySrcKind === "account" ? paySrc : null,
      src_card_id: paySrcKind === "card" ? paySrc : null,
    });
  }

  const { data, error } = await supabase
    .from("vehicle_services")
    .insert({ vehicle_id: vehicleId, category: d.category, name: d.name, date: d.date, mileage: d.mileage ?? null, cost, provider: d.provider, note: d.note, items: d.items, receipt_path: receiptPath })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (d.mileage) await bumpVehicleMileage(vehicleId, d.mileage);

  revalidateVehiclePages();
  return { id: data.id };
}

export async function updateVehicleService(id: string, vehicleId: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseService(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "ไม่พบผู้ใช้" };

  const { data: existing } = await supabase.from("vehicle_services").select("receipt_path").eq("id", id).single();

  let receiptPath: string | null | undefined = undefined;
  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const up = await uploadFile(supabase, auth.user.id, "receipts", receipt);
    if (up.error) return { error: up.error };
    receiptPath = up.path ?? null;
    await removeFile(supabase, existing?.receipt_path);
  }

  const cost = totalOf(d.items);
  const { error } = await supabase
    .from("vehicle_services")
    .update({
      category: d.category, name: d.name, date: d.date, mileage: d.mileage ?? null, cost, provider: d.provider, note: d.note, items: d.items,
      ...(receiptPath !== undefined ? { receipt_path: receiptPath } : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  if (d.mileage) await bumpVehicleMileage(vehicleId, d.mileage);

  revalidateVehiclePages();
  return {};
}

export async function deleteVehicleService(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("vehicle_services").select("receipt_path").eq("id", id).single();
  const { error } = await supabase.from("vehicle_services").delete().eq("id", id);
  if (error) return { error: error.message };
  await removeFile(supabase, existing?.receipt_path);
  revalidateVehiclePages();
  return {};
}
