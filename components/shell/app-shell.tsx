"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  MAIN_MOBILE_ROUTES,
  NAV,
  PAGE_TITLES,
  SETTINGS_ITEM,
  type NavItem,
} from "@/lib/nav/config";
import { usePrefs } from "@/components/providers/prefs-provider";
import { useQuickAdd } from "@/components/providers/quick-add-provider";
import { ProcessDueTrigger } from "@/components/providers/process-due-trigger";
import { TopbarSearch } from "@/components/shell/topbar-search";

const MOBILE_TABS: (NavItem | { href: "+"; label: ""; icon: "plus" })[] = [
  { href: "/", label: "ภาพรวม", icon: "home" },
  { href: "/money", label: "เงิน", icon: "money" },
  { href: "+", label: "", icon: "plus" },
  { href: "/calendar", label: "ปฏิทิน", icon: "calendar" },
  { href: "more" as "+", label: "อื่น ๆ", icon: "more" },
];

export function AppShell({ children, notiCount = 0 }: { children: React.ReactNode; notiCount?: number }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mSearch, setMSearch] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
  const title = PAGE_TITLES[pathname] ?? "";
  const moreActive = !MAIN_MOBILE_ROUTES.includes(pathname) && pathname !== "/settings";
  const { hide, toggleHide } = usePrefs();
  const { open: openQuickAdd } = useQuickAdd();

  return (
    <div className="los">
      <ProcessDueTrigger />
      <nav className="side">
        <Link href="/" className="side-brand">
          <Image className="brand-icon" src="/icons/icon-192.png" alt="" width={32} height={32} />
          <span className="side-label">KhunOwl</span>
        </Link>
        {NAV.map((g) => (
          <div className="side-group" key={g.group || "root"}>
            {g.group && <div className="side-cap">{g.group}</div>}
            {g.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={"side-item" + (isActive(it.href) ? " on" : "")}
                title={it.label}
              >
                <Icon name={it.icon} size={18} />
                <span className="side-label">{it.label}</span>
                {it.href === "/notifications" && notiCount > 0 && <span className="badge red">{notiCount}</span>}
              </Link>
            ))}
          </div>
        ))}
        <div className="side-foot">
          <button
            className="btn btn-accent"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={() => openQuickAdd()}
            title="เพิ่มรายการ"
          >
            <Icon name="plus" size={16} color="#fff" />
            <span className="side-label">เพิ่มรายการ</span>
          </button>
          <Link
            href={SETTINGS_ITEM.href}
            className={"side-item" + (isActive(SETTINGS_ITEM.href) ? " on" : "")}
            title={SETTINGS_ITEM.label}
          >
            <Icon name={SETTINGS_ITEM.icon} size={18} />
            <span className="side-label">{SETTINGS_ITEM.label}</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="side-item" title="ออกจากระบบ">
              <Icon name="lock" size={18} />
              <span className="side-label">ออกจากระบบ</span>
            </button>
          </form>
        </div>
      </nav>

      <div className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className={"topbar-actions" + (mSearch ? " searching" : "")}>
            <button className="btn only-mobile icon-btn" onClick={() => setMSearch((v) => !v)} aria-label="ค้นหา">
              <Icon name={mSearch ? "x" : "search"} size={16} />
            </button>
            <Suspense fallback={<div className="searchbox" />}>
              <TopbarSearch />
            </Suspense>
            <button
              className="btn icon-btn"
              onClick={toggleHide}
              aria-label={hide ? "แสดงยอดเงิน" : "ซ่อนยอดเงิน"}
              title={hide ? "แสดงยอดเงิน" : "ซ่อนยอดเงิน"}
            >
              <Icon name={hide ? "eyeoff" : "eye"} size={16} />
            </button>
            <button className="btn btn-primary desk-only" onClick={() => openQuickAdd()} style={{ display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
              <Icon name="plus" size={16} color="#fff" />
              เพิ่มรายการ
            </button>
            <Link href="/notifications" className="btn icon-btn" aria-label="แจ้งเตือน" style={{ gap: 6 }}>
              <Icon name="bell" size={16} />
              {notiCount > 0 && <span className="badge red">{notiCount}</span>}
            </Link>
          </div>
        </header>
        <main className="content" key={pathname}>
          {children}
        </main>
      </div>

      <nav className="botnav">
        {MOBILE_TABS.map((t) =>
          t.href === "+" ? (
            <button key="+" aria-label="เพิ่มรายการ" onClick={() => openQuickAdd()}>
              <span className="plus">
                <Icon name="plus" size={22} color="#fff" />
              </span>
            </button>
          ) : t.href === "more" ? (
            <button
              key="more"
              className={moreActive ? "on" : ""}
              onClick={() => setMoreOpen(true)}
            >
              <Icon name={t.icon} size={20} />
              {t.label}
              {notiCount > 0 && <span className="nav-dot" />}
            </button>
          ) : (
            <Link key={t.href} href={t.href} className={isActive(t.href) ? "on" : ""}>
              <Icon name={t.icon} size={20} />
              {t.label}
            </Link>
          ),
        )}
      </nav>

      {moreOpen && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && setMoreOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ flex: 1 }}>เมนูทั้งหมด</h3>
              <button className="btn" onClick={() => setMoreOpen(false)} style={{ padding: "6px 9px" }}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="modal-body">
              {NAV.slice(1).map((g) => (
                <div key={g.group} style={{ marginBottom: 14 }}>
                  <div className="cap" style={{ margin: "0 4px 8px" }}>
                    {g.group}
                  </div>
                  <div className="more-grid">
                    {g.items
                      .filter((it) => !MAIN_MOBILE_ROUTES.includes(it.href))
                      .map((it) => (
                        <Link
                          key={it.href}
                          href={it.href}
                          className={"more-item" + (isActive(it.href) ? " on" : "")}
                          onClick={() => setMoreOpen(false)}
                        >
                          <Icon name={it.icon} size={20} />
                          <span>{it.label}</span>
                          {it.href === "/notifications" && notiCount > 0 && <span className="badge red">{notiCount}</span>}
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div className="cap" style={{ margin: "0 4px 8px" }}>
                  อื่น ๆ
                </div>
                <div className="more-grid">
                  <Link
                    href={SETTINGS_ITEM.href}
                    className={"more-item" + (isActive(SETTINGS_ITEM.href) ? " on" : "")}
                    onClick={() => setMoreOpen(false)}
                  >
                    <Icon name={SETTINGS_ITEM.icon} size={20} />
                    <span>{SETTINGS_ITEM.label}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
