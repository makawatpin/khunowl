"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { createProjectBill, deleteProjectBill, updateProjectBill } from "@/lib/actions/project-bills";
import { billTotal } from "@/lib/domain/projects";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export interface ProjectBillFormInitial {
  id: string;
  date: string;
  shop: string | null;
  phase: string | null;
  note: string | null;
  items: { name: string; qty: number; price: number }[];
}

interface Line {
  key: string;
  name: string;
  qty: string;
  price: string;
}

let lineSeq = 0;
function blankLine(): Line {
  return { key: `l${++lineSeq}`, name: "", qty: "1", price: "" };
}

export function ProjectBillForm({
  projectId,
  phases,
  initial,
  accounts,
  onClose,
}: {
  projectId: string;
  phases: string[];
  initial?: ProjectBillFormInitial;
  accounts: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [date, setDate] = useState(initial?.date ?? todayISOInBangkok());
  const [shop, setShop] = useState(initial?.shop ?? "");
  const [phase, setPhase] = useState(initial?.phase ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [lines, setLines] = useState<Line[]>(
    initial?.items.length ? initial.items.map((it) => ({ key: `l${++lineSeq}`, name: it.name, qty: String(it.qty), price: String(it.price) })) : [blankLine()],
  );
  const [attachment, setAttachment] = useState<File | null>(null);
  const [paySrc, setPaySrc] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const items = lines.filter((l) => l.name.trim()).map((l) => ({ name: l.name.trim(), qty: parseFloat(l.qty) || 1, price: parseFloat(l.price) || 0 }));
  const total = billTotal(items);
  const valid = items.length > 0;

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("date", date);
    fd.set("shop", shop);
    fd.set("phase", phase);
    fd.set("note", note);
    fd.set("items", JSON.stringify(items));
    if (attachment) fd.set("attachment", attachment);
    if (!initial && paySrc) fd.set("paySrc", paySrc);
    if (initial) {
      const res = await updateProjectBill(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกบิลแล้ว");
      return;
    }
    const res = await createProjectBill(projectId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show(`บันทึกบิล ${total.toLocaleString()} บาทแล้ว`, async () => {
        await deleteProjectBill(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteProjectBill(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบบิลแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขบิล" : "บันทึกบิลวัสดุ / ค่าใช้จ่าย"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
      saveLabel={`บันทึก ${total.toLocaleString()} บาท`}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <FieldGrid>
        <Field label="วันที่">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="ร้าน / ผู้ขาย">
          <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="เช่น Homepro" />
        </Field>
      </FieldGrid>
      <Field label="หมวดงาน">
        <div className="chips">
          {phases.map((p) => (
            <button key={p} type="button" className={"chip" + (phase === p ? " on" : "")} onClick={() => setPhase(phase === p ? "" : p)}>
              {p}
            </button>
          ))}
        </div>
      </Field>
      <Field label="รายการ">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="pj-head">
            <span>รายการ</span>
            <span>จำนวน</span>
            <span>ราคา/หน่วย</span>
            <span></span>
          </div>
          {lines.map((l, k) => (
            <div key={l.key} className="field pj-line">
              <input value={l.name} onChange={(e) => setLine(l.key, { name: e.target.value })} placeholder={k ? "" : "เช่น ท่อ PVC 4 นิ้ว"} autoFocus={!initial && k === 0} />
              <input className="num" value={l.qty} onChange={(e) => setLine(l.key, { qty: e.target.value })} inputMode="decimal" />
              <input className="num" value={l.price} onChange={(e) => setLine(l.key, { price: e.target.value })} inputMode="decimal" placeholder="0" />
              {lines.length > 1 ? (
                <button type="button" className="x" aria-label="ลบรายการ" onClick={() => setLines((ls) => ls.filter((y) => y.key !== l.key))}>
                  <Icon name="x" size={15} />
                </button>
              ) : (
                <span></span>
              )}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-sm" onClick={() => setLines((ls) => [...ls, blankLine()])}>
              <Icon name="plus" size={14} />
              เพิ่มรายการ
            </button>
            <span style={{ marginLeft: "auto", fontSize: 14 }}>
              รวมบิล <b style={{ fontSize: 18 }}><Money value={total} /></b>
            </span>
          </div>
        </div>
      </Field>
      <Field label="หมายเหตุ">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น สั่งผ่าน Shopee, มีใบกำกับภาษี" />
      </Field>
      <Field label="ไฟล์บิล / ใบเสร็จ">
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
      </Field>
      {!initial && (
        <Field label="จ่ายจาก">
          <select value={paySrc} onChange={(e) => setPaySrc(e.target.value)}>
            <option value="">ไม่บันทึกลงบัญชี</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      )}
    </FormModal>
  );
}
