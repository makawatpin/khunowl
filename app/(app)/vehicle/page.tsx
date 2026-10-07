import { createClient } from "@/lib/supabase/server";
import { signedUrl } from "@/lib/supabase/storage";
import { todayISOInBangkok } from "@/lib/dates/today";
import { VehicleClient, type FuelLogItem } from "@/components/vehicle/vehicle-client";
import type { VehicleFormInitial } from "@/components/forms/vehicle-form";
import type { VehicleServiceFormInitial } from "@/components/forms/vehicle-service-form";

export default async function VehiclePage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();

  const [
    { data: vehicleRows },
    { data: serviceRows },
    { data: fuelRows },
    { data: docRows },
    { data: accountRows },
    { data: cardRows },
  ] = await Promise.all([
    supabase.from("vehicles").select(
      "id, kind, brand, model, year, plate, vin, color, mileage, service_every_km, insurance_company, insurance_policy, insurance_expiry, insurance_premium, prb_expiry, prb_premium, tax_expiry, tax_premium",
    ),
    supabase.from("vehicle_services").select("id, vehicle_id, category, name, date, mileage, cost, provider, note, items, receipt_path"),
    supabase.from("fuel_logs").select("id, vehicle_id, date, mileage, liters, price_per_l, total, energy"),
    supabase.from("documents").select("id, name, type, expiry, related"),
    supabase.from("accounts").select("id, name").eq("archived", false),
    supabase.from("cards").select("id, name").eq("archived", false),
  ]);

  const vehicles: VehicleFormInitial[] = (vehicleRows ?? []).map((v) => ({
    id: v.id, kind: v.kind, brand: v.brand, model: v.model, year: v.year, plate: v.plate, vin: v.vin, color: v.color,
    mileage: v.mileage, serviceEveryKm: v.service_every_km,
    insuranceCompany: v.insurance_company, insurancePolicy: v.insurance_policy, insuranceExpiry: v.insurance_expiry, insurancePremium: v.insurance_premium,
    prbExpiry: v.prb_expiry, prbPremium: v.prb_premium, taxExpiry: v.tax_expiry, taxPremium: v.tax_premium,
  }));

  const servicesByVehicle: Record<string, VehicleServiceFormInitial[]> = {};
  for (const s of serviceRows ?? []) {
    const list = servicesByVehicle[s.vehicle_id] ?? (servicesByVehicle[s.vehicle_id] = []);
    list.push({
      id: s.id, vehicleId: s.vehicle_id, category: s.category, name: s.name, date: s.date, mileage: s.mileage, cost: s.cost,
      provider: s.provider, note: s.note, items: (s.items as { name: string; price: number }[]) ?? [],
      receiptUrl: await signedUrl(supabase, s.receipt_path),
    });
  }

  const fuelByVehicle: Record<string, FuelLogItem[]> = {};
  for (const f of fuelRows ?? []) {
    const list = fuelByVehicle[f.vehicle_id] ?? (fuelByVehicle[f.vehicle_id] = []);
    list.push({ id: f.id, date: f.date, mileage: f.mileage, liters: f.liters, pricePerL: f.price_per_l, total: f.total, energy: f.energy === "ev" ? "ev" : "fuel" });
  }

  const documents = (docRows ?? []).map((d) => ({ id: d.id, name: d.name, type: d.type, expiry: d.expiry, related: d.related }));
  const accounts = (accountRows ?? []).filter((a): a is { id: string; name: string } => !!a.id && !!a.name);
  const cards = (cardRows ?? []).filter((c): c is { id: string; name: string } => !!c.id && !!c.name);

  return (
    <VehicleClient
      vehicles={vehicles}
      servicesByVehicle={servicesByVehicle}
      fuelByVehicle={fuelByVehicle}
      documents={documents}
      accounts={accounts}
      cards={cards}
      todayISO={todayISO}
    />
  );
}
