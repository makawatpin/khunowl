"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { zEmptyToUndefined, zNonNegativeMoney } from "@/lib/validation/helpers";

function revalidateProjectPages() {
  revalidatePath("/");
  revalidatePath("/home");
}

const PROJECT_STATUS = ["planning", "in_progress", "done"] as const;

const projectSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อโครงการ"),
  kind: zEmptyToUndefined,
  status: z.enum(PROJECT_STATUS),
  startOn: zEmptyToUndefined,
  endOn: zEmptyToUndefined,
  budget: zNonNegativeMoney.optional(),
  note: zEmptyToUndefined,
  phases: z.array(z.string()),
});

function parseProject(formData: FormData) {
  return projectSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    status: formData.get("status"),
    startOn: formData.get("startOn"),
    endOn: formData.get("endOn"),
    budget: formData.get("budget") || undefined,
    note: formData.get("note"),
    phases: formData.getAll("phases").map(String),
  });
}

export async function createProject(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseProject(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name: d.name, kind: d.kind, status: d.status, start_on: d.startOn, end_on: d.endOn, budget: d.budget ?? 0, note: d.note, phases: d.phases })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateProjectPages();
  return { id: data.id };
}

export async function updateProject(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseProject(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ name: d.name, kind: d.kind, status: d.status, start_on: d.startOn, end_on: d.endOn, budget: d.budget ?? 0, note: d.note, phases: d.phases })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateProjectPages();
  return {};
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateProjectPages();
  return {};
}
