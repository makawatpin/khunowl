"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { saveBudgets } from "@/lib/actions/budgets";
import { EXPENSE_CATEGORIES } from "@/lib/domain/categories";
import { useToast } from "@/components/providers/toast-provider";

export function BudgetForm({ initial, onClose }: { initial: Record<string, number>; onClose: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, initial[c] ? String(initial[c]) : ""])),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const res = await saveBudgets(EXPENSE_CATEGORIES.map((c) => ({ category: c, limit: parseFloat(values[c]) || 0 })));
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("บันทึกงบแล้ว");
  };

  return (
    <FormModal title="งบประมาณรายเดือน" onClose={onClose} onSave={handleSave} pending={pending}>
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <FieldGrid>
        {EXPENSE_CATEGORIES.map((c) => (
          <Field key={c} label={c}>
            <input value={values[c]} onChange={(e) => setValues((v) => ({ ...v, [c]: e.target.value }))} inputMode="decimal" placeholder="ไม่ตั้งงบ" />
          </Field>
        ))}
      </FieldGrid>
    </FormModal>
  );
}
