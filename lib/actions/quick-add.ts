"use server";

import { createClient } from "@/lib/supabase/server";
import type { TripPerson } from "@/components/ui/avatar";

export interface QuickAddOptions {
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  vehicles: { id: string; name: string; mileage: number }[];
  friends: TripPerson[];
}

/** Dropdown data for the Quick Add forms — fetched when Quick Add opens instead of on every
 * (app) layout render (the layout re-runs on navigation; these lists are only needed in the modal). */
export async function getQuickAddOptions(): Promise<QuickAddOptions> {
  const supabase = await createClient();
  const [{ data: accountRows }, { data: cardRows }, { data: vehicleRows }, { data: friendRows }] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("archived", false).order("pinned", { ascending: false }).order("sort"),
    supabase.from("cards").select("id, name").eq("archived", false).order("pinned", { ascending: false }).order("sort"),
    supabase.from("vehicles").select("id, brand, model, mileage"),
    supabase.from("friends").select("id, name, color"),
  ]);
  return {
    accounts: accountRows ?? [],
    cards: cardRows ?? [],
    vehicles: (vehicleRows ?? []).map((v) => ({ id: v.id, name: [v.brand, v.model].filter(Boolean).join(" ") || "รถ", mileage: v.mileage })),
    friends: (friendRows ?? []).map((f) => ({ id: f.id, name: f.name, color: f.color })),
  };
}
