"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createCard, deleteCard, updateCard } from "@/lib/actions/cards";
import { BANK_OPTIONS } from "@/lib/domain/banks";
import { useToast } from "@/components/providers/toast-provider";

const NETWORKS = ["VISA", "Mastercard", "JCB", "UnionPay", "AMEX"];

export interface CardFormInitial {
  id: string;
  name: string;
  bank: string | null;
  network: string | null;
  last4: string | null;
  creditLimit: number;
  used: number;
  statementDate: string | null;
  dueDate: string | null;
  minPayment: number;
}

export function CardForm({ initial, onClose }: { initial?: CardFormInitial; onClose: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [bank, setBank] = useState(initial?.bank ?? "ktc");
  const [network, setNetwork] = useState(initial?.network ?? "VISA");
  const [last4, setLast4] = useState(initial?.last4 ?? "");
  const [creditLimit, setCreditLimit] = useState(initial ? String(initial.creditLimit) : "");
  const [used, setUsed] = useState(initial ? String(initial.used) : "");
  const [statementDate, setStatementDate] = useState(initial?.statementDate ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [minPayment, setMinPayment] = useState(initial ? String(initial.minPayment) : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0 && parseFloat(creditLimit) > 0;

  const buildFormData = () => {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("bank", bank);
    fd.set("network", network);
    fd.set("last4", last4);
    fd.set("creditLimit", creditLimit);
    fd.set("used", used || "0");
    fd.set("statementDate", statementDate);
    fd.set("dueDate", dueDate);
    fd.set("minPayment", minPayment);
    return fd;
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = buildFormData();
    if (initial) {
      const res = await updateCard(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกบัตรแล้ว");
      return;
    }
    const res = await createCard(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("เพิ่มบัตรแล้ว", async () => {
        await deleteCard(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteCard(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบบัตรแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขบัตรเครดิต" : "เพิ่มบัตรเครดิต"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อบัตร">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="KTC Visa Platinum" autoFocus />
      </Field>
      <FieldGrid>
        <Field label="ผู้ออกบัตร">
          <select value={bank} onChange={(e) => setBank(e.target.value)}>
            {BANK_OPTIONS.map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="เครือข่าย">
          <select value={network} onChange={(e) => setNetwork(e.target.value)}>
            {NETWORKS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Field label="วงเงิน (บาท)">
          <input value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="ยอดใช้ปัจจุบัน">
          <input value={used} onChange={(e) => setUsed(e.target.value)} inputMode="decimal" placeholder="0" />
        </Field>
        <Field label="วันสรุปยอด">
          <input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
        </Field>
        <Field label="กำหนดชำระ">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="ขั้นต่ำ (บาท)">
          <input value={minPayment} onChange={(e) => setMinPayment(e.target.value)} inputMode="decimal" placeholder="8% อัตโนมัติ" />
        </Field>
        <Field label="เลขท้าย 4 หลัก">
          <input value={last4} onChange={(e) => setLast4(e.target.value)} inputMode="numeric" maxLength={4} />
        </Field>
      </FieldGrid>
    </FormModal>
  );
}
