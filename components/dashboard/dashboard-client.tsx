"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Money } from "@/components/ui/money";
import { ActRow } from "@/components/ui/act-row";
import { payBillNow, undoPayBill } from "@/lib/actions/bills";
import { useToast } from "@/components/providers/toast-provider";
import { usePrefs } from "@/components/providers/prefs-provider";
import { useQuickAdd } from "@/components/providers/quick-add-provider";
import { formatMoney } from "@/lib/format/money";
import type { UpcomingPayment } from "@/lib/domain/forecast";
import { PayCardForm } from "@/components/forms/pay-card-form";

export function DashboardClient({
  greeting,
  dateLabel,
  totalBalance,
  accountCount,
  cardDebt,
  forecastEnd,
  forecastOut,
  forecastInc,
  forecastStart,
  payments,
  accounts,
  cardLookup,
}: {
  greeting: string;
  dateLabel: string;
  totalBalance: number;
  accountCount: number;
  cardDebt: number;
  forecastEnd: number;
  forecastOut: number;
  forecastInc: number;
  forecastStart: number;
  payments: UpcomingPayment[];
  accounts: { id: string; name: string }[];
  cardLookup: Record<string, { id: string; name: string; used: number; minPayment: number; dueDate: string | null }>;
}) {
  const router = useRouter();
  const { show } = useToast();
  const { hide } = usePrefs();
  const { open } = useQuickAdd();
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [payingCard, setPayingCard] = useState<(typeof cardLookup)[string] | null>(null);

  const payTotal = payments.reduce((s, p) => s + p.amount, 0);
  const ratio = forecastStart > 0 ? Math.max(0, forecastEnd) / Math.max(forecastStart, forecastEnd) : 0;

  const handlePayBill = async (p: UpcomingPayment) => {
    setPayingBillId(p.id);
    const res = await payBillNow(p.id);
    setPayingBillId(null);
    if (res.error) {
      show(res.error);
      return;
    }
    router.refresh();
    if (res.txnId && res.prevDue) {
      const { txnId, prevDue, prevLastPaid } = res;
      show(`จ่าย ${p.name} ${formatMoney(p.amount, hide)} แล้ว`, async () => {
        await undoPayBill(txnId, p.id, prevDue, prevLastPaid ?? null);
      });
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div className="cap">{dateLabel}</div>
        <p style={{ margin: "4px 0 0", color: "var(--ink-soft)", fontSize: 14 }}>
          {greeting} · 10 วันนี้มี {payments.length} รายการต้องจ่าย ({formatMoney(payTotal, hide)})
        </p>
      </div>
      <div className="dash">
        <div style={{ minWidth: 0 }}>
          <div className="grid g2">
            <div className="hero">
              <div className="cap">เงินคงเหลือรวม</div>
              <div className="num" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1, margin: "6px 0 2px" }}>
                <Money value={totalBalance} />
              </div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)" }}>
                {accountCount} บัญชี · หนี้บัตร {formatMoney(cardDebt, hide)}
              </div>
            </div>
            <div className="card card-pad">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0 }} className="cap">คาดการณ์เงินสด 10 วัน</span>
                <Link className="link-btn" href="/forecast">ดู</Link>
              </div>
              <div className="num" style={{ fontSize: 30, fontWeight: 600, margin: "6px 0 12px", color: forecastEnd < 0 ? "var(--neg)" : "var(--ink)" }}>
                <Money value={forecastEnd} />
              </div>
              <div className="bar"><i style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 }}>
                <div>
                  <div className="cap">จ่ายออก</div>
                  <div className="num" style={{ fontSize: 16, fontWeight: 600, color: "var(--neg)" }}>
                    −<Money value={forecastOut} />
                  </div>
                </div>
                <div>
                  <div className="cap">รับเข้า</div>
                  <div className="num" style={{ fontSize: 16, fontWeight: 600, color: "var(--pos)" }}>
                    +<Money value={forecastInc} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sec">
            <h2>{payments.length ? `ต้องจ่ายภายใน 10 วัน · ${formatMoney(payTotal, hide)} (${payments.length} รายการ)` : "ต้องจ่ายภายใน 10 วัน"}</h2>
            <Link className="more" href="/bills">ทั้งหมด</Link>
          </div>
          <div className="card list">
            {payments.length ? (
              payments.map((p) => (
                <ActRow
                  key={p.key}
                  icon={p.kind === "card" ? "card" : "clock"}
                  title={p.name}
                  sub={p.kind === "bill" ? (p.auto ? "ตัดอัตโนมัติ" : "จ่ายเอง") : p.kind === "sub" ? "สมาชิกรายเดือน" : undefined}
                  amount={p.amount}
                  due={p.date}
                  btn={p.kind === "bill" ? (payingBillId === p.id ? "กำลังจ่าย…" : "จ่าย") : p.kind === "card" ? "ชำระ" : undefined}
                  onBtn={
                    p.kind === "bill"
                      ? () => handlePayBill(p)
                      : p.kind === "card"
                        ? () => setPayingCard(cardLookup[p.id] ?? null)
                        : undefined
                  }
                />
              ))
            ) : (
              <div className="empty">
                <span>ไม่มีรายการต้องจ่ายภายใน 10 วันนี้</span>
                <button className="btn btn-sm" onClick={() => open("bill")}>+ เพิ่มบิล</button>
              </div>
            )}
          </div>
        </div>
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }} />
      </div>
      {payingCard && <PayCardForm card={payingCard} accounts={accounts} onClose={() => setPayingCard(null)} />}
    </>
  );
}
