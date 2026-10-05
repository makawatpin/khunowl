"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { AvatarStack, type TripPerson } from "@/components/ui/avatar";
import { Money } from "@/components/ui/money";
import { TripForm } from "@/components/forms/trip-form";
import { fmtC, tStatus } from "@/lib/domain/trips";
import { dShort } from "@/lib/format/date";
import { todayISOInBangkok } from "@/lib/dates/today";

export interface TripListItem {
  id: string;
  name: string;
  startOn: string | null;
  endOn: string | null;
  currency: string;
  rate: number;
  meId: string;
  members: TripPerson[];
  total: number;
  mineBalance: number;
  hasExpenses: boolean;
}

export function TripsClient({ trips, friends }: { trips: TripListItem[]; friends: TripPerson[] }) {
  const router = useRouter();
  const todayISO = todayISOInBangkok();
  const [newTripForm, setNewTripForm] = useState(false);

  let owed = 0;
  let owe = 0;
  for (const t of trips) {
    const m = t.mineBalance * t.rate;
    if (m > 0.5) owed += m;
    else if (m < -0.5) owe -= m;
  }

  const sorted = [...trips].sort((a, b) => (b.startOn || "").localeCompare(a.startOn || ""));

  return (
    <>
      <div className="hero">
        <div className="cap">ยอดค้างกับเพื่อนทุกทริป (สุทธิ)</div>
        <div className="num" style={{ fontSize: 32, fontWeight: 600, margin: "6px 0 2px" }}><Money value={owed - owe} /></div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)" }}>{owed - owe >= 0 ? "เพื่อนติดเงินเรามากกว่า" : "เราติดเงินเพื่อนมากกว่า"}</div>
        <div style={{ display: "flex", gap: 18, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.28)" }}>
          <div style={{ flex: 1 }}><div className="cap">เพื่อนติดเรา</div><div style={{ fontSize: 16, fontWeight: 600 }}><Money value={owed} /></div></div>
          <div style={{ flex: 1 }}><div className="cap">เราติดเพื่อน</div><div style={{ fontSize: 16, fontWeight: 600 }}><Money value={owe} /></div></div>
          <div style={{ flex: 1 }}><div className="cap">ทริป</div><div style={{ fontSize: 16, fontWeight: 600 }}>{trips.length} ทริป</div></div>
        </div>
      </div>
      <div className="sec">
        <h2>ทริปของฉัน</h2>
        <button className="more" onClick={() => setNewTripForm(true)}>+ สร้างทริป</button>
      </div>
      <div className="grid g2">
        {sorted.map((t) => {
          const st = tStatus(t.startOn, t.endOn, todayISO);
          const foreign = t.currency !== "THB";
          const me = t.mineBalance;
          const dates = t.startOn ? dShort(t.startOn, todayISO) + (t.endOn && t.endOn !== t.startOn ? ` – ${dShort(t.endOn, todayISO)}` : "") : "ยังไม่ระบุวัน";
          return (
            <button key={t.id} className="card card-pad trip-card" onClick={() => router.push(`/trips/${t.id}`)}>
              <span className="trip-card-top">
                <span className="ic" style={{ background: "var(--accent-soft)" }}><Icon name="trip" size={18} color="var(--accent-deep)" /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="row-t" style={{ fontWeight: 600 }}>{t.name}</span>
                  <span className="row-s">{dates} · {t.members.length} คน{foreign ? ` · ${t.currency}` : ""}</span>
                </span>
                <span className={"badge " + st.tone}>{st.text}</span>
              </span>
              <span className="trip-card-mid">
                <span>
                  <span className="cap">ใช้ทั้งทริป</span>
                  <span style={{ display: "block", fontSize: 22, fontWeight: 600 }}>{fmtC(t.total, t.currency)}</span>
                  {foreign && <span className="row-s num">≈ <Money value={t.total * t.rate} /></span>}
                </span>
                {Math.abs(me) > 0.01 ? (
                  <span style={{ textAlign: "right" }}>
                    <span className="cap">{me > 0 ? "ฉันได้คืน" : "ฉันต้องจ่าย"}</span>
                    <span style={{ display: "block", fontSize: 16, fontWeight: 600, color: me > 0 ? "var(--pos)" : "var(--neg)" }}>{fmtC(Math.abs(me), t.currency)}</span>
                  </span>
                ) : (
                  t.hasExpenses && <span className="badge green">เคลียร์ครบ</span>
                )}
              </span>
              <AvatarStack people={t.members} />
            </button>
          );
        })}
        <button className="trip-add" onClick={() => setNewTripForm(true)}>
          <span className="wcard-plus"><Icon name="plus" size={20} /></span>
          สร้างทริปใหม่
        </button>
      </div>
      {newTripForm && (
        <TripForm
          friends={friends}
          onClose={() => setNewTripForm(false)}
          onCreated={(id) => router.push(`/trips/${id}`)}
        />
      )}
    </>
  );
}
