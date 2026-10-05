"use client";

import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import type { CalendarEvent, CalendarKind, CalendarTone } from "@/lib/domain/calendar";
import { dLong, dShort } from "@/lib/format/date";
import { dueLabel } from "@/lib/domain/dates";

const EV_ICON: Record<CalendarKind, IconName> = {
  bill: "clock", sub: "clock", card: "card", income: "money", warranty: "shield",
  home: "wrench", vehicle: "car", task: "check", doc: "doc",
};
const TONE_VAR: Record<CalendarTone, string | null> = { red: "neg", amber: "warn", green: "pos", accent: "accent", "": null };
const WEEKDAYS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

function monthKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}
function isoOf(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const MONTHS_TH_DEFAULT = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export function CalendarClient({ events, todayISO }: { events: CalendarEvent[]; todayISO: string }) {
  const monthLabel = (m: number) => MONTHS_TH_DEFAULT[m];
  const [y, m0] = todayISO.split("-").map(Number);
  const [year, setYear] = useState(y);
  const [month, setMonth] = useState(m0 - 1);
  const [sel, setSel] = useState(todayISO);

  const shift = (d: number) => {
    const n = month + d;
    setYear(year + Math.floor(n / 12));
    setMonth(((n % 12) + 12) % 12);
  };

  const first = new Date(Date.UTC(year, month, 1));
  const startPad = (first.getUTCDay() + 6) % 7;
  const dim = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [events]);

  const dayEvents = byDay.get(sel) ?? [];
  const upcoming = events.filter((e) => e.date >= todayISO).slice(0, 5);
  const mk = monthKey(year, month);
  const monthEv = events.filter((e) => e.date.startsWith(mk));
  const monthOut = monthEv
    .filter((e) => ["bill", "sub", "card"].includes(e.kind))
    .reduce((s, e) => s + (parseFloat(e.sub.replace(/[^\d.]/g, "")) || 0), 0);
  const isThisMonth = year === y && month === m0 - 1;

  return (
    <div className="calwrap">
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <button className="btn btn-sm" onClick={() => shift(-1)} aria-label="เดือนก่อน"><Icon name="back" size={15} /></button>
          <div style={{ fontSize: 19, fontWeight: 600, minWidth: 150, textAlign: "center" }}>{monthLabel(month)} {year}</div>
          <button className="btn btn-sm" onClick={() => shift(1)} aria-label="เดือนถัดไป"><Icon name="arrow" size={15} /></button>
          {!isThisMonth && (
            <button className="btn btn-sm" onClick={() => { setYear(y); setMonth(m0 - 1); setSel(todayISO); }}>
              วันนี้
            </button>
          )}
        </div>
        <div className="calhead">{WEEKDAYS.map((d) => <div key={d}>{d}</div>)}</div>
        <div className="calgrid">
          {cells.map((d, i) => {
            if (!d) return <div key={`p${i}`} className="calday pad" />;
            const iso = isoOf(year, month, d);
            const evs = byDay.get(iso) ?? [];
            const isToday = iso === todayISO;
            const on = iso === sel;
            return (
              <button key={d} className={"calday" + (isToday ? " today" : "") + (on ? " on" : "")} onClick={() => setSel(iso)}>
                <span className="dnum num">{d}</span>
                <span className="cal-dots">
                  {evs.slice(0, 4).map((e, k) => (
                    <i key={k} className={"d-" + (e.tone || "x")} />
                  ))}
                </span>
                {evs.slice(0, 2).map((e, k) => (
                  <span key={k} className={"ev" + (e.tone ? ` ${e.tone}` : "")}>{e.title}</span>
                ))}
                {evs.length > 2 && <span className="ev-more">+{evs.length - 2}</span>}
              </button>
            );
          })}
        </div>
        <div className="sec"><h2>วันที่ {dLong(sel)}</h2></div>
        <div className="card list">
          {dayEvents.length ? (
            dayEvents.map((e, i) => <EventRow key={i} e={e} />)
          ) : (
            <div className="empty">ไม่มีกำหนดการวันนี้</div>
          )}
        </div>
      </div>
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card card-pad">
          <div className="cap">สรุป{monthLabel(month)}</div>
          <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
            <div>
              <div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{monthEv.length}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>กำหนดการ</div>
            </div>
            <div>
              <div className="num" style={{ fontSize: 20, fontWeight: 600, color: "var(--neg)" }}><Money value={monthOut} /></div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>ต้องจ่าย</div>
            </div>
          </div>
        </div>
        <div className="card list">
          <div className="card-head"><span>กำลังจะถึง</span></div>
          {upcoming.length ? (
            upcoming.map((e, i) => (
              <div className="row" key={i}>
                <EventIcon e={e} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="row-t">{e.title}</span>
                  <span className="row-s">{e.sub}</span>
                </span>
                <span style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className="row-t" style={{ display: "block" }}>{dShort(e.date, todayISO)}</span>
                  <span className="row-s">{dueLabel(e.date, todayISO).text}</span>
                </span>
              </div>
            ))
          ) : (
            <div className="empty">ไม่มีรายการ</div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventIcon({ e }: { e: CalendarEvent }) {
  const toneVar = TONE_VAR[e.tone];
  return (
    <span className="ic" style={toneVar ? { background: `var(--${toneVar}-soft)` } : undefined}>
      <Icon name={EV_ICON[e.kind]} size={17} color={toneVar ? `var(--${toneVar})` : "var(--ink-soft)"} />
    </span>
  );
}

function EventRow({ e }: { e: CalendarEvent }) {
  return (
    <div className="row">
      <EventIcon e={e} />
      <span style={{ minWidth: 0, flex: 1 }}>
        <span className="row-t">{e.title}</span>
        <span className="row-s">{e.sub}</span>
      </span>
    </div>
  );
}
