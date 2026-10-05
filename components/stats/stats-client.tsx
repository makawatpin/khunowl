"use client";

import { useMemo, useState } from "react";
import { Money } from "@/components/ui/money";
import { Icon } from "@/components/ui/icon";
import { categoryColor } from "@/lib/domain/categories";
import { dShort } from "@/lib/format/date";
import {
  daysInMonth, groupByCategory, groupByDayOfMonth, monthKeyAdd, monthTrend, sumAmount, topPayees,
  txnsInMonth, type StatsTxn,
} from "@/lib/domain/stats";

const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const M_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const D_TH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

interface TxnWithId extends StatsTxn {
  id: string;
  srcLabel: string;
}

export function StatsClient({
  todayISO,
  txns,
  budgets,
}: {
  todayISO: string;
  txns: TxnWithId[];
  budgets: Record<string, number>;
}) {
  const curMonth = todayISO.slice(0, 7);
  const [mk, setMk] = useState(curMonth);
  const [day, setDay] = useState<number | null>(null);
  const [cat, setCat] = useState<string | null>(null);

  const go = (n: number) => {
    setMk(monthKeyAdd(mk, n));
    setDay(null);
    setCat(null);
  };

  const exp = useMemo(() => txnsInMonth(txns, mk, "expense"), [txns, mk]);
  const inc = useMemo(() => txnsInMonth(txns, mk, "income"), [txns, mk]);
  const prevExp = useMemo(() => txnsInMonth(txns, monthKeyAdd(mk, -1), "expense"), [txns, mk]);
  const E = sumAmount(exp);
  const I = sumAmount(inc);
  const PE = sumAmount(prevExp);

  const byDay = useMemo(() => groupByDayOfMonth(exp), [exp]);
  const maxDay = Math.max(1, ...Object.values(byDay));
  const isCur = mk === curMonth;
  const dim = daysInMonth(mk);
  const todayDay = Number(todayISO.slice(8, 10));
  const budgetTotal = Object.values(budgets).reduce((s, v) => s + v, 0);
  const todaySpend = isCur ? byDay[todayDay] ?? 0 : 0;
  const daysLeft = dim - todayDay + 1;
  const perDay = isCur && budgetTotal ? Math.max(0, (budgetTotal - (E - todaySpend)) / daysLeft) : null;
  const avgDay = E / (isCur ? todayDay : dim);
  const delta = PE ? (E - PE) / PE : null;

  const cats = useMemo(() => Object.entries(groupByCategory(exp)).sort((a, b) => b[1] - a[1]), [exp]);
  const prevCats = useMemo(() => groupByCategory(prevExp), [prevExp]);
  const catMax = Math.max(1, ...cats.map((c) => c[1]));
  const payees = useMemo(() => topPayees(exp, 5), [exp]);
  const trend = useMemo(() => monthTrend(txns, mk, 5), [txns, mk]);
  const tMax = Math.max(1, ...trend.map((t) => Math.max(t.expense, t.income)));

  const [year, month] = mk.split("-").map(Number);
  const offset = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const list = useMemo(
    () =>
      txns
        .filter(
          (t) =>
            t.date.startsWith(mk) &&
            t.type !== "transfer" &&
            (!day || Number(t.date.slice(8, 10)) === day) &&
            (!cat || (t.type === "expense" && t.category === cat)),
        )
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [txns, mk, day, cat],
  );

  const heatStyle = (v: number): React.CSSProperties => {
    const r = v / maxDay;
    return { background: `rgba(242,101,138,${0.14 + 0.8 * r})`, color: r > 0.5 ? "#fff" : "var(--ink)" };
  };

  const maxDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <div className="st-month">
        <button className="btn icon-btn" onClick={() => go(-1)} aria-label="เดือนก่อน"><Icon name="back" size={16} /></button>
        <b>{MONTHS_TH[month - 1]} {year}</b>
        <button className="btn icon-btn" onClick={() => go(1)} disabled={mk >= curMonth} aria-label="เดือนถัดไป"><Icon name="arrow" size={16} /></button>
        {!isCur && (
          <button className="btn btn-sm" onClick={() => { setMk(curMonth); setDay(null); setCat(null); }}>เดือนนี้</button>
        )}
      </div>

      {isCur ? (
        <div className="hero">
          <div className="cap">วันนี้ใช้ไป</div>
          <div className="num" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1, margin: "6px 0 2px" }}><Money value={todaySpend} /></div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)" }}>
            {perDay == null
              ? "ตั้งงบรายหมวดในหน้าตั้งค่าเพื่อดูงบที่ใช้ได้ต่อวัน"
              : todaySpend <= perDay
                ? `วันนี้ยังใช้ได้อีก ${Math.round(perDay - todaySpend).toLocaleString()} บาท`
                : `วันนี้เกินงบรายวันไป ${Math.round(todaySpend - perDay).toLocaleString()} บาท`}
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.28)" }}>
            <div style={{ flex: 1 }}><div className="cap">ใช้ได้วันละ</div><div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{perDay == null ? "—" : <Money value={perDay} />}</div></div>
            <div style={{ flex: 1 }}><div className="cap">งบเหลือเดือนนี้</div><div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{budgetTotal ? <Money value={budgetTotal - E} /> : "—"}</div></div>
            <div style={{ flex: 1 }}><div className="cap">เหลืออีก</div><div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{daysLeft} วัน</div></div>
          </div>
        </div>
      ) : (
        <div className="hero">
          <div className="cap">ใช้จ่ายทั้งเดือน {MONTHS_TH[month - 1]}</div>
          <div className="num" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1, margin: "6px 0 2px" }}><Money value={E} /></div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)" }}>เฉลี่ยวันละ {Math.round(avgDay).toLocaleString()} บาท</div>
          <div style={{ display: "flex", gap: 18, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.28)" }}>
            <div style={{ flex: 1 }}><div className="cap">รายรับ</div><div className="num" style={{ fontSize: 18, fontWeight: 600 }}><Money value={I} /></div></div>
            <div style={{ flex: 1 }}><div className="cap">คงเหลือสุทธิ</div><div className="num" style={{ fontSize: 18, fontWeight: 600 }}><Money value={I - E} /></div></div>
            <div style={{ flex: 1 }}><div className="cap">งบรวม</div><div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{budgetTotal ? <Money value={budgetTotal} /> : "—"}</div></div>
          </div>
        </div>
      )}

      <div className="grid g3" style={{ marginTop: 16 }}>
        <div className="card card-pad" style={{ background: "var(--pos-soft)" }}>
          <div className="cap">รายรับ</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: "var(--pos)" }}><Money value={I} /></div>
          <div className="row-s">{inc.length} รายการ</div>
        </div>
        <div className="card card-pad" style={{ background: "var(--accent-soft)" }}>
          <div className="cap">รายจ่าย</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: "var(--accent-deep)" }}><Money value={E} /></div>
          <div className="row-s">{delta == null ? `${exp.length} รายการ` : `${delta > 0 ? "มากกว่า" : "น้อยกว่า"}เดือนก่อน ${Math.abs(Math.round(delta * 100))}%`}</div>
        </div>
        <div className="card card-pad">
          <div className="cap">คงเหลือสุทธิ</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: I - E < 0 ? "var(--neg)" : "var(--pos)" }}><Money value={I - E} /></div>
          <div className="row-s">เฉลี่ยใช้วันละ {Math.round(avgDay).toLocaleString()} บาท</div>
        </div>
      </div>

      <div className="dash" style={{ marginTop: 6 }}>
        <div style={{ minWidth: 0 }}>
          <div className="sec">
            <h2>ปฏิทินการใช้จ่าย</h2>
            {day && <button className="more" onClick={() => setDay(null)}>ดูทั้งเดือน</button>}
          </div>
          <div className="card card-pad">
            <div className="heat">
              {D_TH.map((d) => <div key={d} className="heat-h">{d}</div>)}
              {Array.from({ length: offset }).map((_, i) => <div key={`p${i}`} />)}
              {Array.from({ length: dim }).map((_, i) => {
                const d = i + 1;
                const v = byDay[d] || 0;
                const fut = isCur && d > todayDay;
                return (
                  <button
                    key={d}
                    className={"heat-d" + (day === d ? " on" : "") + (isCur && d === todayDay ? " today" : "")}
                    disabled={fut}
                    style={{ ...({ "--i": i } as React.CSSProperties), ...(v ? heatStyle(v) : fut ? { opacity: 0.35 } : {}) }}
                    onClick={() => { setDay(day === d ? null : d); setCat(null); }}
                  >
                    <span>{d}</span>
                    {v > 0 && <small className="num">{v >= 1000 ? `${Math.round(v / 100) / 10}k` : Math.round(v)}</small>}
                  </button>
                );
              })}
            </div>
            <div className="hint">
              สียิ่งเข้มยิ่งใช้เยอะ · วันที่ใช้มากสุด {maxDayEntry ? `${maxDayEntry[0]} ${M_TH[month - 1]} (${Math.round(maxDayEntry[1]).toLocaleString()} บาท)` : "—"}
            </div>
          </div>
          <div className="sec">
            <h2>{day ? `รายการวันที่ ${day} ${M_TH[month - 1]}` : cat ? `หมวด ${cat}` : "รายการเดือนนี้"}</h2>
            {(day || cat) && <button className="more" onClick={() => { setDay(null); setCat(null); }}>ล้างตัวกรอง</button>}
          </div>
          <div className="card list">
            {list.length ? (
              list.slice(0, day || cat ? 200 : 30).map((t) => <StatsTxnRow key={t.id} t={t} />)
            ) : (
              <div className="empty">ไม่มีรายการ</div>
            )}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="sec"><h2>ตามหมวด</h2></div>
          <div className="card card-pad">
            {cats.length ? (
              cats.map(([c, v], i) => {
                const p = prevCats[c] || 0;
                const dd = p ? (v - p) / p : null;
                const over = budgets[c] && v > budgets[c];
                return (
                  <button key={c} className="svc-cat" style={{ marginTop: i ? 14 : 0, opacity: cat && cat !== c ? 0.45 : 1 }} onClick={() => { setCat(cat === c ? null : c); setDay(null); }}>
                    <span style={{ display: "flex", gap: 8, fontSize: 14, marginBottom: 6, alignItems: "center" }}>
                      <span style={{ flex: 1, fontWeight: cat === c ? 600 : 400 }}>{c}</span>
                      <span className="row-s">{Math.round((v / E) * 100)}%</span>
                      {dd != null && Math.abs(dd) >= 0.05 && (
                        <span className={"badge " + (dd > 0 ? "red" : "green")}>{dd > 0 ? "▲" : "▼"} {Math.abs(Math.round(dd * 100))}%</span>
                      )}
                      <b className="num"><Money value={v} /></b>
                    </span>
                    <div className="bar"><i style={{ width: `${(v / catMax) * 100}%`, background: over ? "var(--neg)" : (categoryColor(c)?.bar ?? "var(--accent)") }} /></div>
                  </button>
                );
              })
            ) : (
              <div className="empty">ยังไม่มีรายจ่ายเดือนนี้</div>
            )}
            {cats.length > 0 && <div className="hint">▲▼ เทียบกับเดือนก่อน · แตะหมวดเพื่อดูรายการ</div>}
          </div>
          <div className="sec"><h2>6 เดือนล่าสุด</h2></div>
          <div className="card card-pad">
            <div className="trend">
              {trend.map((t, ti) => (
                <button key={t.monthKey} style={{ "--i": ti } as React.CSSProperties} className={"trend-col" + (t.monthKey === mk ? " on" : "")} onClick={() => { setMk(t.monthKey); setDay(null); setCat(null); }}>
                  <div className="trend-bars">
                    <i style={{ height: `${(t.income / tMax) * 100}%`, background: "var(--pos)" }} title={`รายรับ ${t.income}`} />
                    <i style={{ height: `${(t.expense / tMax) * 100}%`, background: "var(--accent)" }} title={`รายจ่าย ${t.expense}`} />
                  </div>
                  <span>{M_TH[Number(t.monthKey.slice(5)) - 1]}</span>
                </button>
              ))}
            </div>
            <div className="trend-key">
              <span><i style={{ background: "var(--pos)" }} />รายรับ</span>
              <span><i style={{ background: "var(--accent)" }} />รายจ่าย</span>
            </div>
          </div>
          <div className="sec"><h2>จ่ายให้ใครมากที่สุด</h2></div>
          <div className="card list">
            {payees.length ? (
              payees.map((p) => (
                <div className="row" key={p.name}>
                  <span className="ic"><Icon name="money" size={17} color="var(--ink-soft)" /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="row-t">{p.name}</span>
                    <span className="row-s">{p.count} ครั้ง</span>
                  </span>
                  <span className="num" style={{ fontWeight: 600 }}><Money value={p.amount} /></span>
                </div>
              ))
            ) : (
              <div className="empty">—</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatsTxnRow({ t }: { t: TxnWithId }) {
  const inc = t.type === "income";
  const cc = !inc ? categoryColor(t.category) : null;
  return (
    <div className="row">
      <span className="ic" style={cc ? { background: cc.bg } : undefined}>
        <Icon name={inc ? "money" : "card"} size={17} color={cc ? cc.fg : "var(--ink-soft)"} />
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span className="row-t">{t.name}</span>
        <span className="row-s">{dShort(t.date)} · {t.category ?? ""} · {t.srcLabel}</span>
      </span>
      <span className="num" style={{ color: inc ? "var(--pos)" : "var(--ink)" }}>
        {inc ? "+" : "−"}
        <Money value={t.amount} />
      </span>
    </div>
  );
}
