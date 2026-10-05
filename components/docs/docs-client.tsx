"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { DocumentForm, type DocumentFormInitial } from "@/components/forms/document-form";
import { dueLabel, daysTo } from "@/lib/domain/dates";
import { dShort } from "@/lib/format/date";

export interface DocumentItem extends DocumentFormInitial {
  fileUrl: string | null;
}

export function DocsClient({ documents, todayISO }: { documents: DocumentItem[]; todayISO: string }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [openForm, setOpenForm] = useState<"new" | DocumentItem | null>(null);

  const types = useMemo(() => [...new Set(documents.map((d) => d.type).filter((t): t is string => !!t))], [documents]);
  const list = useMemo(
    () =>
      documents
        .filter((d) => (!type || d.type === type) && (!q || (d.name + (d.related ?? "")).toLowerCase().includes(q.toLowerCase())))
        .sort((a, b) => ((a.expiry || "9999") < (b.expiry || "9999") ? -1 : 1)),
    [documents, type, q],
  );
  const expiring = documents.filter((d) => {
    const n = d.expiry ? daysTo(d.expiry, todayISO) : null;
    return n != null && n >= 0 && n <= 60;
  });

  return (
    <>
      <div className="grid g2">
        <div className="card card-pad hero">
          <div className="cap">เอกสารทั้งหมด</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{documents.length} ฉบับ</div>
        </div>
        <div className="card card-pad" style={{ background: "var(--warn-soft)" }}>
          <div className="cap">ใกล้หมดอายุ (60 วัน)</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{expiring.length} ฉบับ</div>
          <div className="row-s">{expiring.map((d) => d.name).join(", ") || "—"}</div>
        </div>
      </div>
      <div className="sec">
        <h2>คลังเอกสาร</h2>
        <button className="more" onClick={() => setOpenForm("new")}>+ เพิ่มเอกสาร</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <div className="searchbox" style={{ maxWidth: 260 }}>
          <Icon name="search" size={15} color="var(--ink-faint)" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเอกสาร" />
        </div>
        <div className="chips">
          <button className={"chip" + (type === "" ? " on" : "")} onClick={() => setType("")}>ทั้งหมด</button>
          {types.map((t) => (
            <button key={t} className={"chip" + (type === t ? " on" : "")} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="card list">
        {list.length ? (
          list.map((d) => {
            const dd = d.expiry ? dueLabel(d.expiry, todayISO) : null;
            return (
              <button key={d.id} className="row rowlink" onClick={() => setOpenForm(d)}>
                <span className="ic"><Icon name="doc" size={17} color="var(--ink-soft)" /></span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="row-t">{d.name}</span>
                  <span className="row-s">{d.type}{d.related ? ` · ${d.related}` : ""}</span>
                </span>
                <span style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ display: "block", fontWeight: 600 }}>{d.expiry ? dShort(d.expiry, todayISO) : "ไม่หมดอายุ"}</span>
                  {dd && <span className={"badge " + dd.tone}>{dd.text}</span>}
                </span>
              </button>
            );
          })
        ) : (
          <div className="empty">ไม่พบเอกสาร</div>
        )}
      </div>
      {openForm === "new" && <DocumentForm onClose={() => setOpenForm(null)} />}
      {openForm && openForm !== "new" && <DocumentForm initial={openForm} onClose={() => setOpenForm(null)} />}
    </>
  );
}
