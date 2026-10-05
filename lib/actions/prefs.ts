"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/db.types";

type Prefs = Record<string, unknown>;

async function mergePrefs(patch: Prefs): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from("profiles").select("prefs").eq("user_id", user.id).single();
  const prefs = { ...((profile?.prefs as Prefs) ?? {}), ...patch };
  await supabase.from("profiles").update({ prefs: prefs as Json }).eq("user_id", user.id);
}

export async function setHidePref(hide: boolean) {
  await mergePrefs({ hide });
}

export async function setThemePref(theme: "light" | "dark") {
  await mergePrefs({ theme });
  revalidatePath("/", "layout");
}

export async function setMotionPref(motion: "on" | "off") {
  await mergePrefs({ motion });
  revalidatePath("/", "layout");
}

export async function setPinHash(hash: string | null): Promise<{ error?: string }> {
  await mergePrefs({ pin: hash });
  return {};
}
