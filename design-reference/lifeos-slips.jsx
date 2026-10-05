// lifeos-slips.jsx — read Thai bank transfer slips on-device (Tesseract.js, free) → review → save as transactions
let _tessP = null, _slipWorker = null, _slipWorkerP = null;
function loadTess() {
  if (window.Tesseract) return Promise.resolve();
  if (_tessP) return _tessP;
  _tessP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = res; s.onerror = () => { _tessP = null; rej(new Error('load')); }; document.head.appendChild(s); });
  return _tessP;
}
async function getSlipWorker() {
  await loadTess();
  if (_slipWorker) return _slipWorker;
  if (!_slipWorkerP) _slipWorkerP = window.Tesseract.createWorker(['tha', 'eng'], 1, { logger: m => { if (window.__slipLog) window.__slipLog(m); } }).then(w => { _slipWorker = w; return w; });
  return _slipWorkerP;
}
function endSlipWorker() { if (_slipWorker) { _slipWorker.terminate(); } _slipWorker = null; _slipWorkerP = null; }
function fileToCanvas(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => { const sc = Math.min(2, 1400 / img.width); const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); res(c); };
    img.onerror = rej; img.src = URL.createObjectURL(file);
  });
}

// ── parsing (all on-device) ──
const SLIP_TH_MON = { มค: 1, มกราคม: 1, กพ: 2, กุมภาพันธ์: 2, มีค: 3, มีนาคม: 3, เมย: 4, เมษายน: 4, พค: 5, พฤษภาคม: 5, มิย: 6, มิถุนายน: 6, กค: 7, กรกฎาคม: 7, สค: 8, สิงหาคม: 8, กย: 9, กันยายน: 9, ตค: 10, ตุลาคม: 10, พย: 11, พฤศจิกายน: 11, ธค: 12, ธันวาคม: 12 };
const SLIP_EN_MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const slipYear = (y) => { y = +y; if (y < 100) y += y >= 40 ? 2500 : 2000; if (y > 2400) y -= 543; return y; };
const slipIso = (y, m, d) => (m >= 1 && m <= 12 && d >= 1 && d <= 31) ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
function slipDate(text) {
  let m, re = /(\d{1,2})\s*([ก-๙.]{2,12})\s*(\d{2,4})/g;
  while ((m = re.exec(text))) { const k = m[2].replace(/[.\s]/g, ''); if (SLIP_TH_MON[k]) { const iso = slipIso(slipYear(m[3]), SLIP_TH_MON[k], +m[1]); if (iso) return iso; } }
  m = text.match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*,?\s*(\d{2,4})/i);
  if (m) { const iso = slipIso(slipYear(m[3]), SLIP_EN_MON[m[2].toLowerCase()], +m[1]); if (iso) return iso; }
  m = text.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m) { const iso = slipIso(slipYear(m[3]), +m[2], +m[1]); if (iso) return iso; }
  return TODAY_ISO;
}
const slipNum = (s) => { const m = (s || '').replace(/\s/g, '').match(/(\d{1,3}(?:,\d{3})+|\d+)\.\d{2}/); return m ? parseFloat(m[0].replace(/,/g, '')) : null; };
function slipAmount(lines) {
  for (let i = 0; i < lines.length; i++) if (/จำนวน|amount|ยอดเงิน|ยอดชำระ|ยอดโอน/i.test(lines[i]) && !/ค่าธรรมเนียม|fee/i.test(lines[i])) { const v = slipNum(lines[i]) ?? slipNum(lines[i + 1]); if (v > 0) return v; }
  for (const l of lines) if (/บาท|THB|฿/i.test(l) && !/ค่าธรรมเนียม|fee/i.test(l)) { const v = slipNum(l); if (v > 0) return v; }
  const all = lines.map(slipNum).filter(v => v > 0);
  return all.length ? Math.max(...all) : 0;
}
function slipRef(lines, text) {
  for (let i = 0; i < lines.length; i++) {
    const k = lines[i].match(/(เลขที่รายการ|รหัสอ้างอิง|หมายเลขอ้างอิง|เลขอ้างอิง|ref(?:erence)?\.?\s*(?:no|id)?|transaction\s*(?:id|no)?)/i);
    if (k) { const rest = lines[i].slice(lines[i].indexOf(k[0]) + k[0].length) + ' ' + (lines[i + 1] || ''); const m = rest.replace(/[:：]/g, ' ').match(/[A-Za-z0-9]{10,}/g); const hit = m && m.find(x => /\d{4,}/.test(x)); if (hit) return hit; }
  }
  const toks = (text.match(/[A-Za-z0-9]{14,}/g) || []).filter(x => (x.match(/\d/g) || []).length >= 6);
  return toks[0] || '';
}
const SLIP_NAME_RE = /(นางสาว|นาย|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.|บจก\.?|บริษัท|หจก\.?|ร้าน|MRS?\.?|MS\.?|MISS)\s*[^\d\n]{2,40}/i;
const slipClean = (s) => (s || '').replace(/[xX*•\d][xX*•\d\-\s]{5,}.*$/, '').replace(/(ธนาคาร|bank).*$/i, '').replace(/[|"'`_]+/g, '').replace(/\s{2,}/g, ' ').trim().slice(0, 40);
function slipNames(lines) {
  let to = '', from = '';
  const after = (re) => { for (let i = 0; i < lines.length; i++) { const m = lines[i].match(re); if (m) { const r = lines[i].slice(m.index + m[0].length).replace(/^[\s:：]+/, ''); return r.length > 1 ? r : (lines[i + 1] || ''); } } return ''; };
  to = after(/^(ไปยัง|ไปที่|ถึง|ผู้รับ(เงิน)?|to)\b/i); from = after(/^(จาก|ผู้โอน|from)\b/i);
  const names = lines.filter(l => SLIP_NAME_RE.test(l)).map(l => l.match(SLIP_NAME_RE)[0]);
  if (!to && names.length >= 2) to = names[1];
  if (!from && names.length) from = names[0];
  if (!to) { const k = lines.findIndex(l => /ชำระ(เงิน)?|จ่ายบิล|payment|merchant|ร้านค้า|biller/i.test(l)); if (k >= 0) to = lines[k + 1] || ''; }
  return { to: slipClean(to), from: slipClean(from) };
}
const SLIP_BANKS = [['make', /make\s?by\s?k/i], ['kept', /\bkept\b/i], ['paotang', /เป๋าตัง|paotang/i], ['clicx', /clicx/i], ['kbank', /กสิกร|k\s?plus|kbank|kasikorn/i], ['scb', /ไทยพาณิชย์|scb\s?easy|\bscb\b/i], ['ktb', /กรุงไทย|krungthai|\bktb\b|เป๋าตัง/i], ['bay', /กรุงศรี|krungsri/i], ['ttb', /\bttb\b|ทีทีบี|ทหารไทย/i], ['gsb', /ออมสิน|mymo|\bgsb\b/i], ['bbl', /ธนาคารกรุงเทพ|bangkok\s?bank|bualuang/i], ['truemoney', /true\s?money|ทรูมันนี่/i], ['uob', /\buob\b|ยูโอบี/i], ['cimb', /cimb|ซีไอเอ็มบี/i], ['lhb', /lh\s?bank|แลนด์\s?แอนด์|\blhb\b/i], ['kkp', /\bkkp\b|เกียรตินาคิน/i], ['tisco', /tisco|ทิสโก้/i], ['baac', /ธ\.?ก\.?ส|baac/i], ['ghb', /อาคารสงเคราะห์|\bghb\b|ธอส/i], ['ibank', /ธนาคารอิสลาม|ibank/i], ['icbc', /icbc|ไอซีบีซี/i], ['linebk', /line\s?bk/i], ['dime', /\bdime\b/i], ['shopeepay', /shopee\s?pay|ช้อปปี้เพย์/i]];
const SLIP_CAT_KW = [['รถ', /\bptt\b|ปตท|shell|เชลล์|bangchak|บางจาก|caltex|esso|น้ำมัน|pt\s?station/i], ['เดินทาง', /grab(?!food)|bolt|\bbts\b|\bmrt\b|taxi|แท็กซี่|easy\s?pass|m-?flow|ทางด่วน/i], ['บิล/ค่าน้ำไฟ', /การไฟฟ้า|\bmea\b|\bpea\b|ประปา|\bais\b|true\s?move|dtac|3bb|internet|ค่าไฟ|ค่าน้ำ/i], ['ช้อปปิ้ง', /shopee|lazada|ลาซาด้า|ช้อปปี้|central|uniqlo|homepro|โฮมโปร|ikea|tiktok/i], ['บันเทิง', /netflix|spotify|youtube|major|sf\s?cinema|steam|disney/i], ['สุขภาพ', /โรงพยาบาล|hospital|คลินิก|clinic|ร้านยา|pharmacy|ทันตกรรม/i], ['อาหาร', /อาหาร|food|cafe|คาเฟ่|กาแฟ|coffee|ข้าว|ก๋วยเตี๋ยว|ชาบู|หมูกระทะ|7-?eleven|เซเว่น|lotus|โลตัส|big\s?c|makro|แม็คโคร|tops|line\s?man|foodpanda|robinhood/i]];
const slipFallbackCat = () => EXP_CATS.includes('อื่นๆ') ? 'อื่นๆ' : EXP_CATS[EXP_CATS.length - 1];
function slipCat(name, text) {
  const past = name && LOS_TXNS.find(t => t.type === 'expense' && t.name === name);
  if (past && EXP_CATS.includes(past.cat)) return past.cat;
  const hit = SLIP_CAT_KW.find(([c, re]) => EXP_CATS.includes(c) && (re.test(name || '') || re.test(text)));
  return hit ? hit[0] : slipFallbackCat();
}
function parseSlip(text) {
  const lines = (text || '').split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const head = lines.slice(0, 6).join(' ');
  const bank = (SLIP_BANKS.find(([, re]) => re.test(head)) || SLIP_BANKS.find(([, re]) => re.test(text)) || [''])[0];
  const acc = bank && LOS_ACCOUNTS.find(a => a.bank === bank);
  const { to, from } = slipNames(lines);
  const tm = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  return { amount: slipAmount(lines), date: slipDate(text), time: tm ? `${tm[1].padStart(2, '0')}:${tm[2]}` : '', ref: slipRef(lines, text), name: to || 'โอนเงิน', from, bank, src: acc ? acc.id : firstAcc(), cat: slipCat(to, text), type: 'expense', raw: text };
}
function slipDup(p, batch) {
  if (p.ref && (LOS_TXNS.some(t => t.ref === 'slip:' + p.ref) || batch.some(b => b.ref === p.ref))) return true;
  return LOS_TXNS.some(t => t.type === p.type && Math.abs(t.amount - p.amount) < 0.01 && t.date === p.date && t.name === p.name);
}

// ── UI ──
function SlipImport({ onClose }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [drag, setDrag] = React.useState(false);
  const [raw, setRaw] = React.useState(null);
  const inp = React.useRef(null), doneRef = React.useRef([]);
  React.useEffect(() => () => { window.__slipLog = null; endSlipWorker(); }, []);
  const upd = (id, patch) => setItems(xs => xs.map(x => x.id === id ? { ...x, ...patch } : x));
  const updD = (id, patch) => setItems(xs => xs.map(x => x.id === id ? { ...x, d: { ...x.d, ...patch } } : x));
  const addFiles = async (files) => {
    const list = [...files].filter(f => /^image\//.test(f.type)).map(f => ({ id: lid(), file: f, url: URL.createObjectURL(f), st: 'wait', prog: 0 }));
    if (!list.length) return;
    setItems(xs => [...xs, ...list]); setBusy(true);
    let worker;
    try { if (!_slipWorker) setLoading('กำลังโหลดตัวอ่านภาษาไทย (ครั้งแรกประมาณ 10–15 MB)'); worker = await getSlipWorker(); setLoading(''); }
    catch (e) { setLoading(''); list.forEach(x => upd(x.id, { st: 'fail', err: 'โหลดตัวอ่านไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่' })); setBusy(false); return; }
    for (const x of list) {
      upd(x.id, { st: 'read', prog: 0 });
      window.__slipLog = (m) => { if (m.status === 'recognizing text') upd(x.id, { prog: m.progress }); };
      try {
        const c = await fileToCanvas(x.file);
        const { data } = await worker.recognize(c);
        const d = parseSlip(data.text || '');
        const dup = slipDup(d, doneRef.current);
        doneRef.current.push(d);
        upd(x.id, { st: 'done', d: { ...d, dup, on: !dup && d.amount > 0 } });
      } catch (e) { upd(x.id, { st: 'fail', err: 'อ่านรูปนี้ไม่ได้' }); }
    }
    window.__slipLog = null; setBusy(false);
  };
  const ready = items.filter(x => x.st === 'done' && x.d.on && numv(x.d.amount) > 0);
  const save = () => {
    losUpdate(() => ready.forEach(x => { const d = x.d; addTxn({ type: d.type, amount: numv(d.amount), src: d.src, cat: d.cat, name: (d.name || '').trim() || (d.type === 'income' ? 'รับโอน' : 'โอนเงิน'), date: d.date, note: 'จากสลิป' + (d.time ? ' ' + d.time : '') + (d.ref ? ' · ' + d.ref : ''), ref: d.ref ? 'slip:' + d.ref : undefined }); }), `บันทึกจากสลิป ${ready.length} รายการแล้ว`);
    onClose();
  };
  const total = ready.reduce((s, x) => s + (x.d.type === 'expense' ? numv(x.d.amount) : 0), 0);
  return <Modal title="อ่านสลิปโอนเงิน" onClose={onClose} foot={items.length ? [
    <button key="a" className="btn" onClick={() => inp.current.click()} disabled={busy}><LIcon name="plus" size={15} /></button>,
    <button key="s" className="btn btn-primary" style={{ flex: 1, opacity: ready.length && !busy ? 1 : .4 }} disabled={!ready.length || busy} onClick={save}>{busy ? 'กำลังอ่านสลิป…' : `บันทึก ${ready.length} รายการ` + (total ? ` · ${money(total)}` : '')}</button>] : null}>
    <input ref={inp} type="file" accept="image/*" multiple hidden onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
    {!items.length && <>
      <button className={'slip-drop' + (drag ? ' on' : '')} onClick={() => inp.current.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}>
        <span className="wcard-plus"><LIcon name="upload" size={20} /></span>
        <b>เลือกรูปสลิป (เลือกได้หลายรูป)</b>
        <span className="row-s">หรือลากไฟล์มาวางตรงนี้</span>
      </button>
      <div className="hint">อ่านบนเครื่องของคุณ ไม่ส่งรูปออกไปไหน ไม่มีค่าใช้จ่าย ระบบจะดึงยอดเงิน วันที่ ผู้รับ และเลขอ้างอิงให้ ตรวจและแก้ได้ก่อนบันทึก สลิปที่เคยบันทึกแล้วจะไม่ลงซ้ำ</div>
    </>}
    {loading && <div className="hint" style={{ marginTop: 0, marginBottom: 12 }}>{loading}…</div>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(x => <div key={x.id} className={'slip-card' + (x.st === 'done' && !x.d.on ? ' off' : '')}>
        <img className="slip-thumb" src={x.url} alt="" />
        <div style={{ minWidth: 0 }}>
          {x.st === 'wait' && <div className="row-s">รอคิว…</div>}
          {x.st === 'read' && <><div className="row-s" style={{ marginBottom: 8 }}>กำลังอ่าน… {Math.round((x.prog || 0) * 100)}%</div><Bar ratio={x.prog || 0.02} /></>}
          {x.st === 'fail' && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="row-s" style={{ color: 'var(--neg)', flex: 1 }}>{x.err}</span><button className="btn btn-sm" onClick={() => setItems(xs => xs.filter(y => y.id !== x.id))}>เอาออก</button></div>}
          {x.st === 'done' && <div className="slip-form">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label className="check" style={{ margin: 0, flex: 1 }}><input type="checkbox" checked={x.d.on} onChange={e => updD(x.id, { on: e.target.checked })} />บันทึกรายการนี้</label>
              {x.d.dup && <Badge tone="amber">อาจซ้ำ</Badge>}
              {x.d.bank && <BankMark bank={x.d.bank} size={22} plain />}
            </div>
            <div className="field slip-row"><input className="num" value={x.d.amount || ''} onChange={e => updD(x.id, { amount: e.target.value })} inputMode="decimal" placeholder="ยอดเงิน" style={{ fontWeight: 600, fontSize: 17 }} />
              <div className="seg" style={{ flexShrink: 0 }}>{[['expense', 'จ่าย'], ['income', 'รับ']].map(([k, l]) => <button key={k} type="button" className={x.d.type === k ? 'on' : ''} onClick={() => updD(x.id, { type: k, cat: k === 'income' ? INC_CATS[INC_CATS.length - 1] : slipCat(x.d.name, x.d.raw) })}>{l}</button>)}</div></div>
            <div className="field" style={{ marginBottom: 0 }}><input value={x.d.name} onChange={e => updD(x.id, { name: e.target.value })} placeholder={x.d.type === 'income' ? 'รับจาก' : 'จ่ายให้'} /></div>
            <div className="field slip-row"><input type="date" value={x.d.date} onChange={e => updD(x.id, { date: e.target.value })} />
              <select value={x.d.cat} onChange={e => updD(x.id, { cat: e.target.value })}>{(x.d.type === 'income' ? INC_CATS : EXP_CATS).map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="field" style={{ marginBottom: 0 }}><SrcSelect value={x.d.src} onChange={e => updD(x.id, { src: e.target.value })} cards={false} /></div>
            <div className="row-s" style={{ display: 'flex', gap: 10 }}><span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.d.time ? x.d.time + ' · ' : ''}{x.d.ref ? 'อ้างอิง ' + x.d.ref : 'ไม่พบเลขอ้างอิง'}</span><button className="link-btn" onClick={() => setRaw(x.d.raw)}>ข้อความที่อ่านได้</button></div>
          </div>}
        </div>
      </div>)}
    </div>
    {raw != null && <Modal title="ข้อความที่อ่านได้จากสลิป" onClose={() => setRaw(null)}><pre className="slip-raw">{raw || '(ว่าง)'}</pre></Modal>}
  </Modal>;
}
Object.assign(LOS_FORMS, { slips: SlipImport });
Object.assign(window, { SlipImport, parseSlip });
