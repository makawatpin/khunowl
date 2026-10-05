"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createDocument, deleteDocument, updateDocument } from "@/lib/actions/documents";
import { DOC_TYPES } from "@/lib/domain/things";
import { useToast } from "@/components/providers/toast-provider";

export interface DocumentFormInitial {
  id: string;
  name: string;
  type: string | null;
  expiry: string | null;
  related: string | null;
  note: string | null;
  fileUrl?: string | null;
}

export function DocumentForm({ initial, onClose }: { initial?: DocumentFormInitial; onClose: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? DOC_TYPES[0]);
  const [expiry, setExpiry] = useState(initial?.expiry ?? "");
  const [related, setRelated] = useState(initial?.related ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("type", type);
    fd.set("expiry", expiry);
    fd.set("related", related);
    fd.set("note", note);
    if (file) fd.set("file", file);
    if (initial) {
      const res = await updateDocument(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกเอกสารแล้ว");
      return;
    }
    const res = await createDocument(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("เพิ่มเอกสารแล้ว", async () => {
        await deleteDocument(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteDocument(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบเอกสารแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขเอกสาร" : "เพิ่มเอกสาร"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อเอกสาร">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="บัตรประชาชน" autoFocus />
      </Field>
      <FieldGrid>
        <Field label="ประเภท">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="หมดอายุ">
          <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label="เกี่ยวกับ">
        <input value={related} onChange={(e) => setRelated(e.target.value)} placeholder="เช่น Toyota Yaris" />
      </Field>
      <Field label="ไฟล์ (ถ่ายรูป / อัปโหลด)">
        {initial?.fileUrl && (
          <div className="hint" style={{ margin: "0 0 8px" }}>
            มีไฟล์แล้ว — <a href={initial.fileUrl} target="_blank" rel="noreferrer">เปิดไฟล์ปัจจุบัน</a>, เลือกไฟล์ใหม่เพื่อแทนที่
          </div>
        )}
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Field>
      <Field label="หมายเหตุ">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ไม่บังคับ" />
      </Field>
    </FormModal>
  );
}
