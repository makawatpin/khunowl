"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, signUpAction, type AuthActionState } from "@/lib/actions/auth";
import styles from "./login.module.css";

const COPY = {
  login: {
    title: "เข้าสู่ระบบ",
    sub: "กลับมาดูภาพรวมชีวิตของคุณกันต่อ",
    submit: "เข้าสู่ระบบ",
    switchText: "ยังไม่มีบัญชี?",
    switchHref: "/signup",
    switchLabel: "สร้างบัญชีใหม่",
  },
  signup: {
    title: "สร้างบัญชีใหม่",
    sub: "เริ่มจัดการเงิน ทรัพย์สิน และบ้านของคุณ",
    submit: "สร้างบัญชี",
    switchText: "มีบัญชีอยู่แล้ว?",
    switchHref: "/login",
    switchLabel: "เข้าสู่ระบบ",
  },
} as const;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(action, null);
  const copy = COPY[mode];

  if (state && "sent" in state) {
    return (
      <div className={styles.card}>
        <div className={styles.success}>
          <div className={styles.ring}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5 9 18 20 6" />
            </svg>
          </div>
          <h1 style={{ textAlign: "center" }}>ส่งอีเมลยืนยันแล้ว</h1>
          <p className={styles.sub} style={{ textAlign: "center" }}>
            กดลิงก์ยืนยันในอีเมลเพื่อเริ่มใช้งาน
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1>{copy.title}</h1>
      <p className={styles.sub}>{copy.sub}</p>
      {state && "error" in state && <div className={styles.error}>{state.error}</div>}
      <form action={formAction}>
        <div className={styles.field}>
          <label>อีเมล</label>
          <input type="email" name="email" placeholder="you@email.com" required autoComplete="email" />
        </div>
        <div className={styles.field}>
          <label>รหัสผ่าน</label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
        <button type="submit" className={styles.btnLogin} disabled={pending}>
          {pending ? "กำลังดำเนินการ..." : copy.submit}
        </button>
      </form>
      <div className={styles.or}>หรือ</div>
      <button type="button" className={styles.btnAlt} disabled title="เร็ว ๆ นี้">
        เข้าสู่ระบบด้วย Google (เร็ว ๆ นี้)
      </button>
      <div className={styles.switchLine}>
        {copy.switchText} <Link href={copy.switchHref}>{copy.switchLabel}</Link>
      </div>
    </div>
  );
}
