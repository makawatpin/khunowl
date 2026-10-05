"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { ProjectForm, type ProjectFormInitial } from "@/components/forms/project-form";
import { ProjectBillForm, type ProjectBillFormInitial } from "@/components/forms/project-bill-form";
import { billTotal } from "@/lib/domain/projects";
import { PJ_STATUS_LABEL } from "@/lib/domain/things";
import { dLong } from "@/lib/format/date";

export interface ProjectBillItem extends ProjectBillFormInitial {
  attachmentUrl: string | null;
}

export interface ProjectDetailData extends ProjectFormInitial {
  bills: ProjectBillItem[];
}

export function ProjectDetailClient({
  project,
  accounts,
  onBack,
}: {
  project: ProjectDetailData;
  accounts: { id: string; name: string }[];
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"bills" | "sum">("bills");
  const [phase, setPhase] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [billForm, setBillForm] = useState<"new" | ProjectBillItem | null>(null);

  const bills = useMemo(() => [...project.bills].sort((a, b) => (b.date || "").localeCompare(a.date || "")), [project.bills]);
  const mat = bills.reduce((s, b) => s + billTotal(b.items), 0);
  const usedPhases = useMemo(() => [...new Set(bills.map((b) => b.phase).filter((p): p is string => !!p))], [bills]);
  const shown = phase === "all" ? bills : bills.filter((b) => b.phase === phase);

  const hits = q.trim()
    ? bills.flatMap((b) => b.items.filter((it) => it.name.toLowerCase().includes(q.trim().toLowerCase())).map((it, k) => ({ ...it, key: b.id + k, b })))
    : null;

  const group = (key: "phase" | "shop") => {
    const m = new Map<string, number>();
    bills.forEach((b) => {
      const k = (b[key] as string) || "ไม่ระบุ";
      m.set(k, (m.get(k) ?? 0) + billTotal(b.items));
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const byPhase = group("phase");
  const byShop = group("shop");

  return (
    <>
      <button className="btn btn-sm" onClick={onBack} style={{ marginBottom: 14 }}>
        <Icon name="back" size={14} />
        บ้าน
      </button>
      <div className="hero">
        <div className="cap">{project.kind} · {PJ_STATUS_LABEL[project.status]} · เริ่ม {dLong(project.startOn)}{project.endOn ? ` · เสร็จ ${dLong(project.endOn)}` : ""}</div>
        <div className="num" style={{ fontSize: 32, fontWeight: 600, margin: "6px 0 2px" }}>{project.name}</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)" }}>จ่ายไปแล้ว <Money value={mat} /></div>
      </div>
      {!!project.budget && project.budget > 0 && (
        <div className="card card-pad" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", fontSize: 14, marginBottom: 8, gap: 8 }}>
            <span style={{ flex: 1 }}>ใช้งบไป {Math.round((mat / project.budget) * 100)}%</span>
            <span style={{ color: mat > project.budget ? "var(--neg)" : "var(--pos)", fontWeight: 600 }}>
              {mat > project.budget ? <>เกินงบ <Money value={mat - project.budget} /></> : <>เหลือ <Money value={project.budget - mat} /></>}
            </span>
          </div>
          <div className="bar"><i style={{ width: `${Math.min(100, (mat / project.budget) * 100)}%` }} /></div>
        </div>
      )}
      <div className="actbar">
        <button className="btn btn-primary" onClick={() => setBillForm("new")}>
          <Icon name="plus" size={15} color="currentColor" />
          บิลวัสดุ / ค่าใช้จ่าย
        </button>
        <button className="btn" onClick={() => setEditingProject(true)}>
          <Icon name="edit" size={15} />
          แก้ไขโครงการ
        </button>
      </div>
      {project.note && <div className="hint">{project.note}</div>}
      <div style={{ height: 16 }} />
      <div className="tabs">
        <button className={tab === "bills" ? "on" : ""} onClick={() => setTab("bills")}>บิล & วัสดุ ({bills.length})</button>
        <button className={tab === "sum" ? "on" : ""} onClick={() => setTab("sum")}>สรุปค่าใช้จ่าย</button>
      </div>
      {tab === "bills" && (
        <>
          <div className="pj-search">
            <Icon name="search" size={15} color="var(--ink-faint)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหารายการ เช่น ท่อ PVC, เหล็กกล่อง" />
            {q && <button className="link-btn" onClick={() => setQ("")}>ล้าง</button>}
          </div>
          {hits ? (
            <div className="card list">
              {hits.length ? (
                hits.map((h) => (
                  <div className="row" key={h.key}>
                    <span className="ic"><Icon name="search" size={17} color="var(--ink-soft)" /></span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span className="row-t">{h.name}</span>
                      <span className="row-s">{dLong(h.b.date)} · {h.b.shop || "—"} · {h.qty} × <Money value={h.price} /></span>
                    </span>
                    <span style={{ fontWeight: 600 }}><Money value={h.qty * h.price} /></span>
                  </div>
                ))
              ) : (
                <div className="empty">ไม่พบรายการ</div>
              )}
            </div>
          ) : (
            <>
              <div className="chips" style={{ marginBottom: 10 }}>
                {[["all", "ทั้งหมด"], ...usedPhases.map((x) => [x, x] as const)].map(([k, l]) => (
                  <button key={k} className={"chip" + (phase === k ? " on" : "")} onClick={() => setPhase(k)}>{l}</button>
                ))}
              </div>
              <div className="card list">
                {shown.length ? (
                  shown.map((b) => {
                    const on = open === b.id;
                    const tot = billTotal(b.items);
                    return (
                      <div key={b.id} className="trip-exp">
                        <button className="row rowlink" onClick={() => setOpen(on ? null : b.id)}>
                          <span className="ic"><Icon name="doc" size={17} color="var(--ink-soft)" /></span>
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span className="row-t">{b.shop || "ไม่ระบุร้าน"}</span>
                            <span className="row-s">{[dLong(b.date), b.phase, `${b.items.length} รายการ`].filter(Boolean).join(" · ")}</span>
                          </span>
                          <span style={{ fontWeight: 600 }}><Money value={tot} /></span>
                        </button>
                        {on && (
                          <div className="trip-exp-body">
                            <table className="pj-items">
                              <tbody>
                                {b.items.map((it, k) => (
                                  <tr key={k}>
                                    <td>{it.name}</td>
                                    <td className="r" style={{ color: "var(--ink-soft)" }}>{it.qty} × <Money value={it.price} /></td>
                                    <td className="r num"><Money value={it.qty * it.price} /></td>
                                  </tr>
                                ))}
                                <tr>
                                  <td style={{ fontWeight: 600 }}>รวมบิล</td>
                                  <td></td>
                                  <td className="r num" style={{ fontWeight: 600 }}><Money value={tot} /></td>
                                </tr>
                              </tbody>
                            </table>
                            {b.note && <div className="hint" style={{ margin: 0 }}>หมายเหตุ: {b.note}</div>}
                            {b.attachmentUrl && (
                              <div className="hint" style={{ margin: 0 }}>
                                <a href={b.attachmentUrl} target="_blank" rel="noreferrer">เปิดไฟล์บิล</a>
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn btn-sm" onClick={() => setBillForm(b)}>
                                <Icon name="edit" size={14} />
                                แก้ไข
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="empty">ยังไม่มีบิล</div>
                )}
              </div>
            </>
          )}
        </>
      )}
      {tab === "sum" && (
        <div className="grid g2">
          <div className="card card-pad">
            <div className="cap">แยกตามงาน</div>
            <div style={{ marginTop: 12 }}>
              {byPhase.length ? (
                byPhase.map(([k, v], i) => (
                  <div key={k} style={{ marginTop: i ? 12 : 0 }}>
                    <div style={{ display: "flex", fontSize: 14, marginBottom: 5, gap: 8 }}>
                      <span style={{ flex: 1 }}>{k}</span>
                      <b><Money value={v} /></b>
                    </div>
                    <div className="bar"><i style={{ width: `${(v / byPhase[0][1]) * 100}%` }} /></div>
                  </div>
                ))
              ) : (
                <div className="empty">ยังไม่มีบิล</div>
              )}
            </div>
          </div>
          <div className="card card-pad">
            <div className="cap">แยกตามร้าน</div>
            <div style={{ marginTop: 12 }}>
              {byShop.length ? (
                byShop.map(([k, v], i) => (
                  <div key={k} style={{ marginTop: i ? 12 : 0 }}>
                    <div style={{ display: "flex", fontSize: 14, marginBottom: 5, gap: 8 }}>
                      <span style={{ flex: 1 }}>{k}</span>
                      <span className="row-s">{bills.filter((b) => (b.shop || "ไม่ระบุ") === k).length} บิล</span>
                      <b><Money value={v} /></b>
                    </div>
                    <div className="bar"><i style={{ width: `${(v / byShop[0][1]) * 100}%`, background: "var(--accent-2)" }} /></div>
                  </div>
                ))
              ) : (
                <div className="empty">ยังไม่มีบิล</div>
              )}
            </div>
          </div>
        </div>
      )}
      {editingProject && (
        <ProjectForm
          initial={project}
          onClose={() => setEditingProject(false)}
        />
      )}
      {billForm === "new" && (
        <ProjectBillForm projectId={project.id} phases={project.phases} accounts={accounts} onClose={() => setBillForm(null)} />
      )}
      {billForm && billForm !== "new" && (
        <ProjectBillForm projectId={project.id} phases={project.phases} initial={billForm} accounts={accounts} onClose={() => setBillForm(null)} />
      )}
    </>
  );
}
