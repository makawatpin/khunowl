import { AppShell } from "@/components/shell/app-shell";
import { PrefsProvider } from "@/components/providers/prefs-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { QuickAddProvider } from "@/components/providers/quick-add-provider";
import { PinLockGate } from "@/components/providers/pin-lock-gate";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfilePrefs } from "@/lib/server/session";
import { getNotificationItems } from "@/lib/server/notifications";
import { openNotiCount } from "@/lib/domain/notifications";

// Quick Add's dropdown lists (accounts/cards/vehicles/friends) are fetched when it opens
// (lib/actions/quick-add.ts), not here — this layout re-renders on navigation.
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  let hide = false;
  let theme: "light" | "dark" = "light";
  let motion: "on" | "off" = "on";
  let pinHash: string | null = null;
  let notiCount = 0;

  if (user) {
    const [profilePrefs, items] = await Promise.all([getProfilePrefs(), getNotificationItems(supabase)]);
    const prefs = (profilePrefs as { hide?: boolean; theme?: string; motion?: string; pin?: string } | null) ?? {};
    hide = Boolean(prefs.hide);
    theme = prefs.theme === "dark" ? "dark" : "light";
    motion = prefs.motion === "off" ? "off" : "on";
    pinHash = prefs.pin || null;
    notiCount = openNotiCount(items);
  }

  return (
    <PrefsProvider initialHide={hide} initialTheme={theme} initialMotion={motion}>
      <ToastProvider>
        <QuickAddProvider>
          <PinLockGate pinHash={pinHash}>
            <AppShell notiCount={notiCount}>{children}</AppShell>
          </PinLockGate>
        </QuickAddProvider>
      </ToastProvider>
    </PrefsProvider>
  );
}
