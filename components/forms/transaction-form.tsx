"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createTransaction, deleteTransaction, updateTransaction } from "@/lib/actions/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/domain/categories";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export interface TransactionFormInitial {
  id: string;
  type: "expense" | "income";
  amount: number;
  category: string | null;
  name: string;
  date: string;
  note: string | null;
  source: string;
  sourceKind: "account" | "card";
}

export function TransactionForm({
  type: initialType = "expense",
  initial,
  accounts,
  cards,
  onClose,
}: {
  type?: "expense" | "income";
  initial?: TransactionFormInitial;
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [type, setType] = useState<"expense" | "income">(initial?.type ?? initialType);
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISOInBangkok());
  const [note, setNote] = useState(initial?.note ?? "");
  const [source, setSource] = useState(initial?.source ?? accounts[0]?.id ?? "");
  const [sourceKind, setSourceKind] = useState<"account" | "card">(initial?.sourceKind ?? "account");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = parseFloat(amount.replace(/,/g, "")) > 0 && !!source;

  const switchType = (t: "expense" | "income") => {
    setType(t);
    const cats = t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setCategory(cats[0]);
    if (t === "income" && sourceKind === "card") {
      setSourceKind("account");
      setSource(accounts[0]?.id ?? "");
    }
  };

  const handleSourceChange = (value: string) => {
    setSource(value);
    setSourceKind(cards.some((c) => c.id === value) ? "card" : "account");
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.set("type", type);
    fd.set("amount", amount);
    fd.set("category", category ?? "");
    fd.set("name", name);
    fd.set("date", date);
    fd.set("note", note);
    fd.set("source", source);
    fd.set("sourceKind", sourceKind);
    return fd;
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = buildFormData();
    const label = type === "income" ? "รายรับ" : "รายจ่าย";
    if (initial) {
      const res = await updateTransaction(initial.id, fd);
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
    const res = await createTransaction(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show(`บันทึก${label}แล้ว`, async () => {
        await deleteTransaction(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteTransaction(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบรายการแล้ว");
  };

  return (
    <FormModal
      title={(initial ? "แก้ไข" : "บันทึก") + (type === "income" ? "รายรับ" : "รายจ่าย")}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <div className="seg" style={{ marginBottom: 14 }}>
        {([
          ["expense", "รายจ่าย"],
          ["income", "รายรับ"],
        ] as const).map(([k, l]) => (
          <button key={k} type="button" className={type === k ? "on" : ""} onClick={() => switchType(k)}>
            {l}
          </button>
        ))}
      </div>
      <Field label="จำนวนเงิน (บาท)">
        <input className="big-num" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" autoFocus />
      </Field>
      <Field label="หมวด">
        <div className="chips">
          {categories.map((c) => (
            <button key={c} type="button" className={"chip" + (category === c ? " on" : "")} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </Field>
      <Field label="รายละเอียด">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={category ?? ""} />
      </Field>
      <FieldGrid>
        <Field label={type === "income" ? "เข้าบัญชี" : "จ่ายจาก"}>
          <select value={source} onChange={(e) => handleSourceChange(e.target.value)}>
            <optgroup label="บัญชี / กระเป๋าเงิน">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </optgroup>
            {type === "expense" && cards.length > 0 && (
              <optgroup label="บัตรเครดิต">
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </Field>
        <Field label="วันที่">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label="โน้ต">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ไม่บังคับ" />
      </Field>
    </FormModal>
  );
}
