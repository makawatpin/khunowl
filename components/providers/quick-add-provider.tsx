"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { TransactionForm } from "@/components/forms/transaction-form";
import { TransferForm } from "@/components/forms/transfer-form";
import { BillForm } from "@/components/forms/bill-form";
import { SubscriptionForm } from "@/components/forms/subscription-form";
import { AssetForm } from "@/components/forms/asset-form";
import { DocumentForm } from "@/components/forms/document-form";
import { FuelLogForm, type VehiclePickItem } from "@/components/forms/fuel-log-form";
import { VehicleServiceForm } from "@/components/forms/vehicle-service-form";
import { TripForm } from "@/components/forms/trip-form";
import { SlipImportForm } from "@/components/forms/slip-import-form";
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

  return (
    <QuickAddContext.Provider value={{ open }}>
      {children}
      {menuOpen && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ flex: 1 }}>เพิ่มรายการ</h3>
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
