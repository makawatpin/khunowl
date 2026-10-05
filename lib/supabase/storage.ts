import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";

// Path convention per README §1 / migration 0001: files/<uid>/<kind>/<uuid>.<ext>.
const BUCKET = "files";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DOC_BYTES = 20 * 1024 * 1024;

export type UploadKind = "receipts" | "docs" | "assets" | "slips";

function extOf(filename: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(filename);
  return (m ? m[1] : "bin").toLowerCase();
}

/** Uploads a File from a Server Action's FormData to the private `files` bucket. Returns the storage path (not a URL — use signedUrl() to display it). */
export async function uploadFile(
  supabase: SupabaseClient<Database>,
  userId: string,
  kind: UploadKind,
  file: File,
): Promise<{ path?: string; error?: string }> {
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") return { error: "รองรับเฉพาะรูปภาพหรือ PDF" };
  const maxBytes = kind === "docs" ? MAX_DOC_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) return { error: `ไฟล์ใหญ่เกินไป (จำกัด ${Math.round(maxBytes / 1024 / 1024)}MB)` };

  const path = `${userId}/${kind}/${crypto.randomUUID()}.${extOf(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
  if (error) return { error: error.message };
  return { path };
}

export async function removeFile(supabase: SupabaseClient<Database>, path: string | null | undefined): Promise<void> {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Batch version of signedUrl(): one HTTP call for all paths. Returns a path → URL map (null/failed paths are omitted). */
export async function signedUrls(
  supabase: SupabaseClient<Database>,
  paths: (string | null | undefined)[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const out = new Map<string, string>();
  if (!unique.length) return out;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(unique, expiresIn);
  if (error || !data) return out;
  for (const row of data) if (row.path && row.signedUrl) out.set(row.path, row.signedUrl);
  return out;
}

export async function signedUrl(supabase: SupabaseClient<Database>, path: string | null | undefined, expiresIn = 3600): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
