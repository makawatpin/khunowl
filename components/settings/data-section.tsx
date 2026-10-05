"use client";

import { Fragment, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { exportBackupJSON, exportTransactionsForCsv } from "@/lib/actions/backup";
import { importLegacy, type ImportLegacyResult } from "@/lib/actions/import-legacy";
import { clearAllData } from "@/lib/actions/clear-data";
import { useToast } from "@/components/providers/toast-provider";
import { todayISOInBangkok } from "@/lib/dates/today";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function csvEscape(v: string | number | null): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function DataSection() {
  const router = useRouter();
  const { show } = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportLegacyResult | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearPhrase, setClearPhrase] = useState("");
  const [clearError, setClearError] = useState<string | null>(null);

  const handleExportJson = async () => {
    setBusy("json");
    const res = await exportBackupJSON();
    setBusy(null);
    if (res.error || !res.data) return show(res.error ?? "สำรองข้อมูลไม่สำเร็จ");
    download(`khunowl-backup-${todayISOInBangkok()}.json`, JSON.stringify(res.data, null, 2), "application/json");
    show("ดาวน์โหลดไฟล์สำรองแล้ว");
  };

  const handleExportCsv = async () => {
    setBusy("csv");
    const res = await exportTransactionsForCsv();
    setBusy(null);
    if (res.error || !res.rows) return show(res.error ?? "ส่งออก CSV ไม่สำเร็จ");
    const header = "date,type,name,category,amount,note";
    const lines = res.rows.map((r) => [r.date, r.type, csvEscape(r.name), csvEscape(r.category), r.amount, csvEscape(r.note)].join(","));
    download(`khunowl-transactions-${todayISOInBangkok()}.csv`, [header, ...lines].join("\n"), "text/csv");
    show("ดาวน์โหลด CSV แล้ว");
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    if (!window.confirm("นำเข้าข้อมูลจากไฟล์สำรองเดิมจะเพิ่มข้อมูลต่อจากที่มีอยู่ (ไม่ได้แทนที่) ดำเนินการต่อไหม?")) return;
    setBusy("import");
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await importLegacy(json);
      setImportSummary(result);
      if (!result.error) {
        router.refresh();
        show("นำเข้าข้อมูลเสร็จแล้ว");
      }
    } catch {
      show("ไฟล์ไม่ถูกต้อง");
    }
    setBusy(null);
  };

  const handleClear = async () => {
    setClearError(null);
    setBusy("clear");
    const res = await clearAllData(clearPhrase);
    setBusy(null);
    if (res.error) {
      setClearError(res.error);
      return;
    }
    setClearing(false);
    setClearPhrase("");
    router.refresh();
    show("ล้างข้อมูลทั้งหมดแล้ว");
  };

  return (
    <>
      <div className="card list">
        <button className="row rowlink" onClick={handleExportJson} disabled={busy === "json"}>
          <span className="ic"><Icon name="download" size={17} color="var(--ink-soft)" /></span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span className="row-t">สำรองข้อมูลเป็นไฟล์ (JSON)</span>
            <span className="row-s">ข้อมูลทั้งหมดของบัญชีนี้ ดาวน์โหลดเก็บไว้ในเครื่องหรือคลาวด์</span>
          </span>
        </button>
        <button className="row rowlink" onClick={handleExportCsv} disabled={busy === "csv"}>
          <span className="ic"><Icon name="download" size={17} color="var(--ink-soft)" /></span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span className="row-t">ส่งออกรายการเงินเป็น CSV</span>
            <span className="row-s">เปิดด้วย Excel/Google Sheets ได้</span>
          </span>
        </button>
        <button className="row rowlink" onClick={() => importRef.current?.click()} disabled={busy === "import"}>
          <span className="ic"><Icon name="upload" size={17} color="var(--ink-soft)" /></span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span className="row-t">นำเข้าจากไฟล์สำรองเดิม</span>
            <span className="row-s">ไฟล์ .json จากแอป KhunOwl เวอร์ชันก่อนหน้า — เพิ่มต่อจากข้อมูลปัจจุบัน ไม่แทนที่</span>
          </span>
        </button>
        <input ref={importRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={(e) => { handleImportFile(e.target.files?.[0]); e.target.value = ""; }} />
        <button className="row rowlink" onClick={() => setClearing(true)}>
          <span className="ic" style={{ background: "var(--neg-soft)" }}><Icon name="trash" size={17} color="var(--neg)" /></span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span className="row-t" style={{ color: "var(--neg)" }}>ล้างข้อมูลทั้งหมด</span>
            <span className="row-s">ลบถาวรทุกอย่าง — บัญชี บิล รายการเงิน ทริป ฯลฯ</span>
          </span>
        </button>
      </div>

      {importSummary && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && setImportSummary(null)}>
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ flex: 1 }}>ผลการนำเข้า</h3>
              <button className="btn" onClick={() => setImportSummary(null)} style={{ padding: "6px 9px" }} aria-label="ปิด">
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="modal-body">
              {importSummary.error ? (
                <div className="hint" style={{ color: "var(--neg)" }}>{importSummary.error}</div>
              ) : (
                <dl className="dl">
                  {Object.entries(importSummary.imported).map(([k, v]) => (
                    <Fragment key={k}>
                      <dt>{k}</dt>
                      <dd>นำเข้า {v} รายการ{importSummary.skipped[k] ? ` · ข้าม ${importSummary.skipped[k]}` : ""}</dd>
                    </Fragment>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      )}

      {clearing && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && setClearing(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ flex: 1 }}>ล้างข้อมูลทั้งหมด</h3>
              <button className="btn" onClick={() => setClearing(false)} style={{ padding: "6px 9px" }} aria-label="ปิด">
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p className="hint" style={{ margin: "0 0 14px", color: "var(--neg)" }}>
                การกระทำนี้ลบข้อมูลทั้งหมดถาวร ย้อนกลับไม่ได้ แนะนำให้สำรองข้อมูลก่อน พิมพ์ &ldquo;ลบข้อมูลทั้งหมด&rdquo; เพื่อยืนยัน
              </p>
              {clearError && <div className="hint" style={{ color: "var(--neg)" }}>{clearError}</div>}
              <div className="field">
                <input value={clearPhrase} onChange={(e) => setClearPhrase(e.target.value)} placeholder="ลบข้อมูลทั้งหมด" />
              </div>
            </div>
            <div style={{ padding: "0 18px 18px", display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => setClearing(false)}>ยกเลิก</button>
              <button className="btn btn-danger" style={{ flex: 1 }} disabled={clearPhrase !== "ลบข้อมูลทั้งหมด" || busy === "clear"} onClick={handleClear}>
                {busy === "clear" ? "กำลังลบ…" : "ลบถาวร"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
