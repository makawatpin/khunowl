"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { Avatar, type TripPerson } from "@/components/ui/avatar";
import { usePrefs } from "@/components/providers/prefs-provider";
import { Icon } from "@/components/ui/icon";
import { createTripSettlement } from "@/lib/actions/trip-settlements";
import { fmtC } from "@/lib/domain/trips";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export function TripSettleForm({
  tripId,
  from,
  to,
  amount,
  currency,
  rate,
  meId,
  accounts,
  onClose,
}: {
  tripId: string;
  from: TripPerson;
  to: TripPerson;
  amount: number;
  currency: string;
  rate: number;
  meId: string;
  accounts: { id: string; name: string }[];
  onClose: () => void;
}) {
  const { hide } = usePrefs();
  const router = useRouter();
  const { show } = useToast();
  const [amt, setAmt] = useState(String(amount));
  const [date, setDate] = useState(todayISOInBangkok());
  const [paySrc, setPaySrc] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mine = from.id === meId || to.id === meId;
  const a = parseFloat(amt) || 0;
  const thb = Math.round(a * rate * 100) / 100;
  const valid = a > 0;

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("from", from.id);
    fd.set("to", to.id);
    fd.set("amount", amt);
    fd.set("date", date);
    if (mine && paySrc) fd.set("paySrc", paySrc);
    const res = await createTripSettlement(tripId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show(`${from.name} → ${to.name} เคลียร์แล้ว`);
  };

  return (
    <FormModal title="บันทึกว่าเคลียร์แล้ว" saveLabel="เคลียร์แล้ว" valid={valid} pending={pending} onClose={onClose} onSave={handleSave}>
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "4px 0 18px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 70 }}>
          <Avatar person={from} size={48} />
          <span style={{ fontSize: 14 }}>{from.name}</span>
        </div>
        <Icon name="arrow" size={22} color="var(--ink-faint)" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 70 }}>
          <Avatar person={to} size={48} />
          <span style={{ fontSize: 14 }}>{to.name}</span>
        </div>
      </div>
      <FieldGrid>
        <Field label={`จำนวน (${currency})`}>
          <input className="num" value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="วันที่">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </FieldGrid>
      {currency !== "THB" && <div className="hint" style={{ margin: "-6px 2px 14px" }}>≈ {fmtC(thb, "THB", hide)}</div>}
      {mine && (
        <Field label={from.id === meId ? "บันทึกเป็นรายจ่ายจากบัญชี" : "บันทึกเป็นรายรับเข้าบัญชี"}>
          <select value={paySrc} onChange={(e) => setPaySrc(e.target.value)}>
            <option value="">ไม่บันทึกลงบัญชี</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      )}
      {a < amount - 0.01 && <div className="hint">จ่ายบางส่วน ยอดที่เหลือจะยังอยู่ในรายการต้องโอน</div>}
    </FormModal>
  );
}
