"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeFile, signedUrl, uploadedPath } from "@/lib/supabase/storage";
import { zEmptyToUndefined } from "@/lib/validation/helpers";

function revalidateDocPages() {
  revalidatePath("/");
  revalidatePath("/docs");
  revalidatePath("/calendar");
  revalidatePath("/notifications");
}

const docSchema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อเอกสาร"),
  type: zEmptyToUndefined,
  expiry: zEmptyToUndefined,
  related: zEmptyToUndefined,
  note: zEmptyToUndefined,
});

function parseDoc(formData: FormData) {
  return docSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    expiry: formData.get("expiry"),
    related: formData.get("related"),
    note: formData.get("note"),
  });
}

export async function createDocument(formData: FormData): Promise<{ id?: string; error?: string }> {
  const parsed = parseDoc(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "ไม่พบผู้ใช้" };

  let filePath: string | null = null;
  const up = uploadedPath(formData, "filePath", auth.user.id, "docs");
  if (up.error) return { error: up.error };
  if (up.path) {
    filePath = up.path;
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({ name: d.name, type: d.type, expiry: d.expiry, related: d.related, note: d.note, file_path: filePath })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateDocPages();
  return { id: data.id };
}

export async function updateDocument(id: string, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseDoc(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "ไม่พบผู้ใช้" };

  const { data: existing } = await supabase.from("documents").select("file_path").eq("id", id).single();

  let filePath: string | null | undefined = undefined;
  const up = uploadedPath(formData, "filePath", auth.user.id, "docs");
  if (up.error) return { error: up.error };
  if (up.path) {
    filePath = up.path;
    await removeFile(supabase, existing?.file_path);
  }

  const { error } = await supabase
    .from("documents")
    .update({
      name: d.name, type: d.type, expiry: d.expiry, related: d.related, note: d.note,
      ...(filePath !== undefined ? { file_path: filePath } : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateDocPages();
  return {};
}

export async function deleteDocument(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("documents").select("file_path").eq("id", id).single();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { error: error.message };
  await removeFile(supabase, existing?.file_path);
  revalidateDocPages();
  return {};
}

export async function getDocumentFileUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  return signedUrl(supabase, path);
}
