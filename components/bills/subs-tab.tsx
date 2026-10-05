"use client";

import { useState } from "react";
import { ActRow } from "@/components/ui/act-row";
import { Money } from "@/components/ui/money";
import { SubscriptionForm, type SubscriptionFormInitial } from "@/components/forms/subscription-form";
import { subsMonthly } from "@/lib/domain/forecast";
import { CYCLE_LABEL } from "@/lib/i18n/th";

export interface SubItem extends SubscriptionFormInitial {
  sourceName: string;
}

export function SubsTab({
  subs,
  accounts,
  cards,
}: {
  subs: SubItem[];
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
}) {
  const [openForm, setOpenForm] = useState<"new" | SubItem | null>(null);
  const monthly = subsMonthly(subs.map((s) => ({ price: s.price, cycle: s.cycle })));
  const sorted = [...subs].sort((a, b) => (a.nextBilling < b.nextBilling ? -1 : 1));

  return (
    <>
      <div className="grid g2" style={{ marginBottom: 6 }}>
        <div className="card card-pad">
          <div className="cap">รวมต่อเดือน</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}><Money value={monthly} /></div>
          <div className="row-s">{subs.length} บริการ</div>
        </div>
        <div className="card card-pad">
          <div className="cap">รวมต่อปี</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}><Money value={monthly * 12} /></div>
        </div>
      </div>
      <div className="sec">
        <h2>บริการที่สมัคร</h2>
        <button className="more" onClick={() => setOpenForm("new")}>+ เพิ่ม</button>
      </div>
      <div className="card list">
        {sorted.length ? (
          sorted.map((s) => (
            <ActRow
              key={s.id}
              icon="clock"
              title={s.name}
              sub={`${CYCLE_LABEL[s.cycle]} · ${s.sourceName}`}
              amount={s.price}
              due={s.nextBilling}
              onClick={() => setOpenForm(s)}
            />
          ))
        ) : (
          <div className="empty">ยังไม่มีสมาชิกรายเดือน</div>
        )}
      </div>
      <p className="hint">ระบบตัดเงินและบันทึกรายจ่ายให้อัตโนมัติเมื่อถึงวัน</p>
      {openForm === "new" && <SubscriptionForm accounts={accounts} cards={cards} onClose={() => setOpenForm(null)} />}
      {openForm && openForm !== "new" && <SubscriptionForm initial={openForm} accounts={accounts} cards={cards} onClose={() => setOpenForm(null)} />}
    </>
  );
}
