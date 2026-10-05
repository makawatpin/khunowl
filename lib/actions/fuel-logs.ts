"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { bumpVehicleMileage } from "@/lib/actions/vehicles";
import { zPositiveMoney } from "@/lib/validation/helpers";

function revalidateVehiclePages() {
  revalidatePath("/");
  revalidatePath("/vehicle");
}

const fuelSchema = z.object({
  date: z.string().min(1, "ระบุวันที่"),
  mileage: z.coerce.number().int().positive("ระบุเลขไมล์"),
  liters: z.coerce.number().nonnegative().optional(),
  pricePerL: z.coerce.number().nonnegative().optional(),
  total: zPositiveMoney,
});

export async function createFuelLog(vehicleId: string, formData: FormData): Promise<{ id?: string; error?: string }> {
  const total = parseFloat(String(formData.get("total") ?? "").replace(/,/g, ""));
  const liters = parseFloat(String(formData.get("liters") ?? "").replace(/,/g, "")) || undefined;
  const pricePerL = parseFloat(String(formData.get("pricePerL") ?? "").replace(/,/g, "")) || undefined;
  const resolvedLiters = liters || (pricePerL ? total / pricePerL : undefined);
  const resolvedPricePerL = pricePerL || (resolvedLiters ? total / resolvedLiters : undefined);

  const parsed = fuelSchema.safeParse({
    date: formData.get("date"),
    mileage: formData.get("mileage"),
    liters: resolvedLiters,
    pricePerL: resolvedPricePerL,
    total: formData.get("total"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!d.liters) return { error: "ระบุลิตรหรือราคา/ลิตร" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fuel_logs")
    .insert({ vehicle_id: vehicleId, date: d.date, mileage: d.mileage, liters: Math.round(d.liters * 10) / 10, price_per_l: d.pricePerL ?? null, total: d.total })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const paySrc = String(formData.get("paySrc") || "");
  const paySrcKind = String(formData.get("paySrcKind") || "account");
  if (paySrc) {
    const { data: vehicle } = await supabase.from("vehicles").select("brand, model").eq("id", vehicleId).single();
    const vehicleName = [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ");
    await supabase.from("transactions").insert({
      type: "expense", amount: d.total, name: `เติมน้ำมัน ${vehicleName}`.trim(), category: "รถ", date: d.date,
      src_account_id: paySrcKind === "account" ? paySrc : null,
      src_card_id: paySrcKind === "card" ? paySrc : null,
    });
  }

  await bumpVehicleMileage(vehicleId, d.mileage);

  revalidateVehiclePages();
  return { id: data.id };
}

export async function deleteFuelLog(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateVehiclePages();
  return {};
}
