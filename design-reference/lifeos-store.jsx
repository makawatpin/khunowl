// lifeos-store.jsx — persistence (localStorage), undo, actions, prefs, form/toast bus
const LOS_KEY = 'los:data:v1', LOS_PREF_KEY = 'los:prefs:v1';
const LOS_ARR = { accounts: LOS_ACCOUNTS, cards: LOS_CARDS, bills: LOS_BILLS, subs: LOS_SUBS, income: LOS_INCOME, plans: LOS_PLANS, txns: LOS_TXNS, assets: LOS_ASSETS, homeTasks: LOS_HOME_TASKS, vehicles: LOS_VEHICLES, service: LOS_SERVICE, fuel: LOS_FUEL, docs: LOS_DOCS, tasks: LOS_TASKS, trips: LOS_TRIPS, friends: LOS_FRIENDS, projects: LOS_PROJECTS };
const LOS_OBJ = { home: LOS_HOME, budgets: LOS_BUDGETS, notisDone: LOS_NOTIS_DONE };
const clone = (x) => JSON.parse(JSON.stringify(x));
function losSnapshot() { const o = { v: 1 }; for (const k in LOS_ARR) o[k] = clone(LOS_ARR[k]); for (const k in LOS_OBJ) o[k] = clone(LOS_OBJ[k]); return o; }
function losApply(s) {
  for (const k in LOS_ARR) if (Array.isArray(s[k])) LOS_ARR[k].splice(0, LOS_ARR[k].length, ...clone(s[k]));
  for (const k in LOS_OBJ) if (s[k] && typeof s[k] === 'object') { const t = LOS_OBJ[k]; Object.keys(t).forEach(x => delete t[x]); Object.assign(t, clone(s[k])); }
}
const LOS_SEED = losSnapshot();
const LOS_EMPTY = (() => { const o = clone(LOS_SEED); for (const k in LOS_ARR) o[k] = []; o.accounts = [{ id: 'cash', name: 'เงินสด', type: 'เงินสด', bal: 0, bank: 'cash' }]; o.home = { name: 'บ้านของฉัน', kind: 'เป็นเจ้าของ', rent: 0, since: TODAY_ISO, size: '' }; o.notisDone = {}; return o; })();
let losSavedAt = null;
function losPersist() { try { localStorage.setItem(LOS_KEY, JSON.stringify(losSnapshot())); losSavedAt = new Date(); } catch (e) { console.warn('save failed', e); } }

// prefs
const LOS_PREFS = { hide: false, theme: 'light', pin: '', notify: false, lastNotify: '', lastBackup: '' };
try { Object.assign(LOS_PREFS, JSON.parse(localStorage.getItem(LOS_PREF_KEY) || '{}')); } catch (e) {}
window.__losHide = LOS_PREFS.hide;
function setPref(k, v) { LOS_PREFS[k] = v; if (k === 'hide') window.__losHide = v; if (k === 'theme') document.documentElement.dataset.theme = v; if (k === 'motion') document.documentElement.dataset.motion = v; try { localStorage.setItem(LOS_PREF_KEY, JSON.stringify(LOS_PREFS)); } catch (e) {} losEmit(); }
document.documentElement.dataset.theme = LOS_PREFS.theme;
document.documentElement.dataset.motion = LOS_PREFS.motion || 'on';

// bus
const losSubs = new Set(), toastSubs = new Set(), formSubs = new Set();
function losEmit() { losSubs.forEach(f => f()); }
function useLOS() { const [, force] = React.useReducer(x => x + 1, 0); React.useEffect(() => { losSubs.add(force); return () => losSubs.delete(force); }, []); }
const losToast = (msg, undo) => toastSubs.forEach(f => f({ msg, undo, t: Date.now() }));
const losOpen = (kind, props = {}) => formSubs.forEach(f => f({ kind, props, t: Date.now() + Math.random() }));
let losUndoSnap = null;
function losUpdate(fn, msg, undoable = true) {
  const before = undoable ? losSnapshot() : null;
  fn(); losPersist(); losUndoSnap = before; losEmit();
  if (msg) losToast(msg, !!before);
}
function losUndo() { if (!losUndoSnap) return; losApply(losUndoSnap); losUndoSnap = null; losPersist(); losEmit(); losToast('ย้อนกลับแล้ว', false); }

// money actions (mutate inside losUpdate)
function adjustSrc(id, delta) { // delta: +in / -out
  const a = LOS_ACCOUNTS.find(x => x.id === id); if (a) { a.bal = Math.round(((+a.bal || 0) + delta) * 100) / 100; return; }
  const c = LOS_CARDS.find(x => x.id === id); if (c) c.used = Math.max(0, Math.round(((+c.used || 0) - delta) * 100) / 100);
}
function txnEffect(t, sign) {
  if (t.type === 'expense') adjustSrc(t.src, -t.amount * sign);
  else if (t.type === 'income') adjustSrc(t.src, t.amount * sign);
  else if (t.type === 'transfer') { adjustSrc(t.src, -t.amount * sign); adjustSrc(t.to, t.amount * sign); }
}
function addTxn(t) { const x = { id: lid(), date: TODAY_ISO, ...t, amount: +t.amount }; txnEffect(x, 1); LOS_TXNS.unshift(x); return x; }
function removeTxn(id) { const i = LOS_TXNS.findIndex(t => t.id === id); if (i < 0) return; txnEffect(LOS_TXNS[i], -1); LOS_TXNS.splice(i, 1); }
function payBillNow(b, auto) {
  addTxn({ type: 'expense', amount: b.amount, src: b.account, cat: /ไฟ|น้ำ|เน็ต|มือถือ|AIS|True|3BB/i.test(b.name) ? 'บิล/ค่าน้ำไฟ' : /เช่า|คอนโด|บ้าน/.test(b.name) ? 'บ้าน' : /ประกัน/.test(b.name) ? 'สุขภาพ' : 'บิล/ค่าน้ำไฟ', name: b.name + (auto ? ' (ตัดอัตโนมัติ)' : ''), date: auto ? b.due : TODAY_ISO, ref: 'bill:' + b.id });
  b.lastPaid = auto ? b.due : TODAY_ISO; b.due = addCycle(b.due, b.cycle);
}
function paySubNow(s) { addTxn({ type: 'expense', amount: s.price, src: s.src, cat: 'บันเทิง', name: s.name, date: s.next, ref: 'sub:' + s.id }); s.next = addCycle(s.next, s.cycle); }
function payCardNow(c, amount, from) {
  addTxn({ type: 'transfer', amount, src: from, to: c.id, name: 'ชำระ ' + c.name, cat: 'ชำระบัตร' });
  if (amount >= Math.min(+c.min || 0, c.used + amount)) { c.due = addMonths(c.due, 1); c.statement = addMonths(c.statement, 1); }
}
const losActions = {
  payBill: (id) => { const b = LOS_BILLS.find(x => x.id === id); if (b) losUpdate(() => payBillNow(b), `จ่าย ${b.name} ${money(b.amount)} แล้ว`); },
  payCard: (id) => { const c = LOS_CARDS.find(x => x.id === id); if (c) losOpen('payCard', { card: c }); },
  homeDone: (id) => { const h = LOS_HOME_TASKS.find(x => x.id === id); if (h) losUpdate(() => { h.last = TODAY_ISO; h.next = addCycle(TODAY_ISO, h.every); }, `${h.name} เรียบร้อย · ครั้งถัดไป ${dShort(addCycle(TODAY_ISO, h.every))}`); },
  taskDone: (id) => { const t = LOS_TASKS.find(x => x.id === id); if (t) losUpdate(() => { t.done = !t.done; t.doneAt = TODAY_ISO; }, t.done ? 'ยกเลิกสถานะเสร็จ' : 'ทำเสร็จแล้ว'); },
  notiDone: (id) => losUpdate(() => { LOS_NOTIS_DONE[id] = TODAY_ISO; }, 'รับทราบแล้ว'),
};
// generic CRUD
function losUpsert(arr, item, msg) { losUpdate(() => { const i = arr.findIndex(x => x.id === item.id); if (i >= 0) arr[i] = { ...arr[i], ...item }; else arr.push({ id: lid(), ...item }); }, msg); }
function losRemove(arr, id, msg) { losUpdate(() => { const i = arr.findIndex(x => x.id === id); if (i >= 0) arr.splice(i, 1); }, msg); }

// auto-process on open: auto-debit bills + subscriptions that reached their date
function losProcessDue() {
  let n = 0;
  LOS_BILLS.forEach(b => { let k = 0; while (b.auto && b.due <= TODAY_ISO && LOS_ACCOUNTS.find(a => a.id === b.account) && k++ < 12) { payBillNow(b, true); n++; } });
  LOS_SUBS.forEach(s => { let k = 0; while (s.next <= TODAY_ISO && k++ < 24) { if (allSources().find(x => x.id === s.src)) { paySubNow(s); n++; } else s.next = addCycle(s.next, s.cycle); } });
  // prune old notification acks
  Object.keys(LOS_NOTIS_DONE).forEach(k => { if (daysTo(LOS_NOTIS_DONE[k]) < -120) delete LOS_NOTIS_DONE[k]; });
  return n;
}
// load
(function losLoad() {
  try {
    const raw = localStorage.getItem(LOS_KEY);
    if (raw) losApply(JSON.parse(raw));
    const extra = JSON.parse(localStorage.getItem('los_vehicles_extra') || '[]');
    if (extra.length) { extra.forEach(v => { if (!LOS_VEHICLES.find(x => x.id === v.id)) LOS_VEHICLES.push(v); }); localStorage.removeItem('los_vehicles_extra'); }
  } catch (e) { console.warn('load failed', e); }
  window.__losAutoCount = losProcessDue();
  losPersist();
})();

// backup
function losExport() {
  const blob = new Blob([JSON.stringify({ app: 'KhunOwl', exportedAt: new Date().toISOString(), data: losSnapshot() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `khunowl-backup-${TODAY_ISO}.json`; document.body.appendChild(a); a.click(); a.remove();
  setPref('lastBackup', TODAY_ISO); losToast('ดาวน์โหลดไฟล์สำรองแล้ว');
}
function losImport(file) {
  const r = new FileReader();
  r.onload = () => { try { const j = JSON.parse(r.result); const d = j.data || j; if (!d.accounts) throw new Error('bad'); losUpdate(() => losApply(d), 'กู้คืนข้อมูลแล้ว'); } catch (e) { losToast('ไฟล์ไม่ถูกต้อง'); } };
  r.readAsText(file);
}
const losReset = (empty) => losUpdate(() => losApply(empty ? LOS_EMPTY : LOS_SEED), empty ? 'ล้างข้อมูลแล้ว' : 'รีเซ็ตเป็นข้อมูลตัวอย่างแล้ว');
const pinHash = (s) => { let h = 5381; for (const ch of 'mt:' + s) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return String(h >>> 0); };

// browser notifications (fires once a day when the app is opened)
function losDailyNotify() {
  if (!LOS_PREFS.notify || !('Notification' in window) || Notification.permission !== 'granted' || LOS_PREFS.lastNotify === TODAY_ISO) return;
  const due = notifications().filter(n => !n.done && daysTo(n.date) <= 1);
  if (due.length) { try { new Notification(`KhunOwl · ถึงกำหนด ${due.length} รายการ`, { body: due.slice(0, 4).map(n => '• ' + n.title).join('\n'), icon: 'assets/khunowl-icon.png' }); } catch (e) {} }
  setPref('lastNotify', TODAY_ISO);
}
Object.assign(window, { LOS_PREFS, setPref, useLOS, losToast, losOpen, losUpdate, losUndo, losActions, losUpsert, losRemove, addTxn, removeTxn, payBillNow, payCardNow, adjustSrc, losExport, losImport, losReset, pinHash, losDailyNotify, toastSubs, formSubs, losSnapshot });
