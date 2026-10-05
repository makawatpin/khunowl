import type { Metadata, Viewport } from "next";
import { Anuphan } from "next/font/google";
import { getProfilePrefs } from "@/lib/server/session";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KhunOwl — MheeTang Life OS",
  description: "เว็บแอปจัดการชีวิตส่วนตัวแบบครบวงจร: เงิน ทรัพย์สิน รถ บ้าน ทริป เอกสาร ปฏิทิน แจ้งเตือน",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2658A",
};

// Reads theme/motion server-side (not just in the (app) layout) so <html> renders with the
// right data-theme/data-motion on first paint — avoids a light→dark flash on reload. Falls back
// to light/on for /login, /signup, and anyone not signed in yet (no prefs to read).
async function readThemePrefs(): Promise<{ theme: "light" | "dark"; motion: "on" | "off" }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { theme: "light", motion: "on" };
  }
  try {
    const prefs = (await getProfilePrefs()) as { theme?: string; motion?: string } | null;
    if (!prefs) return { theme: "light", motion: "on" };
    return { theme: prefs.theme === "dark" ? "dark" : "light", motion: prefs.motion === "off" ? "off" : "on" };
  } catch {
    return { theme: "light", motion: "on" };
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { theme, motion } = await readThemePrefs();
  return (
    <html lang="th" className={anuphan.variable} data-theme={theme} data-motion={motion}>
      <body>{children}</body>
    </html>
  );
}
