// Storage path convention (README §1 / migration 0001): files/<uid>/<kind>/<uuid>.<ext>.
// Files are uploaded from the browser (lib/client/upload.ts); Server Actions only receive the
// resulting path, so they must check it points into the caller's own folder of the right kind.

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function isOwnUploadPath(path: string, userId: string, kind: string): boolean {
  return new RegExp(`^${userId}/${kind}/${UUID}\\.[a-z0-9]{1,8}$`).test(path);
}
