"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createSubscription, deleteSubscription, updateSubscription } from "@/lib/actions/subscriptions";
import { useToast } from "@/components/providers/toast-provider";

export interface SubscriptionFormInitial {
  id: string;
  name: string;
  domain: string | null;
  price: number;
  cycle: "monthly" | "yearly";
  nextBilling: string;
  source: string;
  sourceKind: "account" | "card";
}

export function SubscriptionForm({
  initial,
  accounts,
  cards,
  onClose,
}: {
  initial?: SubscriptionFormInitial;
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const defaultSource = cards[0]?.id ?? accounts[0]?.id ?? "";
  const defaultKind: "account" | "card" = cards[0] ? "card" : "account";
  const [name, setName] = useState(initial?.name ?? "");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [cycle, setCycle] = useState<"monthly" | "yearly">(initial?.cycle ?? "monthly");
  const [nextBilling, setNextBilling] = useState(initial?.nextBilling ?? "");
  const [source, setSource] = useState(initial?.source ?? defaultSource);
  const [sourceKind, setSourceKind] = useState<"account" | "card">(initial?.sourceKind ?? defaultKind);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0 && parseFloat(price.replace(/,/g, "")) > 0 && !!nextBilling && !!source;

  const handleSourceChange = (value: string) => {
    setSource(value);
    setSourceKind(cards.some((c) => c.id === value) ? "card" : "account");
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("domain", domain);
    fd.set("price", price);
    fd.set("cycle", cycle);
    fd.set("nextBilling", nextBilling);
    fd.set("source", source);
    fd.set("sourceKind", sourceKind);
    if (initial) {
      const res = await updateSubscription(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกสมาชิกแล้ว");
      return;
    }
    const res = await createSubscription(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      const id = res.id;
      show("เพิ่มสมาชิกแล้ว", async () => {
        await deleteSubscription(id);
      });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteSubscription(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ยกเลิกสมาชิกแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขสมาชิก" : "เพิ่มสมาชิกรายเดือน"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ชื่อบริการ">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix" autoFocus />
      </Field>
      <Field label="เว็บไซต์ (ใช้ดึงโลโก้)">
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="netflix.com" autoCapitalize="none" />
      </Field>
      <FieldGrid>
        <Field label="ราคา">
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="รอบ">
          <select value={cycle} onChange={(e) => setCycle(e.target.value as "monthly" | "yearly")}>
            <option value="monthly">รายเดือน</option>
            <option value="yearly">รายปี</option>
          </select>
        </Field>
        <Field label="ตัดเงินครั้งถัดไป">
          <input type="date" value={nextBilling} onChange={(e) => setNextBilling(e.target.value)} />
        </Field>
        <Field label="ตัดผ่าน">
          <select value={source} onChange={(e) => handleSourceChange(e.target.value)}>
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
      </FieldGrid>
    </FormModal>
  );
}
