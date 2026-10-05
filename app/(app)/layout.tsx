import { AppShell } from "@/components/shell/app-shell";
import { PrefsProvider } from "@/components/providers/prefs-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { QuickAddProvider } from "@/components/providers/quick-add-provider";
import { PinLockGate } from "@/components/providers/pin-lock-gate";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfilePrefs } from "@/lib/server/session";
import { getNotificationItems } from "@/lib/server/notifications";
import { openNotiCount } from "@/lib/domain/notifications";
import type { TripPerson } from "@/components/ui/avatar";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  let hide = false;
  let theme: "light" | "dark" = "light";
  let motion: "on" | "off" = "on";
  let pinHash: string | null = null;
  let accounts: { id: string; name: string }[] = [];
  let cards: { id: string; name: string }[] = [];
  let vehicles: { id: string; name: string; mileage: number }[] = [];
  let friends: TripPerson[] = [];
  let notiCount = 0;

  if (user) {
    const [profilePrefs, { data: accountRows }, { data: cardRows }, { data: vehicleRows }, { data: friendRows }, items] = await Promise.all([
      getProfilePrefs(),
      supabase.from("accounts").select("id, name").eq("archived", false).order("pinned", { ascending: false }).order("sort"),
      supabase.from("cards").select("id, name").eq("archived", false).order("pinned", { ascending: false }).order("sort"),
      supabase.from("vehicles").select("id, brand, model, mileage"),
      supabase.from("friends").select("id, name, color"),
      getNotificationItems(supabase),
    ]);
    const prefs = (profilePrefs as { hide?: boolean; theme?: string; motion?: string; pin?: string } | null) ?? {};
    hide = Boolean(prefs.hide);
    theme = prefs.theme === "dark" ? "dark" : "light";
    motion = prefs.motion === "off" ? "off" : "on";
    pinHash = prefs.pin || null;
    accounts = accountRows ?? [];
    cards = cardRows ?? [];
    vehicles = (vehicleRows ?? []).map((v) => ({ id: v.id, name: [v.brand, v.model].filter(Boolean).join(" ") || "รถ", mileage: v.mileage }));
    friends = (friendRows ?? []).map((f) => ({ id: f.id, name: f.name, color: f.color }));
    notiCount = openNotiCount(items);
  }

  return (
    <PrefsProvider initialHide={hide} initialTheme={theme} initialMotion={motion}>
      <ToastProvider>
        <QuickAddProvider accounts={accounts} cards={cards} vehicles={vehicles} friends={friends}>
          <PinLockGate pinHash={pinHash}>
            <AppShell notiCount={notiCount}>{children}</AppShell>
          </PinLockGate>
        </QuickAddProvider>
      </ToastProvider>
    </PrefsProvider>
  );
}
