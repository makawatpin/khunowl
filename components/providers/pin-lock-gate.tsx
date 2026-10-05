"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { pinHash } from "@/lib/domain/pin";

const UNLOCK_KEY = "los:unlocked";
const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

/** Deters shoulder-surfing only (README §5: "ไม่ใช่ security boundary" — real auth is
 * Supabase Auth + RLS). Gates the whole app shell client-side; `pinHash` is the stored hash
 * or null when the user hasn't set a PIN, in which case this renders children immediately. */
export function PinLockGate({ pinHash: storedHash, children }: { pinHash: string | null; children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(true);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!storedHash) {
      setUnlocked(true);
      return;
    }
    // A fresh password sign-in (see signInAction) sets this cookie to skip the PIN once —
    // without it, logging back out and in after forgetting a PIN would just hit the same lock.
    if (document.cookie.includes("los_skip_pin=1")) {
      document.cookie = "los_skip_pin=; Max-Age=0; path=/";
      sessionStorage.setItem(UNLOCK_KEY, "1");
      setUnlocked(true);
      return;
    }
    setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === "1");
  }, [storedHash]);

  const press = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setErr(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (pinHash(next) === storedHash) {
          sessionStorage.setItem(UNLOCK_KEY, "1");
          setUnlocked(true);
        } else {
          setErr(true);
          setPin("");
        }
      }, 120);
    }
  };

  useEffect(() => {
    if (unlocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, pin]);

  if (unlocked) return <>{children}</>;

  return (
    <div className="lock">
      <div className="side-brand" style={{ color: "var(--ink)", justifyContent: "center", flexDirection: "column", gap: 12, fontSize: 22 }}>
        <Image className="brand-icon" src="/icons/icon-192.png" alt="" width={72} height={72} style={{ borderRadius: 18 }} />
        KhunOwl
      </div>
      <div style={{ color: err ? "var(--neg)" : "var(--ink-soft)", fontSize: 14 }}>{err ? "PIN ไม่ถูกต้อง ลองใหม่" : "ใส่ PIN เพื่อเข้าใช้งาน"}</div>
      <div className="pin-dots">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < pin.length ? "on" : ""} />
        ))}
      </div>
      <div className="pin-pad">
        {PAD_KEYS.map((k, i) =>
          k ? (
            <button key={i} onClick={() => (k === "⌫" ? setPin((p) => p.slice(0, -1)) : press(k))} aria-label={k === "⌫" ? "ลบ" : k}>
              {k}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      <form action="/auth/signout" method="post">
        <button type="submit" className="link-btn" style={{ margin: "0 auto" }}>ลืม PIN? ออกจากระบบ</button>
      </form>
    </div>
  );
}
