import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import { isOwnUploadPath } from "@/lib/domain/uploads";

// Path convention per README §1 / migration 0001: files/<uid>/<kind>/<uuid>.<ext>.
// Uploads happen in the browser (lib/client/upload.ts) — Server Action bodies are size-capped.
const BUCKET = "files";

export type UploadKind = "receipts" | "docs" | "assets" | "slips";

/** Reads a browser-uploaded storage path from `formData[field]`. `{}` when none was sent; an error
 * when the path isn't inside the caller's own `<uid>/<kind>/` folder. */
export function uploadedPath(formData: FormData, field: string, userId: string, kind: UploadKind): { path?: string; error?: string } {
  const v = formData.get(field);
  if (typeof v !== "string" || !v) return {};
  if (!isOwnUploadPath(v, userId, kind)) return { error: "ไฟล์แนบไม่ถูกต้อง" };
  return { path: v };
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
