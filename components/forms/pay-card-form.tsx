"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field } from "@/components/ui/form-modal";
import { payCard, undoPayCard } from "@/lib/actions/cards";
import { useToast } from "@/components/providers/toast-provider";
import { usePrefs } from "@/components/providers/prefs-provider";
import { formatMoney } from "@/lib/format/money";

export interface PayCardTarget {
  id: string;
  name: string;
  used: number;
  minPayment: number;
  dueDate: string | null;
}

export function PayCardForm({
  card,
  accounts,
  onClose,
}: {
  card: PayCardTarget;
  accounts: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const { hide } = usePrefs();
  const [mode, setMode] = useState<"full" | "min" | "custom">("full");
  const [custom, setCustom] = useState("");
  const [from, setFrom] = useState(accounts[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = useMemo(() => {
    if (mode === "full") return card.used;
    if (mode === "min") return Math.min(card.minPayment, card.used);
    return parseFloat(custom.replace(/,/g, "")) || 0;
  }, [mode, custom, card]);

  const valid = amount > 0 && !!from;

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const res = await payCard(card.id, amount, from);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.txnId) {
      const { txnId, prevDueDate, prevStatementDate } = res;
      show(`ชำระ ${card.name} ${formatMoney(amount, hide)} แล้ว`, async () => {
        await undoPayCard(txnId, card.id, prevDueDate, prevStatementDate);
      });
    }
  };

  return (
    <FormModal title={`ชำระ ${card.name}`} onClose={onClose} onSave={handleSave} valid={valid} pending={pending} saveLabel={`ชำระ ${formatMoney(amount, hide)}`}>
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <div className="seg" style={{ marginBottom: 14 }}>
        {([
          ["full", "เต็มจำนวน"],
          ["min", "ขั้นต่ำ"],
          ["custom", "ระบุเอง"],
        ] as const).map(([k, l]) => (
          <button key={k} type="button" className={mode === k ? "on" : ""} onClick={() => setMode(k)}>
            {l}
          </button>
        ))}
      </div>
      {mode === "custom" ? (
        <Field label="จำนวนเงิน">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} inputMode="decimal" autoFocus />
        </Field>
      ) : (
        <div className="num" style={{ fontSize: 30, fontWeight: 600, margin: "0 0 14px" }}>
          {formatMoney(amount, hide)}
        </div>
      )}
      <Field label="จ่ายจากบัญชี">
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </Field>
      <dl className="dl">
        <dt>ยอดค้าง</dt>
        <dd>{formatMoney(card.used, hide)}</dd>
        <dt>ขั้นต่ำ</dt>
        <dd>{formatMoney(card.minPayment, hide)}</dd>
        {card.dueDate && (
          <>
            <dt>กำหนดชำระ</dt>
            <dd>{card.dueDate}</dd>
          </>
        )}
      </dl>
    </FormModal>
  );
}
