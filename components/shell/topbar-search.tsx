"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";

/** Controlled search input only — mobile show/hide toggle lives in AppShell
 * (it needs to add the "searching" class to the surrounding .topbar-actions). */
export function TopbarSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(pathname === "/search" ? (searchParams.get("q") ?? "") : "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (pathname === "/search") setQ(searchParams.get("q") ?? "");
  }, [pathname, searchParams]);

  const handleChange = (value: string) => {
    setQ(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) router.push(`/search?q=${encodeURIComponent(value)}`);
      else if (pathname === "/search") router.push("/search");
    }, 250);
  };

  return (
    <div className="searchbox">
      <Icon name="search" size={15} color="var(--ink-faint)" />
      <input value={q} onChange={(e) => handleChange(e.target.value)} placeholder="ค้นหาทุกอย่าง" />
    </div>
  );
}
