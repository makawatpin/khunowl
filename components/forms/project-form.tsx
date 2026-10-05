"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createProject, deleteProject, updateProject } from "@/lib/actions/projects";
import { Icon } from "@/components/ui/icon";
import { PJ_KINDS, PJ_PHASES_DEFAULT, PJ_STATUS, PJ_STATUS_LABEL } from "@/lib/domain/things";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export interface ProjectFormInitial {
  id: string;
  name: string;
  kind: string | null;
  status: string;
  startOn: string | null;
  endOn: string | null;
  budget: number | null;
  note: string | null;
  phases: string[];
}

export function ProjectForm({
  initial,
  onClose,
  onCreated,
}: {
  initial?: ProjectFormInitial;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState(initial?.kind ?? PJ_KINDS[0]);
  const [status, setStatus] = useState(initial?.status ?? "in_progress");
  const [startOn, setStartOn] = useState(initial?.startOn ?? todayISOInBangkok());
  const [endOn, setEndOn] = useState(initial?.endOn ?? "");
  const [budget, setBudget] = useState(initial?.budget != null ? String(initial.budget) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [phases, setPhases] = useState<string[]>(initial?.phases ?? PJ_PHASES_DEFAULT);
  const [newPhase, setNewPhase] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;

  const addPhase = () => {
    const v = newPhase.trim();
    if (v && !phases.includes(v)) setPhases((p) => [...p, v]);
    setNewPhase("");
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("kind", kind);
    fd.set("status", status);
    fd.set("startOn", startOn);
    fd.set("endOn", endOn);
    fd.set("budget", budget || "0");
    fd.set("note", note);
    phases.forEach((p) => fd.append("phases", p));
    if (initial) {
      const res = await updateProject(initial.id, fd);
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
    const res = await createProject(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      show("สร้างโครงการแล้ว");
      onCreated?.(res.id);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteProject(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบโครงการแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขโครงการ" : "เริ่มโครงการต่อเติม / ก่อสร้าง"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
      saveLabel={initial ? "บันทึก" : "สร้างโครงการ"}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อโครงการ">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ต่อเติมครัวหลังบ้าน" autoFocus={!initial} />
      </Field>
      <FieldGrid>
        <Field label="ประเภท">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {PJ_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="งบประมาณ (บาท)">
          <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" placeholder="ไม่บังคับ" />
        </Field>
        <Field label="วันเริ่ม">
          <input type="date" value={startOn} onChange={(e) => setStartOn(e.target.value)} />
        </Field>
        <Field label="วันเสร็จ">
          <input type="date" value={endOn} onChange={(e) => setEndOn(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label="สถานะ">
        <div className="seg">
          {PJ_STATUS.map((s) => (
            <button key={s} type="button" className={status === s ? "on" : ""} onClick={() => setStatus(s)}>
              {PJ_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="หมวดงาน (ใช้แยกบิล)">
        <div className="chips">
          {phases.map((p) => (
            <button key={p} type="button" className="chip on" onClick={() => setPhases((x) => x.filter((y) => y !== p))}>
              {p} ×
            </button>
          ))}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: -4, marginBottom: 14 }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <input
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPhase();
              }
            }}
            placeholder="เพิ่มหมวดงาน"
          />
        </div>
        <button type="button" className="btn" onClick={addPhase} disabled={!newPhase.trim()}>
          <Icon name="plus" size={14} />
          เพิ่ม
        </button>
      </div>
      <Field label="รายละเอียด">
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ขอบเขตงาน, แบบ, ข้อตกลง" style={{ resize: "vertical" }} />
      </Field>
    </FormModal>
  );
}
