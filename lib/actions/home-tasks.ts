"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addMonths } from "@/lib/domain/dates";
import { todayISOInBangkok } from "@/lib/dates/today";
import { zEmptyToUndefined, zNonNegativeMoney } from "@/lib/validation/helpers";

function revalidateHomePages() {
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/calendar");
  revalidatePath("/notifications");
}

const homeTaskSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่องาน"),
  everyMonths: z.coerce.number().int().positive(),
  nextDue: z.string().min(1, "ระบุวันครั้งถัดไป"),
  lastDone: zEmptyToUndefined,
  cost: zNonNegativeMoney.optional(),
});

function parseHomeTask(formData: FormData) {
  return homeTaskSchema.safeParse({
    name: formData.get("name"),
    everyMonths: formData.get("everyMonths"),
    nextDue: formData.get("nextDue"),
    lastDone: formData.get("lastDone"),
    cost: formData.get("cost") || undefined,
  });
}

export async function createHomeTask(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseHomeTask(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_tasks")
    .insert({ name: d.name, every_months: d.everyMonths, next_due: d.nextDue, last_done: d.lastDone ?? null, cost: d.cost ?? 0 })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateHomePages();
  return { id: data.id };
}

export async function updateHomeTask(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseHomeTask(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("home_tasks")
    .update({ name: d.name, every_months: d.everyMonths, next_due: d.nextDue, last_done: d.lastDone ?? null, cost: d.cost ?? 0 })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateHomePages();
  return {};
}

export async function deleteHomeTask(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("home_tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateHomePages();
  return {};
}

export async function markHomeTaskDone(
  id: string,
): Promise<{ prevLastDone?: string | null; prevNextDue?: string; error?: string }> {
  const supabase = await createClient();
  const { data: task, error: fetchErr } = await supabase.from("home_tasks").select("every_months, last_done, next_due").eq("id", id).single();
  if (fetchErr || !task) return { error: "ไม่พบงาน" };

  const today = todayISOInBangkok();
  const { error } = await supabase
    .from("home_tasks")
    .update({ last_done: today, next_due: addMonths(today, task.every_months) })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateHomePages();
  return { prevLastDone: task.last_done, prevNextDue: task.next_due };
}

export async function undoHomeTaskDone(id: string, prevLastDone: string | null, prevNextDue: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("home_tasks").update({ last_done: prevLastDone, next_due: prevNextDue }).eq("id", id);
  revalidateHomePages();
}
