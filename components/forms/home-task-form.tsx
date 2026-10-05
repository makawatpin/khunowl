"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createHomeTask, deleteHomeTask, updateHomeTask } from "@/lib/actions/home-tasks";
import { HOME_TASK_CYCLES, HOME_TASK_CYCLE_LABEL } from "@/lib/domain/things";
import { addMonths } from "@/lib/domain/dates";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export interface HomeTaskFormInitial {
  id: string;
  name: string;
  everyMonths: number;
  nextDue: string;
  lastDone: string | null;
  cost: number | null;
}

export function HomeTaskForm({ initial, onClose }: { initial?: HomeTaskFormInitial; onClose: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [everyMonths, setEveryMonths] = useState(initial?.everyMonths ?? 6);
  const [nextDue, setNextDue] = useState(initial?.nextDue ?? addMonths(todayISOInBangkok(), 1));
  const [cost, setCost] = useState(initial?.cost != null ? String(initial.cost) : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("everyMonths", String(everyMonths));
    fd.set("nextDue", nextDue);
    fd.set("lastDone", initial?.lastDone ?? "");
    fd.set("cost", cost || "0");
    if (initial) {
      const res = await updateHomeTask(initial.id, fd);
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
    const res = await createHomeTask(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("เพิ่มงานดูแลบ้านแล้ว", async () => {
        await deleteHomeTask(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteHomeTask(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขงานดูแลบ้าน" : "เพิ่มงานดูแลบ้าน"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="งาน">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ล้างแอร์" autoFocus />
      </Field>
      <FieldGrid>
        <Field label="ทำทุก">
          <select value={everyMonths} onChange={(e) => setEveryMonths(Number(e.target.value))}>
            {HOME_TASK_CYCLES.map((m) => (
              <option key={m} value={m}>{HOME_TASK_CYCLE_LABEL[m]}</option>
            ))}
          </select>
        </Field>
        <Field label="ครั้งถัดไป">
          <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label="ค่าใช้จ่ายโดยประมาณ">
        <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" />
      </Field>
    </FormModal>
  );
}
