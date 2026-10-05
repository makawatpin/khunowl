"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { saveProperty } from "@/lib/actions/properties";
import { HOME_KINDS } from "@/lib/domain/things";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export interface PropertyFormInitial {
  name: string;
  kind: string | null;
  size: string | null;
  monthlyRent: number | null;
  since: string | null;
}

export function PropertyForm({ initial, onClose }: { initial?: PropertyFormInitial; onClose: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState(initial?.kind ?? HOME_KINDS[0]);
  const [size, setSize] = useState(initial?.size ?? "");
  const [monthlyRent, setMonthlyRent] = useState(initial?.monthlyRent != null ? String(initial.monthlyRent) : "");
  const [since, setSince] = useState(initial?.since ?? todayISOInBangkok());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("kind", kind);
    fd.set("size", size);
    fd.set("monthlyRent", monthlyRent || "0");
    fd.set("since", since);
    const res = await saveProperty(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("บันทึกข้อมูลบ้านแล้ว");
  };

  return (
    <FormModal title="ข้อมูลบ้าน" onClose={onClose} onSave={handleSave} valid={valid} pending={pending}>
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อ">
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <FieldGrid>
        <Field label="สถานะ">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {HOME_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="ขนาด">
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="32 ตร.ม." />
        </Field>
        <Field label={kind === "ผ่อน" ? "ค่างวด/เดือน" : "ค่าเช่า/เดือน"}>
          <input value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="อยู่ตั้งแต่">
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        </Field>
      </FieldGrid>
    </FormModal>
  );
}
