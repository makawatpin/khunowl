// Ported from design-reference/lifeos-store.jsx (pinHash). Explicitly NOT a security
// boundary (README §5: "ใช้กันคนมองข้ามไหล่เท่านั้น") — real auth is Supabase Auth + RLS.
export function pinHash(pin: string): string {
  let h = 5381;
  for (const ch of `mt:${pin}`) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return String(h >>> 0);
}
