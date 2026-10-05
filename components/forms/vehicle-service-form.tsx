"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { createVehicleService, deleteVehicleService, updateVehicleService } from "@/lib/actions/vehicle-services";
import type { VehiclePickItem } from "@/components/forms/fuel-log-form";
import { SVC_CATEGORIES } from "@/lib/domain/vehicle";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export interface VehicleServiceFormInitial {
  id: string;
  vehicleId: string;
  category: string | null;
  name: string;
  date: string;
  mileage: number | null;
  cost: number;
  provider: string | null;
  note: string | null;
  items: { name: string; price: number }[];
  receiptUrl: string | null;
}

interface Line {
  key: string;
  name: string;
  price: string;
  free: boolean;
}

let lineSeq = 0;
function blankLine(price = ""): Line {
  return { key: `s${++lineSeq}`, name: "", price, free: false };
}

export function VehicleServiceForm({
  vehicles,
  defaultVehicleId,
  initial,
  accounts,
  cards,
  onClose,
}: {
  vehicles: VehiclePickItem[];
  defaultVehicleId: string;
  initial?: VehicleServiceFormInitial;
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? defaultVehicleId);
  const [category, setCategory] = useState(initial?.category ?? SVC_CATEGORIES[0][0]);
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISOInBangkok());
  const [mileage, setMileage] = useState(initial?.mileage != null ? String(initial.mileage) : initial ? "" : String(vehicles.find((v) => v.id === defaultVehicleId)?.mileage ?? ""));
  const [provider, setProvider] = useState(initial?.provider ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [lines, setLines] = useState<Line[]>(
    initial?.items.length ? initial.items.map((it) => ({ key: `s${++lineSeq}`, name: it.name, price: it.price ? String(it.price) : "", free: !it.price })) : [blankLine()],
  );
  const [receipt, setReceipt] = useState<File | null>(null);
  const [paySrc, setPaySrc] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const total = Math.round(lines.reduce((s, l) => s + (l.free ? 0 : parseFloat(l.price) || 0), 0) * 100) / 100;
  const hasVat = lines.some((l) => /vat/i.test(l.name));
  const valid = name.trim().length > 0;

  if (!vehicles.length) {
    return (
      <FormModal title="ซ่อมบำรุง" onClose={onClose} onSave={onClose} valid={false}>
        <div className="empty">ยังไม่มีรถ — เพิ่มรถในหน้ารถยนต์ก่อน</div>
      </FormModal>
    );
  }

  const handleAddVat = () => {
    const sub = lines.reduce((s, l) => s + (l.free ? 0 : parseFloat(l.price) || 0), 0);
    setLines((ls) => [...ls, { key: `s${++lineSeq}`, name: "VAT 7%", price: String(Math.round(sub * 7) / 100), free: false }]);
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const items = lines
      .filter((l) => l.name.trim() || parseFloat(l.price) || l.free)
      .map((l) => ({ name: l.name.trim() || "รายการ", price: l.free ? 0 : parseFloat(l.price) || 0 }));
    const fd = new FormData();
    fd.set("category", category);
    fd.set("name", name);
    fd.set("date", date);
    fd.set("mileage", mileage || "");
    fd.set("provider", provider);
    fd.set("note", note);
    fd.set("items", JSON.stringify(items));
    if (receipt) fd.set("receipt", receipt);
    if (!initial && paySrc) {
      fd.set("paySrc", paySrc);
      fd.set("paySrcKind", cards.some((c) => c.id === paySrc) ? "card" : "account");
    }
    if (initial) {
      const res = await updateVehicleService(initial.id, initial.vehicleId, fd);
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
    const res = await createVehicleService(vehicleId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("บันทึกค่าใช้จ่ายรถแล้ว", async () => {
        await deleteVehicleService(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteVehicleService(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบประวัติแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขรายการรถ" : "บันทึกซ่อมบำรุง / ค่าใช้จ่ายรถ"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      {!initial && vehicles.length > 1 && (
        <Field label="รถ">
          <select value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setMileage(String(vehicles.find((v) => v.id === e.target.value)?.mileage ?? "")); }}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="หมวด">
        <div className="chips">
          {SVC_CATEGORIES.map(([c]) => (
            <button key={c} type="button" className={"chip" + (category === c ? " on" : "")} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      </Field>
      <Field label="หัวข้อ">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช็กระยะ 10,000 กม." autoFocus={!initial} />
      </Field>
      <FieldGrid>
        <Field label="เลขไมล์ (ไม่บังคับ)">
          <input value={mileage} onChange={(e) => setMileage(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="วันที่">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label="ร้าน / ศูนย์">
        <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="ไม่บังคับ" />
      </Field>
      <Field label="รายการย่อย">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lines.map((l, k) => (
            <div key={l.key} className="field svc-item">
              <input style={{ flex: 1, minWidth: 0 }} value={l.name} onChange={(e) => setLine(l.key, { name: e.target.value })} placeholder={k ? "เช่น กรองน้ำมันเครื่อง" : "เช่น น้ำมันเครื่อง 7 ลิตร"} />
              {l.free ? (
                <span className="svc-free">ฟรี</span>
              ) : (
                <input className="num" style={{ width: 96 }} value={l.price} onChange={(e) => setLine(l.key, { price: e.target.value })} inputMode="decimal" placeholder="0" />
              )}
              <button type="button" className={"chip" + (l.free ? " on" : "")} onClick={() => setLine(l.key, { free: !l.free })}>ฟรี</button>
              {lines.length > 1 && (
                <button type="button" className="btn icon-btn" aria-label="ลบรายการ" onClick={() => setLines((ls) => ls.filter((y) => y.key !== l.key))}>
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" className="btn btn-sm" onClick={() => setLines((ls) => [...ls, blankLine()])}>
              <Icon name="plus" size={14} />
              เพิ่มรายการ
            </button>
            {!hasVat && (
              <button type="button" className="btn btn-sm" onClick={handleAddVat}>+ VAT 7%</button>
            )}
            <span style={{ marginLeft: "auto", fontSize: 14 }}>
              รวม <b style={{ fontSize: 18 }}><Money value={total} /></b>
            </span>
          </div>
        </div>
      </Field>
      <Field label="หมายเหตุ">
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ไม่บังคับ" style={{ resize: "vertical" }} />
      </Field>
      <Field label="ใบเสร็จ">
        {initial?.receiptUrl && (
          <div className="hint" style={{ margin: "0 0 8px" }}>
            มีไฟล์แล้ว — <a href={initial.receiptUrl} target="_blank" rel="noreferrer">เปิดไฟล์ปัจจุบัน</a>, เลือกไฟล์ใหม่เพื่อแทนที่
          </div>
        )}
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
      </Field>
      {!initial && (
        <Field label="จ่ายจาก">
          <select value={paySrc} onChange={(e) => setPaySrc(e.target.value)}>
            <option value="">ไม่บันทึกรายจ่าย</option>
            <optgroup label="บัญชี / กระเป๋าเงิน">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </optgroup>
            {cards.length > 0 && (
              <optgroup label="บัตรเครดิต">
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </Field>
      )}
    </FormModal>
  );
}
