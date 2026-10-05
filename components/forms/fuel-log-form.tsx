"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createFuelLog } from "@/lib/actions/fuel-logs";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

export interface VehiclePickItem {
  id: string;
  name: string;
  mileage: number;
}

export function FuelLogForm({
  vehicles,
  defaultVehicleId,
  accounts,
  cards,
  onClose,
}: {
  vehicles: VehiclePickItem[];
  defaultVehicleId: string;
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [vehicleId, setVehicleId] = useState(defaultVehicleId);
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0];
  const [date, setDate] = useState(todayISOInBangkok());
  const [mileage, setMileage] = useState(String(vehicle?.mileage ?? ""));
  const [liters, setLiters] = useState("");
  const [pricePerL, setPricePerL] = useState("");
  const [total, setTotal] = useState("");
  const [paySrc, setPaySrc] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedTotal = parseFloat(total) || Math.round((parseFloat(liters) || 0) * (parseFloat(pricePerL) || 0));
  const valid = computedTotal > 0 && parseFloat(mileage) > 0 && !!vehicle;

  if (!vehicle) {
    return (
      <FormModal title="เติมน้ำมัน" onClose={onClose} onSave={onClose} valid={false}>
        <div className="empty">ยังไม่มีรถ — เพิ่มรถในหน้ารถยนต์ก่อน</div>
      </FormModal>
    );
  }

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("date", date);
    fd.set("mileage", mileage);
    fd.set("liters", liters);
    fd.set("pricePerL", pricePerL);
    fd.set("total", total || String(computedTotal));
    if (paySrc) {
      fd.set("paySrc", paySrc);
      fd.set("paySrcKind", cards.some((c) => c.id === paySrc) ? "card" : "account");
    }
    const res = await createFuelLog(vehicleId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show(`บันทึกเติมน้ำมัน ${computedTotal.toLocaleString()} บาทแล้ว`);
  };

  return (
    <FormModal title="บันทึกเติมน้ำมัน" onClose={onClose} onSave={handleSave} valid={valid} pending={pending}>
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      {vehicles.length > 1 && (
        <Field label="รถ">
          <select value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setMileage(String(vehicles.find((v) => v.id === e.target.value)?.mileage ?? "")); }}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </Field>
      )}
      <FieldGrid>
        <Field label="เลขไมล์ (กม.)">
          <input value={mileage} onChange={(e) => setMileage(e.target.value)} inputMode="numeric" autoFocus />
        </Field>
        <Field label="วันที่">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="ลิตร">
          <input value={liters} onChange={(e) => setLiters(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="ราคา/ลิตร">
          <input value={pricePerL} onChange={(e) => setPricePerL(e.target.value)} inputMode="decimal" />
        </Field>
      </FieldGrid>
      <Field label="ยอดรวม (บาท)">
        <input value={total} onChange={(e) => setTotal(e.target.value)} inputMode="decimal" placeholder={computedTotal ? String(computedTotal) : "0"} />
      </Field>
      <Field label="จ่ายจาก">
        <select value={paySrc} onChange={(e) => setPaySrc(e.target.value)}>
          <option value="">ไม่บันทึกรายจ่าย</option>
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
    </FormModal>
  );
}
