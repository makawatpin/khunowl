"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { zEmptyToUndefined, zNonNegativeMoney } from "@/lib/validation/helpers";

const propertySchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อบ้าน"),
  kind: zEmptyToUndefined,
  size: zEmptyToUndefined,
  monthlyRent: zNonNegativeMoney.optional(),
  since: zEmptyToUndefined,
});

/** One row per user in v1 (README §3) — create on first save, update after. */
export async function saveProperty(formData: FormData): Promise<{ error?: string }> {
  const parsed = propertySchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    size: formData.get("size"),
    monthlyRent: formData.get("monthlyRent") || undefined,
    since: formData.get("since"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase.from("properties").select("id").limit(1).maybeSingle();

  const row = { name: d.name, kind: d.kind, size: d.size, monthly_rent: d.monthlyRent ?? 0, since: d.since };
  const { error } = existing
    ? await supabase.from("properties").update(row).eq("id", existing.id)
    : await supabase.from("properties").insert(row);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/calendar");
  return {};
}
