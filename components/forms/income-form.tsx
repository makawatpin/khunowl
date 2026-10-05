"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createRecurringIncome, deleteRecurringIncome, updateRecurringIncome } from "@/lib/actions/income";
import { useToast } from "@/components/providers/toast-provider";

export interface IncomeFormInitial {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  accountId: string;
}

export function IncomeForm({
  initial,
  accounts,
  onClose,
}: {
  initial?: IncomeFormInitial;
  accounts: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "เงินเดือน");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [dayOfMonth, setDayOfMonth] = useState(String(initial?.dayOfMonth ?? 25));
  const [accountId, setAccountId] = useState(initial?.accountId ?? accounts[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0 && parseFloat(amount) > 0 && !!accountId;

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("amount", amount);
    fd.set("dayOfMonth", String(Math.min(31, Math.max(1, parseInt(dayOfMonth) || 1))));
    fd.set("accountId", accountId);
    if (initial) {
      const res = await updateRecurringIncome(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกแล้ว");
      return;
    }
    const res = await createRecurringIncome(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("เพิ่มรายรับประจำแล้ว", async () => {
        await deleteRecurringIncome(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteRecurringIncome(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขรายรับประจำ" : "เพิ่มรายรับประจำ"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อ">
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <FieldGrid>
        <Field label="จำนวน">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="เข้าทุกวันที่">
          <input value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={2} />
        </Field>
      </FieldGrid>
      <Field label="เข้าบัญชี">
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </Field>
    </FormModal>
  );
}
