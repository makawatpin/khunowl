"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { PersonChip, type TripPerson } from "@/components/ui/avatar";
import { createTrip, deleteTrip, updateTrip } from "@/lib/actions/trips";
import { TRIP_CURRENCIES } from "@/lib/domain/trips";
import { useToast } from "@/components/providers/toast-provider";
import { addDays } from "@/lib/domain/dates";
import { todayISOInBangkok } from "@/lib/dates/today";

const ME: TripPerson = { id: "me", name: "ฉัน", color: "var(--accent-deep)" };

export interface TripFormInitial {
  id: string;
  name: string;
  startOn: string | null;
  endOn: string | null;
  currency: string;
  rate: number;
  memberFriendIds: string[];
}

export function TripForm({
  initial,
  friends,
  usedFriendIds,
  onClose,
  onCreated,
}: {
  initial?: TripFormInitial;
  friends: TripPerson[];
  usedFriendIds?: ReadonlySet<string>;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [startOn, setStartOn] = useState(initial?.startOn ?? addDays(todayISOInBangkok(), 14));
  const [endOn, setEndOn] = useState(initial?.endOn ?? addDays(todayISOInBangkok(), 17));
  const [currency, setCurrency] = useState(initial?.currency ?? "THB");
  const [rate, setRate] = useState(String(initial?.rate ?? 1));
  const [selected, setSelected] = useState<Set<string>>(new Set(initial?.memberFriendIds ?? []));
  const [newNames, setNewNames] = useState<string[]>([]);
  const [newNameInput, setNewNameInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const foreign = currency !== "THB";
  const totalMembers = selected.size + newNames.length;
  const valid = name.trim().length > 0 && totalMembers >= 1 && (!foreign || parseFloat(rate) > 0);

  const toggleFriend = (id: string) => {
    if (usedFriendIds?.has(id) && selected.has(id)) {
      show("คนนี้มีค่าใช้จ่ายในทริปแล้ว เอาออกไม่ได้");
      return;
    }
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addNewName = () => {
    const v = newNameInput.trim();
    if (!v) return;
    setNewNames((n) => [...n, v]);
    setNewNameInput("");
  };

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    const info = TRIP_CURRENCIES.find((c) => c.code === code);
    if (info) setRate(String(info.defaultRate));
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("startOn", startOn);
    fd.set("endOn", endOn);
    fd.set("currency", currency);
    fd.set("rate", foreign ? rate : "1");
    for (const id of selected) fd.append("friendId", id);
    for (const n of newNames) fd.append("newFriendName", n);
    return fd;
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = buildFormData();
    if (initial) {
      const res = await updateTrip(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกทริปแล้ว");
      return;
    }
    const res = await createTrip(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      show("สร้างทริปแล้ว");
      onCreated?.(res.id);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteTrip(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบทริปแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขทริป" : "สร้างทริปใหม่"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
      saveLabel={initial ? "บันทึก" : "สร้างทริป"}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อทริป">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น เที่ยวเชียงใหม่" autoFocus={!initial} />
      </Field>
      <FieldGrid>
        <Field label="วันเริ่ม">
          <input type="date" value={startOn} onChange={(e) => setStartOn(e.target.value)} />
        </Field>
        <Field label="วันกลับ">
          <input type="date" value={endOn} onChange={(e) => setEndOn(e.target.value)} />
        </Field>
        <Field label="สกุลเงินของทริป">
          <select value={currency} onChange={(e) => handleCurrencyChange(e.target.value)}>
            {TRIP_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} · {c.nameTh}</option>
            ))}
          </select>
        </Field>
        {foreign ? (
          <Field label={`1 ${currency} = กี่บาท`}>
            <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
          </Field>
        ) : (
          <div />
        )}
      </FieldGrid>
      <Field label={`สมาชิก (${totalMembers + 1} คน)`}>
        <div className="chips">
          <PersonChip person={ME} on disabled />
          {friends.map((p) => (
            <PersonChip key={p.id} person={p} on={selected.has(p.id)} onClick={() => toggleFriend(p.id)} />
          ))}
          {newNames.map((n, i) => (
            <PersonChip key={`new-${i}`} person={{ id: `new-${i}`, name: n, color: "var(--ink-faint)" }} on onClick={() => setNewNames((ns) => ns.filter((_, k) => k !== i))} />
          ))}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: -4 }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <input
            value={newNameInput}
            onChange={(e) => setNewNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNewName();
              }
            }}
            placeholder="เพิ่มชื่อเพื่อนใหม่"
          />
        </div>
        <button type="button" className="btn" onClick={addNewName} disabled={!newNameInput.trim()}>เพิ่ม</button>
      </div>
      {totalMembers < 1 && <div className="hint">เลือกเพื่อนอย่างน้อย 1 คน</div>}
    </FormModal>
  );
}
