"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { ActRow } from "@/components/ui/act-row";
import { VehicleForm, type VehicleFormInitial } from "@/components/forms/vehicle-form";
import { VehicleServiceForm, type VehicleServiceFormInitial } from "@/components/forms/vehicle-service-form";
import { FuelLogForm, type VehiclePickItem } from "@/components/forms/fuel-log-form";
import { deleteFuelLog } from "@/lib/actions/fuel-logs";
import { SVC_CATEGORIES, fuelStats, nextServiceKm, svcIcon, vehicleYearCost } from "@/lib/domain/vehicle";
import { dueLabel } from "@/lib/domain/dates";
import { dLong, dShort } from "@/lib/format/date";
import { VEHICLE_KIND_LABEL } from "@/lib/i18n/th";
import { useToast } from "@/components/providers/toast-provider";

export interface FuelLogItem {
  id: string;
  date: string;
  mileage: number;
  liters: number;
  pricePerL: number | null;
  total: number;
}

export interface VehicleDocItem {
  id: string;
  name: string;
  type: string | null;
  expiry: string | null;
  related: string | null;
}

type Tab = "overview" | "service" | "fuel" | "papers";

export function VehicleClient({
  vehicles,
  servicesByVehicle,
  fuelByVehicle,
  documents,
  accounts,
  cards,
  todayISO,
}: {
  vehicles: VehicleFormInitial[];
  servicesByVehicle: Record<string, VehicleServiceFormInitial[]>;
  fuelByVehicle: Record<string, FuelLogItem[]>;
  documents: VehicleDocItem[];
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  todayISO: string;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [vehicleId, setVehicleId] = useState<string | null>(vehicles[0]?.id ?? null);
  const [tab, setTab] = useState<Tab>("overview");
  const [svcCatF, setSvcCatF] = useState("all");
  const [svcOpen, setSvcOpen] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState<"new" | VehicleFormInitial | null>(null);
  const [svcForm, setSvcForm] = useState<"new" | VehicleServiceFormInitial | null>(null);
  const [fuelForm, setFuelForm] = useState(false);

  const v = vehicles.find((x) => x.id === vehicleId) ?? null;

  if (!vehicles.length) {
    return (
      <>
        <div className="card list">
          <div className="empty">ยังไม่มีรถในระบบ</div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setVehicleForm("new")}>
          <Icon name="plus" size={15} />
          เพิ่มรถ
        </button>
        {vehicleForm === "new" && <VehicleForm onClose={() => setVehicleForm(null)} onCreated={(id) => setVehicleId(id)} />}
      </>
    );
  }
  if (!v) return null;

  const svc = [...(servicesByVehicle[v.id] ?? [])].sort((a, b) => (b.date < a.date ? -1 : 1));
  const fuel = [...(fuelByVehicle[v.id] ?? [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.mileage - a.mileage));
  const fs = fuelStats(fuel, todayISO.slice(0, 7));
  const target = nextServiceKm(v.mileage, v.serviceEveryKm);
  const kmLeft = target - v.mileage;
  const svcCost = (s: VehicleServiceFormInitial) => s.cost;
  const svcTotal = svc.reduce((s, x) => s + svcCost(x), 0);
  const fuelSum = fuel.reduce((s, x) => s + x.total, 0);
  const lifeCost = svcTotal + fuelSum;
  const year = todayISO.slice(0, 4);
  const yearCost = vehicleYearCost({
    year,
    services: svc.map((s) => ({ date: s.date, cost: svcCost(s) })),
    fuel: fuel.map((f) => ({ date: f.date, total: f.total })),
    insurancePremium: v.insurancePremium,
    prbPremium: v.prbPremium,
    taxPremium: v.taxPremium,
  });
  const catTot = SVC_CATEGORIES.map(([c, ic]) => [c, ic, svc.filter((s) => (s.category ?? SVC_CATEGORIES[0][0]) === c).reduce((a, x) => a + svcCost(x), 0)] as const).filter((x) => x[2] > 0);
  const catMax = Math.max(1, ...catTot.map((x) => x[2]));
  const svcList = svcCatF === "all" ? svc : svc.filter((s) => (s.category ?? SVC_CATEGORIES[0][0]) === svcCatF);
  const firstDate = [...svc, ...fuel].reduce((m, x) => (!m || x.date < m ? x.date : m), "");
  const vehicleName = [v.brand, v.model].filter(Boolean).join(" ");
  const vehiclePickList: VehiclePickItem[] = vehicles.map((x) => ({ id: x.id, name: [x.brand, x.model].filter(Boolean).join(" ") || "รถ", mileage: x.mileage }));
  const ins = { company: v.insuranceCompany, policy: v.insurancePolicy, expiry: v.insuranceExpiry, premium: v.insurancePremium };
  const prb = { expiry: v.prbExpiry, premium: v.prbPremium };
  const tax = { expiry: v.taxExpiry, premium: v.taxPremium };
  const due = (d: string | null) =>
    d ? (
      <>
        {dShort(d, todayISO)} <span className={"badge " + dueLabel(d, todayISO).tone}>{dueLabel(d, todayISO).text}</span>
      </>
    ) : (
      "—"
    );
  const modelKey = (v.model ?? "").split(" ")[0];
  const linkedDocs = documents.filter((d) => d.related && ((modelKey && d.related.includes(modelKey)) || (v.plate && d.related.includes(v.plate))));

  const handleDeleteFuel = async (id: string) => {
    const res = await deleteFuelLog(id);
    if (res.error) return show(res.error);
    router.refresh();
    show("ลบรายการแล้ว");
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        {vehicles.map((x) => (
          <button
            key={x.id}
            className={"chip" + (x.id === v.id ? " on" : "")}
            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
            onClick={() => {
              setVehicleId(x.id);
              setTab("overview");
            }}
          >
            {x.brand} {(x.model ?? "").split(" ")[0]}
          </button>
        ))}
        <button className="chip" style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => setVehicleForm("new")}>
          <Icon name="plus" size={14} />
          เพิ่มรถ
        </button>
      </div>

      <div className="hero">
        <div className="cap">{VEHICLE_KIND_LABEL[v.kind]} · ปี {v.year ?? "—"} · {v.plate || "—"}</div>
        <div className="num" style={{ fontSize: 32, fontWeight: 600, margin: "6px 0 2px" }}>{vehicleName || "รถ"}</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)" }}>เลขไมล์ {v.mileage.toLocaleString()} กม.</div>
        <div style={{ display: "flex", gap: 18, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.28)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 100 }}><div className="cap">เช็กระยะถัดไป</div><div style={{ fontSize: 16, fontWeight: 600 }}>{kmLeft.toLocaleString()} กม.</div></div>
          <div style={{ flex: 1, minWidth: 100 }}><div className="cap">กม./ลิตร</div><div style={{ fontSize: 16, fontWeight: 600 }}>{fs.legs ? fs.kmPerL.toFixed(1) : "—"}</div></div>
          <div style={{ flex: 1, minWidth: 100 }}><div className="cap">ประกันหมด</div><div style={{ fontSize: 16, fontWeight: 600 }}>{ins.expiry ? dShort(ins.expiry, todayISO) : "—"}</div></div>
          <div style={{ flex: 1, minWidth: 100 }}><div className="cap">ใช้จ่ายตลอดการใช้งาน</div><div style={{ fontSize: 16, fontWeight: 600 }}><Money value={lifeCost} /></div></div>
        </div>
      </div>
      <div className="actbar">
        <button className="btn" onClick={() => setFuelForm(true)}>
          <Icon name="fuel" size={15} />
          เติมน้ำมัน
        </button>
        <button className="btn" onClick={() => setSvcForm("new")}>
          <Icon name="wrench" size={15} />
          ซ่อม / ค่าใช้จ่ายรถ
        </button>
        <button className="btn" onClick={() => setVehicleForm(v)}>
          <Icon name="edit" size={15} />
          แก้ไขข้อมูลรถ
        </button>
      </div>
      <div className="tabs">
        <button className={tab === "overview" ? "on" : ""} onClick={() => setTab("overview")}>ภาพรวม</button>
        <button className={tab === "service" ? "on" : ""} onClick={() => setTab("service")}>ซ่อมบำรุง</button>
        <button className={tab === "fuel" ? "on" : ""} onClick={() => setTab("fuel")}>น้ำมัน</button>
        <button className={tab === "papers" ? "on" : ""} onClick={() => setTab("papers")}>ประกัน & ภาษี</button>
      </div>

      {tab === "overview" && (
        <>
          <div className="grid g3">
            <div className="card card-pad" style={{ background: "var(--warn-soft)" }}>
              <div className="cap">เช็กระยะถัดไป</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{target.toLocaleString()} กม.</div>
              <div className="row-s">เหลืออีก {kmLeft.toLocaleString()} กม.</div>
            </div>
            <div className="card card-pad" style={{ background: "var(--pos-soft)" }}>
              <div className="cap">อัตราสิ้นเปลือง</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{fs.legs ? `${fs.kmPerL.toFixed(1)} กม./ลิตร` : "ยังไม่มีข้อมูล"}</div>
              <div className="row-s">{fs.legs ? `${fs.costPerKm.toFixed(2)} บาท/กม.` : "เติมน้ำมัน 2 ครั้งเพื่อคำนวณ"}</div>
            </div>
            <div className="card card-pad hero">
              <div className="cap">ค่าใช้จ่ายรถปี {year}</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}><Money value={yearCost} /></div>
              <div className="row-s">น้ำมัน + ซ่อม + ประกัน + ภาษี</div>
            </div>
          </div>
          <div className="sec"><h2>สถานะที่ต้องดูแล</h2></div>
          <div className="card list">
            <div className="row">
              <span className="ic"><Icon name="wrench" size={17} color="var(--ink-soft)" /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="row-t">เช็กระยะ {target.toLocaleString()} กม.</span>
                <span className="row-s">ปัจจุบัน {v.mileage.toLocaleString()} กม.</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontWeight: 600 }}>{kmLeft.toLocaleString()} กม.</span>
                <span className="row-s">เหลืออีก</span>
              </span>
            </div>
            <div className="row">
              <span className="ic"><Icon name="shield" size={17} color="var(--ink-soft)" /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="row-t">ประกันภัย</span>
                <span className="row-s">{ins.company || "—"}</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontWeight: 600 }}>{ins.expiry ? dShort(ins.expiry, todayISO) : "—"}</span>
                <span className="row-s">{ins.expiry ? dueLabel(ins.expiry, todayISO).text : "ยังไม่ได้กรอก"}</span>
              </span>
            </div>
            <div className="row">
              <span className="ic"><Icon name="doc" size={17} color="var(--ink-soft)" /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="row-t">พ.ร.บ.</span>
                <span className="row-s">{prb.premium ? <Money value={prb.premium} /> : "—"}</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontWeight: 600 }}>{prb.expiry ? dShort(prb.expiry, todayISO) : "—"}</span>
                <span className="row-s">{prb.expiry ? dueLabel(prb.expiry, todayISO).text : "ยังไม่ได้กรอก"}</span>
              </span>
            </div>
            <div className="row">
              <span className="ic"><Icon name="doc" size={17} color="var(--ink-soft)" /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="row-t">ภาษีรถ</span>
                <span className="row-s">{tax.premium ? <Money value={tax.premium} /> : "—"}</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontWeight: 600 }}>{tax.expiry ? dShort(tax.expiry, todayISO) : "—"}</span>
                <span className="row-s">{tax.expiry ? dueLabel(tax.expiry, todayISO).text : "ยังไม่ได้กรอก"}</span>
              </span>
            </div>
          </div>
          <div className="sec"><h2>ข้อมูลรถ</h2></div>
          <div className="card card-pad">
            <dl className="dl">
              <dt>ยี่ห้อ/รุ่น</dt>
              <dd>{vehicleName || "—"}</dd>
              <dt>ประเภท</dt>
              <dd>{VEHICLE_KIND_LABEL[v.kind]}</dd>
              <dt>ปี</dt>
              <dd>{v.year ?? "—"}</dd>
              <dt>ทะเบียน</dt>
              <dd>{v.plate || "—"}</dd>
              {v.vin && (
                <>
                  <dt>เลขตัวถัง</dt>
                  <dd className="num">{v.vin}</dd>
                </>
              )}
              <dt>สี</dt>
              <dd>{v.color || "—"}</dd>
            </dl>
          </div>
        </>
      )}

      {tab === "service" &&
        (svc.length ? (
          <>
            <div className="grid g3">
              <div className="card card-pad hero">
                <div className="cap">ค่าใช้จ่ายตลอดการใช้งาน</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}><Money value={lifeCost} /></div>
                <div className="row-s">
                  ซ่อม/ดูแล <Money value={svcTotal} /> · น้ำมัน <Money value={fuelSum} />{firstDate ? ` · ตั้งแต่ ${dLong(firstDate)}` : ""}
                </div>
              </div>
              <div className="card card-pad" style={{ background: "var(--accent-soft)" }}>
                <div className="cap">ค่าซ่อม/ดูแลปี {year}</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>
                  <Money value={svc.filter((s) => s.date.startsWith(year)).reduce((s, x) => s + svcCost(x), 0)} />
                </div>
              </div>
              <div className="card card-pad">
                <div className="cap">ครั้งล่าสุด</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{dShort(svc[0].date, todayISO)}</div>
                <div className="row-s">{svc[0].mileage ? `${svc[0].mileage.toLocaleString()} กม. · ` : ""}{svc[0].provider || svc[0].name}</div>
              </div>
            </div>
            <div className="sec"><h2>แยกตามหมวด</h2></div>
            <div className="card card-pad">
              {catTot.map(([c, ic, a], k) => (
                <button key={c} className="svc-cat" style={{ marginTop: k ? 12 : 0 }} onClick={() => setSvcCatF(svcCatF === c ? "all" : c)}>
                  <span style={{ display: "flex", gap: 8, fontSize: 14, marginBottom: 6, alignItems: "center" }}>
                    <Icon name={ic} size={15} color="var(--ink-soft)" />
                    <span style={{ flex: 1, fontWeight: svcCatF === c ? 600 : 400 }}>{c}</span>
                    <span className="row-s">{svc.filter((s) => (s.category ?? SVC_CATEGORIES[0][0]) === c).length} ครั้ง</span>
                    <b><Money value={a} /></b>
                  </span>
                  <div className="bar"><i style={{ width: `${(a / catMax) * 100}%`, background: svcCatF === "all" || svcCatF === c ? "var(--accent)" : "var(--line)" }} /></div>
                </button>
              ))}
            </div>
            <div className="sec">
              <h2>ประวัติซ่อมบำรุง & ค่าใช้จ่ายรถ</h2>
              <button className="more" onClick={() => setSvcForm("new")}>+ บันทึก</button>
            </div>
            <div className="chips" style={{ marginBottom: 10 }}>
              {[["all", "ทั้งหมด"] as const, ...SVC_CATEGORIES.filter(([c]) => catTot.some((x) => x[0] === c)).map(([c]) => [c, c] as const)].map(([k, l]) => (
                <button key={k} className={"chip" + (svcCatF === k ? " on" : "")} onClick={() => setSvcCatF(k)}>{l}</button>
              ))}
            </div>
            <div className="card list">
              {svcList.map((s) => {
                const on = svcOpen === s.id;
                const cost = svcCost(s);
                return (
                  <div key={s.id} className="trip-exp">
                    <button className="row rowlink" onClick={() => setSvcOpen(on ? null : s.id)}>
                      <span className="ic"><Icon name={svcIcon(s.category)} size={17} color="var(--ink-soft)" /></span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span className="row-t">{s.name}</span>
                        <span className="row-s">{[s.category, dLong(s.date), s.mileage ? `${s.mileage.toLocaleString()} กม.` : null, s.provider, s.items.length ? `${s.items.length} รายการ` : null].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span style={{ fontWeight: 600 }}><Money value={cost} /></span>
                    </button>
                    {on && (
                      <div className="trip-exp-body">
                        {s.items.length > 0 && (
                          <div className="svc-lines">
                            {s.items.map((it, k) => (
                              <div key={k} className="svc-line">
                                <span>{it.name}</span>
                                <span className="num">{it.price ? <Money value={it.price} /> : <span className="badge green">ฟรี</span>}</span>
                              </div>
                            ))}
                            <div className="svc-line" style={{ fontWeight: 600, borderBottom: "none" }}>
                              <span>รวม</span>
                              <span className="num"><Money value={cost} /></span>
                            </div>
                          </div>
                        )}
                        {s.note && <div className="hint" style={{ margin: 0 }}>หมายเหตุ: {s.note}</div>}
                        {s.receiptUrl && (
                          <div className="hint" style={{ margin: 0 }}>
                            <a href={s.receiptUrl} target="_blank" rel="noreferrer">เปิดใบเสร็จ</a>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-sm" onClick={() => setSvcForm(s)}>
                            <Icon name="edit" size={14} />
                            แก้ไข
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="card list">
            <div className="empty">ยังไม่มีประวัติซ่อมบำรุงของรถคันนี้</div>
            <button className="btn btn-primary" style={{ margin: "0 16px 16px" }} onClick={() => setSvcForm("new")}>บันทึกซ่อมบำรุง</button>
          </div>
        ))}

      {tab === "fuel" &&
        (fuel.length ? (
          <>
            <div className="grid g3">
              <div className="card card-pad" style={{ background: "var(--pos-soft)" }}>
                <div className="cap">เฉลี่ย</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{fs.legs ? `${fs.kmPerL.toFixed(1)} กม./ล.` : "—"}</div>
              </div>
              <div className="card card-pad" style={{ background: "var(--accent-soft)" }}>
                <div className="cap">ต้นทุนต่อ กม.</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{fs.legs ? `${fs.costPerKm.toFixed(2)} บาท` : "—"}</div>
              </div>
              <div className="card card-pad hero">
                <div className="cap">ค่าน้ำมันเดือนนี้</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}><Money value={fs.monthly} /></div>
              </div>
            </div>
            <div className="sec">
              <h2>ประวัติเติมน้ำมัน</h2>
              <button className="more" onClick={() => setFuelForm(true)}>+ บันทึก</button>
            </div>
            <div className="card list">
              {fuel.map((f) => (
                <ActRow
                  key={f.id}
                  icon="fuel"
                  title={`${f.liters.toFixed(1)} ลิตร · ฿${f.pricePerL ?? "—"}/ล.`}
                  sub={`${dShort(f.date, todayISO)} · ${f.mileage.toLocaleString()} กม.`}
                  amount={f.total}
                  btn="ลบ"
                  onBtn={() => handleDeleteFuel(f.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="card list">
            <div className="empty">ยังไม่มีประวัติเติมน้ำมันของรถคันนี้</div>
            <button className="btn btn-primary" style={{ margin: "0 16px 16px" }} onClick={() => setFuelForm(true)}>บันทึกเติมน้ำมัน</button>
          </div>
        ))}

      {tab === "papers" && (
        <>
          <div className="grid g2">
            <div className="card card-pad">
              <div className="cap">ประกันภัย</div>
              <div style={{ fontSize: 15, fontWeight: 600, margin: "6px 0 10px" }}>{ins.company || "—"}</div>
              <dl className="dl">
                <dt>เลขกรมธรรม์</dt>
                <dd className="num">{ins.policy || "—"}</dd>
                <dt>เบี้ยประกัน</dt>
                <dd>{ins.premium ? <Money value={ins.premium} /> : "—"}</dd>
                <dt>หมดอายุ</dt>
                <dd>{due(ins.expiry)}</dd>
              </dl>
            </div>
            <div className="card card-pad">
              <div className="cap">พ.ร.บ. & ภาษี</div>
              <div style={{ fontSize: 15, fontWeight: 600, margin: "6px 0 10px" }}>ทะเบียน {v.plate || "—"}</div>
              <dl className="dl">
                <dt>พ.ร.บ. หมดอายุ</dt>
                <dd>{due(prb.expiry)}</dd>
                <dt>เบี้ย พ.ร.บ.</dt>
                <dd>{prb.premium ? <Money value={prb.premium} /> : "—"}</dd>
                <dt>ภาษีหมดอายุ</dt>
                <dd>{due(tax.expiry)}</dd>
                <dt>ค่าภาษี</dt>
                <dd>{tax.premium ? <Money value={tax.premium} /> : "—"}</dd>
                <dt>รวมต้องเตรียม</dt>
                <dd><b><Money value={(ins.premium ?? 0) + (prb.premium ?? 0) + (tax.premium ?? 0)} /></b></dd>
              </dl>
            </div>
          </div>
          <div className="sec"><h2>เอกสารรถ</h2></div>
          <div className="card list">
            {linkedDocs.length ? (
              linkedDocs.map((d) => (
                <div className="row" key={d.id}>
                  <span className="ic"><Icon name="doc" size={17} color="var(--ink-soft)" /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="row-t">{d.name}</span>
                    <span className="row-s">{d.type}</span>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontWeight: 600 }}>{d.expiry ? dShort(d.expiry, todayISO) : "—"}</span>
                    {d.expiry && <span className="row-s">{dueLabel(d.expiry, todayISO).text}</span>}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty">ยังไม่มีเอกสารผูกกับรถคันนี้</div>
            )}
          </div>
        </>
      )}

      {vehicleForm === "new" && <VehicleForm onClose={() => setVehicleForm(null)} onCreated={(id) => setVehicleId(id)} />}
      {vehicleForm && vehicleForm !== "new" && <VehicleForm initial={vehicleForm} onClose={() => setVehicleForm(null)} />}
      {svcForm === "new" && (
        <VehicleServiceForm vehicles={vehiclePickList} defaultVehicleId={v.id} accounts={accounts} cards={cards} onClose={() => setSvcForm(null)} />
      )}
      {svcForm && svcForm !== "new" && (
        <VehicleServiceForm vehicles={vehiclePickList} defaultVehicleId={v.id} initial={svcForm} accounts={accounts} cards={cards} onClose={() => setSvcForm(null)} />
      )}
      {fuelForm && <FuelLogForm vehicles={vehiclePickList} defaultVehicleId={v.id} accounts={accounts} cards={cards} onClose={() => setFuelForm(false)} />}
    </>
  );
}
