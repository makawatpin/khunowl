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
const VehicleServiceForm = dynamic(() => import("@/components/forms/vehicle-service-form").then((m) => m.VehicleServiceForm), { ssr: false });
const TripForm = dynamic(() => import("@/components/forms/trip-form").then((m) => m.TripForm), { ssr: false });
const SlipImportForm = dynamic(() => import("@/components/forms/slip-import-form").then((m) => m.SlipImportForm), { ssr: false });
import { getQuickAddOptions, type QuickAddOptions } from "@/lib/actions/quick-add";

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

const NO_OPTIONS: QuickAddOptions = { accounts: [], cards: [], vehicles: [], friends: [] };

const QuickAddContext = createContext<{ open: (kind?: QuickAddKind) => void } | null>(null);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [formKind, setFormKind] = useState<QuickAddKind | null>(null);
  // Dropdown lists are fetched fresh on every open (not passed down from the layout, which would
  // re-query them on each navigation). Forms mount only once they arrive, since several pick their
  // default account/vehicle from these lists in their initial state.
  const [options, setOptions] = useState<QuickAddOptions | null>(null);

  const open = (kind?: QuickAddKind) => {
    setOptions(null);
    getQuickAddOptions().then(setOptions, () => setOptions(NO_OPTIONS));
    if (kind) setFormKind(kind);
    else setMenuOpen(true);
  };
  const closeAll = () => {
    setMenuOpen(false);
    setFormKind(null);
  };
  const { accounts, cards, vehicles, friends } = options ?? NO_OPTIONS;
  const showForm = (kind: QuickAddKind) => formKind === kind && options !== null;
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
      {showForm("expense") && <TransactionForm type="expense" accounts={accounts} cards={cards} onClose={closeAll} />}
      {showForm("income") && <TransactionForm type="income" accounts={accounts} cards={cards} onClose={closeAll} />}
      {showForm("transfer") && <TransferForm accounts={accounts} onClose={closeAll} />}
      {showForm("bill") && <BillForm accounts={accounts} onClose={closeAll} />}
      {showForm("sub") && <SubscriptionForm accounts={accounts} cards={cards} onClose={closeAll} />}
      {showForm("asset") && <AssetForm accounts={accounts} onClose={closeAll} />}
      {showForm("doc") && <DocumentForm onClose={closeAll} />}
      {showForm("fuel") && (
        <FuelLogForm vehicles={vehicles} defaultVehicleId={vehicles[0]?.id ?? ""} accounts={accounts} cards={cards} onClose={closeAll} />
      )}
      {showForm("service") && (
        <VehicleServiceForm vehicles={vehicles} defaultVehicleId={vehicles[0]?.id ?? ""} accounts={accounts} cards={cards} onClose={closeAll} />
      )}
      {showForm("trip") && (
        <TripForm friends={friends} onClose={closeAll} onCreated={(id) => { closeAll(); router.push(`/trips/${id}`); }} />
      )}
      {showForm("slips") && <SlipImportForm onClose={closeAll} />}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used within QuickAddProvider");
  return ctx;
}
