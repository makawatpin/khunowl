import type { Metadata } from "next";
import { GreetPanel } from "./greet-panel";
import { AuthForm } from "./auth-form";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "เข้าสู่ระบบ · KhunOwl" };

export default function LoginPage() {
  return (
    <div className={styles.wrap}>
      <GreetPanel />
      <section className={styles.side}>
        <AuthForm mode="login" />
      </section>
    </div>
  );
}
