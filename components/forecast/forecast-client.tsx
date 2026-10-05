"use client";

import { useMemo, useState } from "react";
import { Money } from "@/components/ui/money";
import { Icon } from "@/components/ui/icon";
import { forecast, type ForecastBill, type ForecastCard, type ForecastIncome, type ForecastSubscription } from "@/lib/domain/forecast";
import { dShort } from "@/lib/format/date";

const DAY_OPTIONS = [7, 10, 30, 60, 90];

export function ForecastClient({
  todayISO,
  startBalance,
  bills,
  subscriptions,
  cards,
  income,
}: {
  todayISO: string;
  startBalance: number;
  bills: ForecastBill[];
  subscriptions: ForecastSubscription[];
  cards: ForecastCard[];
  income: ForecastIncome[];
}) {
  const [days, setDays] = useState(30);
  const f = useMemo(
    () => forecast({ days, todayISO, startBalance, bills, subscriptions, cards, income }),
    [days, todayISO, startBalance, bills, subscriptions, cards, income],
  );

  let running = f.start;
  let low = f.start;
  const rows = f.items.map((it) => {
    running += it.amount;
    low = Math.min(low, running);
    return { ...it, running };
  });

  return (
    <>
      <div className="chips" style={{ marginBottom: 16 }}>
        {DAY_OPTIONS.map((d) => (
          <button key={d} className={"chip" + (days === d ? " on" : "")} onClick={() => setDays(d)}>
            {d} วัน
          </button>
        ))}
      </div>
      <div className="grid g3">
        <div className="card card-pad">
          <div className="cap">เงินคงเหลือตอนนี้</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}><Money value={f.start} /></div>
        </div>
        <div className="card" style={{ background: "var(--hero)" }}>
          <div className="card-pad">
            <div className="cap" style={{ color: "rgba(255,255,255,.85)" }}>คาดว่าเหลือใน {days} วัน</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 600, margin: "6px 0 2px", color: "#fff" }}><Money value={f.end} /></div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.85)" }}>
              ออก <Money value={f.out} /> · เข้า <Money value={f.inc} />
            </div>
          </div>
        </div>
        <div className="card card-pad" style={{ background: low < 0 ? "var(--neg-soft)" : "var(--pos-soft)" }}>
          <div className="cap">จุดต่ำสุดระหว่างทาง</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: low < 0 ? "var(--neg)" : "var(--pos)" }}>
            <Money value={low} />
          </div>
          <div className="row-s">{low < 0 ? "เงินไม่พอ ควรเตรียมเพิ่ม" : "เงินพอตลอดช่วง"}</div>
        </div>
      </div>
      <div className="sec">
        <h2>ไทม์ไลน์กระแสเงินสด</h2>
      </div>
      <div className="card list">
        {rows.length ? (
          rows.map((it, i) => (
            <div className="row" key={i}>
              <span className="ic">
                <Icon name={it.amount > 0 ? "money" : "card"} size={17} color={it.amount > 0 ? "var(--pos)" : "var(--ink-soft)"} />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="row-t">{it.name}</span>
                <span className="row-s">{dShort(it.date, todayISO)}</span>
              </span>
              <span style={{ textAlign: "right", flexShrink: 0 }}>
                <span className="num" style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: it.amount > 0 ? "var(--pos)" : "var(--neg)" }}>
                  {it.amount > 0 ? "+" : "−"}
                  <Money value={Math.abs(it.amount)} />
                </span>
                <span className="row-s num" style={{ color: it.running < 0 ? "var(--neg)" : undefined }}>
                  คงเหลือ <Money value={it.running} />
                </span>
              </span>
            </div>
          ))
        ) : (
          <div className="empty">ไม่มีรายการในช่วงนี้</div>
        )}
      </div>
      <p className="hint">คำนวณจากบิล ยอดบัตรเครดิต สมาชิกที่ตัดจากบัญชี และรายรับประจำ</p>
    </>
  );
}
