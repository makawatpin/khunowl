"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";

function revalidateTaskPages() {
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/notifications");
}

export async function toggleTaskDone(id: string, done: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ done, done_at: done ? todayISOInBangkok() : null })
    .eq("id", id);
  revalidateTaskPages();
}
