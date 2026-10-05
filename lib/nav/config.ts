import type { IconName } from "@/components/ui/icon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

// Sidebar + "more" menu structure, ported from design-reference/lifeos-app.jsx (NAV)
// and mapped to routes per README.md §2 Routes ↔ Screens.
export const NAV: NavGroup[] = [
  { group: "", items: [{ href: "/", label: "ภาพรวม", icon: "home" }] },
  {
    group: "การเงิน",
    items: [
      { href: "/money", label: "เงินและบัญชี", icon: "money" },
      { href: "/stats", label: "สรุป & สถิติ", icon: "pie" },
      { href: "/bills", label: "บิล & บัตรเครดิต", icon: "card" },
      { href: "/trips", label: "ทริป & หารเงิน", icon: "trip" },
      { href: "/forecast", label: "คาดการณ์เงินสด", icon: "chart" },
    ],
  },
  {
    group: "ของและที่อยู่",
    items: [
      { href: "/assets", label: "ทรัพย์สิน & ประกัน", icon: "box" },
      { href: "/vehicle", label: "รถยนต์", icon: "car" },
      { href: "/home", label: "บ้าน", icon: "house" },
      { href: "/docs", label: "คลังเอกสาร", icon: "doc" },
    ],
  },
  {
    group: "วางแผน",
    items: [
      { href: "/calendar", label: "ปฏิทิน", icon: "calendar" },
      { href: "/notifications", label: "แจ้งเตือน", icon: "bell" },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { href: "/settings", label: "ตั้งค่า", icon: "gear" };

// Bottom nav (mobile): ภาพรวม · เงิน · + · ปฏิทิน · อื่น ๆ
export const MAIN_MOBILE_ROUTES = ["/", "/money", "/calendar"];

export const PAGE_TITLES: Record<string, string> = {
  "/": "ภาพรวมวันนี้",
  "/money": "เงินและบัญชี",
  "/stats": "สรุป & สถิติ",
  "/bills": "บิล & บัตรเครดิต",
  "/trips": "ทริป & หารเงินกับเพื่อน",
  "/forecast": "คาดการณ์กระแสเงินสด",
  "/assets": "ทรัพย์สิน & ประกัน",
  "/vehicle": "รถยนต์",
  "/home": "บ้าน",
  "/docs": "คลังเอกสาร",
  "/calendar": "ปฏิทิน",
  "/notifications": "ศูนย์แจ้งเตือน",
  "/search": "ค้นหา",
  "/settings": "ตั้งค่า",
};
