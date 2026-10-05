"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field } from "@/components/ui/form-modal";
import { Avatar, PersonChip, type TripPerson } from "@/components/ui/avatar";
import { usePrefs } from "@/components/providers/prefs-provider";
import { Icon } from "@/components/ui/icon";
import { createTripExpense, deleteTripExpense, updateTripExpense } from "@/lib/actions/trip-expenses";
import { fmtC, TRIP_CATEGORIES, type SplitMode } from "@/lib/domain/trips";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";
import type { Database } from "@/lib/db.types";

type DbSplitMode = Database["public"]["Enums"]["split_mode"];
const MODES: { mode: SplitMode; label: string }[] = [
  { mode: "equal", label: "หารเท่ากัน" },
  { mode: "items", label: "แยกตามรายการ" },
  { mode: "custom", label: "กำหนดเอง" },
];

export interface TripExpenseFormInitial {
  id: string;
  title: string;
  category: string | null;
  paidBy: string;
  date: string | null;
  splitMode: DbSplitMode;
  amount: number;
  split: string[];
  shares: Record<string, number>;
  items: { name: string; price: number; people: string[] }[];
}

interface Line {
  key: string;
  name: string;
  price: string;
  people: string[];
}

let lineSeq = 0;
function blankLine(allMemberIds: string[]): Line {
  return { key: `i${++lineSeq}`, name: "", price: "", people: [...allMemberIds] };
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export function TripExpenseForm({
  tripId,
  members,
  currency,
  rate,
  initial,
  onClose,
}: {
  tripId: string;
  members: TripPerson[];
  currency: string;
  rate: number;
  initial?: TripExpenseFormInitial;
  onClose: () => void;
}) {
  const { hide } = usePrefs();
  const router = useRouter();
  const { show } = useToast();
  const memberIds = members.map((m) => m.id);
  const [mode, setMode] = useState<SplitMode>(initial?.splitMode ?? "equal");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? TRIP_CATEGORIES[0][0]);
  const [paidBy, setPaidBy] = useState(initial?.paidBy ?? memberIds[0] ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISOInBangkok());
  const [amount, setAmount] = useState(initial && initial.splitMode !== "items" ? String(initial.amount) : "");
  const [split, setSplit] = useState<string[]>(initial?.split.length ? initial.split : [...memberIds]);
  const [lines, setLines] = useState<Line[]>(
    initial?.items.length ? initial.items.map((it) => ({ key: `i${++lineSeq}`, name: it.name, price: String(it.price), people: it.people })) : [blankLine(memberIds)],
  );
  const [shares, setShares] = useState<Record<string, string>>(
    initial?.shares ? Object.fromEntries(Object.entries(initial.shares).map(([k, v]) => [k, String(v)])) : {},
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amt = mode === "items" ? lines.reduce((s, l) => s + (parseFloat(l.price) || 0), 0) : parseFloat(amount) || 0;
  const remain = round2(amt - memberIds.reduce((s, id) => s + (parseFloat(shares[id]) || 0), 0));
  const okRemain = Math.abs(remain) <= 0.05;
  const valid =
    amt > 0 &&
    (mode === "equal" ? split.length > 0 : mode === "items" ? lines.every((l) => !parseFloat(l.price) || l.people.length > 0) : okRemain);

  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const setLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const evenShares = () => setShares(Object.fromEntries(memberIds.map((id) => [id, String(round2(amt / memberIds.length))])));

  const handleModeChange = (m: SplitMode) => {
    setMode(m);
    if (m === "custom" && !Object.keys(shares).length && amt) {
      setShares(Object.fromEntries(memberIds.map((id) => [id, String(round2(amt / memberIds.length))])));
    }
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("title", title.trim() || category);
    fd.set("category", category);
    fd.set("date", date);
    fd.set("splitMode", mode);
    fd.set("paidBy", paidBy);
    if (mode === "items") {
      const items = lines.filter((l) => parseFloat(l.price) > 0).map((l) => ({ name: l.name.trim() || "รายการ", price: parseFloat(l.price) || 0, people: memberIds.filter((id) => l.people.includes(id)) }));
      fd.set("items", JSON.stringify(items));
    } else if (mode === "custom") {
      fd.set("amount", String(amt));
      const shareRows = Object.fromEntries(memberIds.filter((id) => parseFloat(shares[id]) > 0).map((id) => [id, parseFloat(shares[id]) || 0]));
      fd.set("shares", JSON.stringify(shareRows));
    } else {
      fd.set("amount", String(amt));
      for (const id of memberIds.filter((id) => split.includes(id))) fd.append("split", id);
    }

    if (initial) {
      const res = await updateTripExpense(initial.id, tripId, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกการแก้ไขแล้ว");
      return;
    }
    const res = await createTripExpense(tripId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show(`เพิ่มค่าใช้จ่าย ${fmtC(amt, currency)} แล้ว`, async () => {
        await deleteTripExpense(id, tripId);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteTripExpense(initial.id, tripId);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบรายการแล้ว");
  };

  const personOf = (id: string) => members.find((m) => m.id === id) ?? { id, name: "?", color: "#A4A8AD" };

  return (
    <FormModal
      title={initial ? "แก้ไขค่าใช้จ่ายทริป" : "เพิ่มค่าใช้จ่ายทริป"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <div className="seg" style={{ marginBottom: 14 }}>
        {MODES.map(({ mode: m, label }) => (
          <button key={m} type="button" className={mode === m ? "on" : ""} onClick={() => handleModeChange(m)}>{label}</button>
        ))}
      </div>
      {mode !== "items" ? (
        <Field label={`จำนวนเงิน (${currency})`}>
          <input className="big-num" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" autoFocus={!initial} />
        </Field>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <div className="cap">ยอดรวมทุกรายการ</div>
          <div style={{ fontSize: 26, fontWeight: 600 }}>{fmtC(amt, currency, hide)}</div>
        </div>
      )}
      {currency !== "THB" && amt > 0 && (
        <div className="hint" style={{ margin: "-8px 2px 14px" }}>≈ {fmtC(amt * rate, "THB", hide)} (1 {currency} = ฿{rate})</div>
      )}
      <Field label="รายละเอียด">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={category} />
      </Field>
      <Field label="หมวด">
        <div className="chips">
          {TRIP_CATEGORIES.map(([c]) => (
            <button key={c} type="button" className={"chip" + (category === c ? " on" : "")} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      </Field>
      <Field label="ใครจ่าย">
        <div className="chips">
          {members.map((p) => (
            <PersonChip key={p.id} person={p} on={paidBy === p.id} onClick={() => setPaidBy(p.id)} />
          ))}
        </div>
      </Field>
      {mode === "equal" && (
        <Field label={`หารกับใคร · คนละ ${split.length && amt ? fmtC(amt / split.length, currency, hide) : "—"}`}>
          <div className="chips">
            {members.map((p) => (
              <PersonChip key={p.id} person={p} on={split.includes(p.id)} onClick={() => setSplit((s) => toggle(s, p.id))} />
            ))}
          </div>
        </Field>
      )}
      {mode === "items" && (
        <Field label="รายการ (เลือกคนที่กินหรือใช้รายการนั้น)">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lines.map((l, k) => (
              <div key={l.key} className="card card-flat" style={{ padding: 12 }}>
                <div className="field" style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                  <input style={{ flex: 1, minWidth: 0 }} value={l.name} placeholder={`รายการที่ ${k + 1}`} onChange={(e) => setLine(l.key, { name: e.target.value })} />
                  <input className="num" style={{ width: 110 }} inputMode="decimal" placeholder="0" value={l.price} onChange={(e) => setLine(l.key, { price: e.target.value })} />
                  {lines.length > 1 && (
                    <button type="button" className="btn icon-btn" onClick={() => setLines((ls) => ls.filter((y) => y.key !== l.key))} aria-label="ลบรายการ">
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>
                <div className="chips">
                  {members.map((p) => (
                    <PersonChip key={p.id} person={p} on={l.people.includes(p.id)} onClick={() => setLine(l.key, { people: toggle(l.people, p.id) })} />
                  ))}
                </div>
                {parseFloat(l.price) > 0 && (
                  <div className="hint" style={{ marginTop: 8, color: l.people.length ? undefined : "var(--neg)" }}>
                    {l.people.length ? `คนละ ${fmtC(parseFloat(l.price) / l.people.length, currency, hide)}` : "เลือกอย่างน้อย 1 คน"}
                  </div>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setLines((ls) => [...ls, blankLine(memberIds)])}>
              <Icon name="plus" size={14} />
              เพิ่มรายการ
            </button>
          </div>
        </Field>
      )}
      {mode === "custom" && (
        <Field label="แต่ละคนต้องจ่ายเท่าไร">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {memberIds.map((id) => (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar person={personOf(id)} size={30} />
                <span style={{ flex: 1 }}>{personOf(id).name}</span>
                <input className="num" style={{ width: 130 }} inputMode="decimal" placeholder="0" value={shares[id] || ""} onChange={(e) => setShares((s) => ({ ...s, [id]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <span className="hint" style={{ margin: 0, flex: 1, color: okRemain && amt ? "var(--pos)" : "var(--neg)" }}>
                {!amt ? "ใส่จำนวนเงินก่อน" : okRemain ? "ยอดรวมตรงกันแล้ว" : remain > 0 ? `ยังขาดอีก ${fmtC(remain, currency, hide)}` : `เกินมา ${fmtC(-remain, currency, hide)}`}
              </span>
              <button type="button" className="btn btn-sm" onClick={evenShares} disabled={!amt}>แบ่งเท่ากัน</button>
            </div>
          </div>
        </Field>
      )}
      <Field label="วันที่">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
    </FormModal>
  );
}
