"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Icon, type IconName } from "@/components/ui/icon";
const TransactionForm = dynamic(() => import("@/components/forms/transaction-form").then((m) => m.TransactionForm), { ssr: false });
const TransferForm = dynamic(() => import("@/components/forms/transfer-form").then((m) => m.TransferForm), { ssr: false });
const BillForm = dynamic(() => import("@/components/forms/bill-form").then((m) => m.BillForm), { ssr: false });
const SubscriptionForm = dynamic(() => import("@/components/forms/subscription-form").then((m) => m.SubscriptionForm), { ssr: false });
const AssetForm = dynamic(() => import("@/components/forms/asset-form").then((m) => m.AssetForm), { ssr: false });
const DocumentForm = dynamic(() => import("@/components/forms/document-form").then((m) => m.DocumentForm), { ssr: false });
const FuelLogForm = dynamic(() => import("@/components/forms/fuel-log-form").then((m) => m.FuelLogForm), { ssr: false });
const VehicleServiceForm =dynamic(() => import("@/components/forms/vehicle-service-form").then((m) => m.VehicleServiceForm), { ssr: false });
const TripForm = dynamic(() => import("@/components/forms/trip-form").then((m) => m.TripForm), { ssr: false });
const SlipImportForm = dynamic(() => import("@/components/forms/slip-import-form").then((m) => m.SlipImportForm), { ssr: false });
import type { VehiclePickItem } from "@/components/forms/fuel-log-form";
import type { TripPerson } from "@/components/ui/avatar";

export type QuickAddKind = "expense" | "income" | "transfer" | "bill" | "sub" | "asset" | "doc" | "fuel" | "service" | "trip" | "slips";

const KIND_META: { kind: QuickAddKind; label: string; icon: IconName }[] = [
  { kind: "expense", label: "รายจ่าย", icon: "card" },
  { kind: "income", label: "รายรับ", icon: "money" },
  { kind: "slips", label: "อ่านสลิปโอนเงิน", icon: "slip" },
  { kind: "transfer", label: "โอนเงินระหว่างบัญชี", icon: "swap" },
  { kind: "bill", label: "บิล / ค่าใช้จ่ายประจำ", icon: "clock" },
  { kind: "sub", label: "สมาชิกรายเดือน", icon: "clock" },
  { kind: "asset", label: "ซื้อของ / ทรัพย์สิน", icon: "box" },
  { kind: "fuel", label: "เติมน้ำมัน", icon: "fuel" },
  { kind: "service", label: "ซ่อมรถ", icon: "wrench" },
  { kind: "trip", label: "ทริปใหม่ (หารกับเพื่อน)", icon: "trip" },
  { kind: "doc", label: "เอกสาร", icon: "doc" },
];

type RefOption = { id: string; name: string };

const QuickAddContext = createContext<{ open: (kind?: QuickAddKind) => void } | null>(null);

export function QuickAddProvider({
  accounts,
  cards,
  vehicles,
  friends,
  children,
}: {
  accounts: RefOption[];
  cards: RefOption[];
  vehicles: VehiclePickItem[];
  friends: TripPerson[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [formKind, setFormKind] = useState<QuickAddKind | null>(null);

  const open = (kind?: QuickAddKind) => {
    if (kind) setFormKind(kind);
    else setMenuOpen(true);
  };
  const closeAll = () => {
    setMenuOpen(false);
    setFormKind(null);
  };
  const pick = (kind: QuickAddKind) => {
    setMenuOpen(false);
    setFormKind(kind);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <QuickAddContext.Provider value={{ open }}>
      {children}
      {menuOpen && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
            <div className="modal-head">
              <h3 id="quick-add-title" style={{ flex: 1 }}>เพิ่มรายการ</h3>
              <button className="btn" onClick={closeAll} style={{ padding: "6px 9px" }} aria-label="ปิด">
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="qa-grid">
                {KIND_META.map(({ kind, label, icon }) => (
                  <button key={kind} className="qa-item" onClick={() => pick(kind)}>
                    <span className="ic">
                      <Icon name={icon} size={18} color="var(--ink-soft)" />
                    </span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {formKind === "expense" && <TransactionForm type="expense" accounts={accounts} cards={cards} onClose={closeAll} />}
      {formKind === "income" && <TransactionForm type="income" accounts={accounts} cards={cards} onClose={closeAll} />}
      {formKind === "transfer" && <TransferForm accounts={accounts} onClose={closeAll} />}
      {formKind === "bill" && <BillForm accounts={accounts} onClose={closeAll} />}
      {formKind === "sub" && <SubscriptionForm accounts={accounts} cards={cards} onClose={closeAll} />}
      {formKind === "asset" && <AssetForm accounts={accounts} onClose={closeAll} />}
      {formKind === "doc" && <DocumentForm onClose={closeAll} />}
      {formKind === "fuel" && (
        <FuelLogForm vehicles={vehicles} defaultVehicleId={vehicles[0]?.id ?? ""} accounts={accounts} cards={cards} onClose={closeAll} />
      )}
      {formKind === "service" && (
        <VehicleServiceForm vehicles={vehicles} defaultVehicleId={vehicles[0]?.id ?? ""} accounts={accounts} cards={cards} onClose={closeAll} />
      )}
      {formKind === "trip" && (
        <TripForm friends={friends} onClose={closeAll} onCreated={(id) => { closeAll(); router.push(`/trips/${id}`); }} />
      )}
      {formKind === "slips" && <SlipImportForm onClose={closeAll} />}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used within QuickAddProvider");
  return ctx;
}
