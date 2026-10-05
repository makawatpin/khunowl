"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarStack, type TripPerson } from "@/components/ui/avatar";
import { TripForm, type TripFormInitial } from "@/components/forms/trip-form";
import { TripExpenseForm, type TripExpenseFormInitial } from "@/components/forms/trip-expense-form";
import { TripSettleForm } from "@/components/forms/trip-settle-form";
import { deleteTripSettlement } from "@/lib/actions/trip-settlements";
import { fmtC, tBalances, tSettle, tShares, tTotal, tripCatIcon, type Trip, type TripExpense } from "@/lib/domain/trips";
import { dShort } from "@/lib/format/date";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";
import type { Database } from "@/lib/db.types";

type DbSplitMode = Database["public"]["Enums"]["split_mode"];

export interface TripDetailExpense {
  id: string;
  title: string;
  category: string | null;
  date: string | null;
  paidBy: string;
  splitMode: DbSplitMode;
  amount: number;
  split: string[];
  shares: Record<string, number>;
  items: { name: string; price: number; people: string[] }[];
}

export interface TripDetailSettlement {
  id: string;
  from: string;
  to: string;
  amt: number;
  date: string;
  hasTxn: boolean;
}

export interface TripDetailData {
  id: string;
  name: string;
  startOn: string | null;
  endOn: string | null;
  currency: string;
  rate: number;
  meId: string;
  members: TripPerson[];
  /** trip_member.id -> friends.id, for every member except "me" — paid_by/shares/items.people
   * all reference trip_members.id, but TripForm's friend picker (and `friends` table) works in
   * friends.id space, so this map translates between the two when editing membership. */
  memberFriendIds: Record<string, string>;
  expenses: TripDetailExpense[];
  settlements: TripDetailSettlement[];
}

export function TripDetailClient({
  trip,
  friends,
  accounts,
}: {
  trip: TripDetailData;
  friends: TripPerson[];
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { show } = useToast();
  const todayISO = todayISOInBangkok();
  const [openExpId, setOpenExpId] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState(false);
  const [expenseForm, setExpenseForm] = useState<"new" | TripDetailExpense | null>(null);
  const [settleTarget, setSettleTarget] = useState<{ from: string; to: string; amt: number } | null>(null);

  const C = (a: number) => fmtC(a, trip.currency);
  const foreign = trip.currency !== "THB";
  const personOf = (id: string): TripPerson => trip.members.find((m) => m.id === id) ?? { id, name: "?", color: "#A4A8AD" };

  const domainTrip: Trip = {
    members: trip.members.map((m) => m.id),
    expenses: trip.expenses.map((e) => ({ id: e.id, paidBy: e.paidBy, splitMode: e.splitMode, amount: e.amount, split: e.split, shares: e.shares, items: e.items })),
    settlements: trip.settlements.map((s) => ({ from: s.from, to: s.to, amt: s.amt })),
  };
  const tot = tTotal(domainTrip);
  const bal = tBalances(domainTrip);
  const me = bal[trip.meId] || 0;
  const mineTotal = trip.expenses.reduce((s, e) => s + (tShares(e as TripExpense)[trip.meId] || 0), 0);
  const txs = tSettle(domainTrip);
  const maxAbs = Math.max(1, ...trip.members.map((m) => Math.abs(bal[m.id] || 0)));
  const exps = [...trip.expenses].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const toFriendId = (memberId: string) => trip.memberFriendIds[memberId];
  const usedFriendIds = new Set<string>();
  for (const e of trip.expenses) {
    if (e.paidBy !== trip.meId) usedFriendIds.add(toFriendId(e.paidBy));
    for (const id of Object.keys(e.shares)) if (id !== trip.meId) usedFriendIds.add(toFriendId(id));
    for (const it of e.items) for (const id of it.people) if (id !== trip.meId) usedFriendIds.add(toFriendId(id));
  }

  const tripFormInitial: TripFormInitial = {
    id: trip.id, name: trip.name, startOn: trip.startOn, endOn: trip.endOn, currency: trip.currency, rate: trip.rate,
    memberFriendIds: Object.values(trip.memberFriendIds),
  };

  const handleUnsettle = async (s: TripDetailSettlement) => {
    if (!window.confirm(`ยกเลิกรายการเคลียร์ ${personOf(s.from).name} → ${personOf(s.to).name}?`)) return;
    const res = await deleteTripSettlement(s.id, trip.id);
    if (res.error) return show(res.error);
    router.refresh();
    show("ยกเลิกการเคลียร์แล้ว");
  };

  return (
    <>
      <Link href="/trips" className="btn btn-sm" style={{ marginBottom: 14, display: "inline-flex" }}>
        <Icon name="back" size={14} />
        ทริปทั้งหมด
      </Link>
      <div className="hero">
        <div className="cap">
          {dShort(trip.startOn, todayISO)}
          {trip.endOn && trip.endOn !== trip.startOn ? ` – ${dShort(trip.endOn, todayISO)}` : ""} · {trip.members.length} คน
          {foreign ? ` · 1 ${trip.currency} = ฿${trip.rate}` : ""}
        </div>
        <div className="num" style={{ fontSize: 32, fontWeight: 600, margin: "6px 0 2px" }}>{trip.name}</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)" }}>ใช้ทั้งทริป {C(tot)}</div>
        <div style={{ display: "flex", gap: 18, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.28)", flexWrap: "wrap" }}>
          {foreign && (
            <div style={{ flex: 1, minWidth: 100 }}>
              <div className="cap">≈ เงินไทย</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{fmtC(tot * trip.rate, "THB")}</div>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 100 }}>
            <div className="cap">ส่วนของฉัน</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{C(mineTotal)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <div className="cap">{me >= 0 ? "ฉันได้คืน" : "ฉันต้องจ่าย"}</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{C(Math.abs(me))}</div>
          </div>
        </div>
      </div>
      <div className="actbar">
        <button className="btn btn-primary" onClick={() => setExpenseForm("new")}>
          <Icon name="plus" size={15} color="currentColor" />
          เพิ่มค่าใช้จ่าย
        </button>
        <button className="btn" onClick={() => setEditingTrip(true)}>
          <Icon name="edit" size={15} />
          แก้ไขทริป
        </button>
      </div>
      <div className="dash" style={{ marginTop: 4 }}>
        <div style={{ minWidth: 0 }}>
          <div className="sec"><h2>ค่าใช้จ่าย ({trip.expenses.length})</h2></div>
          <div className="card list">
            {exps.length ? (
              exps.map((e) => {
                const expense = { id: e.id, paidBy: e.paidBy, splitMode: e.splitMode, amount: e.amount, split: e.split, shares: e.shares, items: e.items } as TripExpense;
                const amt = e.splitMode === "items" ? e.items.reduce((s, it) => s + it.price, 0) : e.amount;
                const sh = tShares(expense);
                const n = Object.values(sh).filter((v) => v > 0.001).length;
                const badge = e.splitMode === "items" ? "แยกรายการ" : e.splitMode === "custom" ? "กำหนดเอง" : null;
                const open = openExpId === e.id;
                return (
                  <div key={e.id} className="trip-exp">
                    <button className="row rowlink" onClick={() => setOpenExpId(open ? null : e.id)}>
                      <span className="ic"><Icon name={tripCatIcon(e.category)} size={17} color="var(--ink-soft)" /></span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span className="row-t" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                          {badge && <span className="badge accent">{badge}</span>}
                        </span>
                        <span className="row-s">{personOf(e.paidBy).name} จ่าย · {e.splitMode === "items" ? `${e.items.length} รายการ` : `หาร ${n} คน`} · {dShort(e.date, todayISO)}</span>
                      </span>
                      <span style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ display: "block", fontWeight: 600 }}>{C(amt)}</span>
                        <span className="row-s">{foreign ? `≈ ${fmtC(amt * trip.rate, "THB")}` : e.splitMode === "equal" && n ? `คนละ ${C(amt / n)}` : ""}</span>
                      </span>
                    </button>
                    {open && (
                      <div className="trip-exp-body">
                        {e.splitMode === "items" &&
                          e.items.map((it, k) => (
                            <div key={k} className="trip-item">
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13.5 }}>
                                <span>{it.name}</span>
                                <span className="num" style={{ fontWeight: 600 }}>{C(it.price)}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <AvatarStack people={it.people.map(personOf)} size={22} />
                                <span className="row-s">{it.people.length > 1 ? `คนละ ${C(it.price / it.people.length)}` : `${personOf(it.people[0]).name} คนเดียว`}</span>
                              </div>
                            </div>
                          ))}
                        <div className="cap">ส่วนของแต่ละคน</div>
                        {Object.entries(sh).filter(([, v]) => v > 0.001).sort((a, b) => b[1] - a[1]).map(([id, v]) => (
                          <div key={id} className="share-row">
                            <Avatar person={personOf(id)} size={24} />
                            <span style={{ flex: 1 }}>{personOf(id).name}</span>
                            <span className="num" style={{ fontWeight: 600 }}>{C(v)}</span>
                          </div>
                        ))}
                        <div>
                          <button className="btn btn-sm" onClick={() => setExpenseForm(e)}>
                            <Icon name="edit" size={14} />
                            แก้ไข
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty">ยังไม่มีค่าใช้จ่ายในทริปนี้</div>
            )}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="sec"><h2>ใครต้องโอนให้ใคร</h2></div>
          <div className="card list">
            {txs.length ? (
              txs.map((x, i) => (
                <div key={i} className="row settle-row">
                  <span className="avs">
                    <Avatar person={personOf(x.from)} size={30} />
                    <Avatar person={personOf(x.to)} size={30} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="row-t">{personOf(x.from).name} โอนให้ {personOf(x.to).name}</span>
                    <span className="row-s">{C(x.amt)}{foreign ? ` · ≈ ${fmtC(x.amt * trip.rate, "THB")}` : ""}</span>
                  </span>
                  <button className="btn btn-sm" onClick={() => setSettleTarget(x)}>
                    <Icon name="check" size={14} />
                    เคลียร์แล้ว
                  </button>
                </div>
              ))
            ) : (
              <div className="empty">{trip.expenses.length ? "เคลียร์ครบทุกคนแล้ว" : "ยังไม่มียอดต้องโอน"}</div>
            )}
          </div>
          <div className="sec"><h2>ยอดของแต่ละคน</h2></div>
          <div className="card card-pad">
            {trip.members.map((m, i) => {
              const v = bal[m.id] || 0;
              const z = Math.abs(v) < 0.01;
              return (
                <div key={m.id} style={{ display: "flex", gap: 11, alignItems: "center", marginTop: i ? 14 : 0 }}>
                  <Avatar person={m} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14, marginBottom: 5 }}>
                      <span>{m.name}</span>
                      <span className="num" style={{ fontWeight: 600, color: z ? "var(--ink-faint)" : v > 0 ? "var(--pos)" : "var(--neg)" }}>
                        {z ? "เคลียร์แล้ว" : (v > 0 ? "+" : "−") + C(Math.abs(v))}
                      </span>
                    </div>
                    <div className="bar"><i style={{ width: `${z ? 0 : (Math.abs(v) / maxAbs) * 100}%`, background: v > 0 ? "var(--pos)" : "var(--neg)" }} /></div>
                  </div>
                </div>
              );
            })}
            <div className="hint">บวก = ควรได้เงินคืน · ลบ = ต้องจ่ายเพิ่ม (รวมรายการที่เคลียร์แล้ว)</div>
          </div>
          {trip.settlements.length > 0 && (
            <>
              <div className="sec"><h2>เคลียร์แล้ว ({trip.settlements.length})</h2></div>
              <div className="card list">
                {[...trip.settlements].reverse().map((s) => (
                  <button key={s.id} className="row rowlink" onClick={() => handleUnsettle(s)}>
                    <span className="ic"><Icon name="check" size={17} color="var(--pos)" /></span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span className="row-t">{personOf(s.from).name} → {personOf(s.to).name}</span>
                      <span className="row-s">{dShort(s.date, todayISO)}{s.hasTxn ? " · บันทึกลงบัญชีแล้ว" : ""} · แตะเพื่อยกเลิก</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{C(s.amt)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {editingTrip && <TripForm initial={tripFormInitial} friends={friends} usedFriendIds={usedFriendIds} onClose={() => setEditingTrip(false)} />}
      {expenseForm === "new" && (
        <TripExpenseForm tripId={trip.id} members={trip.members} currency={trip.currency} rate={trip.rate} onClose={() => setExpenseForm(null)} />
      )}
      {expenseForm && expenseForm !== "new" && (
        <TripExpenseForm
          tripId={trip.id}
          members={trip.members}
          currency={trip.currency}
          rate={trip.rate}
          initial={toExpenseFormInitial(expenseForm)}
          onClose={() => setExpenseForm(null)}
        />
      )}
      {settleTarget && (
        <TripSettleForm
          tripId={trip.id}
          from={personOf(settleTarget.from)}
          to={personOf(settleTarget.to)}
          amount={settleTarget.amt}
          currency={trip.currency}
          rate={trip.rate}
          meId={trip.meId}
          accounts={accounts}
          onClose={() => setSettleTarget(null)}
        />
      )}
    </>
  );
}

function toExpenseFormInitial(e: TripDetailExpense): TripExpenseFormInitial {
  return { id: e.id, title: e.title, category: e.category, paidBy: e.paidBy, date: e.date, splitMode: e.splitMode, amount: e.amount, split: e.split, shares: e.shares, items: e.items };
}
