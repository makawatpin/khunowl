"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createBill, deleteBill, updateBill } from "@/lib/actions/bills";
import { useToast } from "@/components/providers/toast-provider";
import { CYCLE_LABEL } from "@/lib/i18n/th";
import type { Database } from "@/lib/db.types";

type Cycle = Database["public"]["Enums"]["cycle_t"];
const CYCLES: Cycle[] = ["monthly", "quarterly", "semiannual", "yearly"];

export interface BillFormInitial {
  id: string;
  name: string;
  domain: string | null;
  amount: number;
  cycle: Cycle;
  nextDue: string;
  accountId: string;
  autoDebit: boolean;
}

export function BillForm({
  initial,
  accounts,
  onClose,
}: {
  initial?: BillFormInitial;
  accounts: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [cycle, setCycle] = useState<Cycle>(initial?.cycle ?? "monthly");
  const [nextDue, setNextDue] = useState(initial?.nextDue ?? "");
  const [accountId, setAccountId] = useState(initial?.accountId ?? accounts[0]?.id ?? "");
  const [autoDebit, setAutoDebit] = useState(initial?.autoDebit ?? false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0 && parseFloat(amount.replace(/,/g, "")) > 0 && !!nextDue && !!accountId;

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("domain", domain);
    fd.set("amount", amount);
    fd.set("cycle", cycle);
    fd.set("nextDue", nextDue);
    fd.set("accountId", accountId);
    if (autoDebit) fd.set("autoDebit", "on");
    if (initial) {
      const res = await updateBill(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกบิลแล้ว");
      return;
    }
    const res = await createBill(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("เพิ่มบิลแล้ว", async () => {
        await deleteBill(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteBill(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบบิลแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขบิล" : "เพิ่มบิล / ค่าใช้จ่ายประจำ"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อบิล">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ค่าไฟ MEA" autoFocus />
      </Field>
      <Field label="เว็บไซต์ (ใช้ดึงโลโก้)">
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mea.or.th" autoCapitalize="none" />
      </Field>
      <FieldGrid>
        <Field label="จำนวนเงิน">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="รอบ">
          <select value={cycle} onChange={(e) => setCycle(e.target.value as Cycle)}>
            {CYCLES.map((c) => (
              <option key={c} value={c}>{CYCLE_LABEL[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="ครบกำหนดครั้งถัดไป">
          <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
        </Field>
        <Field label="จ่ายจาก">
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      </FieldGrid>
      <label className="check">
        <input type="checkbox" checked={autoDebit} onChange={(e) => setAutoDebit(e.target.checked)} />
        ตัดบัญชีอัตโนมัติ (ระบบบันทึกให้เมื่อถึงวัน)
      </label>
    </FormModal>
  );
}
