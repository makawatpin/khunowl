import type { Metadata } from "next";
import { GreetPanel } from "../login/greet-panel";
import { AuthForm } from "../login/auth-form";
import styles from "../login/login.module.css";

export const metadata: Metadata = { title: "สร้างบัญชีใหม่ · KhunOwl" };

export default function SignupPage() {
  return (
    <div className={styles.wrap}>
      <GreetPanel />
      <section className={styles.side}>
        <AuthForm mode="signup" />
      </section>
    </div>
  );
}
