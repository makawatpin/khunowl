"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BankMark } from "@/components/ui/bank-mark";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { CardForm, type CardFormInitial } from "@/components/forms/card-form";
import { PayCardForm } from "@/components/forms/pay-card-form";
import { togglePinCard } from "@/lib/actions/cards";
import { dShort } from "@/lib/format/date";

export interface CardListItem {
  id: string;
  name: string;
  bank: string | null;
  network: string | null;
  last4: string | null;
  used: number;
  creditLimit: number;
  statementDate: string | null;
  dueDate: string | null;
  minPayment: number;
  pinned: boolean;
}

const LIMIT = 4;

export function CardList({ cards, accounts }: { cards: CardListItem[]; accounts: { id: string; name: string }[] }) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [openForm, setOpenForm] = useState<"new" | CardFormInitial | null>(null);
  const [payTarget, setPayTarget] = useState<CardListItem | null>(null);

  const sorted = useMemo(() => [...cards].sort((a, b) => Number(b.pinned) - Number(a.pinned)), [cards]);
  const shown = editMode || showAll || sorted.length <= LIMIT + 1 ? sorted : sorted.slice(0, LIMIT);
  const total = cards.reduce((s, c) => s + c.used, 0);

  const togglePin = async (id: string, pinned: boolean) => {
    await togglePinCard(id, !pinned);
    router.refresh();
  };

  return (
    <>
      <div className="sec">
        <h2>บัตรเครดิต</h2>
        <span className="num acct-total">
          ค้าง <Money value={total} />
        </span>
        <span className="acct-acts">
          {cards.length > 1 && (
            <button className="more" onClick={() => setEditMode((v) => !v)}>
              {editMode ? "เสร็จ" : "จัดเรียง"}
            </button>
          )}
          <button className="more" onClick={() => setOpenForm("new")}>+ เพิ่ม</button>
        </span>
      </div>
      <div className="card list acct-list">
        {shown.map((c) => {
          const pct = c.creditLimit > 0 ? Math.min(100, (c.used / c.creditLimit) * 100) : 0;
          return (
            <div className="acct-row" key={c.id}>
              <button className="acct-main" onClick={() => !editMode && setOpenForm(toInitial(c))}>
                <BankMark bank={c.bank} size={38} />
                <span className="acct-name">
                  <span className="row-t">{c.name}</span>
                  <span className="row-s">
                    {c.network}
                    {c.last4 ? ` · •••• ${c.last4}` : ""}
                    {c.dueDate ? ` · ชำระ ${dShort(c.dueDate)}` : ""}
                  </span>
                </span>
                <span className="acct-amt">
                  <Money value={c.used} />
                  <span className="acct-lim">{Math.round(pct)}% ของวงเงิน</span>
                </span>
              </button>
              <div className="bar acct-bar">
                <i style={{ width: pct + "%", background: pct > 80 ? "var(--neg)" : undefined }} />
              </div>
              {editMode ? (
                <span className="acct-edit">
                  <button className={"pin" + (c.pinned ? " on" : "")} onClick={() => togglePin(c.id, c.pinned)} aria-label="ปักหมุด">
                    <Icon name="star" size={16} />
                  </button>
                </span>
              ) : (
                c.used > 0 && (
                  <div style={{ padding: "0 12px 10px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPayTarget(c);
                      }}
                    >
                      ชำระบัตร
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
        {!editMode && sorted.length > LIMIT + 1 && (
          <button className="acct-more" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "ย่อรายการ" : `ดูทั้งหมด (${sorted.length})`}
          </button>
        )}
        {!cards.length && <div className="empty">ยังไม่มีบัตรเครดิต</div>}
      </div>
      {openForm === "new" && <CardForm onClose={() => setOpenForm(null)} />}
      {openForm && openForm !== "new" && <CardForm initial={openForm} onClose={() => setOpenForm(null)} />}
      {payTarget && (
        <PayCardForm
          card={{ id: payTarget.id, name: payTarget.name, used: payTarget.used, minPayment: payTarget.minPayment, dueDate: payTarget.dueDate }}
          accounts={accounts}
          onClose={() => setPayTarget(null)}
        />
      )}
    </>
  );
}

function toInitial(c: CardListItem): CardFormInitial {
  return {
    id: c.id, name: c.name, bank: c.bank, network: c.network, last4: c.last4,
    creditLimit: c.creditLimit, used: c.used, statementDate: c.statementDate, dueDate: c.dueDate, minPayment: c.minPayment,
  };
}
