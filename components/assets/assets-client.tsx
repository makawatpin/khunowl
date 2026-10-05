"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { AssetForm, type AssetFormInitial } from "@/components/forms/asset-form";
import { ASSET_KINDS } from "@/lib/domain/things";
import { warrantyState, assetValue } from "@/lib/domain/assets";
import { dLong, dShort } from "@/lib/format/date";
import { daysTo } from "@/lib/domain/dates";

export interface AssetItem extends AssetFormInitial {
  receiptUrl: string | null;
}

export interface LinkedDocItem {
  id: string;
  name: string;
  type: string | null;
  expiry: string | null;
  related: string | null;
}

type Tab = "all" | "warranty" | "appliance" | "sold";

export function AssetsClient({
  assets,
  accounts,
  documents,
  todayISO,
}: {
  assets: AssetItem[];
  accounts: { id: string; name: string }[];
  documents: LinkedDocItem[];
  todayISO: string;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<"new" | AssetItem | null>(null);

  const active = useMemo(() => assets.filter((a) => !a.sold), [assets]);
  const sold = useMemo(() => assets.filter((a) => a.sold), [assets]);
  const sel = assets.find((a) => a.id === selId) ?? null;

  const base =
    tab === "sold" ? sold : tab === "warranty" ? active.filter((a) => a.warrantyUntil && daysTo(a.warrantyUntil, todayISO) >= 0) : tab === "appliance" ? active.filter((a) => a.kind === "เครื่องใช้ไฟฟ้า") : active;
  const ql = q.trim().toLowerCase();
  const list = useMemo(
    () =>
      base
        .filter((a) => !ql || [a.name, a.brand, a.model, a.serial, a.store].some((x) => x && x.toLowerCase().includes(ql)))
        .slice()
        .sort((a, b) => ((a.purchasedOn ?? "") < (b.purchasedOn ?? "") ? 1 : -1)),
    [base, ql],
  );
  const expiring = active.filter((a) => {
    const n = a.warrantyUntil ? daysTo(a.warrantyUntil, todayISO) : null;
    return n != null && n >= 0 && n <= 45;
  });

  const linkedDocs = (a: AssetItem) => documents.filter((d) => d.related && (a.name.includes(d.related) || d.related.includes(a.name)));

  return (
    <>
      <div className="grid g3">
        <div className="card card-pad hero">
          <div className="cap">มูลค่าของที่ใช้อยู่ (ราคาซื้อ)</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}><Money value={assetValue(active)} /></div>
          <div className="row-s">
            {active.length} ชิ้น{sold.length ? ` · ขายไปแล้ว ${sold.length} ชิ้น` : ""}
          </div>
        </div>
        <div className="card card-pad" style={{ background: "var(--pos-soft)" }}>
          <div className="cap">ทรัพย์สินทั้งหมด</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{assets.length} ชิ้น</div>
        </div>
        <div className="card card-pad" style={{ background: "var(--warn-soft)" }}>
          <div className="cap">ประกันใกล้หมด (45 วัน)</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{expiring.length} ชิ้น</div>
          <div className="row-s">{expiring.map((a) => a.name).join(", ") || "—"}</div>
        </div>
      </div>
      <div className="sec">
        <h2>ทรัพย์สินทั้งหมด</h2>
        <button className="more" onClick={() => setOpenForm("new")}>+ เพิ่ม</button>
      </div>
      <div className="tabs">
        {([
          ["all", "ใช้อยู่"],
          ["warranty", "ยังมีประกัน"],
          ["appliance", "เครื่องใช้ไฟฟ้า"],
          ["sold", `ขาย/ปลดระวางแล้ว (${sold.length})`],
        ] as const).map(([k, l]) => (
          <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>
      <div className="pj-search">
        <Icon name="search" size={15} color="var(--ink-faint)" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ ยี่ห้อ รุ่น ซีเรียล ร้าน" />
        {q && <button className="link-btn" onClick={() => setQ("")}>ล้าง</button>}
      </div>
      <div className="card list">
        {list.length ? (
          list.map((a) => {
            const w = warrantyState(a.warrantyUntil, todayISO);
            return (
              <button key={a.id} className="row rowlink" onClick={() => setSelId(a.id)}>
                <span className="ic"><Icon name="box" size={17} color="var(--ink-soft)" /></span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="row-t">{a.name}</span>
                  <span className="row-s">
                    {[[a.brand, a.model].filter(Boolean).join(" "), `ซื้อ ${dShort(a.purchasedOn, todayISO)}`, a.store].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ display: "block", fontWeight: 600 }}><Money value={a.price} /></span>
                  <span className="row-s">{a.sold ? "ขายแล้ว" : w.label}</span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="empty">{q ? "ไม่พบรายการ" : tab === "sold" ? "ยังไม่มีของที่ขายไป" : "ยังไม่มีทรัพย์สิน"}</div>
        )}
      </div>

      {sel && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && setSelId(null)}>
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ flex: 1 }}>{sel.name}</h3>
              <button className="btn" onClick={() => setSelId(null)} style={{ padding: "6px 9px" }} aria-label="ปิด">
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="modal-body">
              <dl className="dl">
                <dt>ประเภท</dt>
                <dd>{sel.kind || ASSET_KINDS[0]}</dd>
                <dt>แบรนด์</dt>
                <dd>{sel.brand || "—"}</dd>
                {sel.model && (
                  <>
                    <dt>รุ่น</dt>
                    <dd>{sel.model}</dd>
                  </>
                )}
                <dt>ซีเรียล</dt>
                <dd className="num">{sel.serial || "—"}</dd>
                <dt>ราคาที่จ่าย</dt>
                <dd><Money value={sel.price} /></dd>
                <dt>วันที่ซื้อ</dt>
                <dd>{dLong(sel.purchasedOn)}</dd>
                <dt>ร้าน</dt>
                <dd>{sel.store || "—"}</dd>
                <dt>ประกัน</dt>
                <dd>
                  {sel.warrantyUntil ? (
                    <>
                      ถึง {dLong(sel.warrantyUntil)} <span className={"badge " + warrantyState(sel.warrantyUntil, todayISO).tone}>{warrantyState(sel.warrantyUntil, todayISO).label}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
                {sel.note && (
                  <>
                    <dt>หมายเหตุ</dt>
                    <dd>{sel.note}</dd>
                  </>
                )}
                {sel.receiptUrl && (
                  <>
                    <dt>ใบเสร็จ</dt>
                    <dd><a href={sel.receiptUrl} target="_blank" rel="noreferrer">เปิดไฟล์</a></dd>
                  </>
                )}
              </dl>
              <div className="sec"><h2>เอกสารที่ผูกไว้</h2></div>
              <div className="card list">
                {linkedDocs(sel).length ? (
                  linkedDocs(sel).map((d) => (
                    <div className="row" key={d.id}>
                      <span className="ic"><Icon name="doc" size={17} color="var(--ink-soft)" /></span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span className="row-t">{d.name}</span>
                        <span className="row-s">{d.type}</span>
                      </span>
                      <span className="row-s">{d.expiry ? dShort(d.expiry, todayISO) : "—"}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty">ยังไม่มีเอกสาร</div>
                )}
              </div>
            </div>
            <div style={{ padding: "0 18px 18px", display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setSelId(null); setOpenForm(sel); }}>
                {sel.sold ? "แก้ไข" : "แก้ไข / บันทึกขาย"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openForm === "new" && <AssetForm accounts={accounts} onClose={() => setOpenForm(null)} />}
      {openForm && openForm !== "new" && <AssetForm initial={openForm} accounts={accounts} onClose={() => setOpenForm(null)} />}
    </>
  );
}
