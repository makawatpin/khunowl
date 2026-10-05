"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeFile, uploadedPath } from "@/lib/supabase/storage";
import { billTotal } from "@/lib/domain/projects";
import { zEmptyToUndefined } from "@/lib/validation/helpers";

function revalidateProjectPages() {
  revalidatePath("/");
  revalidatePath("/home");
}

const itemSchema = z.object({ name: z.string().trim().min(1), qty: z.coerce.number().positive(), price: z.coerce.number().nonnegative() });

const billSchema = z.object({
  date: z.string().min(1, "ระบุวันที่"),
  shop: zEmptyToUndefined,
  phase: zEmptyToUndefined,
  note: zEmptyToUndefined,
  items: z.array(itemSchema).min(1, "เพิ่มรายการอย่างน้อย 1 รายการ"),
});

function parseBill(formData: FormData) {
  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") || "[]"));
  } catch {
    items = [];
  }
  return billSchema.safeParse({
    date: formData.get("date"),
    shop: formData.get("shop"),
    phase: formData.get("phase"),
    note: formData.get("note"),
    items,
  });
}

export async function createProjectBill(projectId: string, formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseBill(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "ไม่พบผู้ใช้" };

  let attachmentPath: string | null = null;
  const up = uploadedPath(formData, "attachmentPath", auth.user.id, "receipts");
  if (up.error) return { error: up.error };
  if (up.path) {
    attachmentPath = up.path;
  }

  const total = billTotal(d.items);
  const paySrc = String(formData.get("paySrc") || "");
  if (paySrc && total > 0) {
    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).single();
    await supabase.from("transactions").insert({
      type: "expense", amount: total, name: `${project?.name ?? "โครงการ"} · ${d.shop || "วัสดุ"}`,
      category: "บ้าน", date: d.date, src_account_id: paySrc,
    });
  }

  const { data, error } = await supabase
    .from("project_bills")
    .insert({ project_id: projectId, date: d.date, shop: d.shop, phase: d.phase, note: d.note, items: d.items, attachment_path: attachmentPath })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateProjectPages();
  return { id: data.id };
}

export async function updateProjectBill(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseBill(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "ไม่พบผู้ใช้" };

  const { data: existing } = await supabase.from("project_bills").select("attachment_path").eq("id", id).single();

  let attachmentPath: string | null | undefined = undefined;
  const up = uploadedPath(formData, "attachmentPath", auth.user.id, "receipts");
  if (up.error) return { error: up.error };
  if (up.path) {
    attachmentPath = up.path;
    await removeFile(supabase, existing?.attachment_path);
  }

  const { error } = await supabase
    .from("project_bills")
    .update({
      date: d.date, shop: d.shop, phase: d.phase, note: d.note, items: d.items,
      ...(attachmentPath !== undefined ? { attachment_path: attachmentPath } : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateProjectPages();
  return {};
}

export async function deleteProjectBill(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("project_bills").select("attachment_path").eq("id", id).single();
  const { error } = await supabase.from("project_bills").delete().eq("id", id);
  if (error) return { error: error.message };
  await removeFile(supabase, existing?.attachment_path);
  revalidateProjectPages();
  return {};
}
