"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActRow } from "@/components/ui/act-row";
import { Money } from "@/components/ui/money";
import { BillForm, type BillFormInitial } from "@/components/forms/bill-form";
import { payBillNow, undoPayBill } from "@/lib/actions/bills";
import { useToast } from "@/components/providers/toast-provider";
import { usePrefs } from "@/components/providers/prefs-provider";
import { formatMoney } from "@/lib/format/money";
import { CYCLE_MONTHS, daysTo } from "@/lib/domain/dates";
import { todayISOInBangkok } from "@/lib/dates/today";
import { CYCLE_LABEL } from "@/lib/i18n/th";
import { dShort } from "@/lib/format/date";

export interface BillItem extends BillFormInitial {
  accountName: string;
  lastPaid: string | null;
}

export function BillsTab({ bills, accounts }: { bills: BillItem[]; accounts: { id: string; name: string }[] }) {
  const router = useRouter();
  const { show } = useToast();
  const { hide } = usePrefs();
  const [openForm, setOpenForm] = useState<"new" | BillItem | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const todayISO = todayISOInBangkok();

  const sorted = [...bills].sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1));
  const monthlyTotal = bills.reduce((s, b) => s + b.amount / (CYCLE_MONTHS[b.cycle] || 1), 0);
  const dueSoonTotal = bills.filter((b) => daysTo(b.nextDue, todayISO) <= 7).reduce((s, b) => s + b.amount, 0);
  const autoCount = bills.filter((b) => b.autoDebit).length;

  const handlePay = async (bill: BillItem) => {
    setPayingId(bill.id);
    const res = await payBillNow(bill.id);
    setPayingId(null);
    if (res.error) {
      show(res.error);
      return;
    }
    router.refresh();
    if (res.txnId && res.prevDue) {
      const { txnId, prevDue, prevLastPaid } = res;
      show(`จ่าย ${bill.name} ${formatMoney(bill.amount, hide)} แล้ว`, async () => {
        await undoPayBill(txnId, bill.id, prevDue, prevLastPaid ?? null);
      });
    }
  };

  return (
    <>
      <div className="grid g3" style={{ marginBottom: 6 }}>
        <div className="card card-pad">
          <div className="cap">ค่าใช้จ่ายประจำ/เดือน</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}><Money value={monthlyTotal} /></div>
        </div>
        <div className="card card-pad">
          <div className="cap">ครบกำหนดใน 7 วัน</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: "var(--neg)" }}><Money value={dueSoonTotal} /></div>
        </div>
        <div className="card card-pad">
          <div className="cap">ตัดอัตโนมัติ</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{autoCount} / {bills.length}</div>
        </div>
      </div>
      <div className="sec">
        <h2>เรียงตามวันครบกำหนด</h2>
        <button className="more" onClick={() => setOpenForm("new")}>+ เพิ่มบิล</button>
      </div>
      <div className="card list">
        {sorted.length ? (
          sorted.map((b) => (
            <ActRow
              key={b.id}
              icon="clock"
              title={b.name}
              sub={`${CYCLE_LABEL[b.cycle]} · ${b.autoDebit ? "ตัดอัตโนมัติ" : "จ่ายเอง"} · ${b.accountName}${b.lastPaid ? ` · จ่ายล่าสุด ${dShort(b.lastPaid)}` : ""}`}
              amount={b.amount}
              due={b.nextDue}
              btn={payingId === b.id ? "กำลังจ่าย…" : "จ่าย"}
              onBtn={() => handlePay(b)}
              onClick={() => setOpenForm(b)}
            />
          ))
        ) : (
          <div className="empty">ยังไม่มีบิล</div>
        )}
      </div>
      <p className="hint">กด &ldquo;จ่าย&rdquo; ระบบจะหักเงินจากบัญชีที่ผูกไว้ บันทึกรายจ่าย และเลื่อนไปงวดถัดไปให้ (กดเลิกทำได้)</p>
      {openForm === "new" && <BillForm accounts={accounts} onClose={() => setOpenForm(null)} />}
      {openForm && openForm !== "new" && <BillForm initial={openForm} accounts={accounts} onClose={() => setOpenForm(null)} />}
    </>
  );
}
