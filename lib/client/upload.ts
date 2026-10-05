import { createClient } from "@/lib/supabase/browser";

// Uploads go straight from the browser to Supabase Storage — not through a Server Action, whose
// request body is capped (Next: 1MB default, Vercel: 4.5MB), which phone photos routinely exceed.
// The `files` bucket's RLS policies (migration 0001) only allow writes under `<auth.uid()>/...`,
// and the Server Action re-checks the returned path with `uploadedPath()` (lib/supabase/storage.ts).

export type UploadKind = "receipts" | "docs" | "assets" | "slips";

const BUCKET = "files";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DOC_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2000;
const RESIZABLE = /^image\/(jpeg|png|webp|heic|heif)$/;

function extOf(filename: string): string {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(filename);
  return (m ? m[1] : "bin").toLowerCase();
}

/** Downscales large photos to ≤2000px JPEG. Returns the original file if decoding fails (e.g. HEIC
 * on browsers that can't decode it) or if the re-encode isn't actually smaller. */
async function shrinkImage(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  const original = { blob: file as Blob, ext: extOf(file.name), type: file.type };
  if (!RESIZABLE.test(file.type)) return original;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return original;
    return { blob, ext: "jpg", type: "image/jpeg" };
  } catch {
    return original;
  }
}

export async function uploadToStorage(file: File, kind: UploadKind): Promise<{ path?: string; error?: string }> {
  const isImage = file.type.startsWith("image/");
  if (!isImage && file.type !== "application/pdf") return { error: "รองรับเฉพาะรูปภาพหรือ PDF" };

  const { blob, ext, type } = isImage ? await shrinkImage(file) : { blob: file as Blob, ext: extOf(file.name), type: file.type };
  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;
  if (blob.size > maxBytes) return { error: `ไฟล์ใหญ่เกินไป (จำกัด ${Math.round(maxBytes / 1024 / 1024)}MB)` };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่พบผู้ใช้" };

  const path = `${user.id}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: type || undefined });
  if (error) return { error: `อัปโหลดไฟล์ไม่สำเร็จ: ${error.message}` };
  return { path };
}

/** Uploads `file` (if any) and puts its storage path on `fd[field]`. Returns an error message, or null. */
export async function attachUpload(fd: FormData, field: string, file: File | null, kind: UploadKind): Promise<string | null> {
  if (!file) return null;
  const up = await uploadToStorage(file, kind);
  if (up.error || !up.path) return up.error ?? "อัปโหลดไฟล์ไม่สำเร็จ";
  fd.set(field, up.path);
  return null;
}
