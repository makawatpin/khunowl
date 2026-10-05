"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { BankMark } from "@/components/ui/bank-mark";
import { parseSlip, slipIsDuplicate } from "@/lib/domain/slips";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/domain/categories";
import { getSlipDedupeContext, importSlipTransactions, type SlipDedupeTxn } from "@/lib/actions/slip-import";
import { useToast } from "@/components/providers/toast-provider";

// Tesseract.js loads from a CDN at runtime (not an npm dependency) — same approach as the
// prototype (design-reference/lifeos-slips.jsx): its WASM/traineddata payload is ~10-15MB and
// OCR only runs for the rare user who opens this form, so it shouldn't bloat every page's bundle.
declare global {
  interface Window {
    Tesseract?: {
      createWorker: (langs: string[], oem: number, opts: { logger: (m: { status: string; progress: number }) => void }) => Promise<TesseractWorker>;
    };
  }
}
interface TesseractWorker {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<void>;
}

let tesseractScriptPromise: Promise<void> | null = null;
function loadTesseractScript(): Promise<void> {
  if (window.Tesseract) return Promise.resolve();
  if (tesseractScriptPromise) return tesseractScriptPromise;
  tesseractScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
    s.onload = () => resolve();
    s.onerror = () => {
      tesseractScriptPromise = null;
      reject(new Error("load"));
    };
    document.head.appendChild(s);
  });
  return tesseractScriptPromise;
}

let sharedWorker: TesseractWorker | null = null;
let sharedWorkerPromise: Promise<TesseractWorker> | null = null;
async function getSlipWorker(onProgress: (m: { status: string; progress: number }) => void): Promise<TesseractWorker> {
  await loadTesseractScript();
  if (sharedWorker) return sharedWorker;
  if (!sharedWorkerPromise) {
    sharedWorkerPromise = window.Tesseract!.createWorker(["tha", "eng"], 1, { logger: onProgress }).then((w) => {
      sharedWorker = w;
      return w;
    });
  }
  return sharedWorkerPromise;
}
function endSlipWorker() {
  sharedWorker?.terminate();
  sharedWorker = null;
  sharedWorkerPromise = null;
}

function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(2, 1400 / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

interface Draft {
  amount: string;
  type: "expense" | "income";
  name: string;
  date: string;
  category: string;
  accountId: string;
  bank: string;
  time: string;
  ref: string;
  raw: string;
  dup: boolean;
  on: boolean;
}
interface SlipItem {
  id: string;
  file: File;
  url: string;
  status: "wait" | "read" | "done" | "fail";
  progress: number;
  error?: string;
  draft?: Draft;
}

let itemSeq = 0;

export function SlipImportForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const [items, setItems] = useState<SlipItem[]>([]);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(false);
  const [rawView, setRawView] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ existingRefs: Set<string>; recentTxns: SlipDedupeTxn[]; accounts: { id: string; name: string; bank: string | null }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchRefs = useRef<string[]>([]);

  useEffect(() => {
    getSlipDedupeContext().then((d) => setCtx({ existingRefs: new Set(d.existingRefs), recentTxns: d.recentTxns, accounts: d.accounts }));
    return () => {
      endSlipWorker();
    };
  }, []);

  const update = (id: string, patch: Partial<SlipItem>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setItems((xs) => xs.map((x) => (x.id === id && x.draft ? { ...x, draft: { ...x.draft, ...patch } } : x)));

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || !ctx) return;
    const list: SlipItem[] = [...fileList]
      .filter((f) => /^image\//.test(f.type))
      .map((f) => ({ id: `s${++itemSeq}`, file: f, url: URL.createObjectURL(f), status: "wait" as const, progress: 0 }));
    if (!list.length) return;
    setItems((xs) => [...xs, ...list]);
    setBusy(true);

    let worker: TesseractWorker;
    try {
      if (!sharedWorker) setLoadingMsg("กำลังโหลดตัวอ่านภาษาไทย (ครั้งแรกประมาณ 10–15 MB)");
      worker = await getSlipWorker((m) => {
        if (m.status === "recognizing text") {
          // Progress callback fires for whichever file is currently being recognized — the
          // latest "read" item is always the one this applies to.
          setItems((xs) => {
            const idx = [...xs].reverse().find((x) => x.status === "read");
            return idx ? xs.map((x) => (x.id === idx.id ? { ...x, progress: m.progress } : x)) : xs;
          });
        }
      });
      setLoadingMsg("");
    } catch {
      setLoadingMsg("");
      list.forEach((x) => update(x.id, { status: "fail", error: "โหลดตัวอ่านไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่" }));
      setBusy(false);
      return;
    }

    const todayISO = new Date().toISOString().slice(0, 10);
    for (const x of list) {
      update(x.id, { status: "read", progress: 0 });
      try {
        const canvas = await fileToCanvas(x.file);
        const { data } = await worker.recognize(canvas);
        const pastCategoryForName = (name: string) => ctx.recentTxns.find((t) => t.type === "expense" && t.name === name)?.category ?? undefined;
        const parsed = parseSlip({ text: data.text || "", todayISO, expenseCategories: EXPENSE_CATEGORIES, pastCategoryForName });
        const dup = slipIsDuplicate(parsed, ctx.existingRefs, batchRefs.current, ctx.recentTxns);
        if (parsed.ref) batchRefs.current.push(parsed.ref);
        const account = ctx.accounts.find((a) => a.bank === parsed.bank) ?? ctx.accounts[0];
        update(x.id, {
          status: "done",
          draft: {
            amount: parsed.amount ? String(parsed.amount) : "",
            type: "expense",
            name: parsed.name,
            date: parsed.date,
            category: parsed.category,
            accountId: account?.id ?? "",
            bank: parsed.bank,
            time: parsed.time,
            ref: parsed.ref,
            raw: parsed.raw,
            dup,
            on: !dup && parsed.amount > 0,
          },
        });
      } catch {
        update(x.id, { status: "fail", error: "อ่านรูปนี้ไม่ได้" });
      }
    }
    setBusy(false);
  };

  const ready = items.filter((x): x is SlipItem & { draft: Draft } => x.status === "done" && !!x.draft?.on && parseFloat(x.draft.amount) > 0);
  const total = ready.reduce((s, x) => s + (x.draft.type === "expense" ? parseFloat(x.draft.amount) || 0 : 0), 0);

  const handleSave = async () => {
    setSaving(true);
    const res = await importSlipTransactions(
      ready.map((x) => ({
        type: x.draft.type,
        amount: parseFloat(x.draft.amount) || 0,
        accountId: x.draft.accountId,
        category: x.draft.category,
        name: x.draft.name.trim() || (x.draft.type === "income" ? "รับโอน" : "โอนเงิน"),
        date: x.draft.date,
        note: "จากสลิป" + (x.draft.time ? ` ${x.draft.time}` : "") + (x.draft.ref ? ` · ${x.draft.ref}` : ""),
        ref: x.draft.ref ? `slip:${x.draft.ref}` : undefined,
      })),
    );
    setSaving(false);
    if (res.error) {
      show(res.error);
      return;
    }
    onClose();
    router.refresh();
    show(`บันทึกจากสลิป ${res.imported} รายการแล้ว`);
  };

  const accounts = ctx?.accounts ?? [];

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3 style={{ flex: 1 }}>อ่านสลิปโอนเงิน</h3>
          <button className="btn" onClick={onClose} style={{ padding: "6px 9px" }} aria-label="ปิด">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="modal-body">
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          {!items.length && (
            <>
              <button
                className={"slip-drop" + (drag ? " on" : "")}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
              >
                <span className="wcard-plus"><Icon name="upload" size={20} /></span>
                <b>เลือกรูปสลิป (เลือกได้หลายรูป)</b>
                <span className="row-s">หรือลากไฟล์มาวางตรงนี้</span>
              </button>
              <div className="hint">อ่านบนเครื่องของคุณ ไม่ส่งรูปออกไปไหน ไม่มีค่าใช้จ่าย ระบบจะดึงยอดเงิน วันที่ ผู้รับ และเลขอ้างอิงให้ ตรวจและแก้ได้ก่อนบันทึก สลิปที่เคยบันทึกแล้วจะไม่ลงซ้ำ</div>
            </>
          )}
          {loadingMsg && <div className="hint" style={{ marginTop: 0, marginBottom: 12 }}>{loadingMsg}…</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((x) => (
              <div key={x.id} className={"slip-card" + (x.status === "done" && !x.draft?.on ? " off" : "")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="slip-thumb" src={x.url} alt="" />
                <div style={{ minWidth: 0 }}>
                  {x.status === "wait" && <div className="row-s">รอคิว…</div>}
                  {x.status === "read" && (
                    <>
                      <div className="row-s" style={{ marginBottom: 8 }}>กำลังอ่าน… {Math.round((x.progress || 0) * 100)}%</div>
                      <div className="bar"><i style={{ width: `${Math.max(2, (x.progress || 0) * 100)}%` }} /></div>
                    </>
                  )}
                  {x.status === "fail" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="row-s" style={{ color: "var(--neg)", flex: 1 }}>{x.error}</span>
                      <button className="btn btn-sm" onClick={() => setItems((xs) => xs.filter((y) => y.id !== x.id))}>เอาออก</button>
                    </div>
                  )}
                  {x.status === "done" && x.draft && (
                    <div className="slip-form">
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <label className="check" style={{ margin: 0, flex: 1 }}>
                          <input type="checkbox" checked={x.draft.on} onChange={(e) => updateDraft(x.id, { on: e.target.checked })} />
                          บันทึกรายการนี้
                        </label>
                        {x.draft.dup && <span className="badge amber">อาจซ้ำ</span>}
                        {x.draft.bank && <BankMark bank={x.draft.bank} size={22} />}
                      </div>
                      <div className="field slip-row">
                        <input className="num" value={x.draft.amount} onChange={(e) => updateDraft(x.id, { amount: e.target.value })} inputMode="decimal" placeholder="ยอดเงิน" style={{ fontWeight: 600, fontSize: 17 }} />
                        <div className="seg" style={{ flexShrink: 0 }}>
                          {([["expense", "จ่าย"], ["income", "รับ"]] as const).map(([k, l]) => (
                            <button key={k} type="button" className={x.draft!.type === k ? "on" : ""} onClick={() => updateDraft(x.id, { type: k, category: k === "income" ? INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1] : x.draft!.category })}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <input value={x.draft.name} onChange={(e) => updateDraft(x.id, { name: e.target.value })} placeholder={x.draft.type === "income" ? "รับจาก" : "จ่ายให้"} />
                      </div>
                      <div className="field slip-row">
                        <input type="date" value={x.draft.date} onChange={(e) => updateDraft(x.id, { date: e.target.value })} />
                        <select value={x.draft.category} onChange={(e) => updateDraft(x.id, { category: e.target.value })}>
                          {(x.draft.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <select value={x.draft.accountId} onChange={(e) => updateDraft(x.id, { accountId: e.target.value })}>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="row-s" style={{ display: "flex", gap: 10 }}>
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {x.draft.time ? `${x.draft.time} · ` : ""}{x.draft.ref ? `อ้างอิง ${x.draft.ref}` : "ไม่พบเลขอ้างอิง"}
                        </span>
                        <button className="link-btn" onClick={() => setRawView(x.draft!.raw)}>ข้อความที่อ่านได้</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {items.length > 0 && (
          <div style={{ padding: "0 18px 18px", display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={busy} aria-label="เพิ่มรูป">
              <Icon name="plus" size={15} />
            </button>
            <button className="btn btn-primary" style={{ flex: 1, opacity: ready.length && !busy ? 1 : 0.4 }} disabled={!ready.length || busy || saving} onClick={handleSave}>
              {busy ? "กำลังอ่านสลิป…" : saving ? "กำลังบันทึก…" : `บันทึก ${ready.length} รายการ` + (total ? ` · ${Math.round(total).toLocaleString()} บาท` : "")}
            </button>
          </div>
        )}
      </div>
      {rawView != null && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && setRawView(null)}>
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ flex: 1 }}>ข้อความที่อ่านได้จากสลิป</h3>
              <button className="btn" onClick={() => setRawView(null)} style={{ padding: "6px 9px" }} aria-label="ปิด">
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="modal-body">
              <pre className="slip-raw">{rawView || "(ว่าง)"}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
