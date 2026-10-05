"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createTransfer, deleteTransfer } from "@/lib/actions/transactions";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export function TransferForm({ accounts, onClose }: { accounts: { id: string; name: string }[]; onClose: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const [srcAccountId, setSrcAccountId] = useState(accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISOInBangkok());
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = parseFloat(amount.replace(/,/g, "")) > 0 && !!srcAccountId && !!toAccountId && srcAccountId !== toAccountId;

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("srcAccountId", srcAccountId);
    fd.set("toAccountId", toAccountId);
    fd.set("amount", amount);
    fd.set("date", date);
    fd.set("note", note);
    const res = await createTransfer(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("บันทึกการโอนแล้ว", async () => {
        await deleteTransfer(id);
      });
    }
  };

  return (
    <FormModal title="โอนเงินระหว่างบัญชี" onClose={onClose} onSave={handleSave} valid={valid} pending={pending}>
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <FieldGrid>
        <Field label="จาก">
          <select value={srcAccountId} onChange={(e) => setSrcAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
        <Field label="ไปยัง">
          <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      </FieldGrid>
      <FieldGrid>
        <Field label="จำนวนเงิน">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" autoFocus />
        </Field>
        <Field label="วันที่">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label="โน้ต">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ไม่บังคับ" />
      </Field>
    </FormModal>
  );
}
