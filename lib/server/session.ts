import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Per-request memoized so the root layout and the (app) layout share one auth round trip. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Per-request memoized `profiles.prefs` for the signed-in user (null when signed out). */
export const getProfilePrefs = cache(async (): Promise<Record<string, unknown> | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("prefs").eq("user_id", user.id).single();
  return (profile?.prefs as Record<string, unknown> | null) ?? {};
});
