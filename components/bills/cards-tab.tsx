"use client";

import { useState } from "react";
import { CardList, type CardListItem } from "@/components/money/card-list";
import { CardForm, type CardFormInitial } from "@/components/forms/card-form";
import { PayCardForm } from "@/components/forms/pay-card-form";
import { Money } from "@/components/ui/money";
import { BankMark } from "@/components/ui/bank-mark";
import { dueLabel } from "@/lib/domain/dates";
import { todayISOInBangkok } from "@/lib/dates/today";
import { dShort } from "@/lib/format/date";

export function CardsTab({ cards, accounts }: { cards: CardListItem[]; accounts: { id: string; name: string }[] }) {
  const [editing, setEditing] = useState<CardFormInitial | null>(null);
  const [paying, setPaying] = useState<CardListItem | null>(null);
  const todayISO = todayISOInBangkok();

  return (
    <>
      <CardList cards={cards} accounts={accounts} />
      <div className="grid g2" style={{ marginTop: 16 }}>
        {cards.map((c) => {
          const due = c.dueDate ? dueLabel(c.dueDate, todayISO) : null;
          return (
            <div className="card card-pad" key={c.id}>
              <div className="card-head" style={{ padding: "0 0 10px" }}>
                <BankMark bank={c.bank} size={30} />
                {c.name}
                <span style={{ marginLeft: "auto" }}>
                  <Money value={c.used} />
                </span>
              </div>
              <dl className="dl">
                <dt>วงเงิน</dt>
                <dd><Money value={c.creditLimit} /></dd>
                <dt>คงเหลือ</dt>
                <dd><Money value={c.creditLimit - c.used} /></dd>
                {c.statementDate && (
                  <>
                    <dt>วันสรุปยอด</dt>
                    <dd>{dShort(c.statementDate, todayISO)}</dd>
                  </>
                )}
                {c.dueDate && (
                  <>
                    <dt>กำหนดชำระ</dt>
                    <dd>
                      {dShort(c.dueDate, todayISO)} {due && <span className={"badge " + due.tone}>{due.text}</span>}
                    </dd>
                  </>
                )}
                <dt>ขั้นต่ำ</dt>
                <dd><Money value={c.minPayment} /></dd>
              </dl>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={!c.used} onClick={() => setPaying(c)}>
                  ชำระบัตร
                </button>
                <button className="btn" onClick={() => setEditing(toInitial(c))}>แก้ไข</button>
              </div>
            </div>
          );
        })}
      </div>
      {editing && <CardForm initial={editing} onClose={() => setEditing(null)} />}
      {paying && (
        <PayCardForm
          card={{ id: paying.id, name: paying.name, used: paying.used, minPayment: paying.minPayment, dueDate: paying.dueDate }}
          accounts={accounts}
          onClose={() => setPaying(null)}
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
