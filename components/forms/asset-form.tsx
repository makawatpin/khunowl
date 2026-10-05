"use client";

import { useState } from "react";
import { attachUpload } from "@/lib/client/upload";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createAsset, deleteAsset, updateAsset } from "@/lib/actions/assets";
import { ASSET_KINDS } from "@/lib/domain/things";
import { addMonths } from "@/lib/domain/dates";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export interface AssetFormInitial {
  id: string;
  name: string;
  kind: string | null;
  brand: string | null;
  model: string | null;
  serial: string | null;
  price: number | null;
  purchasedOn: string | null;
  store: string | null;
  warrantyUntil: string | null;
  note: string | null;
  sold: boolean;
  receiptUrl?: string | null;
}

const WARRANTY_YEARS = [1, 2, 3, 5, 10];

export function AssetForm({
  initial,
  accounts,
  onClose,
}: {
  initial?: AssetFormInitial;
  accounts: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState(initial?.kind ?? ASSET_KINDS[0]);
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [serial, setSerial] = useState(initial?.serial ?? "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [purchasedOn, setPurchasedOn] = useState(initial?.purchasedOn ?? todayISOInBangkok());
  const [store, setStore] = useState(initial?.store ?? "");
  const [warrantyUntil, setWarrantyUntil] = useState(initial?.warrantyUntil ?? addMonths(todayISOInBangkok(), 12));
  const [note, setNote] = useState(initial?.note ?? "");
  const [sold, setSold] = useState(initial?.sold ?? false);
  const [paySrc, setPaySrc] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;

  const buildFormData = () => {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("kind", kind);
    fd.set("brand", brand);
    fd.set("model", model);
    fd.set("serial", serial);
    fd.set("price", price || "0");
    fd.set("purchasedOn", purchasedOn);
    fd.set("store", store);
    fd.set("warrantyUntil", warrantyUntil);
    fd.set("note", note);
    if (sold) fd.set("sold", "on");
    if (!initial && paySrc) fd.set("paySrc", paySrc);
    return fd;
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = buildFormData();
    const uploadErr = await attachUpload(fd, "receiptPath", receipt, "receipts");
    if (uploadErr) {
      setPending(false);
      setError(uploadErr);
      return;
    }
    if (initial) {
      const res = await updateAsset(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกแล้ว");
      return;
    }
    const res = await createAsset(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("เพิ่มทรัพย์สินแล้ว", async () => {
        await deleteAsset(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteAsset(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบทรัพย์สินแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขทรัพย์สิน" : "เพิ่มของที่ซื้อ / ทรัพย์สิน"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
      saveLabel={initial ? (sold ? "บันทึก (ขายแล้ว)" : "บันทึก") : "เพิ่ม"}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อ">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น เครื่องซักผ้าฝาหน้า" autoFocus={!initial} />
      </Field>
      <FieldGrid>
        <Field label="ประเภท">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {ASSET_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="แบรนด์">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Electrolux" />
        </Field>
        <Field label="รุ่น / โมเดล">
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="EWF8025CQWA 8 kg" />
        </Field>
        <Field label="ซีเรียล (S/N)">
          <input value={serial} onChange={(e) => setSerial(e.target.value)} />
        </Field>
        <Field label="ราคาที่จ่ายจริง">
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="วันที่ซื้อ">
          <input type="date" value={purchasedOn} onChange={(e) => setPurchasedOn(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label="ร้าน / ผู้ขาย">
        <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="เช่น Electrolux Official Mall" />
      </Field>
      <Field label="ประกันถึงวันที่">
        <input type="date" value={warrantyUntil} onChange={(e) => setWarrantyUntil(e.target.value)} />
      </Field>
      <div className="chips" style={{ marginTop: -6, marginBottom: 14 }}>
        {WARRANTY_YEARS.map((y) => (
          <button
            key={y}
            type="button"
            className={"chip" + (warrantyUntil === addMonths(purchasedOn || todayISOInBangkok(), y * 12) ? " on" : "")}
            onClick={() => setWarrantyUntil(addMonths(purchasedOn || todayISOInBangkok(), y * 12))}
          >
            ประกัน {y} ปี
          </button>
        ))}
        <button type="button" className={"chip" + (!warrantyUntil ? " on" : "")} onClick={() => setWarrantyUntil("")}>
          ไม่มี
        </button>
      </div>
      <Field label="ใบเสร็จ / รูปถ่าย">
        {initial?.receiptUrl && (
          <div className="hint" style={{ margin: "0 0 8px" }}>
            มีไฟล์แล้ว — <a href={initial.receiptUrl} target="_blank" rel="noreferrer">เปิดไฟล์ปัจจุบัน</a>, เลือกไฟล์ใหม่เพื่อแทนที่
          </div>
        )}
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
      </Field>
      <Field label="หมายเหตุ">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น เบอร์ศูนย์บริการ, ของแถม, เงื่อนไขประกัน" />
      </Field>
      {initial && (
        <label className="check">
          <input type="checkbox" checked={sold} onChange={(e) => setSold(e.target.checked)} />
          ขาย / ปลดระวางแล้ว
        </label>
      )}
      {!initial && (
        <Field label="บันทึกเป็นรายจ่ายด้วย">
          <select value={paySrc} onChange={(e) => setPaySrc(e.target.value)}>
            <option value="">ไม่ต้องบันทึก</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      )}
    </FormModal>
  );
}
