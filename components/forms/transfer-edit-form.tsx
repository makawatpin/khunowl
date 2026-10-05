"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field } from "@/components/ui/form-modal";
import { deleteTransfer } from "@/lib/actions/transactions";
import { useToast } from "@/components/providers/toast-provider";
import { formatMoney } from "@/lib/format/money";
import { usePrefs } from "@/components/providers/prefs-provider";

export interface TransferEditTxn {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  srcId: string | null;
  toId: string | null;
}

/** Transfers show the same fields as creation but read-only — editing amount/accounts
 * after the fact would desync the two account balances, so this view is delete-only. */
export function TransferEditForm({
  txn,
  accounts,
  onClose,
}: {
  txn: TransferEditTxn;
  accounts: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const { hide } = usePrefs();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const srcName = accounts.find((a) => a.id === txn.srcId)?.name ?? "—";
  const toName = accounts.find((a) => a.id === txn.toId)?.name ?? "—";

  const handleDelete = async () => {
    setPending(true);
    const res = await deleteTransfer(txn.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบรายการโอนแล้ว");
  };

  return (
    <FormModal title="รายการโอน" onClose={onClose} onSave={onClose} onDelete={handleDelete} pending={pending} saveLabel="ปิด">
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <dl className="dl">
        <dt>จาก</dt>
        <dd>{srcName}</dd>
        <dt>ไปยัง</dt>
        <dd>{toName}</dd>
        <dt>จำนวนเงิน</dt>
        <dd>{formatMoney(txn.amount, hide)}</dd>
        <dt>วันที่</dt>
        <dd>{txn.date}</dd>
      </dl>
      {txn.note && <Field label="โน้ต"><input value={txn.note} readOnly /></Field>}
    </FormModal>
  );
}
