"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal, Field, FieldGrid } from "@/components/ui/form-modal";
import { createVehicle, deleteVehicle, updateVehicle } from "@/lib/actions/vehicles";
import { VEHICLE_KIND_LABEL } from "@/lib/i18n/th";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";
import type { Database } from "@/lib/db.types";

type VehicleKind = Database["public"]["Enums"]["vehicle_kind"];
const KINDS: VehicleKind[] = ["car", "motorcycle"];

export interface VehicleFormInitial {
  id: string;
  kind: VehicleKind;
  brand: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  vin: string | null;
  color: string | null;
  mileage: number;
  serviceEveryKm: number;
  insuranceCompany: string | null;
  insurancePolicy: string | null;
  insuranceExpiry: string | null;
  insurancePremium: number | null;
  prbExpiry: string | null;
  prbPremium: number | null;
  taxExpiry: string | null;
  taxPremium: number | null;
}

export function VehicleForm({
  initial,
  onClose,
  onCreated,
}: {
  initial?: VehicleFormInitial;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [kind, setKind] = useState<VehicleKind>(initial?.kind ?? "car");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(initial?.year != null ? String(initial.year) : String(Number(todayISOInBangkok().slice(0, 4))));
  const [plate, setPlate] = useState(initial?.plate ?? "");
  const [vin, setVin] = useState(initial?.vin ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [mileage, setMileage] = useState(initial ? String(initial.mileage) : "");
  const [serviceEveryKm, setServiceEveryKm] = useState(initial ? String(initial.serviceEveryKm) : "5000");
  const [insuranceCompany, setInsuranceCompany] = useState(initial?.insuranceCompany ?? "");
  const [insurancePolicy, setInsurancePolicy] = useState(initial?.insurancePolicy ?? "");
  const [insuranceExpiry, setInsuranceExpiry] = useState(initial?.insuranceExpiry ?? "");
  const [insurancePremium, setInsurancePremium] = useState(initial?.insurancePremium != null ? String(initial.insurancePremium) : "");
  const [prbExpiry, setPrbExpiry] = useState(initial?.prbExpiry ?? "");
  const [prbPremium, setPrbPremium] = useState(initial?.prbPremium != null ? String(initial.prbPremium) : "");
  const [taxExpiry, setTaxExpiry] = useState(initial?.taxExpiry ?? "");
  const [taxPremium, setTaxPremium] = useState(initial?.taxPremium != null ? String(initial.taxPremium) : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = brand.trim().length > 0 && model.trim().length > 0 && plate.trim().length > 0;

  const buildFormData = () => {
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("brand", brand);
    fd.set("model", model);
    fd.set("year", year);
    fd.set("plate", plate);
    fd.set("vin", vin);
    fd.set("color", color);
    fd.set("mileage", mileage || "0");
    fd.set("serviceEveryKm", serviceEveryKm || "5000");
    fd.set("insuranceCompany", insuranceCompany);
    fd.set("insurancePolicy", insurancePolicy);
    fd.set("insuranceExpiry", insuranceExpiry);
    fd.set("insurancePremium", insurancePremium || "0");
    fd.set("prbExpiry", prbExpiry);
    fd.set("prbPremium", prbPremium || "0");
    fd.set("taxExpiry", taxExpiry);
    fd.set("taxPremium", taxPremium || "0");
    return fd;
  };

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const fd = buildFormData();
    if (initial) {
      const res = await updateVehicle(initial.id, fd);
      setPending(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
      show("บันทึกข้อมูลรถแล้ว");
      return;
    }
    const res = await createVehicle(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    if (res.id) {
      show("เพิ่มรถแล้ว");
      onCreated?.(res.id);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setPending(true);
    const res = await deleteVehicle(initial.id);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
    show("ลบรถแล้ว");
  };

  return (
    <FormModal
      title={initial ? "แก้ไขข้อมูลรถ" : "เพิ่มรถ"}
      onClose={onClose}
      onSave={handleSave}
      onDelete={initial ? handleDelete : undefined}
      valid={valid}
      pending={pending}
    >
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
      <Field label="ประเภท">
        <div className="seg">
          {KINDS.map((k) => (
            <button key={k} type="button" className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
              {VEHICLE_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </Field>
      <FieldGrid>
        <Field label="ยี่ห้อ">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Toyota" autoFocus={!initial} />
        </Field>
        <Field label="รุ่น">
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Yaris Ativ" />
        </Field>
        <Field label="ปี">
          <input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" placeholder="2022" />
        </Field>
        <Field label="สี">
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="เทา" />
        </Field>
      </FieldGrid>
      <Field label="ทะเบียน">
        <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="2กก 1234 กรุงเทพฯ" />
      </Field>
      <FieldGrid>
        <Field label="เลขไมล์ปัจจุบัน (กม.)">
          <input value={mileage} onChange={(e) => setMileage(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="เช็กระยะทุก (กม.)">
          <input value={serviceEveryKm} onChange={(e) => setServiceEveryKm(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="เลขตัวถัง (VIN)">
          <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="ไม่บังคับ" />
        </Field>
      </FieldGrid>
      <div className="form-sec">ประกัน · พ.ร.บ. · ภาษี (ใส่ทีหลังได้)</div>
      <FieldGrid>
        <Field label="บริษัทประกัน">
          <input value={insuranceCompany} onChange={(e) => setInsuranceCompany(e.target.value)} />
        </Field>
        <Field label="เลขกรมธรรม์">
          <input value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} />
        </Field>
        <Field label="ประกันหมดอายุ">
          <input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
        </Field>
        <Field label="เบี้ยประกัน">
          <input value={insurancePremium} onChange={(e) => setInsurancePremium(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="พ.ร.บ. หมดอายุ">
          <input type="date" value={prbExpiry} onChange={(e) => setPrbExpiry(e.target.value)} />
        </Field>
        <Field label="เบี้ย พ.ร.บ.">
          <input value={prbPremium} onChange={(e) => setPrbPremium(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="ภาษีหมดอายุ">
          <input type="date" value={taxExpiry} onChange={(e) => setTaxExpiry(e.target.value)} />
        </Field>
        <Field label="ค่าภาษี">
          <input value={taxPremium} onChange={(e) => setTaxPremium(e.target.value)} inputMode="numeric" />
        </Field>
      </FieldGrid>
    </FormModal>
  );
}
