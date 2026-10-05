"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field } from "@/components/ui/form-modal";
import { setPinHash } from "@/lib/actions/prefs";
import { pinHash } from "@/lib/domain/pin";
import { useToast } from "@/components/providers/toast-provider";

export function PinSetupForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [pending, setPending] = useState(false);

  const valid = /^\d{4}$/.test(a) && a === b;

  const handleSave = async () => {
    setPending(true);
    await setPinHash(pinHash(a));
    sessionStorage.setItem("los:unlocked", "1");
    setPending(false);
    onClose();
    router.refresh();
    show("ตั้ง PIN แล้ว");
  };

  return (
    <FormModal title="ตั้งรหัส PIN" onClose={onClose} onSave={handleSave} valid={valid} pending={pending}>
      <Field label="PIN 4 หลัก">
        <input type="password" inputMode="numeric" maxLength={4} value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ""))} autoFocus />
      </Field>
      <Field label="ยืนยัน PIN">
        <input type="password" inputMode="numeric" maxLength={4} value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ""))} />
      </Field>
      {b.length === 4 && a !== b && <p className="hint" style={{ color: "var(--neg)" }}>PIN ไม่ตรงกัน</p>}
      <p className="hint">ถ้าลืม PIN กด &ldquo;ออกจากระบบ&rdquo; ที่หน้าล็อกแล้วเข้าสู่ระบบใหม่ด้วยอีเมล/รหัสผ่านได้ จากนั้นปิดการล็อกในหน้าตั้งค่า</p>
    </FormModal>
  );
}
