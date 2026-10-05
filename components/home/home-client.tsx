"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { ActRow } from "@/components/ui/act-row";
import { PropertyForm, type PropertyFormInitial } from "@/components/forms/property-form";
import { HomeTaskForm, type HomeTaskFormInitial } from "@/components/forms/home-task-form";
import { AssetForm, type AssetFormInitial } from "@/components/forms/asset-form";
import { ProjectForm } from "@/components/forms/project-form";
import { ProjectDetailClient, type ProjectDetailData } from "@/components/home/project-detail-client";
import { markHomeTaskDone, undoHomeTaskDone } from "@/lib/actions/home-tasks";
import { pjStats } from "@/lib/domain/projects";
import { PJ_STATUS_LABEL } from "@/lib/domain/things";
import { addDays, CYCLE_MONTHS, type Cycle } from "@/lib/domain/dates";
import { dLong } from "@/lib/format/date";
import { useToast } from "@/components/providers/toast-provider";

export type HomeTaskItem = HomeTaskFormInitial;

export interface ApplianceItem extends AssetFormInitial {
  receiptUrl: string | null;
}

export interface HomeBillItem {
  name: string;
  amount: number;
  cycle: Cycle;
}

export function HomeClient({
  property,
  homeTasks,
  appliances,
  homeBills,
  projects,
  accounts,
  todayISO,
}: {
  property: PropertyFormInitial | null;
  homeTasks: HomeTaskItem[];
  appliances: ApplianceItem[];
  homeBills: HomeBillItem[];
  projects: ProjectDetailData[];
  accounts: { id: string; name: string }[];
  todayISO: string;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingHome, setEditingHome] = useState(false);
  const [taskForm, setTaskForm] = useState<"new" | HomeTaskItem | null>(null);
  const [assetForm, setAssetForm] = useState<ApplianceItem | null>(null);
  const [projectForm, setProjectForm] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  if (selectedProject) {
    return <ProjectDetailClient project={selectedProject} accounts={accounts} onBack={() => setSelectedProjectId(null)} />;
  }

  const upkeepMonthly = homeTasks.reduce((s, h) => s + (h.cost || 0) / (h.everyMonths || 12), 0);
  const billsMonthly = homeBills.reduce((s, b) => s + b.amount / (CYCLE_MONTHS[b.cycle] || 1), 0);
  const totalMonthly = (property?.monthlyRent || 0) + billsMonthly + upkeepMonthly;
  const sortedTasks = [...homeTasks].sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1));

  const handleDone = async (task: HomeTaskItem) => {
    setDoneId(task.id);
    const res = await markHomeTaskDone(task.id);
    setDoneId(null);
    if (res.error) return show(res.error);
    router.refresh();
    if (res.prevNextDue !== undefined) {
      const { prevLastDone, prevNextDue } = res;
      show(`${task.name} เรียบร้อย`, async () => undoHomeTaskDone(task.id, prevLastDone ?? null, prevNextDue!));
    }
  };

  return (
    <>
      <div className="hero">
        <div className="cap">
          {property ? `${property.kind}${property.size ? " · " + property.size : ""} · อยู่มาตั้งแต่ ${dLong(property.since)}` : "ยังไม่ได้ตั้งค่าข้อมูลบ้าน"}
        </div>
        <div className="num" style={{ fontSize: 32, fontWeight: 600, margin: "6px 0 2px" }}>{property?.name ?? "บ้าน"}</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)" }}>
          ต่อเดือน <Money value={property?.monthlyRent ?? 0} />
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.28)" }}>
          <div style={{ flex: 1 }}><div className="cap">เครื่องใช้ไฟฟ้า</div><div style={{ fontSize: 18, fontWeight: 600 }}>{appliances.length} ชิ้น</div></div>
          <div style={{ flex: 1 }}><div className="cap">งานดูแล</div><div style={{ fontSize: 18, fontWeight: 600 }}>{homeTasks.length} รายการ</div></div>
          <div style={{ flex: 1 }}><div className="cap">ถึงกำหนด 30 วัน</div><div style={{ fontSize: 18, fontWeight: 600 }}>{homeTasks.filter((h) => h.nextDue <= addDays(todayISO, 30)).length} รายการ</div></div>
        </div>
      </div>
      <div className="actbar">
        <button className="btn" onClick={() => setEditingHome(true)}>
          <Icon name="edit" size={15} />
          แก้ไขข้อมูลบ้าน
        </button>
      </div>

      <div className="sec">
        <h2>งานต่อเติม / ก่อสร้าง</h2>
        <button className="more" onClick={() => setProjectForm(true)}>+ เริ่มโครงการ</button>
      </div>
      {projects.length ? (
        <div className="grid g2">
          {[...projects].sort((a, b) => (b.startOn || "").localeCompare(a.startOn || "")).map((p) => {
            const s = pjStats(p.bills);
            return (
              <button key={p.id} className="card card-pad trip-card" onClick={() => setSelectedProjectId(p.id)}>
                <span className="trip-card-top">
                  <span className="ic" style={{ background: "var(--warn-soft)" }}><Icon name="hammer" size={18} color="#B8762A" /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="row-t" style={{ fontWeight: 600 }}>{p.name}</span>
                    <span className="row-s">{p.kind} · เริ่ม {dLong(p.startOn)}</span>
                  </span>
                  <span className={"badge " + (p.status === "done" ? "green" : p.status === "in_progress" ? "accent" : "amber")}>{PJ_STATUS_LABEL[p.status]}</span>
                </span>
                <span className="trip-card-mid">
                  <span>
                    <span className="cap">จ่ายไปแล้ว</span>
                    <span style={{ display: "block", fontSize: 22, fontWeight: 600 }}><Money value={s.mat} /></span>
                  </span>
                </span>
                {!!p.budget && p.budget > 0 && (
                  <span style={{ display: "block" }}>
                    <div className="bar"><i style={{ width: `${Math.min(100, (s.mat / p.budget) * 100)}%` }} /></div>
                    <span className="row-s" style={{ marginTop: 6 }}>
                      ใช้ไปแล้ว <Money value={s.mat} /> จากงบ <Money value={p.budget} />
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card list">
          <div className="empty">บันทึกค่าวัสดุและบิลทุกใบของงานต่อเติมไว้ดูย้อนหลัง</div>
        </div>
      )}

      <div className="sec">
        <h2>ตารางดูแลบ้าน</h2>
        <button className="more" onClick={() => setTaskForm("new")}>+ เพิ่มงาน</button>
      </div>
      <div className="card list">
        {sortedTasks.length ? (
          sortedTasks.map((h) => (
            <ActRow
              key={h.id}
              icon="wrench"
              title={h.name}
              sub={`ทุก ${h.everyMonths} เดือน${h.lastDone ? ` · ทำล่าสุด ${dLong(h.lastDone)}` : ""}${h.cost ? ` · ~฿${h.cost.toLocaleString()}` : ""}`}
              due={h.nextDue}
              btn={doneId === h.id ? "กำลังบันทึก…" : "ทำแล้ว"}
              onBtn={() => handleDone(h)}
              onClick={() => setTaskForm(h)}
            />
          ))
        ) : (
          <div className="empty">ยังไม่มีงานดูแลบ้าน</div>
        )}
      </div>

      <div className="sec"><h2>เครื่องใช้ไฟฟ้า</h2></div>
      <div className="card list">
        {appliances.length ? (
          appliances.map((a) => (
            <button key={a.id} className="row rowlink" onClick={() => setAssetForm(a)}>
              <span className="ic"><Icon name="box" size={17} color="var(--ink-soft)" /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="row-t">{a.name}</span>
                <span className="row-s">{a.brand} · ซื้อ {dLong(a.purchasedOn)}</span>
              </span>
              <span style={{ fontWeight: 600 }}><Money value={a.price} /></span>
            </button>
          ))
        ) : (
          <div className="empty">ยังไม่มีเครื่องใช้ไฟฟ้า</div>
        )}
      </div>

      <div className="sec"><h2>ค่าใช้จ่ายบ้านต่อเดือน</h2></div>
      <div className="card card-pad">
        <dl className="dl">
          <dt>{property?.kind === "ผ่อน" ? "ค่างวด" : "ค่าเช่า"}</dt>
          <dd><Money value={property?.monthlyRent ?? 0} /></dd>
          {homeBills.map((b) => (
            <Fragment key={b.name}>
              <dt>{b.name}</dt>
              <dd><Money value={b.amount / (CYCLE_MONTHS[b.cycle] || 1)} /></dd>
            </Fragment>
          ))}
          <dt>ดูแลบ้านเฉลี่ย</dt>
          <dd><Money value={upkeepMonthly} /></dd>
          <dt>รวม</dt>
          <dd><b><Money value={totalMonthly} /></b></dd>
        </dl>
      </div>

      {editingHome && <PropertyForm initial={property ?? undefined} onClose={() => setEditingHome(false)} />}
      {taskForm === "new" && <HomeTaskForm onClose={() => setTaskForm(null)} />}
      {taskForm && taskForm !== "new" && <HomeTaskForm initial={taskForm} onClose={() => setTaskForm(null)} />}
      {assetForm && <AssetForm initial={assetForm} accounts={accounts} onClose={() => setAssetForm(null)} />}
      {projectForm && (
        <ProjectForm
          onClose={() => setProjectForm(false)}
          onCreated={(id) => {
            setProjectForm(false);
            setSelectedProjectId(id);
          }}
        />
      )}
    </>
  );
}
