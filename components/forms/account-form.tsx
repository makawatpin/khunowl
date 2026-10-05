"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createAccount, deleteAccount, updateAccount } from "@/lib/actions/accounts";
import { BANK_OPTIONS } from "@/lib/domain/banks";
import { ACCOUNT_TYPE_LABEL } from "@/lib/i18n/th";
import { useToast } from "@/components/providers/toast-provider";
import type { Database } from "@/lib/db.types";

type AccountType = Database["public"]["Enums"]["account_type"];
const TYPES: AccountType[] = ["savings", "checking", "ewallet", "cash", "investment"];

export interface AccountFormInitial {
  id: string;
  name: string;
  bank: string | null;
  type: AccountType;
  balance: number;
  last4: string | null;
}

export function AccountForm({ initial, onClose }: { initial?: AccountFormInitial; onClose: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [bank, setBank] = useState(initial?.bank ?? "kbank");
  const [type, setType] = useState<AccountType>(initial?.type ?? "savings");
  const [balance, setBalance] = useState(initial ? String(initial.balance) : "");
  const [last4, setLast4] = useState(initial?.last4 ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;

  const buildFormData = () => {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("bank", bank);
    fd.set("type", type);
    fd.set("balance", balance || "0");
    fd.set("last4", last4);
    return fd;
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = buildFormData();
    if (initial) {
      const res = await updateAccount(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกบัญชีแล้ว");
      return;
    }
    const res = await createAccount(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("เพิ่มบัญชีแล้ว", async () => {
        await deleteAccount(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteAccount(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบบัญชีแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขบัญชี" : "เพิ่มบัญชี"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อบัญชี">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="กสิกร เงินเดือน" autoFocus />
      </Field>
      <FieldGrid>
        <Field label="ธนาคาร">
          <select value={bank} onChange={(e) => setBank(e.target.value)}>
            {BANK_OPTIONS.map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="ประเภท">
          <select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{ACCOUNT_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="ยอดคงเหลือ (บาท)">
          <input value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" placeholder="0" />
        </Field>
        <Field label="เลขท้าย 4 หลัก">
          <input value={last4} onChange={(e) => setLast4(e.target.value)} inputMode="numeric" maxLength={4} placeholder="ไม่บังคับ" />
        </Field>
      </FieldGrid>
    </FormModal>
  );
}
