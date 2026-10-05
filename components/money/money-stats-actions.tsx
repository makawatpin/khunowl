"use client";

import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { useQuickAdd } from "@/components/providers/quick-add-provider";

export function MoneyStatsActions({
  totalBalance,
  accountCount,
  cardDebt,
  cardCount,
  monthLabel,
  monthSpend,
  monthIncome,
}: {
  totalBalance: number;
  accountCount: number;
  cardDebt: number;
  cardCount: number;
  monthLabel: string;
  monthSpend: number;
  monthIncome: number;
}) {
  const { open } = useQuickAdd();
  return (
    <>
      <div className="grid g3 money-stats">
        <div className="card" style={{ background: "var(--hero)" }}>
          <div className="card-pad">
            <div className="cap" style={{ color: "rgba(255,255,255,.85)" }}>เงินคงเหลือรวม</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 600, margin: "6px 0 2px", color: "#fff" }}>
              <Money value={totalBalance} />
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.85)" }}>{accountCount} บัญชี</div>
          </div>
        </div>
        <div className="card" style={{ background: "var(--warn-soft)", boxShadow: "none" }}>
          <div className="card-pad">
            <div className="cap">ยอดค้างบัตรเครดิต</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 600, margin: "6px 0 2px", color: "var(--warn)" }}>
              <Money value={cardDebt} />
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{cardCount} ใบ</div>
          </div>
        </div>
        <div className="card" style={{ background: "var(--accent-soft)", boxShadow: "none" }}>
          <div className="card-pad">
            <div className="cap">ใช้ไปเดือน{monthLabel}</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 600, margin: "6px 0 2px", color: "var(--accent-deep)" }}>
              <Money value={monthSpend} />
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              รับเข้า <Money value={monthIncome} />
            </div>
          </div>
        </div>
      </div>
      <div className="actbar">
        <button className="btn" onClick={() => open("expense")}>
          <Icon name="minus" size={15} />
          รายจ่าย
        </button>
        <button className="btn" onClick={() => open("income")}>
          <Icon name="plus" size={15} />
          รายรับ
        </button>
        <button className="btn" onClick={() => open("transfer")}>
          <Icon name="swap" size={15} />
          โอนเงิน
        </button>
      </div>
    </>
  );
}
