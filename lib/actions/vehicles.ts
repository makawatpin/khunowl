"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { zEmptyToUndefined, zNonNegativeMoney } from "@/lib/validation/helpers";

const VEHICLE_KINDS = ["car", "motorcycle"] as const;

function revalidateVehiclePages() {
  revalidatePath("/");
  revalidatePath("/vehicle");
  revalidatePath("/calendar");
  revalidatePath("/notifications");
}

const vehicleSchema = z.object({
  kind: z.enum(VEHICLE_KINDS),
  brand: zEmptyToUndefined,
  model: zEmptyToUndefined,
  year: z.coerce.number().int().positive().optional(),
  plate: zEmptyToUndefined,
  vin: zEmptyToUndefined,
  color: zEmptyToUndefined,
  mileage: z.coerce.number().nonnegative(),
  serviceEveryKm: z.coerce.number().int().positive(),
  insuranceCompany: zEmptyToUndefined,
  insurancePolicy: zEmptyToUndefined,
  insuranceExpiry: zEmptyToUndefined,
  insurancePremium: zNonNegativeMoney.optional(),
  prbExpiry: zEmptyToUndefined,
  prbPremium: zNonNegativeMoney.optional(),
  taxExpiry: zEmptyToUndefined,
  taxPremium: zNonNegativeMoney.optional(),
});

function parseVehicle(formData: FormData) {
  return vehicleSchema.safeParse({
    kind: formData.get("kind"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year") || undefined,
    plate: formData.get("plate"),
    vin: formData.get("vin"),
    color: formData.get("color"),
    mileage: formData.get("mileage") || "0",
    serviceEveryKm: formData.get("serviceEveryKm") || "5000",
    insuranceCompany: formData.get("insuranceCompany"),
    insurancePolicy: formData.get("insurancePolicy"),
    insuranceExpiry: formData.get("insuranceExpiry"),
    insurancePremium: formData.get("insurancePremium") || undefined,
    prbExpiry: formData.get("prbExpiry"),
    prbPremium: formData.get("prbPremium") || undefined,
    taxExpiry: formData.get("taxExpiry"),
    taxPremium: formData.get("taxPremium") || undefined,
  });
}

function toRow(d: z.infer<typeof vehicleSchema>) {
  return {
    kind: d.kind, brand: d.brand, model: d.model, year: d.year ?? null, plate: d.plate, vin: d.vin, color: d.color,
    mileage: d.mileage, service_every_km: d.serviceEveryKm,
    insurance_company: d.insuranceCompany, insurance_policy: d.insurancePolicy, insurance_expiry: d.insuranceExpiry,
    insurance_premium: d.insurancePremium ?? null,
    prb_expiry: d.prbExpiry, prb_premium: d.prbPremium ?? null,
    tax_expiry: d.taxExpiry, tax_premium: d.taxPremium ?? null,
  };
}

export async function createVehicle(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseVehicle(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from("vehicles").insert(toRow(parsed.data)).select("id").single();
  if (error) return { error: error.message };

  revalidateVehiclePages();
  return { id: data.id };
}

export async function updateVehicle(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseVehicle(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };

  revalidateVehiclePages();
  return {};
}

export async function deleteVehicle(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateVehiclePages();
  return {};
}

/** Called after a service/fuel entry sets a higher odometer reading than the vehicle's stored mileage. */
export async function bumpVehicleMileage(id: string, mileage: number): Promise<void> {
  const supabase = await createClient();
  const { data: v } = await supabase.from("vehicles").select("mileage").eq("id", id).single();
  if (v && mileage > v.mileage) {
    await supabase.from("vehicles").update({ mileage }).eq("id", id);
  }
}
